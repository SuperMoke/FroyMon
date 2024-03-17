'use client'
import React, { useEffect, useState } from "react";
import { Card, CardBody } from "@material-tailwind/react/components/Card"
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from '../firebase';
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@material-tailwind/react/components/Button";

export default function AdminPage() {
    const [students, setStudents] = useState<{
        id: string;
        name: string;
        labid: string;
        computernumber: string;
        computerstatus: string;
    }[]>([]);

    const { data: session, status } = useSession();
    const router = useRouter();

    React.useEffect(() => {
        if (!session) {
          router.push('/signin'); 
        }
      }, [session, status, router]);
      

    useEffect(() => {
        const fetchData = async () => {
            const studentsCollection = collection(db, 'items'); // Assuming 'items' is the collection name
            const snapshot = await getDocs(studentsCollection);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as { name: string; labid: string; computernumber: string; computerstatus: string; } }));
            setStudents(data);
        };

        fetchData();

        // Add real-time listener
        const unsubscribe = onSnapshot(collection(db, 'items'), (querySnapshot) => {
            const updatedStudents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as { name: string; labid: string; computernumber: string; computerstatus: string; } }));
            setStudents(updatedStudents);
        });

        // Cleanup function to unsubscribe from listener when component unmounts
        return () => unsubscribe();
    }, []);

    return (
        <div className="flex min-h-full flex-1 flex-col justify-center items-center px-6 py-12 lg:px-8">
            <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-black">
                Admin Page
            </h2>
            <h1 className="mt-2 text-center text-2xl font-bold leading-9 tracking-tight text-black">
                Computer Status
            </h1>
            {students.map(student => (
                <Card key={student.id} className="w-96 mt-2" placeholder={undefined}>
                    <CardBody className="text-center" placeholder={undefined}>
                        <h2>Student Name: {student.name}</h2>
                        <h2>Computer Number: {student.computernumber}</h2>
                        <h2>Computer Status: {student.computerstatus}</h2>
                        <h2>Laboratory: {student.labid}</h2>
                    </CardBody>
                </Card>
            ))}
            <Button 
            className='flex mt-5 justify-center'
            placeholder={undefined} 
            onClick={() => signOut()}            
          >
            Logout
          </Button>
        </div>
    )
}
