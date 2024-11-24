"use client";
import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Button,
  Input,
  List,
  ListItem,
  ListItemPrefix,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Select,
  Option,
  Chip,
} from "@material-tailwind/react";
import {
  addDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../../utils/auth";
import Header from "../header";
import Sidebar from "../sidebar";
import { useAuthState } from "react-firebase-hooks/auth";
import { FaCalendarAlt, FaChevronDown } from "react-icons/fa";

export default function Audit_Trails() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, loading, error] = useAuthState(auth);
  const [auditLogs, setAuditLogs] = useState([]); // For filtered/displayed logs
  const [allLogs, setAllLogs] = useState([]); // For storing all logs
  const [filterType, setFilterType] = useState("All");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      console.log("User is not authenticated, redirecting to home...");
      router.push("/");
      return;
    }
    const checkAuth = async () => {
      const authorized = await isAuthenticated("Admin");
      setIsAuthorized(authorized);
    };
    checkAuth();
  }, [user, loading, router]);

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const ticketRef = doc(db, "ticketentries", ticketId);
      await updateDoc(ticketRef, {
        ticketStatus: newStatus,
      });
      console.log("Ticket status updated successfully");
    } catch (error) {
      console.error("Error updating ticket status: ", error);
    }
  };

  useEffect(() => {
    const fetchAuditLogs = () => {
      const teacherLogsQuery = query(
        collection(db, "teacherLogs"),
        orderBy("date", "desc"),
        limit(50)
      );
      const studentQuery = query(
        collection(db, "lobbydata"),
        orderBy("date", "desc"),
        limit(50)
      );

      const ticketQuery = query(
        collection(db, "ticketentries"),
        orderBy("date", "desc"),
        limit(50)
      );

      const userAccountQuery = query(
        collection(db, "user"),
        orderBy("date", "desc"),
        limit(50)
      );

      const unsubscribeAccountQuery = onSnapshot(
        userAccountQuery,
        (snapshot) => {
          const ticketLogs = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              timestamp: `${data.date} ${data.time}`,
              type: "Admin",
              content: `The admin created an account for ${data.name}.`,
            };
          });
          updateAuditLogs(ticketLogs);
        }
      );

      const unsubscribeTicketQuery = onSnapshot(ticketQuery, (snapshot) => {
        const ticketLogs = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            timestamp: `${data.date} ${data.timeIn}`,
            type: "Student",
            content: `The student ${data.studentName} has submitted a ticket.`,
          };
        });
        updateAuditLogs(ticketLogs);
      });

      const unsubscribeTeacherLogs = onSnapshot(
        teacherLogsQuery,
        (snapshot) => {
          const teacherLogs = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              timestamp: `${data.date} ${data.time}`,
              type: "Teacher",
              content: `${data.teacherName} ${data.action}: ${data.classSection} in ${data.computerLab}`,
            };
          });
          updateAuditLogs(teacherLogs);
        }
      );

      const unsubscribeStudent = onSnapshot(studentQuery, (snapshot) => {
        const studentLogs = snapshot.docs.map((doc) => {
          const data = doc.data();

          return {
            id: doc.id,
            timestamp: `${data.date} ${data.timeIn}`,
            type: "Student",
            content: `${data.studentName} entered classroom: ${data.classSection}`,
          };
        });
        updateAuditLogs(studentLogs);
      });

      return () => {
        unsubscribeTeacherLogs();
        unsubscribeStudent();
        unsubscribeTicketQuery();
        unsubscribeAccountQuery();
      };
    };

    fetchAuditLogs();
  }, []);

  const updateAuditLogs = (newLogs) => {
    setAllLogs((prevLogs) => {
      // Combine previous logs with new logs
      const combinedLogs = [...prevLogs, ...newLogs];

      // Remove duplicates based on the log ID
      const uniqueLogs = combinedLogs.reduce((acc, log) => {
        if (!acc.find((item) => item.id === log.id)) {
          acc.push(log);
        }
        return acc;
      }, []);
      return uniqueLogs;
    });
  };

  // Update the useEffect that handles filtering
  useEffect(() => {
    // First filter logs based on selected type
    const filteredLogs =
      filterType === "All"
        ? allLogs
        : allLogs.filter((log) => log.type === filterType);

    // Then sort the filtered logs by timestamp (latest to oldest)
    const sortedLogs = filteredLogs.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB - dateA;
    });

    // Update the state with sorted logs
    setAuditLogs(sortedLogs);
  }, [filterType, allLogs]);

  const renderAuditLogsTable = () => (
    <Card className="overflow-x-auto px-0">
      <table className="w-full table-auto text-left">
        <thead>
          <tr>
            <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4 w-1/4">
              <Typography
                variant="paragraph"
                color="blue-gray"
                className="font-semibold"
              >
                Timestamp
              </Typography>
            </th>
            <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4 w-1/4">
              <Typography
                variant="paragraph"
                color="blue-gray"
                className="font-semibold"
              >
                Type
              </Typography>
            </th>
            <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4 w-2/4">
              <Typography
                variant="paragraph"
                color="blue-gray"
                className="font-semibold"
              >
                Content
              </Typography>
            </th>
          </tr>
        </thead>
        <tbody>
          {auditLogs.map((log, index) => (
            <tr
              key={log.id}
              className={
                index !== auditLogs.length - 1
                  ? "border-b border-blue-gray-50"
                  : ""
              }
            >
              <td className="p-4 w-1/4">
                <Typography variant="paragraph">{log.timestamp}</Typography>
              </td>
              <td className="p-4 w-2/4">
                <Chip
                  variant="ghost"
                  size="md"
                  value={log.type}
                  color={
                    log.type === "Admin"
                      ? "blue"
                      : log.type === "Teacher"
                      ? "green"
                      : "gray"
                  }
                />
              </td>
              <td className="p-4 w-1/4">
                <Typography variant="paragraph">{log.content}</Typography>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );

  return isAuthorized ? (
    <>
      <div className="bg-blue-gray-50 min-h-screen">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 sm:ml-64">
            <div className="container mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <Typography
                  variant="h3"
                  color="blue-gray"
                  className="mb-4 md:mb-0"
                >
                  Audit Trails
                </Typography>
                <div>
                  <Select
                    label="Filter by Type"
                    value={filterType}
                    onChange={(value) => setFilterType(value)}
                    className="w-full"
                  >
                    <Option value="All">All</Option>
                    <Option value="Admin">Admin</Option>
                    <Option value="Teacher">Teacher</Option>
                    <Option value="Student">Student</Option>
                  </Select>
                </div>
              </div>
              {renderAuditLogsTable()}
            </div>
          </main>
        </div>
      </div>
    </>
  ) : null;
}
