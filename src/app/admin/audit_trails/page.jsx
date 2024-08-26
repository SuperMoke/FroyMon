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
  const [auditLogs, setAuditLogs] = useState([]);

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
      const teacherQuery = query(
        collection(db, "lobbies"),
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

      const unsubscribeTeacher = onSnapshot(teacherQuery, (snapshot) => {
        const teacherLogs = snapshot.docs.map((doc) => {
          const data = doc.data();
          const timestamp = new Date(`${data.date} ${data.time}`);
          return {
            id: doc.id,
            timestamp: `${data.date} ${data.time}`,
            type: "Teacher",
            content: `${data.name} created classroom: ${data.classSection}`,
          };
        });
        updateAuditLogs(teacherLogs);
      });

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
        unsubscribeTeacher();
        unsubscribeStudent();
        unsubscribeTicketQuery();
        unsubscribeAccountQuery();
      };
    };

    fetchAuditLogs();
  }, []);

  const updateAuditLogs = (newLogs) => {
    setAuditLogs((prevLogs) => {
      const combinedLogs = [...prevLogs, ...newLogs];
      const uniqueLogs = combinedLogs.reduce((acc, log) => {
        if (!acc.find((item) => item.id === log.id)) {
          acc.push(log);
        }
        return acc;
      }, []);
      return uniqueLogs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 100);
    });
  };

  const renderAuditLogsTable = () => (
    <Card className="w-full mb-8 shadow-lg rounded-lg overflow-hidden">
      <div className="bg-blue-500 p-4 flex justify-between items-center">
        <Typography variant="h5" color="white">
          System Log
        </Typography>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-blue-gray-50">
              <th className="border-b border-blue-gray-100 p-4">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-bold leading-none opacity-70"
                >
                  Timestamp
                </Typography>
              </th>
              <th className="border-b border-blue-gray-100 p-4">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-bold leading-none opacity-70"
                >
                  Type
                </Typography>
              </th>
              <th className="border-b border-blue-gray-100 p-4">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-bold leading-none opacity-70"
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
                className={index % 2 === 0 ? "bg-blue-gray-50/50" : ""}
              >
                <td className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-normal text-center"
                  >
                    {log.timestamp.toLocaleString()}
                  </Typography>
                </td>
                <td className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-normal text-center"
                  >
                    {log.type}
                  </Typography>
                </td>
                <td className="p-4">
                  <Typography
                    variant="small"
                    color="blue-gray"
                    className="font-normal text-center"
                  >
                    {log.content}
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
              </div>
              {renderAuditLogsTable()}
            </div>
          </main>
        </div>
      </div>
    </>
  ) : null;
}
