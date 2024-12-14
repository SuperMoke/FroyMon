"use client";
import React, { useState, useEffect, useRef } from "react";
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
  CardBody,
  CardFooter,
  Chip,
  CardHeader,
} from "@material-tailwind/react";
import { auth, db } from "../../firebase";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

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
import Papa from "papaparse";
import * as XLSX from "xlsx";

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
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const fileInputRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const TABLE_HEAD = ["Name", "Email", "Role", "Action"];
  const [isLoading, setIsLoading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      console.log("User is not authenticated, redirecting to home...");
      router.push("/");
      return;
    }
    const checkAuth = async () => {
      const authorized = await isAuthenticated("Admin");
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
    setIsLoading(true);
    if (!validateCcaEmail(email)) {
      toast.error("Please use a valid CCA email address (@cca.edu.ph)");
      setIsLoading(false);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    setIsBulkUploading(true);
    const file = e.target.files[0];
    const fileExtension = file.name.split(".").pop().toLowerCase();

    try {
      if (fileExtension === "csv") {
        await handleCsvUpload(file);
      } else if (["xlsx", "xls"].includes(fileExtension)) {
        await handleExcelUpload(file);
      }
    } finally {
      setIsBulkUploading(false);
    }
  };

  const handleExcelUpload = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const users = XLSX.utils.sheet_to_json(firstSheet);

      if (!validateBulkEmails(users)) {
        return;
      }

      for (const user of users) {
        try {
          let defaultPassword;
          switch (user.role?.toLowerCase()) {
            case "teacher":
              defaultPassword = "teacher123";
              break;
            case "admin":
              defaultPassword = "admin123";
              break;
            default:
              defaultPassword = "student123";
          }

          await fetch("/api/createUser", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: user.email,
              password: defaultPassword,
              role: user.role || "Student",
              name: user.name,
            }),
          });
        } catch (error) {
          console.error(`Error creating user ${user.email}:`, error);
          toast.error(`Failed to create user ${user.email}`);
        }
      }
      toast.success("Bulk upload completed!");
      setOpenBulkDialog(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCsvUpload = (file) => {
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const users = results.data;

        if (!validateBulkEmails(users)) {
          return;
        }

        for (const user of users) {
          try {
            let defaultPassword;
            switch (user.role?.toLowerCase()) {
              case "teacher":
                defaultPassword = "teacher123";
                break;
              case "admin":
                defaultPassword = "admin123";
                break;
              default:
                defaultPassword = "student123";
            }

            await fetch("/api/createUser", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: user.email,
                password: defaultPassword,
                role: user.role || "Student",
                name: user.name,
              }),
            });
          } catch (error) {
            console.error(`Error creating user ${user.email}:`, error);
            toast.error(`Failed to create user ${user.email}`);
          }
        }
        toast.success("Bulk upload completed!");
        setOpenBulkDialog(false);
      },
    });
  };

  const handleEditUser = (user) => {
    setEditUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setOpenEditDialog(true);
  };

  const handleResetPassword = async () => {
    let defaultPassword;
    switch (selectedUser.role) {
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
        body: JSON.stringify({
          uid: selectedUser.id,
          newPassword: defaultPassword,
        }),
      });

      if (response.ok) {
        toast.success("Password reset successfully!");
        setOpenResetDialog(false);
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
    setIsEditLoading(true);
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
    } finally {
      setIsEditLoading(false);
    }
  };

  // Add this function before the return statement
  const downloadTemplate = () => {
    const template = [
      {
        name: "John Doe",
        email: "john.doe@cca.edu.ph",
        role: "Student",
      },
      {
        name: "Jane Smith",
        email: "jane.smith@cca.edu.ph",
        role: "Teacher",
      },
      {
        name: "Chris Brown",
        email: "chrisbrown@cca.edu.ph",
        role: "Admin",
      },
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(template);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "user_upload_template.xlsx");
  };

  const handleDeleteUser = async () => {
    try {
      const response = await fetch("/api/deleteUser", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid: selectedUser.id }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("User deleted successfully!");
        setOpenDeleteDialog(false);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error deleting user:", error.message);
      toast.error("Error deleting user!");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedUsers =
    filteredUsers.length > 0
      ? filteredUsers.slice(
          (currentPage - 1) * itemsPerPage,
          Math.max(currentPage * itemsPerPage, 1)
        )
      : [];

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const validateCcaEmail = (email) => {
    return email.toLowerCase().endsWith("@cca.edu.ph");
  };

  const handleOpenDialog = () => setOpenDialog(!openDialog);
  const handleOpenEditDialog = () => setOpenEditDialog(!openEditDialog);
  const handleOpenBulkDialog = () => setOpenBulkDialog(!openBulkDialog);

  const validateBulkEmails = (users) => {
    const validRoles = ["Student", "Teacher", "Admin"];

    // Separate validation for emails and roles
    const invalidEmails = users.filter(
      (user) => !user.email?.toLowerCase().endsWith("@cca.edu.ph")
    );
    const invalidRoles = users.filter(
      (user) => !validRoles.includes(user.role)
    );

    let isValid = true;

    if (invalidEmails.length > 0) {
      toast.error(`Invalid emails found. All emails must end with @cca.edu.ph`);
      console.log(
        "Invalid emails:",
        invalidEmails.map((user) => user.email)
      );
      isValid = false;
    }

    if (invalidRoles.length > 0) {
      toast.error(
        `Invalid roles found. Roles must be Student, Teacher, or Admin`
      );
      console.log(
        "Invalid roles:",
        invalidRoles.map((user) => ({ email: user.email, role: user.role }))
      );
      isValid = false;
    }

    return isValid;
  };

  return isAuthorized ? (
    <>
      <div className="min-h-screen bg-blue-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 ml-64">
            {/* Header Section */}
            <div className="mb-4 flex justify-between items-center">
              <Typography variant="h3" color="blue-gray">
                Account Management
              </Typography>
              <div className="flex items-center gap-4">
                <Button onClick={() => setOpenBulkDialog(true)} color="black">
                  Bulk Upload
                </Button>
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
                          color={
                            user.role === "Admin"
                              ? "blue"
                              : user.role === "Teacher"
                              ? "green"
                              : "gray"
                          }
                        />
                      </td>
                      <td className="p-4 text-right">
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
                              onClick={() => {
                                setSelectedUser(user);
                                setOpenResetDialog(true);
                              }}
                            >
                              <LockClosedIcon className="h-5 w-5" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip content="Delete the Account">
                            <IconButton
                              variant="text"
                              onClick={() => {
                                setSelectedUser(user);
                                setOpenDeleteDialog(true);
                              }}
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
      <Dialog open={openDialog} handler={handleOpenDialog}>
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
              <Option value="Admin">Admin</Option>
              <Option value="Student">Student</Option>
              <Option value="Teacher">Teacher</Option>
            </Select>
          </form>
        </DialogBody>
        <DialogFooter className="space-x-4">
          <Button
            variant="text"
            color="black"
            onClick={() => setOpenDialog(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleFormSubmit}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
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
                <span>Creating...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
              </>
            )}
          </Button>
        </DialogFooter>
        <ToastContainer />
      </Dialog>
      <Dialog open={openEditDialog} handler={handleOpenEditDialog}>
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
        <DialogFooter className="space-x-4">
          <Button
            variant="text"
            color="black"
            onClick={() => setOpenEditDialog(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleEditFormSubmit}
            disabled={isEditLoading}
          >
            {isEditLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
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
                <span>Saving...</span>
              </>
            ) : (
              <span>Save</span>
            )}
          </Button>
        </DialogFooter>
        <ToastContainer />
      </Dialog>

      <Dialog open={openBulkDialog} handler={handleOpenBulkDialog}>
        <DialogHeader>Bulk Upload Account</DialogHeader>
        <DialogBody>
          <Typography color="gray" className="mb-4">
            Upload a CSV or Excel file with details. It should have columns for
            Name, Email and Role. The role values should be: Student, Teacher,
            or Admin (case insensitive).Alos. Download the template?
            <Button
              color="gray"
              variant="text"
              size="sm"
              className="w-fit"
              onClick={downloadTemplate}
            >
              Click Here
            </Button>
          </Typography>
          <div className="flex flex-col gap-4">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                fileInputRef.current = e.target.files[0];
              }}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="black"
            onClick={() => setOpenBulkDialog(false)}
          >
            Cancel
          </Button>
          <Button
            color="black"
            onClick={() => {
              if (fileInputRef.current) {
                handleFileUpload({ target: { files: [fileInputRef.current] } });
              }
            }}
            disabled={isBulkUploading}
          >
            {isBulkUploading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
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
                <span>Processing...</span>
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </DialogFooter>
        <ToastContainer />
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        handler={() => setOpenDeleteDialog(false)}
      >
        <DialogHeader>Delete Account</DialogHeader>
        <DialogBody>
          Are you sure you want to delete the account for {selectedUser?.name}?
          This action cannot be undone.
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="black"
            onClick={() => setOpenDeleteDialog(false)}
          >
            Cancel
          </Button>
          <Button color="red" onClick={handleDeleteUser}>
            Delete Account
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={openResetDialog} handler={() => setOpenResetDialog(false)}>
        <DialogHeader>Reset Password</DialogHeader>
        <DialogBody>
          Are you sure you want to reset the password for {selectedUser?.name}?
          The password will be reset to the default based on their role.
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="black"
            onClick={() => setOpenResetDialog(false)}
          >
            Cancel
          </Button>
          <Button color="black" onClick={handleResetPassword}>
            Reset Password
          </Button>
        </DialogFooter>
      </Dialog>

      <ToastContainer />
    </>
  ) : null;
};

export default Admin_CreateUser;
