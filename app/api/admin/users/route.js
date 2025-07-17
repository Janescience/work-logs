// app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route'; // Adjust path as needed
import connectMongo from '@/lib/mongodb';
import User from '@/models/user.model';

export async function GET(req) {
    try {
        await connectMongo();
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and is an admin
        if (!session || !session.user || !session.user.roles || !session.user.roles.includes('ADMIN')) {
            return NextResponse.json({ message: 'Unauthorized: Admin access required' }, { status: 403 });
        }

        // Fetch all users, excluding the password field for security
        const users = await User.find({}, { password: 0 }).sort({ createdAt: 1 }); // Sort by creation date

        // Format created date for better readability if needed
        const formattedUsers = users.map(user => ({
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            roles: user.roles, // Ensure 'roles' is returned as an array
            createdAt: user.createdAt.toISOString(), // Convert Date to ISO string
        }));

        return NextResponse.json({ users: formattedUsers }, { status: 200 });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ message: 'Failed to fetch users' }, { status: 500 });
    }
}
