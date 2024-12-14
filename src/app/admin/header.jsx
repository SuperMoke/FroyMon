import React, { useState, useEffect } from "react";
import {
  Avatar,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Typography,
  Button,
} from "@material-tailwind/react";
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { query, collection, where, onSnapshot } from "firebase/firestore";
import { auth } from "../firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { db } from "../firebase";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    profileUrl: "",
  });
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        const userQuery = query(
          collection(db, "user"),
          where("email", "==", currentUser.email)
        );

        const unsubscribeSnapshot = onSnapshot(
          userQuery,
          (snapshot) => {
            if (!snapshot.empty) {
              const userDoc = snapshot.docs[0].data();
              setUserData({
                name: userDoc.name,
                email: userDoc.email,
                profileUrl: userDoc.profileUrl,
              });
            }
          },
          (error) => {
            console.error("Real-time data error:", error);
          }
        );

        return () => unsubscribeSnapshot();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  function handleLogout() {
    signOut(auth)
      .then(() => {
        console.log("User signed out");
        router.push("/");
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  }

  return (
    <header className="bg-blue-gray-50 shadow-md py-4 px-4 sm:px-10 flex justify-between items-center">
      <div className="flex items-center space-x-4 ml-auto">
        <Menu open={isMenuOpen} handler={setIsMenuOpen} placement="bottom-end">
          <MenuHandler>
            <div className="flex items-center space-x-2 cursor-pointer">
              <Avatar
                src={userData.profileUrl || "/Avatar.jpg"}
                alt="Profile"
                size="s"
              />
              <Typography variant="small" className="text-base hidden sm:block">
                {userData.name}
              </Typography>
            </div>
          </MenuHandler>
          <MenuList>
            <MenuItem className="flex items-center gap-2">
              <Link href="/admin/profile">
                <Button variant="text" className="flex items-start gap-3">
                  <UserCircleIcon className="h-4 w-4" />
                  Profile
                </Button>
              </Link>
            </MenuItem>
            <MenuItem className="flex items-center gap-2">
              <Button
                variant="text"
                className="flex items-start gap-3"
                onClick={handleLogout}
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                Logout
              </Button>
            </MenuItem>
          </MenuList>
        </Menu>
      </div>
    </header>
  );
}
