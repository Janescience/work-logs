// app/api/services/[serviceId]/details/[detailId]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route'; // Adjust path as needed
import dbConnect from '@/lib/mongodb';
import ServiceDetail from '@/models/serviceDetail.model';
import Service from '@/models/service.model'; // Import Service model to validate serviceId

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized: Authentication required to view service detail' }, { status: 401 });
        }

        const { serviceId, detailId } = params;

        // Ensure parent service exists and detail belongs to it
        const serviceExists = await Service.findById(serviceId);
        if (!serviceExists) {
            return NextResponse.json({ message: 'Parent Service not found' }, { status: 404 });
        }

        const serviceDetail = await ServiceDetail.findOne({ _id: detailId, service: serviceId });
        if (!serviceDetail) {
            return NextResponse.json({ message: 'Service detail not found or does not belong to this service' }, { status: 404 });
        }

        return NextResponse.json({ serviceDetail }, { status: 200 });
    } catch (error) {
        console.error("Error fetching specific service detail:", error);
        return NextResponse.json({ message: 'Failed to fetch service detail', error: error.message }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized: Authentication required to update service detail' }, { status: 401 });
        }

        const { id, detailId } = params;
        const data = await req.json();

        const { env } = data; // Validate environment as it's part of unique index
        if (!env) {
            return NextResponse.json({ message: 'Environment is required for service detail update' }, { status: 400 });
        }

        const updatedServiceDetail = await ServiceDetail.findOneAndUpdate(
            { _id: detailId, service: id }, // Find by detail ID AND parent service ID
            data,
            { new: true, runValidators: true }
        );

        if (!updatedServiceDetail) {
            return NextResponse.json({ message: 'Service detail not found or unauthorized to update' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Service detail updated successfully!', serviceDetail: updatedServiceDetail }, { status: 200 });
    } catch (error) {
        console.error("Error updating service detail:", error);
        if (error.code === 11000) { // Duplicate key error for service + env combination
            return NextResponse.json({ message: `Service detail for environment "${data.env}" already exists for this service.` }, { status: 409 });
        }
        return NextResponse.json({ message: 'Failed to update service detail', error: error.message }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized: Authentication required to delete service detail' }, { status: 401 });
        }

        const { id, detailId } = params;

        const deletedServiceDetail = await ServiceDetail.findOneAndDelete({ _id: detailId, service: id }); // Find by detail ID AND parent service ID

        if (!deletedServiceDetail) {
            return NextResponse.json({ message: 'Service detail not found or unauthorized to delete' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Service detail deleted successfully!' }, { status: 200 });
    } catch (error) {
        console.error("Error deleting service detail:", error);
        return NextResponse.json({ message: 'Failed to delete service detail', error: error.message }, { status: 500 });
    }
}
