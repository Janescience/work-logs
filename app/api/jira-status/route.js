// /app/api/jira-status/route.js
export async function GET(req) {
    const url = new URL(req.url);
    // รับ 'jiraNumbers' เป็น comma-separated string
    const jiraNumbersParam = url.searchParams.get('jiraNumbers');

    if (!jiraNumbersParam) {
      return new Response(JSON.stringify({ error: 'Missing jiraNumbers parameter' }), { status: 400 });
    }

    const jiraNumbers = jiraNumbersParam.split(',');
    const JIRA_DOMAIN = process.env.JIRA_DOMAIN;
    const JIRA_USER = process.env.JIRA_USER;
    const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

    // สร้าง JQL query เพื่อดึงข้อมูลทีเดียว
    const jql = `key in (${jiraNumbers.join(',')})`;
    const apiUrl = `https://${JIRA_DOMAIN}/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=status,key`;

    try {
        const resp = await fetch(apiUrl, {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${JIRA_USER}:${JIRA_API_TOKEN}`).toString('base64'),
                'Accept': 'application/json'
            }
        });

        if (!resp.ok) {
            return new Response(JSON.stringify({ error: 'Failed to fetch from Jira API', status: resp.status }), { status: resp.status });
        }

        const data = await resp.json();
        const statuses = {};
        
        // Map ผลลัพธ์กลับไปเป็น object { jiraNumber: status }
        data.issues.forEach(issue => {
            statuses[issue.key] = issue.fields.status?.name ?? null;
        });

        return new Response(JSON.stringify({ statuses }), { status: 200 });

    } catch (error) {
        console.error("Error fetching Jira statuses:", error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}
  