import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import DailyLog from '@/models/dailyLog.model';
import mongoose from 'mongoose';
import Project from '@/models/project.model';
import User from '@/models/user.model';
import Jira from '@/models/jira.model';
import Team from '@/models/team.model'; // Import Team model

export async function GET(req) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.roles?.includes('IT LEAD')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year'), 10);
    const month = parseInt(searchParams.get('month'), 10);

    if (isNaN(year) || isNaN(month)) {
        return NextResponse.json({ error: 'Invalid year or month' }, { status: 400 });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    try {
        await dbConnect();

        const results = await DailyLog.aggregate([
            { $match: { logDate: { $gte: startDate, $lt: endDate } } },
            { $addFields: { "hours": { "$toDouble": "$timeSpent" } } },
            { $lookup: { from: 'jiras', localField: 'jiraId', foreignField: '_id', as: 'jiraDetail' } },
            { $unwind: '$jiraDetail' },
            { $addFields: { "userIdObject": { "$toObjectId": "$jiraDetail.userId" } } },
            { $lookup: { from: 'users', localField: 'userIdObject', foreignField: '_id', as: 'userDetail' } },
            { $unwind: '$userDetail' },
            { $lookup: { from: 'projects', localField: 'jiraDetail.projectName', foreignField: 'name', as: 'projectDetail' } },
            { $unwind: { path: '$projectDetail', preserveNullAndEmptyArrays: true } },
            { $addFields: { "userIdString": { "$toString": "$userDetail._id" } } }, // Convert user's ObjectId to string for team lookup
            { $lookup: { from: 'teams', localField: 'userIdString', foreignField: 'memberIds', as: 'teamDetail' } },
            { $unwind: { path: '$teamDetail', preserveNullAndEmptyArrays: true } },

            {
                $facet: {
                    projectSummary: [
                        {
                            $group: {
                                _id: { projectName: '$jiraDetail.projectName', projectType: { $ifNull: ['$projectDetail.type', 'Other'] } },
                                totalHours: { $sum: '$hours' },
                                nonCoreHours: { $sum: { $cond: [{ $eq: ["$userDetail.type", "Non-Core"] }, "$hours", 0] } },
                                coreHours: { $sum: { $cond: [{ $eq: ["$userDetail.type", "Core"] }, "$hours", 0] } }
                            }
                        },
                        {
                            $group: {
                                _id: '$_id.projectType',
                                projects: { $push: { name: '$_id.projectName', totalHours: '$totalHours', nonCoreHours: '$nonCoreHours', coreHours: '$coreHours' } }
                            }
                        },
                        { $sort: { _id: 1 } }
                    ],
                    individualSummary: [
                        {
                            $group: {
                                _id: { user: '$userDetail', team: '$teamDetail' },
                                totalHours: { $sum: '$hours' },
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                user: {
                                    _id: '$_id.user._id',
                                    username: '$_id.user.username',
                                    email: '$_id.user.email',
                                    type: '$_id.user.type',
                                    name: '$_id.user.name',
                                    teamName: '$_id.team.teamName' // --- ADDED teamName to response ---
                                },
                                totalHours: '$totalHours',
                            }
                        },
                        { $sort: { 'user.username': 1 } }
                    ]
                }
            }
        ]);

        if (results.length === 0) {
            return NextResponse.json({ projectSummary: [], individualSummary: [] });
        }
        
        return NextResponse.json(results[0]);

    } catch (error) {
        console.error("IT Lead Summary API Error:", error);
        return NextResponse.json({ error: 'Failed to fetch summary data' }, { status: 500 });
    }
}