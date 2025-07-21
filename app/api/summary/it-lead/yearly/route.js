import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import DailyLog from '@/models/dailyLog.model';
import mongoose from 'mongoose';
import User from '@/models/user.model';
import Jira from '@/models/jira.model';

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.roles?.includes('IT LEAD')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year'), 10);

    if (isNaN(year)) {
        return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
    }

    const startDate = new Date(year, 0, 1); // January 1st of the year
    const endDate = new Date(year + 1, 0, 1); // January 1st of the next year

    try {
        await dbConnect();

        const results = await DailyLog.aggregate([
            { $match: { logDate: { $gte: startDate, $lt: endDate } } },
            { $lookup: { from: 'jiras', localField: 'jiraId', foreignField: '_id', as: 'jiraDetail' } },
            { $unwind: '$jiraDetail' },
            { $addFields: { "userIdObject": { "$toObjectId": "$jiraDetail.userId" } } },
            { $lookup: { from: 'users', localField: 'userIdObject', foreignField: '_id', as: 'userDetail' } },
            { $unwind: '$userDetail' },
            {
                $project: {
                    month: { $month: "$logDate" },
                    hours: { "$toDouble": "$timeSpent" },
                    userType: "$userDetail.type" 
                }
            },
            {
                $group: {
                    _id: {
                        month: "$month",
                        type: "$userType"
                    },
                    totalHours: { $sum: "$hours" }
                }
            },
            {
                $group: {
                    _id: "$_id.month",
                    coreHours: { $sum: { $cond: [{ $eq: ["$_id.type", "Core"] }, "$totalHours", 0] } },
                    nonCoreHours: { $sum: { $cond: [{ $eq: ["$_id.type", "Non-Core"] }, "$totalHours", 0] } }
                }
            },
            { $sort: { "_id": 1 } },
            { $project: { _id: 0, month: "$_id", coreHours: 1, nonCoreHours: 1 } }
        ]);

        // Fill in missing months with zero values
        const monthlyData = Array.from({ length: 12 }, (_, i) => {
            const monthNumber = i + 1;
            const found = results.find(r => r.month === monthNumber);
            return found || { month: monthNumber, coreHours: 0, nonCoreHours: 0 };
        });

        return NextResponse.json(monthlyData);

    } catch (error) {
        console.error("Yearly Summary API Error:", error);
        return NextResponse.json({ error: 'Failed to fetch yearly summary data' }, { status: 500 });
    }
}