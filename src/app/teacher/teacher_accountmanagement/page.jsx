"use client";
import React, { useState, useEffect } from "react";
import {
  Avatar,
  Button,
  Card,
  Input,
  Select,
  Option,
  Typography,
  IconButton,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Tooltip,
} from "@material-tailwind/react";
import { auth, db } from "../../firebase";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
} from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../../utils/auth";
import Header from "../header";
import Sidebar from "../sidebar";
import {
  PencilIcon,
  LockClosedIcon,
  PlusCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { FaSearch } from "react-icons/fa";
import { useAuthState } from "react-firebase-hooks/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Admin_CreateUser = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      console.log("User is not authenticated, redirecting to home...");
      router.push("/");
      return;
    }
    const checkAuth = async () => {
      const authorized = await isAuthenticated("Teacher");
      setIsAuthorized(authorized);
    };
    checkAuth();

    const fetchUsers = () => {
      const usersRef = collection(db, "user");
      const q = query(usersRef);
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userList = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          userList.push({
            id: doc.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
          });
        });
        setUsers(userList);
      });
      return unsubscribe;
    };
    const unsubscribe = fetchUsers();
    return () => unsubscribe();
  }, [user, loading, router]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!email.endsWith("@cca.edu.ph")) {
      toast.error("Please use a valid CCA email address (@cca.edu.ph)");
      return;
    }

    let defaultPassword;
    switch (role) {
      case "Student":
        defaultPassword = "student123";
        break;
      case "Teacher":
        defaultPassword = "teacher123";
        break;
      case "Admin":
        defaultPassword = "admin123";
        break;
      default:
        defaultPassword = "default123";
    }
    try {
      const response = await fetch("/api/createUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password: defaultPassword, role, name }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log("User created successfully:", data.uid);
        toast.success("User created successfully!");
        setOpenDialog(false);
        // Reset form fields
        setEmail("");
        setPassword("");
        setRole("");
        setName("");
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error creating user:", error.message);
      toast.error("Error creating user!");
    }
  };

  const handleEditUser = (user) => {
    setEditUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setOpenEditDialog(true);
  };

  const handleResetPassword = async (userId, userRole) => {
    let defaultPassword;
    switch (userRole) {
      case "Student":
        defaultPassword = "student123";
        break;
      case "Teacher":
        defaultPassword = "teacher123";
        break;
      case "Admin":
        defaultPassword = "admin123";
        break;
      default:
        defaultPassword = "default123";
    }

    try {
      const response = await fetch("/api/resetPassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid: userId, newPassword: defaultPassword }),
      });

      if (response.ok) {
        toast.success("Password reset successfully!");
      } else {
        throw new Error("Failed to reset password");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Error resetting password!");
    }
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const userDocRef = doc(db, "user", editUser.id);
      await updateDoc(userDocRef, {
        name: name,
        email: email,
        role: role,
      });
      setEditUser(null);
      setName("");
      setEmail("");
      setRole("");
      setOpenEditDialog(false);
      console.log("User updated successfully!");
      toast.success("User updated successfully!");
    } catch (error) {
      console.error("Error updating user:", error.message);
      toast.error("Error updating user!");
    }
  };

  const handleDeleteUser = async (userId) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!isConfirmed) {
      return; // Exit if user cancels
    }
    try {
      const response = await fetch("/api/deleteUser", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid: userId }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log("User deleted successfully");
        toast.success("User deleted successfully!");
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error deleting user:", error.message);
      toast.error("Error deleting user!");
    }
  };

  // Modify the filteredUsers constant to only show students:
  const filteredUsers = users.filter(
    (user) =>
      user.role === "Student" &&
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return isAuthorized ? (
    <>
      <div className="bg-blue-gray-50 min-h-screen">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 sm:ml-64">
            <Typography variant="h2" className="mb-4 text-center">
              Account Management
            </Typography>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <div></div>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
                <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-gray-300" />
              </div>
            </div>
            <Card className="w-full mb-8 shadow-lg rounded-lg overflow-hidden">
              <div className="bg-blue-500 p-4 flex justify-between items-center">
                <Button
                  onClick={() => setOpenDialog(true)}
                  color="white"
                  variant="filled"
                  className="ml-auto"
                >
                  Create Account
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-blue-gray-50">
                      <th className="border-b border-blue-gray-100 p-4">
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-bold leading-none opacity-70"
                        >
                          Name
                        </Typography>
                      </th>
                      <th className="border-b border-blue-gray-100 p-4">
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-bold leading-none opacity-70"
                        >
                          Email
                        </Typography>
                      </th>
                      <th className="border-b border-blue-gray-100 p-4">
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-bold leading-none opacity-70"
                        >
                          Role
                        </Typography>
                      </th>
                      <th className="border-b border-blue-gray-100 p-4">
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-bold leading-none opacity-70"
                        >
                          Action
                        </Typography>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className={
                          user.role === "Student"
                            ? "bg-blue-gray-50/50"
                            : "bg-blue-gray-100/50"
                        }
                      >
                        <td className="p-4">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-normal text-center"
                          >
                            {user.name}
                          </Typography>
                        </td>
                        <td className="p-4">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-normal text-center"
                          >
                            {user.email}
                          </Typography>
                        </td>
                        <td className="p-4">
                          <Typography
                            variant="small"
                            color="blue-gray"
                            className="font-normal text-center"
                          >
                            {user.role}
                          </Typography>
                        </td>
                        <td className="p-4 flex justify-center space-x-2">
                          <Tooltip content="Edit User">
                            <IconButton
                              size="sm"
                              color="blue-gray"
                              variant="text"
                              onClick={() => handleEditUser(user)}
                            >
                              <PencilIcon className="h-5 w-5" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip content="Delete User">
                            <IconButton
                              size="sm"
                              color="blue-gray"
                              variant="text"
                              onClick={() =>
                                handleDeleteUser(user.id, user.email)
                              }
                            >
                              <TrashIcon className="h-5 w-5" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip content="Reset Password">
                            <IconButton
                              size="sm"
                              color="blue-gray"
                              variant="text"
                              onClick={() =>
                                handleResetPassword(user.id, user.role)
                              }
                            >
                              <LockClosedIcon className="h-5 w-5" />
                            </IconButton>
                          </Tooltip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </main>
        </div>
      </div>
      <Dialog open={openDialog} handler={setOpenDialog}>
        <DialogHeader>Create New Account</DialogHeader>
        <DialogBody>
          <form className="flex flex-col space-y-2">
            <Typography color="gray" className="font-normal mt-2 mb-2">
              Name:
            </Typography>
            <Input
              type="text"
              label="Enter The Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Typography className="font-normal mb-2">Email:</Typography>
            <Input
              type="email"
              label="Enter The CCA Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Typography className="font-normal mb-2">Role:</Typography>
            <Select
              label="Select Role"
              value={role}
              onChange={(e) => setRole(e)}
              required
            >
              <Option value="Student">Student</Option>
            </Select>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={() => setOpenDialog(false)}
          >
            Cancel
          </Button>
          <Button type="submit" onClick={handleFormSubmit}>
            Create
          </Button>
        </DialogFooter>
        <ToastContainer />
      </Dialog>
      <Dialog open={openEditDialog} handler={setOpenEditDialog}>
        <DialogHeader>Edit User</DialogHeader>
        <DialogBody>
          <form className="flex flex-col space-y-2">
            <Typography color="gray" className="font-normal mt-2 mb-2">
              Name:
            </Typography>
            <Input
              type="text"
              label="Enter The Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Typography className="font-normal mb-2">Role:</Typography>
            <Select
              label="Select Role"
              value={role}
              onChange={(e) => setRole(e)}
              required
            >
              <Option value="Student">Student</Option>
              <Option value="Teacher">Teacher</Option>
            </Select>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="red"
            onClick={() => setOpenEditDialog(false)}
          >
            Cancel
          </Button>
          <Button type="submit" onClick={handleEditFormSubmit}>
            Save
          </Button>
        </DialogFooter>
      </Dialog>
      <ToastContainer />
    </>
  ) : null;
};

export default Admin_CreateUser;
