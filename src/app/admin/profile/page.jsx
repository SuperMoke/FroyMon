"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  Card,
  Input,
  Button,
  IconButton,
} from "@material-tailwind/react";

import Image from "next/image";
import {
  getFirestore,
  getDocs,
  query,
  collection,
  where,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { auth, db, storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../../utils/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import Header from "../header";
import Sidebar from "../sidebar";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function AdminProfile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profileUrl, setProfileUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);
  const fileInputRef = useRef();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingName, setIsChangingName] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      toast.error("User is not authenticated, redirecting to home...");
      router.push("/");
      return;
    }
    const checkAuth = async () => {
      const authorized = await isAuthenticated("Admin");
      setIsAuthorized(authorized);
      if (!authorized) {
        toast.error("Unauthorized access");
      }
    };
    checkAuth();
  }, [user, loading, router]);

  const handleChangeName = async () => {
    setIsChangingName(true);
    try {
      if (!newName.trim()) {
        toast.error("Please enter a valid name");
        return;
      }

      const userRef = collection(db, "user");
      const userQuery = query(userRef, where("email", "==", email));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const docRef = userSnapshot.docs[0].ref;
        await updateDoc(docRef, {
          name: newName,
        });
        setName(newName);
        setNewName("");
        toast.success("Name updated successfully!");
      }
    } catch (error) {
      toast.error("Error updating name");
    } finally {
      setIsChangingName(false);
    }
  };

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
                setName(userData.name);
                setEmail(userData.email);
                setProfileUrl(userData.profileUrl);
              });
              toast.success("Profile data loaded successfully");
            } else {
              toast.error("User not found or role not specified");
            }
          }
        });
      } catch (error) {
        toast.error(`Error fetching user data: ${error.message}`);
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
      toast.error("Please select a valid image file (JPEG, PNG, GIF, or WEBP)");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUpload = async () => {
    if (!profilePhoto) {
      toast.error("Please select an image first");
      return;
    }
    setIsUploadingPhoto(true);

    try {
      const storageRef = ref(storage, "profileImages/" + profilePhoto.name);
      await uploadBytes(storageRef, profilePhoto);
      const downloadURL = await getDownloadURL(storageRef);

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
            toast.success("Profile photo updated successfully");
            setProfileUrl(downloadURL);
          } catch (error) {
            toast.error(`Error updating profile URL: ${error.message}`);
          }
        });
      } else {
        toast.error("User not found");
      }
    } catch (error) {
      toast.error(`Error uploading image: ${error.message}`);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleChangePassword = async () => {
    setIsChangingPassword(true);

    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast.error("All password fields are required");
        setIsChangingPassword(false);
        return;
      }
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;

      if (!passwordRegex.test(newPassword)) {
        toast.error(
          "Password must contain at least 12 characters, including uppercase, lowercase, number and special character"
        );
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error("New password and confirm password do not match");
        return;
      }

      const auth = getAuth();
      const user = auth.currentUser;
      const Emailcredential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, Emailcredential);

      await updatePassword(user, newPassword);
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(`Error updating password`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  useEffect(() => {
    const userRef = collection(db, "user");
    const userQuery = query(userRef, where("email", "==", email));

    const unsubscribe = onSnapshot(userQuery, (snapshot) => {
      snapshot.forEach((doc) => {
        const userData = doc.data();
        setProfileUrl(userData.profileUrl);
      });
    });

    return () => unsubscribe();
  }, [email]);

  const validateCcaEmail = (email) => {
    return email.toLowerCase().endsWith("@cca.edu.ph");
  };

  const handleChangeEmail = async () => {
    setIsChangingEmail(true);
    try {
      const user = auth.currentUser;
      if (!newEmail || !emailPassword) {
        toast.error("Email and password are required");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        toast.error("Please enter a valid email address");
        return;
      }
      if (!validateCcaEmail(email)) {
        toast.error("Please use a valid CCA email address (@cca.edu.ph)");
        return;
      }

      if (newEmail === user.email) {
        toast.error("Please use another email");
        return;
      }
      const credential = EmailAuthProvider.credential(
        user.email,
        emailPassword
      );
      await reauthenticateWithCredential(user, credential);
      await sendEmailVerification(user);
      toast.info(
        "Verification email sent. Please verify your new email before the change"
      );

      await updateEmail(user, newEmail);

      const userRef = collection(db, "user");
      const userQuery = query(userRef, where("email", "==", email));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const docRef = userSnapshot.docs[0].ref;
        await updateDoc(docRef, {
          email: newEmail,
        });
        setEmail(newEmail);
        setNewEmail("");
        setEmailPassword("");
        toast.success("Email updated successfully!");
      }
    } catch (error) {
      toast.error("Error updating email", error);
      setNewEmail("");
      setEmailPassword("");
      console.log(error);
    } finally {
      setIsChangingEmail(false);
    }
  };

  return isAuthorized ? (
    <>
      <div className="bg-blue-gray-50 min-h-screen ">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 sm:ml-64">
            <div className="mb-4 flex justify-between items-center">
              <Typography variant="h3" className="blue-gray">
                Profile
              </Typography>
            </div>

            <div className="flex flex-wrap gap-6">
              <Card className="w-96 p-8">
                <div className="flex justify-center mb-6">
                  {profileUrl ? (
                    <Image
                      src={profileUrl}
                      width={200}
                      height={200}
                      alt="User Picture"
                      className="w-40 h-40 rounded-full object-cover"
                    />
                  ) : (
                    <Image
                      src="/Avatar.jpg"
                      width={200}
                      height={200}
                      alt="User Picture"
                      className="w-40 h-40 rounded-full object-cover"
                    />
                  )}
                </div>

                <Typography color="gray" className="font-normal mt-6 mb-2">
                  Admin Name:
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
                  className="text-xl font-bold mb-5 mt-7 text-center"
                >
                  Change Profile Photo
                </Typography>
                <div className="flex flex-col space-y-5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg, image/png, image/gif, image/webp"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <Button
                    onClick={handleUpload}
                    disabled={isUploadingPhoto}
                    className="flex flex-row items-center justify-center"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 mr-2"
                          viewBox="0 0 24 24"
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
                        <span>Uploading...</span>
                      </>
                    ) : (
                      "Upload Profile Photo"
                    )}
                  </Button>
                </div>
                <Typography
                  color="gray"
                  className="text-xl font-bold mb-5 mt-10 text-center"
                >
                  Change Name
                </Typography>

                <Input
                  type="text"
                  label="New Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <Button
                  className="flex flex-row items-center justify-center mt-4 mb-4"
                  onClick={handleChangeName}
                  disabled={isChangingName}
                >
                  {isChangingName ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 mr-2"
                        viewBox="0 0 24 24"
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
                      <span>Updating...</span>
                    </>
                  ) : (
                    "Update Name"
                  )}
                </Button>
              </Card>
              <Card className="w-96 p-8">
                <Typography
                  color="gray"
                  className="text-xl font-bold mb-5 mt-5 text-center"
                >
                  Change Password
                </Typography>
                <div className="flex flex-col space-y-3">
                  <Typography color="gray" className="font-bold">
                    Enter The Current Password
                  </Typography>
                  <div className="relative flex w-full">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      label="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pr-20"
                    />
                    <IconButton
                      variant="text"
                      size="sm"
                      className="!absolute right-1 top-1 rounded"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeIcon className="h-5 w-5" />
                      ) : (
                        <EyeSlashIcon className="h-5 w-5" />
                      )}
                    </IconButton>
                  </div>
                  <Typography color="gray" className="font-bold mb-2 ">
                    Enter The New Password
                  </Typography>
                  <div className="relative flex w-full">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      label="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pr-20"
                    />
                    <IconButton
                      variant="text"
                      size="sm"
                      className="!absolute right-1 top-1 rounded"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeIcon className="h-5 w-5" />
                      ) : (
                        <EyeSlashIcon className="h-5 w-5" />
                      )}
                    </IconButton>
                  </div>
                  <Typography color="gray" className="font-bold mb-2 ">
                    Enter The New Confirm Password
                  </Typography>
                  <div className="relative flex w-full">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      label="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-20"
                    />
                    <IconButton
                      variant="text"
                      size="sm"
                      className="!absolute right-1 top-1 rounded"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeIcon className="h-5 w-5" />
                      ) : (
                        <EyeSlashIcon className="h-5 w-5" />
                      )}
                    </IconButton>
                  </div>
                </div>
                <Button
                  className="flex flex-row items-center justify-center mt-5"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 mr-2"
                        viewBox="0 0 24 24"
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
                      <span>Updating...</span>
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </Card>
            </div>
          </main>
        </div>
      </div>
      <ToastContainer />
    </>
  ) : null;
}
