"use client";
import React, { useEffect, useState } from "react";
import { Card, Typography, Button, Input } from "@material-tailwind/react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../../utils/auth";
import Header from "../header";
import { useAuthState } from "react-firebase-hooks/auth";
import { FaSearch, FaCalendarAlt } from "react-icons/fa";
import Sidebar from "../sidebar";

export default function ViewAttendance() {
  const TABLE_HEAD = [
    "Student Name",
    "Email",
    "Class Section",
    "Computer Lab",
    "Time In",
    "Time Out",
    "Date",
  ];
  const [attendanceData, setAttendanceData] = useState({});
  const [teacherId, setTeacherId] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);

  useEffect(() => {
    if (!user) return;
    setTeacherId(user.uid);
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      console.log("User is not authenticated, redirecting to home...");
      router.push("/");
      return;
    }
    const checkAuth = async () => {
      const authorized = await isAuthenticated("Teacher");
      setIsAuthorized(authorized);
    };
    checkAuth();
  }, [user, loading, router]);

  useEffect(() => {
    console.log("Teacher ID:", teacherId);
    if (!teacherId) return;

    const q = query(
      collection(db, "lobbydata"),
      where("teacherId", "==", teacherId),
      where("date", "==", selectedDate)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newAttendanceData = {};
      querySnapshot.forEach((doc) => {
        const studentData = doc.data();
        if (!newAttendanceData[studentData.classSection]) {
          newAttendanceData[studentData.classSection] = [];
        }
        newAttendanceData[studentData.classSection].push(studentData);
      });
      setAttendanceData(newAttendanceData);
    });

    return () => unsubscribe();
  }, [teacherId, selectedDate]);

  const filteredAttendanceData = Object.entries(attendanceData).reduce(
    (acc, [section, students]) => {
      const filteredStudents = students.filter(
        (student) =>
          student.studentName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          student.ccaEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filteredStudents.length > 0) {
        acc[section] = filteredStudents;
      }
      return acc;
    },
    {}
  );

  const downloadCSV = (students, section) => {
    const csvRows = [];
    const headers = TABLE_HEAD.join(",");
    csvRows.push(headers);

    students.forEach((student) => {
      const values = [
        student.studentName,
        student.ccaEmail,
        student.classSection,
        student.computerLab,
        student.timeIn,
        student.timeOut,
        `"${student.date}"`,
      ];
      csvRows.push(values.join(","));
    });

    const csvContent = `data:text/csv;charset=utf-8,${csvRows.join("\n")}`;
    const encodedUri = encodeURI(csvContent);
    const formattedDate = new Date(selectedDate).toISOString().split("T")[0];
    const filename = `attendance_${section}_${formattedDate}.csv`;

    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTable = (students, title) => (
    <Card className="w-full mb-8 shadow-lg rounded-lg overflow-hidden">
      <div className="bg-blue-500 p-4 flex justify-between items-center">
        <Typography variant="h5" color="white">
          {title}
        </Typography>
        <Button
          onClick={() => downloadCSV(students, title)}
          color="white"
          variant="filled"
          className="ml-auto"
        >
          Download CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-blue-gray-50">
              {TABLE_HEAD.map((head) => (
                <th key={head} className="border-b border-blue-gray-100 p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-bold leading-none opacity-70"
                  >
                    {head}
                  </Typography>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "bg-blue-gray-50/50" : ""}
              >
                <td className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-normal text-center"
                  >
                    {student.studentName}
                  </Typography>
                </td>
                <td className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-normal text-center"
                  >
                    {student.ccaEmail}
                  </Typography>
                </td>
                <td className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-normal text-center"
                  >
                    {student.classSection}
                  </Typography>
                </td>
                <td className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-normal text-center"
                  >
                    {student.computerLab}
                  </Typography>
                </td>
                <td className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-normal text-center"
                  >
                    {student.timeIn}
                  </Typography>
                </td>
                <td className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-normal text-center"
                  >
                    {student.timeOut}
                  </Typography>
                </td>
                <td className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-normal text-center"
                  >
                    {student.date}
                  </Typography>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  return isAuthorized ? (
    <>
      <div className="flex flex-col bg-blue-gray-50 min-h-screen">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <div className="flex-1 p-4 sm:ml-64">
            <div className="container mx-auto px-4 py-8">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <Typography
                  variant="h3"
                  color="blue-gray"
                  className="mb-4 md:mb-0"
                >
                  Attendance Records
                </Typography>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                    <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-gray-300" />
                  </div>
                  <div className="relative">
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="pr-5"
                    />
                  </div>
                </div>
              </div>
              {Object.entries(filteredAttendanceData).length > 0 ? (
                Object.entries(filteredAttendanceData).map(
                  ([section, students]) =>
                    renderTable(students, `Section ${section}`)
                )
              ) : (
                <Card className="w-full mx-auto p-6 text-center">
                  <Typography variant="h5" color="blue-gray">
                    No attendance records found for the selected criteria.
                  </Typography>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  ) : null;
}
