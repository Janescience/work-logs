// app/api/admin/update-role/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectMongo from '@/lib/mongodb';
import User from '@/models/user.model';

export async function PUT(req) {
    try {
        await connectMongo();
        const session = await getServerSession(authOptions);

        // Check if user is authenticated and has 'admin' role
        if (!session || !session.user || !session.user.roles || !session.user.roles.includes('ADMIN')) {
            return NextResponse.json({ message: 'Unauthorized: Admin access required' }, { status: 403 });
        }

        const { userId, newRoles } = await req.json(); // Expect newRoles as an array

        // Basic validation for newRoles (must be an array and contain valid roles)
        const validRoles = ['DEVELOPER', 'TEAM LEAD','IT LEAD','ADMIN'];
        if (!userId || !Array.isArray(newRoles) || newRoles.some(role => !validRoles.includes(role))) {
            return NextResponse.json({ message: 'Invalid user ID or roles format/values' }, { status: 400 });
        }

        // Ensure an admin cannot remove themselves from the admin role (optional but good practice)
        if (userId === session.user.id && !newRoles.includes('ADMIN')) {
            return NextResponse.json({ message: 'Admin cannot remove their own admin role' }, { status: 403 });
        }

        // Find and update the user's roles
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { roles: newRoles }, // Update the 'roles' array
            { new: true, select: '-password' }
        );

        if (!updatedUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'User roles updated successfully', user: updatedUser }, { status: 200 });
    } catch (error) {
        console.error("Error updating user roles:", error);
        return NextResponse.json({ message: 'Failed to update user roles' }, { status: 500 });
    }
}
