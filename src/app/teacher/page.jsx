"use client";
import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  onSnapshot,
} from "firebase/firestore";

import { Button, Typography, Card } from "@material-tailwind/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";
import Header from "../teacher/header";
import Sidebar from "../teacher/sidebar";
import {
  CalendarIcon,
  ClockIcon,
  ComputerDesktopIcon,
  QrCodeIcon,
  AcademicCapIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
  ClipboardIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";
import AnnouncementView from "./AnnouncementView";

export default function TeacherPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);
  const [userActivities, setUserActivities] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

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

    window.history.pushState(null, "", window.location.href);
    window.onpopstate = () => {
      window.history.pushState(null, "", window.location.href);
    };

    const checkAuth = async () => {
      console.log("Checking authentication...");
      const requiredRole = "Teacher";

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
    if (user.email) {
      fetchUserActivities(user.email);
    }
    return () => {
      window.onpopstate = null;
    };
  }, [user, loading, router]);

  const fetchUserActivities = async (userEmail) => {
    try {
      const db = getFirestore();
      const activitiesRef = collection(db, "lobbies");
      const today = new Date().toISOString().split("T")[0];
      const q = query(
        activitiesRef,
        where("email", "==", userEmail),
        where("date", "==", today),
        orderBy("time", "desc"),
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

      if (
        error.code === "failed-precondition" ||
        error.code === "resource-exhausted"
      ) {
        try {
          const db = getFirestore();
          const activitiesRef = collection(db, "lobbies");
          const today = new Date().toISOString().split("T")[0];
          const q = query(
            activitiesRef,
            where("email", "==", userEmail),
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
        <div className="p-3 rounded-full">{icon}</div>
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
    <div className="flex flex-col bg-blue-gray-50 min-h-screen">
      <Header />
      <div className="flex flex-1 ">
        <Sidebar />
        <main className="flex-1 p-4 sm:ml-64">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-8 mt-5">
              <CardSection
                title="Create A Virtual Class"
                icon={<UserGroupIcon className="h-6 w-6 text-purple-500" />}
                color="border-l-purple-500"
              >
                <Typography className="mb-4 text-gray-700">
                  Create a virtual classroom and share it with your students.
                </Typography>
                <ActionButton
                  href="teacher/teacher_generatelobby"
                  icon={<AcademicCapIcon className="h-5 w-5" />}
                  color="purple"
                >
                  Generate Classroom
                </ActionButton>
              </CardSection>

              <CardSection
                title="Announcements"
                icon={<BellIcon className="h-6 w-6 text-yellow-500" />}
                color="border-l-yellow-500"
              >
                {announcements.length > 0 ? (
                  <AnnouncementView announcements={announcements} />
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
