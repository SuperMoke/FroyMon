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
  setDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../../utils/auth";
import Header from "../header";
import Sidebar from "../sidebar";
import { useAuthState } from "react-firebase-hooks/auth";
import { FaCalendarAlt, FaChevronDown } from "react-icons/fa";
import { saveAs } from "file-saver";

export default function Audit_Trails() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, loading, error] = useAuthState(auth);
  const [auditLogs, setAuditLogs] = useState([]); // For filtered/displayed logs
  const [allLogs, setAllLogs] = useState([]); // For storing all logs
  const [filterType, setFilterType] = useState("All");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [isRestoring, setIsRestoring] = useState(false);

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
    // Filter logs based on both type and date
    const filteredLogs = allLogs.filter((log) => {
      const logDate = log.timestamp.split(" ")[0]; // Extract date part from timestamp
      const matchesType = filterType === "All" || log.type === filterType;
      const matchesDate = logDate === selectedDate;

      return matchesType && matchesDate;
    });

    // Sort the filtered logs by timestamp (latest to oldest)
    const sortedLogs = filteredLogs.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB - dateA;
    });

    setAuditLogs(sortedLogs);
  }, [filterType, selectedDate, allLogs]);

  const handleBackup = async () => {
    const collections = [
      "announcements",
      "laboratories",
      "lobbydata",
      "sessions",
      "studententries",
      "teacherLogs",
      "ticketHistory",
      "ticketentries",
      "user",
      "users",
    ];
    const backupData = {};

    for (const collectionName of collections) {
      const querySnapshot = await getDocs(collection(db, collectionName));
      backupData[collectionName] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    const backupJson = JSON.stringify(backupData, null, 2);
    const blob = new Blob([backupJson], { type: "application/json" });
    const filename = `froymon_backup_${new Date().toISOString()}.json`;
    saveAs(blob, filename);
  };

  const handleRestore = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsRestoring(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const backupData = JSON.parse(e.target.result);
        for (const [collectionName, documents] of Object.entries(backupData)) {
          for (const document of documents) {
            const { id, ...data } = document;
            const docRef = doc(db, collectionName, id);
            await setDoc(docRef, data);
          }
        }
        alert("Restore completed successfully!");
      } catch (error) {
        console.error("Restore failed:", error);
        alert("Failed to restore backup");
      } finally {
        setIsRestoring(false);
      }
    };

    reader.readAsText(file);
  };

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
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative">
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
                  <div className="relative">
                    <Input
                      label="Filter by Date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="pr-5"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mb-2 justify-end">
                <Button
                  onClick={handleBackup}
                  className="flex items-center gap-2"
                  color="black"
                >
                  Backup Data
                </Button>

                <div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestore}
                    className="hidden"
                    id="restore-file"
                    disabled={isRestoring}
                  />
                  <Button
                    onClick={() =>
                      document.getElementById("restore-file").click()
                    }
                    className="flex items-center gap-2"
                    color="black"
                    disabled={isRestoring}
                  >
                    {isRestoring ? (
                      <>
                        <span className="animate-spin h-5 w-5 mr-2">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                        </span>
                        Restoring...
                      </>
                    ) : (
                      "Restore Data"
                    )}
                  </Button>
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
