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
  CardFooter,
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
import jsPDF from "jspdf";
import "jspdf-autotable";

const TABLE_STYLES = {
  dateColumn: "w-32 whitespace-nowrap",
  labColumn: "w-28",
  pcNumColumn: "w-24",
  statusColumn: "w-28",
  descColumn: "w-40",
  nameColumn: "w-32",
  ticketStatusColumn: "w-28",
  remarksColumn: "w-40",
  actionColumn: "w-24",
  historyColumn: "w-24",
};

export default function ComputerTicket() {
  const TABLE_HEAD = [
    "Date and Time",
    "Computer Lab",
    "Computer Number",
    "Computer Status",
    "Description",
    "Name",
    "Status",
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [laboratories, setLaboratories] = useState([]);

  const getColumnClass = (header) => {
    switch (header) {
      case "Date and Time":
        return "dateColumn";
      case "Computer Lab":
        return "labColumn";
      case "Computer Number":
        return "pcNumColumn";
      case "Computer Status":
        return "statusColumn";
      case "Description":
        return "descColumn";
      case "Name":
        return "nameColumn";
      case "Status":
        return "ticketStatusColumn";
      case "Remarks":
        return "remarksColumn";
      case "Action":
        return "actionColumn";
      case "History":
        return "historyColumn";
      default:
        return "";
    }
  };

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
  }, []);

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
    const filtered = ticketData
      .filter((ticket) => {
        return (
          String(ticket.computerNumber).includes(searchComputerNumber) &&
          (filterComputerLab === "" ||
            ticket.computerLab === filterComputerLab) &&
          (filterComputerStatus === "" ||
            ticket.computerStatus === filterComputerStatus)
        );
      })
      .sort((a, b) => {
        // Prioritize "Pending" tickets
        if (a.ticketStatus === "Pending" && b.ticketStatus !== "Pending") {
          return -1;
        }
        if (a.ticketStatus !== "Pending" && b.ticketStatus === "Pending") {
          return 1;
        }
        // If both are "Pending" or both are not "Pending", sort by timeIn
        const dateTimeA = new Date(`${a.date} ${a.timeIn}`);
        const dateTimeB = new Date(`${b.date} ${b.timeIn}`);
        return dateTimeB - dateTimeA;
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
      if (status === "Closed") {
        const isConfirmed = window.confirm(
          "Are you sure you want to close this ticket? This action cannot be undone."
        );
        if (!isConfirmed) {
          return;
        }
      }

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
            {["On-Going", "Pending", "Closed"].map((status) => (
              <MenuItem key={status} onClick={() => handleStatusChange(status)}>
                {status}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
      </List>
    );
  };

  // Add this computed value before the return statement
  const paginatedTickets = filteredTicketData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const downloadPDF = () => {
    const doc = new jsPDF();

    // Add logo image at the center top
    const logoWidth = 30; // Adjust size as needed
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.addImage(
      "/froymon_logo.png",
      "PNG",
      (pageWidth - logoWidth) / 2,
      10,
      logoWidth,
      logoWidth
    );

    // Add centered titles with bold text
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");

    // Center the main title text
    const title = "FroyMon: Computer Laboratory Monitoring System";
    const titleWidth =
      (doc.getStringUnitWidth(title) * 16) / doc.internal.scaleFactor;
    doc.text(title, (pageWidth - titleWidth) / 2, logoWidth + 20);

    // Add subtitle
    const subtitle = "Computer Problem Report";
    const subtitleWidth =
      (doc.getStringUnitWidth(subtitle) * 16) / doc.internal.scaleFactor;
    doc.text(subtitle, (pageWidth - subtitleWidth) / 2, logoWidth + 30);

    // Add date with regular font
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Date: ${selectedDate}`, 14, logoWidth + 40);

    const pdfColumns = TABLE_HEAD.slice(0, 8);

    const data = filteredTicketData.map((ticket) => [
      `${ticket.date} "&" ${ticket.timeIn}`,
      ticket.computerLab,
      ticket.computerNumber,
      ticket.computerStatus,
      ticket.description,
      ticket.studentName,
      ticket.ticketStatus,
      Array.isArray(ticket.remarks)
        ? ticket.remarks.map((r) => r.text).join(", ")
        : "No Remarks",
    ]);

    doc.autoTable({
      head: [pdfColumns],
      body: data,
      startY: logoWidth + 45,
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        4: { cellWidth: 40 },
        7: { cellWidth: 40 },
      },
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: [255, 255, 255],
      },
    });

    doc.save(`computer-tickets-${selectedDate}.pdf`);
  };

  // Add this useEffect to reset pagination when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchComputerNumber, filterComputerLab, filterComputerStatus]);

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
                  Computer Problem
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
                      {[
                        {
                          id: "all",
                          labCode: "",
                          labName: "All Computer Laboratory",
                        },
                        ...laboratories.filter(
                          (lab) => lab.status !== "Maintenance"
                        ),
                      ].map((lab) => (
                        <Option key={lab.id} value={lab.labCode}>
                          {lab.labName}
                        </Option>
                      ))}
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
                      className="pr-5"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mb-4">
                <Button
                  className="self-end"
                  onClick={downloadPDF}
                  color="black"
                >
                  Download PDF
                </Button>
              </div>
              <Card className="overflow-x-auto px-0">
                <table className="w-full table-auto text-left">
                  <thead>
                    <tr>
                      {TABLE_HEAD.map((head) => (
                        <th
                          key={head}
                          className={`border-y border-blue-gray-100 bg-blue-gray-50/50 p-2 ${
                            TABLE_STYLES[getColumnClass(head)]
                          }`}
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
                    {paginatedTickets.length > 0 ? (
                      paginatedTickets.map((ticket, index) => (
                        <tr
                          key={ticket.id}
                          className={
                            index !== paginatedTickets.length - 1
                              ? "border-b border-blue-gray-50"
                              : ""
                          }
                        >
                          {/* Date and Time */}
                          <td
                            className={`p-2 ${
                              TABLE_STYLES[getColumnClass(TABLE_HEAD[0])]
                            }`}
                          >
                            <Typography variant="small">
                              {ticket.date} & {ticket.timeIn}
                            </Typography>
                          </td>

                          {/* Computer Lab */}
                          <td
                            className={`p-2 ${
                              TABLE_STYLES[getColumnClass(TABLE_HEAD[1])]
                            }`}
                          >
                            <Typography variant="small">
                              {ticket.computerLab}
                            </Typography>
                          </td>

                          {/* Computer Number */}
                          <td
                            className={`p-2 ${
                              TABLE_STYLES[getColumnClass(TABLE_HEAD[2])]
                            }`}
                          >
                            <Typography variant="small">
                              {ticket.computerNumber}
                            </Typography>
                          </td>

                          {/* Computer Status */}
                          <td
                            className={`p-2 ${
                              TABLE_STYLES[getColumnClass(TABLE_HEAD[3])]
                            }`}
                          >
                            <Typography variant="small">
                              {ticket.computerStatus}
                            </Typography>
                          </td>

                          {/* Description */}
                          <td
                            className={`p-2 ${
                              TABLE_STYLES[getColumnClass(TABLE_HEAD[4])]
                            }`}
                          >
                            <Typography variant="small">
                              {ticket.description}
                            </Typography>
                          </td>

                          {/* Name */}
                          <td
                            className={`p-2 ${
                              TABLE_STYLES[getColumnClass(TABLE_HEAD[5])]
                            }`}
                          >
                            <Typography variant="small">
                              {ticket.studentName}
                            </Typography>
                          </td>

                          {/* Status */}
                          <td
                            className={`p-2 ${
                              TABLE_STYLES[getColumnClass(TABLE_HEAD[6])]
                            }`}
                          >
                            <TicketStatusList ticket={ticket} />
                          </td>

                          {/* Remarks */}
                          <td
                            className={`p-2 ${
                              TABLE_STYLES[getColumnClass(TABLE_HEAD[7])]
                            }`}
                          >
                            <Typography variant="small">
                              {Array.isArray(ticket.remarks)
                                ? ticket.remarks.map((remark, index) => (
                                    <div key={index} className="mb-2">
                                      {remark.text}
                                    </div>
                                  ))
                                : "No Remarks"}
                            </Typography>
                          </td>

                          {/* Action */}
                          <td
                            className={`p-2 ${
                              TABLE_STYLES[getColumnClass(TABLE_HEAD[8])]
                            }`}
                          >
                            <RemarksSection
                              ticket={ticket}
                              updateTicketRemarks={updateTicketRemarks}
                              user={user}
                            />
                          </td>

                          {/* History */}
                          <td
                            className={`p-2 ${
                              TABLE_STYLES[getColumnClass(TABLE_HEAD[9])]
                            }`}
                          >
                            <Button
                              variant="text"
                              color="black"
                              onClick={() => handleViewHistory(ticket.id)}
                            >
                              View History
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={TABLE_HEAD.length}
                          className="text-center py-10"
                        >
                          <Typography variant="h5" color="blue-gray">
                            No data found
                          </Typography>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <CardFooter className="flex items-center justify-between border-t border-blue-gray-50 p-4">
                  <Typography variant="small" color="blue-gray">
                    Page {currentPage} of{" "}
                    {Math.ceil(filteredTicketData.length / itemsPerPage)}
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
                        Math.ceil(filteredTicketData.length / itemsPerPage)
                      }
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </CardFooter>
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
