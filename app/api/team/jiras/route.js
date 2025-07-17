// app/api/team/jiras/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/team.model';
import User from '@/models/user.model';
import Jira from '@/models/jira.model';
import DailyLog from '@/models/dailyLog.model';

export async function GET(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.roles?.includes('TEAM LEAD')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Get team for current team lead
    const team = await Team.findOne({ 
      teamLeadId: session.user.id,
      isActive: true 
    });

    if (!team || team.memberIds.length === 0) {
      return NextResponse.json({ jirasByUser: {} }, { status: 200 });
    }

    // Get member details
    const members = await User.find(
      { _id: { $in: team.memberIds } },
      'username email'
    );

    // Create a map for quick lookup
    const memberMap = {};
    members.forEach(member => {
      memberMap[member._id.toString()] = member;
    });

    // Fetch jiras for team members
    const jiras = await Jira.find({
      userId: { $in: team.memberIds },
      actualStatus: { $nin: ['done', 'closed'] }
    }).populate('dailyLogs');

    // Group by userId with member info
    const jirasByUser = {};
    team.memberIds.forEach(memberId => {
      const member = memberMap[memberId];
      if (member) {
        jirasByUser[memberId] = {
          memberInfo: {
            userId: member._id,
            username: member.username,
            email: member.email
          },
          jiras: jiras.filter(j => j.userId === memberId)
        };
      }
    });

    return NextResponse.json({ 
      jirasByUser, 
      team: {
        ...team.toObject(),
        members
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching team jiras:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}