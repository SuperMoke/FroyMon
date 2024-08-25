/* eslint-disable react/no-unescaped-entities */
"use client";
import React, { useEffect, useState } from "react";
import { Button, Typography, Card, Tooltip } from "@material-tailwind/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import Header from "./header";
import Sidebar from "./sidebar";
import {
  CalendarIcon,
  ClockIcon,
  ComputerDesktopIcon,
  QrCodeIcon,
  AcademicCapIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
  ClipboardIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

import { auth, db } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";

export default function UserPage() {
  const [user, loading, error] = useAuthState(auth);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userActivities, setUserActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const router = useRouter();

  useEffect(() => {
    const fetchAnnouncements = () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const announcementsRef = collection(db, "announcements");
      const q = query(
        announcementsRef,
        where("timestamp", ">=", threeDaysAgo),
        orderBy("timestamp", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedAnnouncements = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAnnouncements(fetchedAnnouncements);
      });

      return unsubscribe;
    };

    const unsubscribe = fetchAnnouncements();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      console.log("User is not authenticated, redirecting to home...");
      router.push("/");
      return;
    }

    const checkAuth = async () => {
      console.log("Checking authentication...");
      const roleMap = {
        Student: true,
        Teacher: true,
        Admin: true,
      };
      for (const role of Object.keys(roleMap)) {
        const authorized = await isAuthenticated(role);
        if (authorized) {
          console.log("User is authorized:", role);
          setIsAuthorized(true);
          return;
        }
      }
      console.log("User is not authorized, redirecting to home...");
      router.push("/");
    };
    checkAuth();
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        const userEmail = user.email;
        const db = getFirestore();
        const userQuery = query(
          collection(db, "user"),
          where("email", "==", userEmail)
        );
        const querySnapshot = await getDocs(userQuery);
        if (!querySnapshot.empty) {
          querySnapshot.forEach((doc) => {
            const userData = doc.data();
            console.log("User data fetched:", userData);
            setUserName(userData.name);
          });
          await fetchUserActivities(userEmail);
        } else {
          console.error("User not found or role not specified");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, [user]);

  const fetchUserActivities = async (userEmail) => {
    try {
      const db = getFirestore();
      const activitiesRef = collection(db, "studententries");
      const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
      const q = query(
        activitiesRef,
        where("ccaEmail", "==", userEmail),
        where("date", "==", today),
        orderBy("timeIn", "desc"),
        limit(3)
      );
      const querySnapshot = await getDocs(q);
      const activities = [];
      querySnapshot.forEach((doc) => {
        activities.push({ id: doc.id, ...doc.data() });
      });
      setUserActivities(activities);
    } catch (error) {
      console.error("Error fetching user activities:", error);
      // If the error is due to missing index, we can fetch activities without ordering
      if (
        error.code === "failed-precondition" ||
        error.code === "resource-exhausted"
      ) {
        try {
          const db = getFirestore();
          const activitiesRef = collection(db, "studententries");
          const today = new Date().toISOString().split("T")[0];
          const q = query(
            activitiesRef,
            where("ccaEmail", "==", userEmail),
            where("date", "==", today),
            limit(3)
          );
          const querySnapshot = await getDocs(q);
          const activities = [];
          querySnapshot.forEach((doc) => {
            activities.push({ id: doc.id, ...doc.data() });
          });
          setUserActivities(activities);
        } catch (fallbackError) {
          console.error(
            "Error fetching user activities (fallback):",
            fallbackError
          );
        }
      }
    }
  };

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

  const CardSection = ({ title, children, icon, color }) => (
    <Card
      className={`p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 ${color}`}
    >
      <div className="flex items-center mb-4">
        <div
          className={`p-3 rounded-full ${color
            .replace("border-l-", "bg-")
            .replace("-500", "-100")}`}
        >
          {icon}
        </div>
        <Typography variant="h5" className="ml-4 font-semibold">
          {title}
        </Typography>
      </div>
      {children}
    </Card>
  );

  const ActionButton = ({ href, icon, color, children }) => (
    <Link href={href}>
      <Button
        variant="filled"
        color={color}
        size="lg"
        className="w-full sm:w-auto flex items-center justify-center transition-transform hover:scale-105"
      >
        {icon}
        <span className="ml-2">{children}</span>
      </Button>
    </Link>
  );

  return isAuthorized ? (
    <div className="flex bg-gray-50 min-h-screen">
      <div className="flex-1 ">
        <Header />
        <main className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-5">
              <CardSection
                title="Join Virtual Classroom"
                icon={<UserGroupIcon className="h-6 w-6 text-purple-500" />}
                color="border-l-purple-500"
              >
                <Typography className="mb-4 text-gray-700">
                  Join your teacher's virtual lobby to mark your attendance for
                  the class.
                </Typography>
                <ActionButton
                  href="user/user_pickclassroom"
                  icon={<AcademicCapIcon className="h-5 w-5" />}
                  color="purple"
                >
                  Select Classroom
                </ActionButton>
              </CardSection>

              <CardSection
                title="Report Computer Issues"
                icon={
                  <ExclamationCircleIcon className="h-6 w-6 text-red-500" />
                }
                color="border-l-red-500"
              >
                <Typography className="mb-4 text-gray-700">
                  Having problems with a computer? Scan its QR code to report
                  the issue quickly.
                </Typography>
                <ActionButton
                  href="user/user_scanqrcode"
                  icon={<QrCodeIcon className="h-5 w-5" />}
                  color="red"
                >
                  Scan QR Code
                </ActionButton>
              </CardSection>

              <CardSection
                title="Recent Activity"
                icon={<ClockIcon className="h-6 w-6 text-blue-500" />}
                color="border-l-blue-500"
              >
                <ul className="space-y-3">
                  {userActivities.length > 0 ? (
                    userActivities.map((activity, index) => (
                      <li key={activity.id} className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        <span>Attended class in {activity.computerLab}</span>
                        <span className="ml-auto text-sm text-gray-500">
                          {activity.timeIn}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span>No recent activity</span>
                    </li>
                  )}
                </ul>
              </CardSection>

              <CardSection
                title="Announcements"
                icon={<BellIcon className="h-6 w-6 text-yellow-500" />}
                color="border-l-yellow-500"
              >
                {announcements.length > 0 ? (
                  <ul className="space-y-2">
                    {announcements.map((announcement) => (
                      <li key={announcement.id} className="border-b pb-2">
                        <Typography variant="small" className="font-medium">
                          {announcement.content}
                        </Typography>
                        <Typography variant="small" color="gray">
                          Posted by: {announcement.postedBy} on{" "}
                          {formatDate(announcement.timestamp.toDate())}
                        </Typography>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Typography>No announcements at this time.</Typography>
                )}
              </CardSection>
            </div>
          </div>
        </main>
      </div>
    </div>
  ) : null;
}
