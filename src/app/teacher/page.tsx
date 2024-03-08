'use client'
import React, { useEffect, useState } from "react";
import { Card, CardBody } from "@material-tailwind/react/components/Card"
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from '../firebase';

export default function TeacherHomepage() {
    const [students, setStudents] = useState<{
        id: string;
        name: string;
        computernumber: string;
    }[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const studentsCollection = collection(db, 'items'); // Assuming 'items' is the collection name
            const snapshot = await getDocs(studentsCollection);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as { name: string; computernumber: string; } }));
            setStudents(data);
        };

        fetchData();

        const unsubscribe = onSnapshot(collection(db, 'items'), (querySnapshot) => {
            const updatedStudents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as { name: string; computernumber: string; } }));
            setStudents(updatedStudents);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="flex min-h-full flex-1 flex-col justify-center items-center px-6 py-12 lg:px-8">
            <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-black">
                Teacher Page
            </h2>
            <h1 className="mt-2 text-center text-2xl font-bold leading-9 tracking-tight text-black">
                Attendance
            </h1>
            {students.map(student => (
                <Card key={student.id} className="w-96 mt-2"  placeholder={undefined}>
                    <CardBody className="text-center" placeholder={undefined}>
                        <h2>Student Name: {student.name}</h2>
                        <h2>Computer Number: {student.computernumber}</h2>
                    </CardBody>
                </Card>
            ))}
        </div>
    )
}
