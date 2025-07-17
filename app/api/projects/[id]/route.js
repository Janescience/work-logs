import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route'; // Adjust path as needed
import dbConnect from '@/lib/mongodb';
import Project from '@/models/project.model';

export async function DELETE(req, { params }) { // *** Accept 'params' as the second argument ***
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        // Authentication check: User must be logged in to delete Master Data
        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized: Authentication required to delete master data' }, { status: 401 });
        }

        // *** Extract the ID from params.id (from the URL path) ***
        const { id } = params; // This 'id' matches the dynamic segment '[id]' in the folder name

        if (!id) { // Basic check if id is present (though Next.js usually ensures this for dynamic routes)
            return NextResponse.json({ message: 'Project ID is required in the URL path' }, { status: 400 });
        }

        // Find and delete the project by its ID
        const deletedProject = await Project.findOneAndDelete({ _id: id }); // Use the 'id' from params

        if (!deletedProject) {
            return NextResponse.json({ message: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Project deleted successfully!' }, { status: 200 });
    } catch (error) {
        console.error("Error deleting project:", error);
        return NextResponse.json({ message: 'Failed to delete project', error: error.message }, { status: 500 });
    }
}

export async function PUT(req, { params }) { // *** Added/Updated PUT method ***
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized: Authentication required to update master data' }, { status: 401 });
        }

        const { id } = params; // Project ID from URL parameter
        const { name, type } = await req.json(); // Destructure name and type from request body

        if (!name || !type) { // Validate both name and type are provided
            return NextResponse.json({ message: 'Project name and type are required' }, { status: 400 });
        }

        // Find and update the project by its ID
        const updatedProject = await Project.findOneAndUpdate(
            { _id: id }, // Find by ID only (since userId is not used for master data)
            { name: name, type: type }, // Update both name and type fields
            { new: true, runValidators: true } // Return the updated document, run schema validators
        );

        if (!updatedProject) {
            return NextResponse.json({ message: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Project updated successfully!', project: updatedProject }, { status: 200 });
    } catch (error) {
        console.error("Error updating project:", error);
        // Handle MongoDB duplicate key error (code 11000)
        if (error.code === 11000) {
            return NextResponse.json({ message: 'Project name and type combination must be unique.' }, { status: 409 });
        }
        return NextResponse.json({ message: 'Failed to update project', error: error.message }, { status: 500 });
    }
}