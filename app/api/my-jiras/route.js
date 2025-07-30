// /app/api/jira-janewit/route.js
import { NextResponse } from 'next/server';

export const revalidate = 0; // บอก Next.js ให้ Revalidate ทันที (ห้ามใช้ cache เก่า)
export const dynamic = 'force-dynamic'; // บอก Next.js ให้บังคับเป็น Dynamic Render (ไม่ใช้ cache)

export async function GET(req) {
    const JIRA_DOMAIN = process.env.JIRA_DOMAIN;
    const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
    const JIRA_USER = process.env.JIRA_USER

    // Get the email from the query parameters
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('email'); // Get the email from the URL query

    if (!userEmail) {
        return new NextResponse(JSON.stringify({ error: "User email is required for this API." }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Construct JQL to query Jiras assigned to the provided email
    // Note: Jira's assignee field usually accepts username or email. Using email is more robust.
    const jql = encodeURIComponent(`assignee="${userEmail}"`); // ใช้ userEmail แทน JIRA_USER
    const apiUrl = `https://${JIRA_DOMAIN}/rest/api/3/search?jql=${jql}&fields=key,summary,created,reporter,status,assignee`;
    console.log("Fetching Jira issues for user:", userEmail);
    console.log("Jira API URL:", apiUrl);
    console.log("Authorization Header:", Buffer.from(`${JIRA_USER}:${JIRA_API_TOKEN}`).toString('base64'));
    try {
        const resp = await fetch(apiUrl, {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${JIRA_USER}:${JIRA_API_TOKEN}`).toString('base64'),
                'Accept': 'application/json',
            },
            cache: 'no-store' // บอก Next.js fetch cache ให้ห้ามเก็บ
        });

        if (!resp.ok) {
            const errorText = await resp.text();
            console.error(`Jira API returned an error: ${resp.status} - ${errorText}`);
            // Attempt to parse JSON if possible, otherwise use raw text
            let errorMessage = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.errorMessages ? errorJson.errorMessages.join(', ') : errorText;
            } catch (e) {
                // Not a JSON error, use raw text
            }
            throw new Error(`Failed to fetch Jira data: ${errorMessage}`);
        }

        const data = await resp.json();

        return new NextResponse(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0',
                'Surrogate-Control': 'no-store',
            },
        });
    } catch (error) {
        console.error("Error fetching Jira API:", error);
        return new NextResponse(JSON.stringify({ error: error.message || "Failed to fetch Jira data" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
