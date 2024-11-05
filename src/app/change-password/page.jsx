"use client";
import React, { useState } from "react";
import {
  Button,
  Card,
  Input,
  Typography,
  Spinner,
  IconButton,
} from "@material-tailwind/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth } from "../firebase";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { updatePassword } from "firebase/auth";
import { isAuthenticated } from "../utils/auth";

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Password validation rules
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      toast.error(
        "Password must contain at least:\n" +
          "- 8 characters\n" +
          "- One uppercase letter\n" +
          "- One lowercase letter\n" +
          "- One number\n" +
          "- One special character (@$!%*?&)"
      );
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      setIsLoading(false);
      return;
    }

    try {
      const user = auth.currentUser;
      await updatePassword(user, newPassword);
      toast.success("Password updated successfully!");

      // Check roles and redirect
      const roleMap = {
        Student: "/user",
        Teacher: "/teacher",
        Admin: "/admin",
      };

      for (const role of Object.keys(roleMap)) {
        const hasRole = await isAuthenticated(role);
        if (hasRole) {
          router.push(roleMap[role]);
          return;
        }
      }

      router.push("/");
    } catch (error) {
      toast.error("Error updating password. Please try again.");
      console.error("Error:", error);
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
          Change Your Password
        </Typography>
        <Typography className="mb-4 text-center text-sm text-gray-600">
          Please set a new password for your account
        </Typography>
        <form onSubmit={handlePasswordChange}>
          <h2 className="text-black text-sm font-normal mb-2">New Password:</h2>
          <div className="relative flex w-full">
            <Input
              type={showPassword ? "text" : "password"}
              label="Enter New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="pr-20"
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
          <Typography className="mt-2 text-xs text-gray-600">
            Password must contain at least 8 characters, one uppercase letter,
            one lowercase letter, one number, and one special character
            (@$!%*?&)
          </Typography>
          <div className="mb-6">
            <h2 className="text-black text-sm font-normal mb-2">
              Confirm Password:
            </h2>
            <div className="relative flex w-full">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="pr-20"
              />
              <IconButton
                variant="text"
                size="sm"
                className="!absolute right-1 top-1 rounded"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeIcon className="h-5 w-5" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5" />
                )}
              </IconButton>
            </div>
          </div>
          <div className="flex justify-center">
            {isLoading ? (
              <Spinner color="black" size="lg" />
            ) : (
              <Button type="submit" color="black" fullWidth>
                Change Password
              </Button>
            )}
          </div>
        </form>
      </Card>
      <ToastContainer />
    </div>
  );
}
