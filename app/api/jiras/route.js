import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'; // Import getServerSession
import { authOptions } from '../auth/[...nextauth]/route'; // Adjust path if authOptions is in a different location

import mongoose from 'mongoose';
import Jira from '@/models/jira.model';

import DailyLog from '@/models/dailyLog.model'; // Import DailyLog Model
import dbConnect from '@/lib/mongodb';


export async function GET() {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions); // ดึง session

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized: No valid session' }, { status: 401 });
    }

    const userId = session.user.id;

    const jiras = await Jira.find({ userId: userId })
      .populate({
        path: 'dailyLogs'
      })
      .lean();

    return NextResponse.json({ jiras });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Failed to fetch data' }, { status: 500 });
  } 
}

export async function POST(request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions); // ดึง session
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized: No valid session' }, { status: 401 });
    }

    const userId = session.user.id; // ดึง userId จาก session
    const data = await request.json();
    const newJira = new Jira({ ...data, userId: userId });
    const savedJira = await newJira.save();

    return NextResponse.json({ message: 'Jira added successfully', id: savedJira._id }, { status: 201 });
    
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Failed to add Jira' }, { status: 500 });
  } 
}

export async function DELETE(request, { params }) {
  const { searchParams } = new URL(request.url);
  const jiraId = searchParams.get('jiraId');

  try {
    await dbConnect();
    const session = await getServerSession(authOptions); // ดึง session

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized: No valid session' }, { status: 401 });
    }

    const userId = session.user.id; // ดึง userId จาก session

    const deletedJira = await Jira.findOneAndDelete({ _id: jiraId, userId: userId });

    if (!deletedJira) {
      return NextResponse.json({ message: 'Jira not found' }, { status: 404 });
    }

    await DailyLog.deleteMany({ jiraId });

    return NextResponse.json({ message: 'Jira and its logs deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting jira:', error);
    return NextResponse.json({ message: 'Failed to delete jira' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { searchParams } = new URL(request.url);
  const jiraId = searchParams.get('jiraId');

  const {
    projectName,
    serviceName,
    jiraNumber,
    description,
    assignee,
    effortEstimation,
    jiraStatus,
    actualStatus,
    relatedJira,
    environment,
    dueDate,
  } = await request.json();

  try {
    await dbConnect();
    const session = await getServerSession(authOptions); // ดึง session

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Unauthorized: No valid session' }, { status: 401 });
    }

    const userId = session.user.id;
    const updatedJira = await Jira.findOneAndUpdate(
      { _id: jiraId, userId: userId }, // ค้นหาด้วย ID และ userId
      {
        projectName,
        serviceName,
        jiraNumber,
        description,
        assignee,
        effortEstimation,
        jiraStatus,
        actualStatus,
        relatedJira,
        environment,
        dueDate
      },
      { new: true } // Return the updated document
    );

    if (!updatedJira) {
      return NextResponse.json({ message: 'Jira not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Jira updated successfully', jira: updatedJira }, { status: 200 });
  } catch (error) {
    console.error('Error updating jira:', error);
    return NextResponse.json({ message: 'Failed to update jira' }, { status: 500 });
  }
}