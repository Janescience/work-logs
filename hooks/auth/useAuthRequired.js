// hooks/useAuthRequired.js
import { useSession } from 'next-auth/react';
// *** แก้ไขตรงนี้: เปลี่ยนจาก 'next/router' เป็น 'next/navigation' ***
import { useRouter } from 'next/navigation'; // <-- ต้องใช้ตัวนี้สำหรับ App Router
import { useEffect } from 'react';

export function useAuthRequired() {
    const { data: session, status } = useSession();
    const router = useRouter(); // ตอนนี้ useRouter จะมาจาก next/navigation แล้ว

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login'); // Redirect to login if not authenticated
        }
    }, [status, router]);

    return { session, status };
}

export function useAdminRequired() {
    const { data: session, status } = useSession();
    const router = useRouter(); // ตอนนี้ useRouter จะมาจาก next/navigation แล้ว

    useEffect(() => {
        // *** ตรวจสอบ 'ADMIN' ด้วยตัวพิมพ์ใหญ่ตามที่คุณระบุ ***
        if (status === 'authenticated' && (!session?.user?.roles || !session.user.roles.includes('ADMIN'))) {
            router.push('/denied'); // Redirect to denied if not admin
        } else if (status === 'unauthenticated') {
            router.push('/login'); // Redirect to login if not authenticated at all
        }
    }, [session, status, router]);

    return { session, status };
}
