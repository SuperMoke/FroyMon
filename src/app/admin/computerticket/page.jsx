"use client";
import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Button,
  Input,
  List,
  ListItem,
  ListItemPrefix,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Select,
  Option,
} from "@material-tailwind/react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../../utils/auth";
import Header from "../header";
import Sidebar from "../sidebar";
import { useAuthState } from "react-firebase-hooks/auth";
import { FaCalendarAlt, FaChevronDown, FaEdit } from "react-icons/fa";

export default function ComputerTicket() {
  const TABLE_HEAD = [
    "Computer Lab",
    "Computer Number",
    "Computer Status",
    "Description",
    "Student Name",
    "Ticket Status",
    "Action",
  ];
  const [ticketData, setTicketData] = useState([]);
  const [filteredTicketData, setFilteredTicketData] = useState([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [searchComputerNumber, setSearchComputerNumber] = useState("");
  const [filterComputerLab, setFilterComputerLab] = useState("");
  const [filterComputerStatus, setFilterComputerStatus] = useState("");
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);
  const [editingTicketId, setEditingTicketId] = useState(null);

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
  }, [user, loading, router]);

  useEffect(() => {
    if (!isAuthorized) return;

    const q = query(
      collection(db, "ticketentries"),
      where("date", "==", selectedDate)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newTicketData = [];
      querySnapshot.forEach((doc) => {
        newTicketData.push({ id: doc.id, ...doc.data() });
      });
      setTicketData(newTicketData);
      setFilteredTicketData(newTicketData);
    });

    return () => unsubscribe();
  }, [isAuthorized, selectedDate]);

  useEffect(() => {
    const filtered = ticketData.filter((ticket) => {
      return (
        ticket.computerNumber.includes(searchComputerNumber) &&
        (filterComputerLab === "" ||
          ticket.computerLab === filterComputerLab) &&
        (filterComputerStatus === "" ||
          ticket.computerStatus === filterComputerStatus)
      );
    });
    setFilteredTicketData(filtered);
  }, [
    searchComputerNumber,
    filterComputerLab,
    filterComputerStatus,
    ticketData,
  ]);

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const ticketRef = doc(db, "ticketentries", ticketId);
      await updateDoc(ticketRef, {
        ticketStatus: newStatus,
      });
      console.log("Ticket status updated successfully");
    } catch (error) {
      console.error("Error updating ticket status: ", error);
    }
  };

  const TicketStatusList = ({ ticket }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleStatusChange = async (status) => {
      await updateTicketStatus(ticket.id, status);
      setIsMenuOpen(false);
      setEditingTicketId(null);
    };

    const isEditing = editingTicketId === ticket.id;

    return (
      <List>
        <Menu
          open={isMenuOpen}
          handler={setIsMenuOpen}
          placement="bottom-start"
        >
          <MenuHandler>
            <ListItem
              className="focus:bg-blue-gray-50 hover:bg-blue-gray-50 cursor-pointer"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              disabled={!isEditing}
            >
              <ListItemPrefix>
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-normal"
                >
                  {ticket.ticketStatus || "Select Status"}
                </Typography>
              </ListItemPrefix>
              <FaChevronDown className="h-3 w-3 ml-auto" />
            </ListItem>
          </MenuHandler>
          <MenuList>
            {["Open", "On-Going", "Closed"].map((status) => (
              <MenuItem key={status} onClick={() => handleStatusChange(status)}>
                {status}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </List>
    );
  };

  return isAuthorized ? (
    <>
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
                  Computer Tickets
                </Typography>
                <div className="flex flex-col md:flex-row gap-4">
                  <Input
                    type="text"
                    label="Search Computer Number"
                    value={searchComputerNumber}
                    onChange={(e) => setSearchComputerNumber(e.target.value)}
                    className="w-full md:w-64"
                  />
                  <div className="w-full md:w-70">
                    <Select
                      label="Filter by Computer Lab"
                      value={filterComputerLab}
                      onChange={(value) => setFilterComputerLab(value)}
                      className="w-full"
                    >
                      <Option value="">All Computer Laboratory</Option>
                      <Option value="CLAB1">Computer Laboratory 1</Option>
                      <Option value="CLAB2">Computer Laboratory 2</Option>
                      <Option value="CLAB3">Computer Laboratory 3</Option>
                      <Option value="CLAB4">Computer Laboratory 4</Option>
                      <Option value="CLAB5">Computer Laboratory 5</Option>
                      <Option value="CLAB6">Computer Laboratory 6</Option>
                      <Option value="CiscoLab">Cisco Laboratory</Option>
                      <Option value="AccountingLab">
                        Accounting Laboratory
                      </Option>
                      <Option value="HardwareLab">Hardware Laboratory</Option>
                      <Option value="ContactCenterLab">
                        Contact Center Laboratory
                      </Option>
                    </Select>
                  </div>
                  <div className="w-full md:w-64">
                    <Select
                      label="Filter by Computer Status"
                      value={filterComputerStatus}
                      onChange={(value) => setFilterComputerStatus(value)}
                      className="w-full"
                    >
                      <Option value="">All Issues</Option>
                      <Option value="Hardware Issues">Hardware Issues</Option>
                      <Option value="Software Issues">Software Issues</Option>
                      <Option value="Network Problems">Network Problems</Option>
                    </Select>
                  </div>
                  <div className="relative">
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="pr-10"
                    />
                    <FaCalendarAlt className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-gray-300" />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mb-4"></div>
              <Card className="w-full mb-8 shadow-lg rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="bg-blue-gray-50">
                        {TABLE_HEAD.map((head) => (
                          <th
                            key={head}
                            className="border-b border-blue-gray-100 p-4"
                          >
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-bold leading-none opacity-70"
                            >
                              {head}
                            </Typography>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTicketData.map((ticket, index) => (
                        <tr
                          key={ticket.id}
                          className={
                            index % 2 === 0 ? "bg-blue-gray-50/50" : ""
                          }
                        >
                          <td className="p-4">
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-normal text-center"
                            >
                              {ticket.computerLab}
                            </Typography>
                          </td>
                          <td className="p-4">
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-normal text-center"
                            >
                              {ticket.computerNumber}
                            </Typography>
                          </td>
                          <td className="p-4">
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-normal text-center"
                            >
                              {ticket.computerStatus}
                            </Typography>
                          </td>
                          <td className="p-4">
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-normal text-center"
                            >
                              {ticket.description}
                            </Typography>
                          </td>
                          <td className="p-4">
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-normal text-center"
                            >
                              {ticket.studentName}
                            </Typography>
                          </td>
                          <td className="p-4">
                            <TicketStatusList ticket={ticket} />
                          </td>
                          <td className="p-4">
                            <Button
                              size="sm"
                              color={
                                editingTicketId === ticket.id ? "red" : "blue"
                              }
                              onClick={() => {
                                if (editingTicketId === ticket.id) {
                                  setEditingTicketId(null);
                                } else {
                                  setEditingTicketId(ticket.id);
                                }
                              }}
                            >
                              <FaEdit className="mr-2" />
                              {editingTicketId === ticket.id
                                ? "Cancel Edit"
                                : "Edit Status"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </>
  ) : null;
}
