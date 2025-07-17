// app/api/services/[serviceId]/details/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route'; // Adjust path as needed
import dbConnect from '@/lib/mongodb';
import ServiceDetail from '@/models/serviceDetail.model';
import Service from '@/models/service.model'; // Import Service model to validate serviceId

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized: Authentication required to view service details' }, { status: 401 });
        }

        const { id } = params; // Service ID from URL

        // Optional: Validate if the serviceId actually exists
        const serviceExists = await Service.findById(id);
        if (!serviceExists) {
            return NextResponse.json({ message: 'Parent Service not found' }, { status: 404 });
        }

        const serviceDetails = await ServiceDetail.find({ service: id }).sort({ env: 1 }); // Sort by environment

        return NextResponse.json({ serviceDetails }, { status: 200 });
    } catch (error) {
        console.error("Error fetching service details:", error);
        return NextResponse.json({ message: 'Failed to fetch service details', error: error.message }, { status: 500 });
    }
}

export async function POST(req, { params }) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized: Authentication required to add service details' }, { status: 401 });
        }

        const { id } = params;
        const data = await req.json();

        // Validate required fields for ServiceDetail
        const { env } = data;
        if (!env) {
            return NextResponse.json({ message: 'Environment is required for service detail' }, { status: 400 });
        }

        // Ensure parent service exists
        const serviceExists = await Service.findById(id);
        if (!serviceExists) {
            return NextResponse.json({ message: 'Parent Service not found' }, { status: 404 });
        }

        const newServiceDetail = new ServiceDetail({ ...data, service: id });
        const savedServiceDetail = await newServiceDetail.save();

        return NextResponse.json({ message: 'Service detail added successfully!', serviceDetail: savedServiceDetail }, { status: 201 });
    } catch (error) {
        console.error("Error adding service detail:", error);
        if (error.code === 11000) { // Duplicate key error for service + env combination
            return NextResponse.json({ message: `Service detail for environment "${data.env}" already exists for this service.` }, { status: 409 });
        }
        return NextResponse.json({ message: 'Failed to add service detail', error: error.message }, { status: 500 });
    }
}
