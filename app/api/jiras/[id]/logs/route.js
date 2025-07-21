import { NextResponse } from 'next/server';

import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;

import DailyLog from '@/models/dailyLog.model';
import Jira from '@/models/jira.model';
import dbConnect from '@/lib/mongodb';


export async function POST(request, { params }) {
  const { id } = params;
  try {
    await dbConnect();
    const data = await request.json();
    const { logDate, taskDescription, timeSpent, detail,envDetail, sqlDetail, logOptions } = data;

    const newLog = new DailyLog({
      jiraId: id,
      logDate: logDate,
      taskDescription: taskDescription,
      timeSpent: parseFloat(timeSpent),
      detail: detail || '',
      envDetail,
      sqlDetail,
      options: logOptions,
    });

    const savedLog = await newLog.save();

    // Optionally, update the Jira document to include this log
    const jira = await Jira.findByIdAndUpdate(
      id,
      { $push: { dailyLogs: savedLog._id } },
      { new: true }
    );

    return NextResponse.json({ message: 'Log added successfully', id: savedLog._id }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Failed to add log' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { jiraId } = params; // เข้าถึงค่า [jiraId] จาก URL
  const { searchParams } = new URL(request.url);
  const logId = searchParams.get('logId'); // เข้าถึงค่า logId จาก Query Parameter

  if (!logId) {
    return NextResponse.json({ message: 'Missing logId parameter' }, { status: 400 });
  }

  try {
    await dbConnect();
    const deletedLog = await DailyLog.findByIdAndDelete(logId);

    if (!deletedLog) {
      return NextResponse.json({ message: 'Log not found' }, { status: 404 });
    }

    // อัปเดต Jira โดยลบ Log ออกจาก Array dailyLogs
    await Jira.findByIdAndUpdate(jiraId, { $pull: { dailyLogs: logId } });

    return NextResponse.json({ message: 'Log deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting log:', error);
    return NextResponse.json({ message: 'Failed to delete log' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const { id } = params;
  const { searchParams } = new URL(req.url);
  const logId = searchParams.get('logId');
  const updatedLogData = await req.json();

  try {
    await dbConnect();

    const updateFields = {};
    if (updatedLogData.logDate) updateFields['logDate'] = new Date(updatedLogData.logDate);
    if (typeof updatedLogData.taskDescription === 'string' && updatedLogData.taskDescription !== "") updateFields['taskDescription'] = updatedLogData.taskDescription;
    updateFields['timeSpent'] = updatedLogData.timeSpent;
    if (typeof updatedLogData.envDetail === 'string' && updatedLogData.envDetail !== "") updateFields['envDetail'] = updatedLogData.envDetail;
    if (typeof updatedLogData.sqlDetail === 'string' && updatedLogData.sqlDetail !== "") updateFields['sqlDetail'] = updatedLogData.sqlDetail;

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
    }

    const updatedLog = await DailyLog.findByIdAndUpdate(
      logId,
      { $set: updateFields },
      { new: true }
    );
    
    if (!updatedLog) {
      return NextResponse.json({ message: 'Log not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Log updated successfully', log : updatedLog }, { status: 200 });
  } catch (error) {
    console.error('Error updating log:', error);
    return NextResponse.json({ message: 'Failed to update log', error: error.message }, { status: 500 });
  }
}
