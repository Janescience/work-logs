import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import Jira from '@/models/jira.model';
import Project from '@/models/project.model'; 
import Service from '@/models/service.model'; 
import DailyLog from '@/models/dailyLog.model'; // Import DailyLog explicitly
import dbConnect from '@/lib/mongodb';

// Ensure these are set in your .env.local for Jira API calls
const JIRA_DOMAIN = process.env.JIRA_DOMAIN || 'generalith.atlassian.net'; // Get from env
const JIRA_USER = process.env.JIRA_USER; // Get from env
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN; // Get from env

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let dateFilter = {};
    if (startDateParam && endDateParam) {
      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);
      dateFilter = {
        logDate: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    }

    // Fetch Jiras and their daily logs
    // Add populate for service if needed for service.color_code logic (if you decide to use it here)
    const jiras = await Jira.find({}).populate('dailyLogs').lean();

    // --- Fetch Live Jira Statuses ---
    const jiraNumbersToFetch = jiras
      .map(jira => jira.jiraNumber)
      .filter(jiraNumber => jiraNumber && !jiraNumber.startsWith('JANE')) // Exclude internal JIRAs if 'JANE' is your convention
      .filter((value, index, self) => self.indexOf(value) === index); // Get unique Jira numbers

    const jiraStatusMap = {};
    const jiraStatusPromises = jiraNumbersToFetch.map(async (jiraNumber) => {
      const apiUrl = `https://${JIRA_DOMAIN}/rest/api/3/issue/${jiraNumber}`;
      try {
        const resp = await fetch(apiUrl, {
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${JIRA_USER}:${JIRA_API_TOKEN}`).toString('base64'),
            'Accept': 'application/json'
          },
          cache: 'no-store' // Do not cache this API call
        });

        if (resp.ok) {
          const data = await resp.json();
          jiraStatusMap[jiraNumber] = data.fields.status?.name ?? 'N/A'; // Store status, default to N/A
        } else {
          console.warn(`Failed to fetch status for Jira ${jiraNumber}: ${resp.status}`);
          jiraStatusMap[jiraNumber] = `Error (${resp.status})`; // Indicate error
        }
      } catch (error) {
        console.error(`Error fetching status for Jira ${jiraNumber}:`, error);
        jiraStatusMap[jiraNumber] = 'API Error'; // Indicate API error
      }
    });

    // Await all Jira status fetches to complete
    await Promise.all(jiraStatusPromises);


    // --- Create Workbook ---
    const workbook = XLSX.utils.book_new();

    // --- Summary Sheet Logic ---
    const ws_summary_headers = [
      "JIRA#",
      "Description",
      "Project Name",
      "Related JIRA#",
      "JIRA status", // Updated header for clarity
      "Actual status",
      "Effort Estimation (MHRs)",
      "Total Effort (MHRs)",
      "Assignee"
    ];

    // Filter summary data: Exclude rows where totalEffort is 0
    const summaryData = jiras.filter(jira => { // *** เพิ่ม filter ตรงนี้ ***
      const filteredLogs = jira.dailyLogs.filter(log => {
        const logDate = new Date(log.logDate);
        return (
          (!dateFilter.logDate?.$gte || logDate >= dateFilter.logDate.$gte) &&
          (!dateFilter.logDate?.$lte || logDate <= dateFilter.logDate.$lte)
        );
      });
      const totalEffort = filteredLogs.reduce((sum, log) => sum + parseFloat(log.timeSpent || 0), 0);
      return totalEffort > 0; // *** กรองออกถ้า totalEffort เป็น 0 ***
    }).map(jira => {
      // Filter daily logs for the selected period for accurate total effort (re-calculated after filter)
      const filteredLogs = jira.dailyLogs.filter(log => {
        const logDate = new Date(log.logDate);
        return (
          (!dateFilter.logDate?.$gte || logDate >= dateFilter.logDate.$gte) &&
          (!dateFilter.logDate?.$lte || logDate <= dateFilter.logDate.$lte)
        );
      });
      const totalEffort = filteredLogs.reduce((sum, log) => sum + parseFloat(log.timeSpent || 0), 0);
      const assignee = jira.assignee || '';

      // Get live Jira status from the map, fallback to stored Jira status if not found
      const liveJiraStatus = jiraStatusMap[jira.jiraNumber] || jira.jiraStatus || ''; 

      return {
        "JIRA#": jira.jiraNumber || '',
        "Description": jira.description || '',
        "Project Name": jira.projectName || '',
        "Related JIRA#": jira.relatedJira || '',
        "JIRA status": liveJiraStatus, // Use live status
        "Actual status": jira.actualStatus || '',
        "Effort Estimation (MHRs)": jira.effortEstimation || '',
        "Total Effort (MHRs)": totalEffort,
        "Assignee": assignee
      };
    });

    const ws_summary = XLSX.utils.json_to_sheet(summaryData, { header: ws_summary_headers });
    XLSX.utils.book_append_sheet(workbook, ws_summary, "Summary");

    // --- Detail Sheet Logic ---
    const ws_detail_headers = ["No.", "Reference Project/JIRA#", "Description", "Total HRs"];
    // Assume current month for detail sheet days if no date filter is applied
    const today = new Date();
    const currentMonthDays = new Date(dateFilter.logDate?.$lte?.getFullYear() || today.getFullYear(), (dateFilter.logDate?.$lte?.getMonth() || today.getMonth()) + 1, 0).getDate();
    
    for (let i = 1; i <= currentMonthDays; i++) { // Dynamically add days based on month
      ws_detail_headers.push(String(i));
    }

    const detailDataMap = {};
    let jiraCounter = 1;

    // Filter and group daily logs based on the date range
    jiras.forEach(jira => {
      jira.dailyLogs.forEach(log => {
        const logDate = new Date(log.logDate);
        const dayOfMonth = logDate.getDate();
        const jiraNumber = jira.jiraNumber;

        // Apply global date filter for logs
        const isInDateRange = (
            (!dateFilter.logDate?.$gte || logDate >= dateFilter.logDate.$gte) &&
            (!dateFilter.logDate?.$lte || logDate <= dateFilter.logDate.$lte)
        );

        if (isInDateRange) {
            if (!detailDataMap[jiraNumber]) {
                detailDataMap[jiraNumber] = {
                    no: jiraCounter++,
                    description: jira.description || '',
                    totalHrs: 0,
                    days: {}
                };
            }
            detailDataMap[jiraNumber].days[dayOfMonth] = (detailDataMap[jiraNumber].days[dayOfMonth] || 0) + parseFloat(log.timeSpent || 0);
            detailDataMap[jiraNumber].totalHrs += parseFloat(log.timeSpent || 0);
        }
      });
    });

    const detailDataArray = Object.keys(detailDataMap).map(jiraNumber => {
      const data = detailDataMap[jiraNumber];
      const row = {
        "No.": data.no,
        "Reference Project/JIRA#": jiraNumber,
        "Description": data.description,
        "Total HRs": data.totalHrs
      };
      for (let i = 1; i <= currentMonthDays; i++) { // Use dynamic days count
        row[String(i)] = data.days[i] || '';
      }
      return row;
    });

    const ws_detail = XLSX.utils.json_to_sheet(detailDataArray, { header: ws_detail_headers });
    XLSX.utils.book_append_sheet(workbook, ws_detail, "Detail");

    // --- Generate Excel Buffer and Send Response ---
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const filename = `work_log_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Date.now()}.xlsx`;
    const headers = new Headers({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new NextResponse(Buffer.from(excelBuffer), { headers });

  } catch (error) {
    console.error('Error exporting to Excel with date filter:', error);
    return NextResponse.json({ error: 'Failed to export to Excel with date filter' }, { status: 500 });
  }
}
