import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

import Jira from '@/models/jira.model';
import dbConnect from '@/lib/mongodb';

export async function PUT(req, { params }) {
  const { id } = params;

  try {
    await dbConnect();
    const body = await req.json();

    const updatedJira = await Jira.findByIdAndUpdate(id, body, { new: true });

    if (!updatedJira) {
      return new NextResponse(JSON.stringify({ message: 'Jira not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new NextResponse(JSON.stringify({ message: 'Jira updated successfully', jira: updatedJira }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating Jira:', error);
    return new NextResponse(JSON.stringify({ message: 'Failed to update Jira' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
