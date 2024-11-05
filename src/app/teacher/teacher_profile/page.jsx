"use client";
import {
  Typography,
  Card,
  Avatar,
  Input,
  Button,
} from "@material-tailwind/react";
import React, { useState, useEffect, useRef } from "react";
import Header from "../header";
import Image from "next/image";
import {
  getFirestore,
  getDocs,
  query,
  collection,
  where,
  updateDoc,
} from "firebase/firestore";
import { auth, db, storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  updatePassword,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../../utils/auth";
import Sidebar from "../sidebar";

export default function TeacherProfile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profileUrl, setProfileUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef(null);

  useEffect(() => {
    const checkAuth = async () => {
      const authorized = await isAuthenticated("Teacher");
      setIsAuthorized(authorized);
      if (!authorized) {
        router.push("/");
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        auth.onAuthStateChanged(async (currentUser) => {
          if (currentUser) {
            const userEmail = currentUser.email;
            console.log("User email:", userEmail);
            const db = getFirestore();
            const userQuery = query(
              collection(db, "user"),
              where("email", "==", userEmail)
            );
            const querySnapshot = await getDocs(userQuery);
            if (!querySnapshot.empty) {
              querySnapshot.forEach((doc) => {
                const userData = doc.data();
                setName(userData.name);
                setEmail(userData.email);
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

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (file && allowedTypes.includes(file.type)) {
      setProfilePhoto(file);
    } else {
      alert("Please select a valid image file (JPEG, PNG, GIF, or WEBP)");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUpload = async () => {
    if (!profilePhoto) return;
    try {
      const storageRef = ref(storage, "profileImages/" + profilePhoto.name);
      await uploadBytes(storageRef, profilePhoto);
      const downloadURL = await getDownloadURL(storageRef);
      console.log("Image uploaded:", downloadURL);
      const db = getFirestore();
      const userRef = collection(db, "user");
      const userQuery = query(userRef, where("email", "==", email));
      const userSnapshot = await getDocs(userQuery);
      if (!userSnapshot.empty) {
        userSnapshot.forEach(async (doc) => {
          const userDocRef = doc.ref;
          try {
            await updateDoc(userDocRef, {
              profileUrl: downloadURL,
            });
            console.log("Profile URL updated in Firestore");
          } catch (error) {
            console.error("Error updating profile URL:", error);
          }
        });
      } else {
        console.error("User not found");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleChangePassword = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const Emailcredential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, Emailcredential);
      console.log("Credential:", Emailcredential);

      if (newPassword !== confirmPassword) {
        console.error("New password and confirm password do not match");
        return;
      }
      await updatePassword(user, newPassword).then(() => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      });
    } catch (error) {
      console.error("Error updating password:", error);
    }
  };

  return isAuthorized ? (
    <>
      <div className="flex flex-col bg-blue-gray-50 min-h-screen">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 sm:ml-64">
            <div className="container mx-auto">
              <Typography variant="h2" className="mb-4 text-center">
                Teacher Profile
              </Typography>
              <div className="flex flex-wrap justify-center gap-6">
                <Card className="w-96 p-8">
                  <div className="flex justify-center mb-6">
                    {profileUrl ? ( // Render the uploaded image if URL is available
                      <Image
                        src={profileUrl}
                        width={200}
                        height={200}
                        alt="User Picture"
                        className="w-40 h-40 rounded-full object-cover"
                      />
                    ) : (
                      <Image // Render default image if URL is not available
                        src="/Avatar.jpg"
                        width={200}
                        height={200}
                        alt="User Picture"
                        className="w-40 h-40 rounded-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-col space-y-5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg, image/png, image/gif, image/webp"
                      onChange={handleFileChange}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <Button onClick={handleUpload}>Upload Profile Photo</Button>
                  </div>
                  <Typography color="gray" className="font-normal mt-2 mb-2">
                    Teacher Name:
                  </Typography>
                  <Typography color="gray" className="font-bold mb-4">
                    {name}
                  </Typography>
                  <Typography className="font-normal mb-2">Email:</Typography>
                  <Typography color="gray" className="font-bold mb-4">
                    {email}
                  </Typography>
                </Card>
                <Card className="w-96 p-8">
                  <Typography
                    color="gray"
                    className="text-xl font-bold mb-5 text-center"
                  >
                    Change Password
                  </Typography>
                  <div className="flex flex-col space-y-2">
                    <Typography color="gray" className="font-bold mb-2 ">
                      Current Password:
                    </Typography>
                    <Input
                      label="Enter The Current Password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    ></Input>
                    <Typography color="gray" className="font-bold mb-2 ">
                      New Password:
                    </Typography>
                    <Input
                      label="Enter The New Password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    ></Input>
                    <Typography color="gray" className="font-bold mb-2 ">
                      Confirm New Password:
                    </Typography>
                    <Input
                      label="Confirm the New Password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    ></Input>
                  </div>
                  <Button className="mt-5" onClick={handleChangePassword}>
                    Submit
                  </Button>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  ) : null;
}
