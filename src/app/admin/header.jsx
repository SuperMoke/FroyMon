import React, { useState, useEffect } from "react";
import {
  Avatar,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Typography,
  IconButton,
  Button,
} from "@material-tailwind/react";
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import {
  getFirestore,
  getDocs,
  query,
  collection,
  where,
  updateDoc,
} from "firebase/firestore";
import { auth } from "../firebase";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [profileUrl, setProfileUrl] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        auth.onAuthStateChanged(async (currentUser) => {
          if (currentUser) {
            const userEmail = currentUser.email;
            const db = getFirestore();
            const userQuery = query(
              collection(db, "user"),
              where("email", "==", userEmail)
            );
            const querySnapshot = await getDocs(userQuery);
            if (!querySnapshot.empty) {
              querySnapshot.forEach((doc) => {
                const userData = doc.data();
                setUserName(userData.name);
                setProfileUrl(userData.profileUrl);
              });
            } else {
              console.error("User not found or role not specified");
            }
          }
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

  const router = useRouter();
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
                src={profileUrl || "/Avatar.jpg"}
                alt="Profile"
                size="s"
              />
              <Typography
                variant="small"
                className="text-base hidden sm:block "
              >
                {userName}
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
