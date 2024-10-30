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
  Collapse,
  Textarea,
} from "@material-tailwind/react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
  getDocs,
  addDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../../utils/auth";
import Header from "../header";
import Sidebar from "../sidebar";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  FaCalendarAlt,
  FaChevronDown,
  FaEdit,
  FaComment,
} from "react-icons/fa";
import RemarksSection from "./RemarksSection";
import HistoryModal from "./HistoryModal";

export default function ComputerTicket() {
  const TABLE_HEAD = [
    "Date and Time",
    "Computer Lab",
    "Computer Number",
    "Computer Status",
    "Description",
    "Student Name",
    "Ticket Status",
    "Remarks",
    "Action",
    "History",
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
  const [remarks, setRemarks] = useState({});
  const [isRemarksOpen, setIsRemarksOpen] = useState({});
  const [actionMode, setActionMode] = useState({});
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedTicketHistory, setSelectedTicketHistory] = useState([]);

  const generateRandomTicketData = () => {
    const computerLabs = [
      "CLAB1",
      "CLAB2",
      "CLAB3",
      "CLAB4",
      "CLAB5",
      "CLAB6",
      "CiscoLab",
      "AccountingLab",
      "HardwareLab",
      "ContactCenterLab",
    ];
    const computerStatuses = [
      "Hardware Issues",
      "Software Issues",
      "Network Problems",
    ];
    const ticketStatuses = ["Pending", "Open", "On-Going", "Closed"];
    const studentNames = [
      "John Doe",
      "Jane Smith",
      "Alice Johnson",
      "Bob Brown",
      "Charlie Davis",
    ];

    const randomDate = new Date().toISOString().split("T")[0];

    const randomTicketData = [];
    for (let i = 0; i < 10; i++) {
      randomTicketData.push({
        id: `ticket-${i}`,
        computerLab:
          computerLabs[Math.floor(Math.random() * computerLabs.length)],
        computerNumber: `C${Math.floor(Math.random() * 50) + 1}`,
        computerStatus:
          computerStatuses[Math.floor(Math.random() * computerStatuses.length)],
        description: `Issue description for computer ${i + 1}`,
        studentName:
          studentNames[Math.floor(Math.random() * studentNames.length)],
        ticketStatus:
          ticketStatuses[Math.floor(Math.random() * ticketStatuses.length)],
        remarks: `Remarks for ticket ${i + 1}`,
        date: randomDate,
      });
    }

    return randomTicketData;
  };

  // Add this index configuration to your Firestore
  const fetchTicketHistory = async (ticketId) => {
    const q = query(
      collection(db, "ticketHistory"),
      where("ticketId", "==", ticketId),
      orderBy("timestamp", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  };

  const handleViewHistory = async (ticketId) => {
    const history = await fetchTicketHistory(ticketId);
    setSelectedTicketHistory(history);
    setIsHistoryOpen(true);
  };

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

  const saveTicketHistory = async (
    ticketId,
    action,
    oldValue,
    newValue,
    userId
  ) => {
    try {
      await addDoc(collection(db, "ticketHistory"), {
        ticketId,
        action,
        oldValue,
        newValue,
        userId,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving history:", error);
    }
  };

  useEffect(() => {
    const filtered = ticketData.filter((ticket) => {
      return (
        String(ticket.computerNumber).includes(searchComputerNumber) &&
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
      const ticketSnap = await getDoc(ticketRef);
      const oldStatus = ticketSnap.data().ticketStatus;
      await updateDoc(ticketRef, {
        ticketStatus: newStatus,
      });

      await saveTicketHistory(
        ticketId,
        "Status Change",
        oldStatus,
        newStatus,
        user.email
      );
      console.log("Ticket status updated successfully");
    } catch (error) {
      console.error("Error updating ticket status: ", error);
    }
  };

  const updateTicketRemarks = async (ticketId, remark) => {
    try {
      const ticketRef = doc(db, "ticketentries", ticketId);
      await updateDoc(ticketRef, {
        remarks: remark,
      });
      console.log("Ticket remarks updated successfully");
    } catch (error) {
      console.error("Error updating ticket remarks: ", error);
    }
  };

  const TicketStatusList = ({ ticket }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleStatusChange = async (status) => {
      await updateTicketStatus(ticket.id, status);
      setIsMenuOpen(false);
      setEditingTicketId(null);
      setActionMode((prev) => ({ ...prev, [ticket.id]: null }));
    };

    const isEditing = actionMode[ticket.id] === "status";

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
              onClick={() => {
                if (ticket.ticketStatus !== "Closed") {
                  setIsMenuOpen((prev) => !prev);
                }
              }}
              disabled={ticket.ticketStatus === "Closed"}
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
            {["Pending", "Open", "On-Going", "Closed"].map((status) => (
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
                              {ticket.date} & {ticket.timeIn}
                            </Typography>
                          </td>
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
                            <Typography
                              variant="small"
                              color="blue-gray"
                              className="font-normal text-center"
                            >
                              {ticket.remarks || "No Remarks"}
                            </Typography>
                          </td>

                          <td className="p-4">
                            <RemarksSection
                              ticket={ticket}
                              updateTicketRemarks={updateTicketRemarks}
                              user={user}
                            />
                          </td>
                          <td className="p-4">
                            <Button
                              variant="text"
                              color="blue"
                              onClick={() => handleViewHistory(ticket.id)}
                            >
                              View History
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
            <HistoryModal
              open={isHistoryOpen}
              handleOpen={() => setIsHistoryOpen(!isHistoryOpen)}
              history={selectedTicketHistory}
            />
          </main>
        </div>
      </div>
    </>
  ) : null;
}
