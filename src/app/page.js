"use client";
import React, { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  Button,
  Card,
  Input,
  Typography,
  Spinner,
  Alert,
  IconButton,
} from "@material-tailwind/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth } from "../app/firebase";
import { isAuthenticated } from "../app/utils/auth";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { collection, query, getDocs, where } from "firebase/firestore";
import { db } from "../app/firebase";
import { createSession, checkExistingSessions } from "./utils/sessionManager";

export default function SigninPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const [loginAttempts, setLoginAttempts] = useState(0);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const checkGenericPassword = (password) => {
    const genericPatterns = [
      "student123",
      "admin123",
      "teacher123",
      "password123",
      "default123",
    ];
    return genericPatterns.includes(password.toLowerCase());
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const auth = getAuth();

    try {
      if (checkGenericPassword(password)) {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        sessionStorage.setItem(
          "tempAuthCredentials",
          JSON.stringify({
            email,
            currentPassword: password,
          })
        );
        router.push("/change-password");
        return;
      }

      // First authenticate the user
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Get user's role from Firestore
      const userCollectionRef = collection(db, "user");
      const userQuery = query(userCollectionRef, where("email", "==", email));
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        throw new Error("User profile not found");
      }

      const userData = userSnapshot.docs[0].data();
      const userRole = userData.role;

      if (!userRole) {
        throw new Error("User role not assigned");
      }

      // Check for existing sessions before proceeding
      const hasExistingSession = await checkExistingSessions(
        userCredential.user.uid
      );
      if (hasExistingSession) {
        toast.info("Signing out from other devices...");
      }

      // Create new session
      await createSession(userCredential.user.uid);

      // Route based on role
      const roleMap = {
        Student: "/user",
        Teacher: "/teacher",
        Admin: "/admin",
      };

      if (roleMap[userRole]) {
        router.push(roleMap[userRole]);
      } else {
        throw new Error(`Invalid role: ${userRole}`);
      }
    } catch (error) {
      console.error("Error signing in:", error);
      setLoginAttempts((prev) => prev + 1);

      if (loginAttempts >= 2) {
        toast.error(
          "You have attempted to login 3 times. Please contact your teacher or MISSO to reset your password."
        );
      } else {
        // More specific error messages
        const errorMessage = error.message.includes("User role")
          ? "Account setup incomplete. Please contact administrator."
          : error.message.includes("other devices")
          ? "Account signed in elsewhere. Please try again."
          : "Invalid email or password. Please try again.";

        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card className="w-96 p-6">
        <div className="flex justify-center">
          <Image
            src="/froymon_logo.png"
            width={200}
            height={200}
            alt="Logo Picture"
          />
        </div>
        <Typography variant="h4" className="mb-6 mt-4 text-center text-black">
          Sign in to your account
        </Typography>
        <form onSubmit={handleSignIn}>
          <div className="mb-4">
            <h2 className="text-black text-sm font-normal mb-2">Email:</h2>
            <Input
              type="email"
              label="Enter Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <h2 className="text-black text-sm font-normal mb-2">Password:</h2>
            <div className="relative flex w-full max-w-[24rem]">
              <Input
                type={showPassword ? "text" : "password"}
                label="Enter Your Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-20"
                containerProps={{
                  className: "min-w-0",
                }}
              />
              <IconButton
                variant="text"
                size="sm"
                className="!absolute right-1 top-1 rounded"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeIcon className="h-5 w-5" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5" />
                )}
              </IconButton>
            </div>
          </div>
          <div className="flex justify-center">
            <Button
              type="submit"
              color="black"
              fullWidth
              disabled={isLoading}
              className="flex items-center justify-center space-x-2"
            >
              {isLoading ? (
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
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </Button>
          </div>
        </form>
      </Card>
      <ToastContainer />
    </div>
  );
}
