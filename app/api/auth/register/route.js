// app/api/auth/register/route.js
import connectMongo from '@/lib/mongodb';
import User from '@/models/user.model';
import { NextResponse } from 'next/server';

export async function POST(req) {
    await connectMongo();
    const data = await req.json();
    const { username, password, email, name, phone,type } = data; // Destructure new fields
    // Basic validation
    if (!username || !password || !email || !name) { // name is now required
        return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }

    try {
        // Check if user or email already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return NextResponse.json({ message: 'Username or Email already exists.' }, { status: 409 });
        }

        // Password hashing is handled by the pre-save hook in the User model
        const newUser = new User({
            username,
            password, // Password will be hashed by pre-save hook
            email,
            name,
            phone,
            type,
            // *** แก้ไขตรงนี้: กำหนด 'roles' เป็น Array แทน 'role' String ***
            roles: ['DEVELOPER'] // Default role(s) for new registrations (e.g., ['developer'])
        });

        await newUser.save();

        return NextResponse.json({ message: 'User registered successfully!' }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ message: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}
