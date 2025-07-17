// app/api/projects/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route'; // Adjust path as needed
import dbConnect from '@/lib/mongodb';
import Project from '@/models/project.model';

export async function GET(req) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        // *** คงไว้ซึ่งการตรวจสอบ Authentication: User ต้อง Login ถึงจะเห็น Master Data ได้ ***
        if (!session || !session.user) { // ไม่ต้องตรวจสอบ session.user.id เพราะไม่ผูกกับ userId
            return NextResponse.json({ message: 'Unauthorized: Authentication required to view master data' }, { status: 401 });
        }

        // *** ดึง Project ทั้งหมด ไม่ต้องกรองด้วย userId ***
        const projects = await Project.find({}).sort({ createdAt: 1 });

        return NextResponse.json({ projects }, { status: 200 });
    } catch (error) {
        console.error("Error fetching projects:", error);
        return NextResponse.json({ message: 'Failed to fetch projects' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);

        // *** คงไว้ซึ่งการตรวจสอบ Authentication: User ต้อง Login ถึงจะเพิ่ม Master Data ได้ ***
        if (!session || !session.user) { // ไม่ต้องตรวจสอบ session.user.id
            return NextResponse.json({ message: 'Unauthorized: Authentication required to add master data' }, { status: 401 });
        }

        // ไม่ต้องดึง userId จาก session
        const { name,type } = await req.json();

        if (!name || !type) {
            return NextResponse.json({ message: 'Project name is required' }, { status: 400 });
        }

        // *** ตรวจสอบชื่อ Project ที่ซ้ำกันแบบ Global (เพราะ unique: true ใน model) ***
        const existingProject = await Project.findOne({ name: name, type: type });
        if (existingProject) {
            return NextResponse.json({ message: `Project with name "${name}" already exists.` }, { status: 409 });
        }

        // *** สร้าง Project ใหม่โดยไม่มี userId ***
        const newProject = new Project({ name , type }); // ไม่ต้องใส่ userId
        const savedProject = await newProject.save();

        return NextResponse.json({ message: 'Project added successfully!', project: savedProject }, { status: 201 });
    } catch (error) {
        console.error("Error adding project:", error);
        if (error.code === 11000) {
            return NextResponse.json({ message: 'Project name must be unique.' }, { status: 409 });
        }
        return NextResponse.json({ message: 'Failed to add project', error: error.message }, { status: 500 });
    }
}


