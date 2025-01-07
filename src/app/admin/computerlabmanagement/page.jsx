"use client";
import React, { useEffect, useState } from "react";
import {
  Card,
  Input,
  Button,
  Typography,
  Select,
  Option,
  CardFooter,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  onSnapshot,
  where,
  doc,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../../utils/auth";
import Header from "../header";
import Sidebar from "../sidebar";
import { useAuthState } from "react-firebase-hooks/auth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { IconButton, Tooltip } from "@material-tailwind/react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

const TABLE_HEAD = [
  "Laboratory Name",
  "Laboratory Code",
  "Computer Count",
  "Status",
  "Last Updated",
  "Action",
];

export default function ComputerLabManagement() {
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [laboratories, setLaboratories] = useState([]);
  const [isAddingLab, setIsAddingLab] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchLab, setSearchLab] = useState("");
  const [filterLabType, setFilterLabType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  const [openDialog, setOpenDialog] = useState(false);
  const handleOpenDialog = () => setOpenDialog(true);

  const [formData, setFormData] = useState({
    labName: "",
    labCode: "",
    computerCount: "",
    status: "Active",
    description: "",
  });

  const [selectedLab, setSelectedLab] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/");
      return;
    }
    const checkAuth = async () => {
      const authorized = await isAuthenticated("Admin");
      setIsAuthorized(authorized);
    };
    checkAuth();
  }, [user, loading, router]);

  useEffect(() => {
    if (!isAuthorized) return;

    const unsubscribe = onSnapshot(
      collection(db, "laboratories"),
      (snapshot) => {
        const labsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLaboratories(labsData);
      }
    );

    return () => unsubscribe();
  }, [isAuthorized]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const filteredLabs = laboratories.filter((lab) => {
    return (
      lab.labName.toLowerCase().includes(searchLab.toLowerCase()) &&
      (filterLabType === "" || lab.labType === filterLabType) &&
      (filterStatus === "" || lab.status === filterStatus)
    );
  });

  const paginatedLabs = filteredLabs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const labRef = doc(db, "laboratories", formData.labName.toLowerCase());
      await setDoc(labRef, {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.email,
      });

      toast.success("Laboratory added successfully!");
      setOpenDialog(false);

      setFormData({
        labName: "",
        labCode: "",
        computerCount: "",
        status: "Active",
      });
    } catch (error) {
      toast.error("Error adding laboratory: " + error.message);
    }
  };

  const handleEditLab = (lab) => {
    setSelectedLab(lab);
    setFormData({
      labName: lab.labName,
      labCode: lab.labCode,
      computerCount: lab.computerCount,
      status: lab.status,
    });
    setOpenEditDialog(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsEditLoading(true);
    try {
      const labRef = doc(db, "laboratories", selectedLab.id);
      await updateDoc(labRef, {
        ...formData,
        updatedAt: serverTimestamp(),
        updatedBy: user.email,
      });
      toast.success("Laboratory updated successfully!");
      setOpenEditDialog(false);
    } catch (error) {
      toast.error("Error updating laboratory: " + error.message);
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDeleteLab = async () => {
    try {
      const labRef = doc(db, "laboratories", selectedLab.id);
      await deleteDoc(labRef);
      toast.success("Laboratory deleted successfully!");
      setOpenDeleteDialog(false);
    } catch (error) {
      toast.error("Error deleting laboratory: " + error.message);
    }
  };

  return isAuthorized ? (
    <div className="bg-blue-gray-50 min-h-screen">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:ml-64">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
              <Typography
                variant="h3"
                color="blue-gray"
                className="mb-4 md:mb-0"
              >
                Computer Laboratories
              </Typography>
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  type="text"
                  label="Search Laboratory"
                  value={searchLab}
                  onChange={(e) => setSearchLab(e.target.value)}
                  className="w-full md:w-64"
                />

                <Select
                  label="Filter by Status"
                  value={filterStatus}
                  onChange={(value) => setFilterStatus(value)}
                  className="w-full md:w-64"
                >
                  <Option value="">All Status</Option>
                  <Option value="Active">Active</Option>
                  <Option value="Maintenance">Maintenance</Option>
                </Select>
              </div>
            </div>
            <Button className="mb-4" color="black" onClick={handleOpenDialog}>
              Add Laboratory
            </Button>

            <Card className="overflow-x-auto px-0">
              <table className="w-full table-auto text-left">
                <thead>
                  <tr>
                    {TABLE_HEAD.map((head) => (
                      <th
                        key={head}
                        className="border-y border-blue-gray-100 bg-blue-gray-50/50 p-4"
                      >
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-semibold"
                        >
                          {head}
                        </Typography>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedLabs.map((lab, index) => (
                    <tr
                      key={lab.id}
                      className={
                        index !== paginatedLabs.length - 1
                          ? "border-b border-blue-gray-50"
                          : ""
                      }
                    >
                      <td className="p-4">
                        <Typography variant="small">{lab.labName}</Typography>
                      </td>
                      <td className="p-4">
                        <Typography variant="small">{lab.labCode}</Typography>
                      </td>
                      <td className="p-4">
                        <Typography variant="small">
                          {lab.computerCount}
                        </Typography>
                      </td>
                      <td className="p-4">
                        <Typography variant="small">{lab.status}</Typography>
                      </td>
                      <td className="p-4">
                        <Typography variant="small">
                          {lab.updatedAt
                            ? new Date(
                                lab.updatedAt.seconds * 1000
                              ).toLocaleDateString()
                            : "Not updated"}
                        </Typography>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Tooltip content="Edit Laboratory">
                            <IconButton
                              variant="text"
                              onClick={() => handleEditLab(lab)}
                            >
                              <PencilIcon className="h-5 w-5" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip content="Delete Laboratory">
                            <IconButton
                              variant="text"
                              onClick={() => {
                                setSelectedLab(lab);
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
                  {Math.ceil(filteredLabs.length / itemsPerPage)}
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
                      Math.ceil(filteredLabs.length / itemsPerPage)
                    }
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>

      <Dialog
        open={openEditDialog}
        handler={() => setOpenEditDialog(false)}
        size="lg"
      >
        <DialogHeader>Edit Laboratory</DialogHeader>
        <DialogBody>
          <form
            id="editLabForm"
            onSubmit={handleEditSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Input
              type="text"
              label="Laboratory Name"
              name="labName"
              value={formData.labName}
              onChange={handleInputChange}
              required
            />
            <Input
              type="text"
              label="Laboratory Code"
              name="labCode"
              value={formData.labCode}
              onChange={handleInputChange}
              required
            />
            <Input
              type="number"
              label="Computer Count"
              name="computerCount"
              value={formData.computerCount}
              onChange={handleInputChange}
              required
            />
            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={(value) =>
                handleInputChange({ target: { name: "status", value } })
              }
            >
              <Option value="Active">Active</Option>
              <Option value="Maintenance">Maintenance</Option>
            </Select>
          </form>
        </DialogBody>
        <DialogFooter className="space-x-2">
          <Button
            variant="text"
            color="black"
            onClick={() => setOpenEditDialog(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="editLabForm" disabled={isEditLoading}>
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
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        handler={() => setOpenDeleteDialog(false)}
      >
        <DialogHeader>Delete Laboratory</DialogHeader>
        <DialogBody>
          Are you sure you want to delete {selectedLab?.labName}? This action
          cannot be undone.
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            color="black"
            onClick={() => setOpenDeleteDialog(false)}
          >
            Cancel
          </Button>
          <Button color="red" onClick={handleDeleteLab}>
            Delete Laboratory
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={openDialog} handler={() => setOpenDialog(false)} size="lg">
        <DialogHeader className="text-2xl font-bold">
          Add New Laboratory
        </DialogHeader>
        <DialogBody>
          <form
            id="addLabForm"
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Input
              type="text"
              label="Laboratory Name"
              name="labName"
              value={formData.labName}
              onChange={handleInputChange}
              required
              className="w-full"
            />
            <Input
              type="text"
              label="Laboratory Code"
              name="labCode"
              value={formData.labCode}
              onChange={handleInputChange}
              required
              className="w-full"
            />
            <Input
              type="number"
              label="Computer Count"
              name="computerCount"
              value={formData.computerCount}
              onChange={handleInputChange}
              required
              className="w-full"
            />
            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={(value) =>
                handleInputChange({ target: { name: "status", value } })
              }
            >
              <Option value="Active">Active</Option>
              <Option value="Maintenance">Maintenance</Option>
            </Select>
          </form>
        </DialogBody>
        <DialogFooter className="space-x-2">
          <Button
            variant="outlined"
            color="red"
            onClick={() => setOpenDialog(false)}
          >
            Cancel
          </Button>
          <Button color="black" type="submit" form="addLabForm">
            Add Laboratory
          </Button>
        </DialogFooter>
      </Dialog>

      <ToastContainer />
    </div>
  ) : null;
}
