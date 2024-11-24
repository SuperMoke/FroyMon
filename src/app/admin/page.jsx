"use client";
import React, { useState, useEffect } from "react";
import {
  Typography,
  Button,
  Card,
  IconButton,
  Progress,
  Input,
} from "@material-tailwind/react";
import {
  addDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import { auth } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import Header from "./header";
import Sidebar from "./sidebar";
import {
  Bars3Icon,
  WrenchIcon,
  CodeBracketIcon,
  WifiIcon,
  BellIcon,
  PencilIcon,
  PaperAirplaneIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
} from "@material-tailwind/react";
import Image from "next/image";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import AnnouncementComponent from "./AnnouncementComponent";

export default function AdminPage() {
  const [statusCounts, setStatusCounts] = useState({
    hardwareIssues: 0,
    softwareIssues: 0,
    networkProblems: 0,
  });
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [totalComputers, setTotalComputers] = useState(0);
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);
  const [auditLogs, setAuditLogs] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [date, setDate] = useState(new Date());
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [announcementFilter, setAnnouncementFilter] = useState("all"); // all, today, week, month
  const [announcementPriority, setAnnouncementPriority] = useState("normal"); // normal, important, urgent
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      console.log("User is not authenticated, redirecting to home...");
      router.push("/");
      return;
    }

    window.history.pushState(null, "", window.location.href);
    window.onpopstate = () => {
      window.history.pushState(null, "", window.location.href);
    };

    const checkAuth = async () => {
      console.log("Checking authentication...");
      const requiredRole = "Admin";

      const authorized = await isAuthenticated(requiredRole);
      if (authorized) {
        console.log("User is authorized:", requiredRole);
        setIsAuthorized(true);
        return;
      }

      console.log("User is not authorized, redirecting to home...");
      router.push("/");
    };
    checkAuth();

    return () => {
      window.onpopstate = null;
    };
  }, [user, loading, router]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && user.email) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setUserProfile(querySnapshot.docs[0].data());
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "ticketentries"));
        const counts = {
          hardwareIssues: 0,
          softwareIssues: 0,
          networkProblems: 0,
        };
        let total = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.computerStatus === "Hardware Issues") {
            counts.hardwareIssues++;
          } else if (data.computerStatus === "Software Issues") {
            counts.softwareIssues++;
          } else if (data.computerStatus === "Network Problems") {
            counts.networkProblems++;
          }
          total++;
        });

        setStatusCounts(counts);
        setTotalComputers(total);
      } catch (error) {
        console.error("Error fetching data from Firestore:", error);
      }
    };

    fetchData();
  }, []);

  const handleIssueClick = async (issueType) => {
    try {
      const ticketsRef = collection(db, "ticketentries");
      const q = query(ticketsRef, where("computerStatus", "==", issueType));
      const querySnapshot = await getDocs(q);

      const issues = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSelectedIssue({
        type: issueType,
        tickets: issues,
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching issues:", error);
      toast.error("Failed to fetch issue details");
    }
  };

  useEffect(() => {
    const fetchAnnouncements = () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const announcementsQuery = query(
        collection(db, "announcements"),
        where("timestamp", ">=", threeDaysAgo),
        orderBy("timestamp", "desc")
      );

      const unsubscribe = onSnapshot(announcementsQuery, (snapshot) => {
        const fetchedAnnouncements = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAnnouncements(fetchedAnnouncements);
      });

      return unsubscribe;
    };

    fetchAnnouncements();
  }, []);

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

      const unsubscribeTicketQuery = onSnapshot(ticketQuery, (snapshot) => {
        const ticketLogs = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            timestamp: `${data.date} ${data.timeIn}`,
            type: "Admin",
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

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.trim()) {
      toast.error("Announcement cannot be empty");
      return;
    }
    try {
      await addDoc(collection(db, "announcements"), {
        content: newAnnouncement,
        timestamp: new Date(),
        postedBy: userProfile ? userProfile.name : user.email,
        edited: false,
        editedAt: null,
      });
      setNewAnnouncement("");
      toast.success("Announcement added successfully");
    } catch (error) {
      console.error("Error adding announcement:", error);
      toast.error("Failed to add announcement");
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      await deleteDoc(doc(db, "announcements", id));
      toast.success("Announcement deleted successfully");
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast.error("Failed to delete announcement");
    }
  };

  const handleEditAnnouncement = async (id, newContent) => {
    try {
      const announcementRef = doc(db, "announcements", id);
      await updateDoc(announcementRef, {
        content: newContent,
        edited: true,
        editedAt: new Date(),
      });
      setEditingId(null);
      toast.success("Announcement updated successfully");
    } catch (error) {
      console.error("Error updating announcement:", error);
      toast.error("Failed to update announcement");
    }
  };

  const renderCalendar = () => (
    <Calendar
      onChange={setDate}
      value={date}
      className="rounded-lg border-none shadow-md"
    />
  );

  const formatDate = (date) => {
    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return isAuthorized ? (
    <div className=" min-h-screen bg-blue-gray-50">
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
                Dashboard
              </Typography>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              <Card
                className="w-full bg-white shadow-lg rounded-xl p-6 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105"
                onClick={() => handleIssueClick("Hardware Issues")}
              >
                <div className="flex items-center justify-between mb-3">
                  <Typography variant="h5" color="blue-gray">
                    Hardware Issues
                  </Typography>
                  <WrenchIcon className="h-6 w-6 text-red-500" />
                </div>
                <Typography className="text-2xl font-bold">
                  {statusCounts.hardwareIssues}
                </Typography>
                <Progress
                  value={(statusCounts.hardwareIssues / totalComputers) * 100}
                  color="red"
                  className="mt-2"
                />
              </Card>
              <Card
                className="w-full bg-white shadow-lg rounded-xl p-6 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105"
                onClick={() => handleIssueClick("Software Issues")}
              >
                <div className="flex items-center justify-between mb-3">
                  <Typography variant="h5" color="blue-gray">
                    Software Issues
                  </Typography>
                  <CodeBracketIcon className="h-6 w-6 text-yellow-500" />
                </div>
                <Typography className="text-2xl font-bold">
                  {statusCounts.softwareIssues}
                </Typography>
                <Progress
                  value={(statusCounts.softwareIssues / totalComputers) * 100}
                  color="yellow"
                  className="mt-2"
                />
              </Card>
              <Card
                className="w-full bg-white shadow-lg rounded-xl p-6 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105"
                onClick={() => handleIssueClick("Network Problems")}
              >
                <div className="flex items-center justify-between mb-3">
                  <Typography variant="h5" color="blue-gray">
                    Network Problems
                  </Typography>
                  <WifiIcon className="h-6 w-6 text-orange-500" />
                </div>
                <Typography className="text-2xl font-bold">
                  {statusCounts.networkProblems}
                </Typography>
                <Progress
                  value={(statusCounts.networkProblems / totalComputers) * 100}
                  color="orange"
                  className="mt-2"
                />
              </Card>
            </div>

            <Card className="col-span-2 shadow-lg rounded-xl overflow-hidden bg-white p-4">
              <AnnouncementComponent
                userProfile={userProfile}
                announcements={announcements}
                onAddAnnouncement={async (announcementData) => {
                  try {
                    await addDoc(collection(db, "announcements"), {
                      ...announcementData,
                      timestamp: new Date(),
                      postedBy: userProfile ? userProfile.name : user.email,
                      edited: false,
                      editedAt: null,
                    });
                    toast.success("Announcement added successfully");
                  } catch (error) {
                    toast.error("Failed to add announcement");
                  }
                }}
                onEditAnnouncement={handleEditAnnouncement}
                onDeleteAnnouncement={handleDeleteAnnouncement}
              />
            </Card>
          </div>
        </main>
      </div>
      <ToastContainer />
      <Dialog
        open={isModalOpen}
        handler={() => setIsModalOpen(false)}
        size="lg"
      >
        <DialogHeader>{selectedIssue?.type} Details</DialogHeader>
        <DialogBody divider className="max-h-[400px] overflow-y-auto">
          {selectedIssue?.tickets.map((ticket, index) => (
            <div key={ticket.id} className="mb-4 p-4 border-b last:border-b-0">
              <Typography variant="h6">Name: {ticket.studentName}</Typography>
              <Typography color="gray">
                Computer Number: {ticket.computerNumber}
              </Typography>
              <Typography color="gray">Date: {ticket.date}</Typography>
              <Typography color="gray">Time: {ticket.timeIn}</Typography>
              <Typography color="gray">
                Description: {ticket.description}
              </Typography>
            </div>
          ))}
          {selectedIssue?.tickets.length === 0 && (
            <Typography color="gray" className="text-center">
              No issues reported
            </Typography>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="text" onClick={() => setIsModalOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  ) : null;
}
