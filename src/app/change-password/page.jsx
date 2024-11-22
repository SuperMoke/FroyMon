"use client";
import React, { useStat, useEffect } from "react";
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
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPasswordChanged = async () => {
      const user = auth.currentUser;
      if (user) {
        const db = getFirestore();
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.passwordChanged) {
            // Redirect the user away if password has been changed
            router.push("/"); // Change to your desired path
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } else {
        // If the user is not authenticated, redirect to login
        router.push("/login"); // Change to your login path
      }
    };
    checkPasswordChanged();
  }, []);

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
      const db = getFirestore();
      await setDoc(
        doc(db, "users", user.uid),
        { passwordChanged: true },
        { merge: true }
      );

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

  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // Add this function to check password requirements in real-time
  const checkPasswordRequirements = (password) => {
    setPasswordRequirements({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[@$!%*?&]/.test(password),
    });
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
              onChange={(e) => {
                setNewPassword(e.target.value);
                checkPasswordRequirements(e.target.value);
              }}
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
          <div className="mt-2 space-y-1">
            <div
              className={`text-xs ${
                passwordRequirements.length ? "text-green-500" : "text-red-500"
              }`}
            >
              {passwordRequirements.length ? "✓" : "✗"} At least 8 characters
            </div>
            <div
              className={`text-xs ${
                passwordRequirements.uppercase
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {passwordRequirements.uppercase ? "✓" : "✗"} One uppercase letter
            </div>
            <div
              className={`text-xs ${
                passwordRequirements.lowercase
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {passwordRequirements.lowercase ? "✓" : "✗"} One lowercase letter
            </div>
            <div
              className={`text-xs ${
                passwordRequirements.number ? "text-green-500" : "text-red-500"
              }`}
            >
              {passwordRequirements.number ? "✓" : "✗"} One number
            </div>
            <div
              className={`text-xs ${
                passwordRequirements.special ? "text-green-500" : "text-red-500"
              }`}
            >
              {passwordRequirements.special ? "✓" : "✗"} One special character
              (@$!%*?&)
            </div>
          </div>
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
