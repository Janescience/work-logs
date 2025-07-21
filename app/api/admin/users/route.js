// app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route'; // Adjust path as needed
import dbConnect from '@/lib/mongodb';
import User from '@/models/user.model';
import Team from '@/models/team.model';

export async function GET(req) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.roles.includes('ADMIN')) {
            return NextResponse.json({ message: 'Unauthorized: Admin access required' }, { status: 403 });
        }

        // 2. Fetch all users and all teams in parallel
        const [users, teams] = await Promise.all([
            User.find({}, { password: 0 }).sort({ createdAt: -1 }).lean(),
            Team.find({}).lean()
        ]);

        // 3. Create a map for quick team lookup
        const userTeamMap = {};
        teams.forEach(team => {
            team.memberIds.forEach(memberId => {
                userTeamMap[memberId] = team.teamName;
            });
        });

        // 4. Format user data and include all required fields
        const formattedUsers = users.map(user => ({
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            roles: user.roles,
            type: user.type || 'Non-Core', // Include type
            name: user.name,               // Include name
            phone: user.phone || '-',      // Include phone
            teamName: userTeamMap[user._id.toString()] || 'N/A', // Include team name from map
            createdAt: user.createdAt.toISOString(),
        }));

        return NextResponse.json({ users: formattedUsers }, { status: 200 });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ message: 'Failed to fetch users' }, { status: 500 });
    }
}
