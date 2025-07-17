// app/api/team/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Team from '@/models/team.model';
import User from '@/models/user.model';

export async function GET(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.roles?.includes('TEAM LEAD')) {
      return NextResponse.json({ error: 'Forbidden - Team Lead access required' }, { status: 403 });
    }

    const team = await Team.findOne({ 
      teamLeadId: session.user.id,
      isActive: true 
    });
    
    // Get team members details if team exists
    let teamWithMembers = null;
    if (team) {
      const members = await User.find(
        { _id: { $in: team.memberIds } },
        'username email'
      );
      
      teamWithMembers = {
        ...team.toObject(),
        members
      };
    }
    
    // Get all available developers
    const availableMembers = await User.find(
      { 
        _id: { $ne: session.user.id },
        roles: { $in: ['DEVELOPER'] }
      },
      'username email'
    );

    return NextResponse.json({ 
      team: teamWithMembers, 
      availableMembers 
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.roles?.includes('TEAM LEAD')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { teamName, memberIds } = await req.json();

    if (!teamName || !memberIds || !Array.isArray(memberIds)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Validate that all memberIds exist
    const validMembers = await User.countDocuments({
      _id: { $in: memberIds }
    });

    if (validMembers !== memberIds.length) {
      return NextResponse.json({ error: 'Some member IDs are invalid' }, { status: 400 });
    }

    // Update or create team
    const team = await Team.findOneAndUpdate(
      { 
        teamLeadId: session.user.id,
        isActive: true 
      },
      {
        teamName,
        memberIds,
        teamLeadId: session.user.id
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true 
      }
    );

    // Get member details for response
    const members = await User.find(
      { _id: { $in: team.memberIds } },
      'username email'
    );

    return NextResponse.json({ 
      team: {
        ...team.toObject(),
        members
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error saving team:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.user.roles?.includes('TEAM LEAD')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { memberIds } = await req.json();

    if (!memberIds || !Array.isArray(memberIds)) {
      return NextResponse.json({ error: 'Invalid memberIds' }, { status: 400 });
    }
    
    const team = await Team.findOneAndUpdate(
      { 
        teamLeadId: session.user.id,
        isActive: true 
      },
      {
        $pull: { memberIds: { $in: memberIds } }
      },
      { new: true }
    );

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Get updated member details
    const members = await User.find(
      { _id: { $in: team.memberIds } },
      'username email'
    );

    return NextResponse.json({ 
      team: {
        ...team.toObject(),
        members
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}