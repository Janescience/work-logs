// app/api/services/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route'; // Adjust path as needed
import dbConnect from '@/lib/mongodb';
import Service from '@/models/service.model';
import ServiceDetail from '@/models/serviceDetail.model'; // Import ServiceDetail model

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized: Authentication required to view service' }, { status: 401 });
        }

        const { id } = params; // Service ID from URL

        const service = await Service.findById(id);
        if (!service) {
            return NextResponse.json({ message: 'Service not found' }, { status: 404 });
        }

        return NextResponse.json({ service }, { status: 200 });
    } catch (error) {
        console.error("Error fetching service by ID:", error);
        return NextResponse.json({ message: 'Failed to fetch service', error: error.message }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized: Authentication required to update service' }, { status: 401 });
        }

        const { id } = params; // Service ID from URL
        const { name,repository,deployBy } = await req.json();

        if (!name) {
            return NextResponse.json({ message: 'Service name is required' }, { status: 400 });
        }

        const updatedService = await Service.findByIdAndUpdate(
            id,
            { name: name , repository: repository, deployBy: deployBy },
            { new: true, runValidators: true } // Return updated doc, run schema validators
        );

        if (!updatedService) {
            return NextResponse.json({ message: 'Service not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Service updated successfully!', service: updatedService }, { status: 200 });
    } catch (error) {
        console.error("Error updating service:", error);
        if (error.code === 11000) { // Duplicate key error
            return NextResponse.json({ message: 'Service name must be unique.' }, { status: 409 });
        }
        return NextResponse.json({ message: 'Failed to update service', error: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized: Authentication required to delete service' }, { status: 401 });
        }

        const { id } = params; // Service ID from URL

        const deletedService = await Service.findByIdAndDelete(id);

        if (!deletedService) {
            return NextResponse.json({ message: 'Service not found' }, { status: 404 });
        }

        // *** Also delete all associated Service Details ***
        await ServiceDetail.deleteMany({ service: id });

        return NextResponse.json({ message: 'Service and its details deleted successfully!' }, { status: 200 });
    } catch (error) {
        console.error("Error deleting service:", error);
        return NextResponse.json({ message: 'Failed to delete service', error: error.message }, { status: 500 });
    }
}
