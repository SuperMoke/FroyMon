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
  CardFooter,
  Chip,
} from "@material-tailwind/react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

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
  const [role, setRole] = useState("Student");
  const [name, setName] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      (user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return isAuthorized ? (
    <>
      <div className="min-h-screen bg-blue-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 ml-64">
            <div className="mb-4 flex justify-between items-center">
              <Typography variant="h3" color="blue-gray">
                Account Management
              </Typography>
              <div className="flex items-center gap-4">
                <Button onClick={() => setOpenDialog(true)} color="black">
                  Create Account
                </Button>
                <div className="w-72">
                  <Input
                    type="text"
                    label="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                  />
                </div>
              </div>
            </div>

            <Card className="overflow-x-auto px-0">
              <table className="w-full table-auto text-left">
                <thead>
                  <tr>
                    <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4 w-1/4">
                      <Typography
                        variant="paragraph"
                        color="blue-gray"
                        className="font-semibold"
                      >
                        Name
                      </Typography>
                    </th>
                    <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4 w-1/4">
                      <Typography
                        variant="paragraph"
                        color="blue-gray"
                        className="font-semibold"
                      >
                        Email
                      </Typography>
                    </th>
                    <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4 w-1/4">
                      <Typography
                        variant="paragraph"
                        color="blue-gray"
                        className="font-semibold"
                      >
                        Role
                      </Typography>
                    </th>
                    <th className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4 w-1/4">
                      <Typography
                        variant="paragraph"
                        color="blue-gray"
                        className="font-semibold text-center"
                      >
                        Action
                      </Typography>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user, index) => (
                    <tr
                      key={user.id}
                      className={
                        index !== paginatedUsers.length - 1
                          ? "border-b border-blue-gray-50"
                          : ""
                      }
                    >
                      <td className="p-4">
                        <Typography variant="paragraph">{user.name}</Typography>
                      </td>
                      <td className="p-4">
                        <Typography variant="paragraph">
                          {user.email}
                        </Typography>
                      </td>
                      <td className="p-4">
                        <Chip
                          variant="ghost"
                          size="md"
                          value={user.role}
                          color="gray"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center">
                          <Tooltip content="Edit the User">
                            <IconButton
                              variant="text"
                              onClick={() => handleEditUser(user)}
                            >
                              <PencilIcon className="h-5 w-5" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip content="Reset the Password">
                            <IconButton
                              variant="text"
                              onClick={() =>
                                handleResetPassword(user.id, user.role)
                              }
                            >
                              <LockClosedIcon className="h-5 w-5" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip content="Delete the Account">
                            <IconButton
                              variant="text"
                              onClick={() =>
                                handleDeleteUser(user.id, user.email)
                              }
                            >
                              <TrashIcon className="h-5 w-5" />
                            </IconButton>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <CardFooter className="flex items-center justify-between border-t border-blue-gray-50 p-4">
                <Typography variant="small" color="blue-gray">
                  Page {currentPage} of{" "}
                  {Math.ceil(filteredUsers.length / itemsPerPage)}
                </Typography>
                <div className="flex gap-2">
                  <Button
                    variant="outlined"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="filled"
                    color="black"
                    size="sm"
                    disabled={
                      currentPage >=
                      Math.ceil(filteredUsers.length / itemsPerPage)
                    }
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </CardFooter>
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
