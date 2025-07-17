// app/api/services/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route'; // Adjust path as needed
import dbConnect from '@/lib/mongodb';
import Service from '@/models/service.model';

export async function GET(req) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized: Authentication required to view services' }, { status: 401 });
        }

        const services = await Service.find({}).sort({ name: 1 }); // Sort by name

        return NextResponse.json({ services }, { status: 200 });
    } catch (error) {
        console.error("Error fetching services:", error);
        return NextResponse.json({ message: 'Failed to fetch services', error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized: Authentication required to add services' }, { status: 401 });
        }

        const { name,repository,deployBy } = await req.json();

        if (!name) {
            return NextResponse.json({ message: 'Service name is required' }, { status: 400 });
        }

        const newService = new Service({ name,repository,deployBy });
        const savedService = await newService.save();

        return NextResponse.json({ message: 'Service added successfully!', service: savedService }, { status: 201 });
    } catch (error) {
        console.error("Error adding service:", error);
        if (error.code === 11000) { // Duplicate key error
            return NextResponse.json({ message: 'Service name must be unique.' }, { status: 409 });
        }
        return NextResponse.json({ message: 'Failed to add service', error: error.message }, { status: 500 });
    }
}
