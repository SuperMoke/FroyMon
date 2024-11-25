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
    "Total Time",
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
    if (!teacherId) return;

    const q = query(
      collection(db, "lobbydata"),
      where("teacherId", "==", teacherId),
      where("date", "==", selectedDate)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tempData = {};

      // First pass to organize data by student
      querySnapshot.forEach((doc) => {
        const studentData = doc.data();
        const key = `${studentData.ccaEmail}_${studentData.classSection}`;

        if (!tempData[key]) {
          tempData[key] = {
            ...studentData,
            timeIn: studentData.timeIn,
            timeOut: studentData.timeOut,
          };
        } else {
          // Update timeIn if current record has earlier time
          if (studentData.timeIn < tempData[key].timeIn) {
            tempData[key].timeIn = studentData.timeIn;
          }
          // Update timeOut if current record has later time
          if (studentData.timeOut > tempData[key].timeOut) {
            tempData[key].timeOut = studentData.timeOut;
          }
        }
      });

      // Organize final data by section
      const newAttendanceData = {};
      Object.values(tempData).forEach((studentData) => {
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

  // Add this helper function at the top of the file, after the imports
  const calculateTotalTime = (timeIn, timeOut) => {
    const [inTime, inPeriod] = timeIn.split(" ");
    const [outTime, outPeriod] = timeOut.split(" ");

    const [inHours, inMinutes] = inTime.split(":");
    const [outHours, outMinutes] = outTime.split(":");

    let startHours = parseInt(inHours);
    let endHours = parseInt(outHours);

    if (inPeriod === "PM" && startHours !== 12) startHours += 12;
    if (outPeriod === "PM" && endHours !== 12) endHours += 12;
    if (inPeriod === "AM" && startHours === 12) startHours = 0;
    if (outPeriod === "AM" && endHours === 12) endHours = 0;

    const totalSeconds =
      endHours * 3600 +
      parseInt(outMinutes) * 60 -
      (startHours * 3600 + parseInt(inMinutes) * 60);

    const hours = Math.floor(Math.abs(totalSeconds) / 3600);
    const minutes = Math.floor((Math.abs(totalSeconds) % 3600) / 60);
    const seconds = Math.abs(totalSeconds) % 60;

    if (hours === 0) {
      if (minutes === 0) {
        return `${seconds}s`;
      }
      return `${minutes}m ${seconds}s`;
    }
    return `${hours}h ${minutes}m ${seconds}s`;
  };

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
        calculateTotalTime(student.timeIn, student.timeOut),
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

  // Replace the existing renderTable function with this one
  const renderTable = (students, title) => (
    <Card className="overflow-x-auto px-0 mb-8">
      <div className="flex justify-between items-center bg-blue-gray-50/50 p-4">
        <Typography variant="h5" color="blue-gray">
          {title}
        </Typography>
        <Button
          onClick={() => downloadCSV(students, title)}
          color="black"
          variant="filled"
        >
          Download CSV
        </Button>
      </div>
      <table className="w-full table-auto text-left">
        <thead>
          <tr>
            {TABLE_HEAD.map((head) => (
              <th
                key={head}
                className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4"
              >
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-semibold"
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
              className={
                index !== students.length - 1
                  ? "border-b border-blue-gray-50"
                  : ""
              }
            >
              <td className="p-4">
                <Typography variant="small" color="blue-gray">
                  {student.studentName}
                </Typography>
              </td>
              <td className="p-4">
                <Typography variant="small" color="blue-gray">
                  {student.ccaEmail}
                </Typography>
              </td>
              <td className="p-4">
                <Typography variant="small" color="blue-gray">
                  {student.classSection}
                </Typography>
              </td>
              <td className="p-4">
                <Typography variant="small" color="blue-gray">
                  {student.computerLab}
                </Typography>
              </td>
              <td className="p-4">
                <Typography variant="small" color="blue-gray">
                  {student.timeIn}
                </Typography>
              </td>
              <td className="p-4">
                <Typography variant="small" color="blue-gray">
                  {student.timeOut}
                </Typography>
              </td>
              <td className="p-4">
                <Typography variant="small" color="blue-gray">
                  {calculateTotalTime(student.timeIn, student.timeOut)}
                </Typography>
              </td>
              <td className="p-4">
                <Typography variant="small" color="blue-gray">
                  {student.date}
                </Typography>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );

  return isAuthorized ? (
    <>
      <div className="flex flex-col bg-blue-gray-50 min-h-screen">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <div className="flex-1 p-4 sm:ml-64">
            <div className="mb-4 flex justify-between items-center">
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
                    label="Search students"
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
    </>
  ) : null;
}
