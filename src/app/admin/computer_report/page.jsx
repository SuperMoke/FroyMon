"use client";
import React, { useEffect, useState, useRef } from "react";
import { Typography, Card, Button } from "@material-tailwind/react";
import Header from "../header";
import Sidebar from "../sidebar";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../firebase";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../../utils/auth";
import { collection, query, onSnapshot } from "firebase/firestore";
import dynamic from "next/dynamic";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format, parseISO } from "date-fns";
import Image from "next/image";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function ComputerReport() {
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [ticketData, setTicketData] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [todayReportCount, setTodayReportCount] = useState(0);

  const [chartData, setChartData] = useState({
    labTickets: {},
    statusDistribution: {},
    computerIssues: {},
    ticketsOverTime: {},
    topProblematicComputers: {},
  });

  const reportRef = useRef(null);

  useEffect(() => {
    if (ticketData.length > 0) {
      // Get today's date in yyyy-MM-dd format
      const today = format(new Date(), "yyyy-MM-dd");

      // Count reports from today
      const todayCount = ticketData.filter((ticket) => {
        const ticketDate =
          typeof ticket.date === "string"
            ? format(parseISO(ticket.date), "yyyy-MM-dd")
            : format(new Date(ticket.date), "yyyy-MM-dd");
        return ticketDate === today;
      }).length;

      setTodayReportCount(todayCount);
    }
  }, [ticketData]);

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

    const q = query(collection(db, "ticketentries"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newTicketData = [];
      querySnapshot.forEach((doc) => {
        newTicketData.push({ id: doc.id, ...doc.data() });
      });
      setTicketData(newTicketData);
    });

    return () => unsubscribe();
  }, [isAuthorized]);

  useEffect(() => {
    if (ticketData.length > 0) {
      const labTickets = {
        CLAB1: 0,
        CLAB2: 0,
        CLAB3: 0,
        CLAB4: 0,
        CLAB5: 0,
        CLAB6: 0,
        CiscoLab: 0,
        AccountingLab: 0,
        HardwareLab: 0,
        ContactCenterLab: 0,
      };
      const statusDistribution = {
        Pending: 0,
        Open: 0,
        "On-Going": 0,
        Closed: 0,
      };
      const computerIssues = {
        "Hardware Issues": 0,
        "Software Issues": 0,
        "Network Problems": 0,
      };
      const ticketsOverTime = {};
      const computerTicketCount = {};

      ticketData.forEach((ticket) => {
        labTickets[ticket.computerLab] =
          (labTickets[ticket.computerLab] || 0) + 1;

        statusDistribution[ticket.ticketStatus] =
          (statusDistribution[ticket.ticketStatus] || 0) + 1;

        computerIssues[ticket.computerStatus] =
          (computerIssues[ticket.computerStatus] || 0) + 1;

        let date;
        if (typeof ticket.date === "string") {
          date = format(parseISO(ticket.date), "yyyy-MM-dd");
        } else {
          date = format(new Date(ticket.date), "yyyy-MM-dd");
        }
        ticketsOverTime[date] = (ticketsOverTime[date] || 0) + 1;

        const key = `${ticket.computerNumber} (${ticket.computerLab})`;
        computerTicketCount[key] = (computerTicketCount[key] || 0) + 1;
      });

      const topProblematicComputers = Object.entries(computerTicketCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

      setChartData({
        labTickets,
        statusDistribution,
        computerIssues,
        ticketsOverTime,
        topProblematicComputers,
      });
    }
  }, [ticketData]);

  const chartOptions = {
    labTickets: {
      chart: { type: "bar" },
      xaxis: {
        categories: [
          "Computer Lab 1",
          "Computer Lab 2",
          "Computer Lab 3",
          "Computer Lab 4",
          "Computer Lab 5",
          "Computer Lab 6",
          "Cisco Lab",
          "Accounting Lab",
          "Hardware Lab",
          "Contact Center Lab",
        ],
      },
      title: { text: "Tickets by Computer Lab" },
    },
    statusDistribution: {
      chart: {
        type: "pie",
        animations: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
      },
      legend: {
        position: "bottom",
        horizontalAlign: "center",
        fontSize: "14px",
        markers: {
          width: 12,
          height: 12,
          radius: 6,
        },
        itemMargin: {
          horizontal: 10,
          vertical: 5,
        },
      },
      plotOptions: {
        pie: {
          size: "80%",
          donut: {
            size: "75%",
          },
        },
      },
      labels: ["Pending", "Open", "On-Going", "Closed"],
      title: {
        text: "Ticket Status Distribution",
      },
    },
    computerIssues: {
      chart: {
        type: "donut",
        animations: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
      },
      legend: {
        position: "bottom",
        horizontalAlign: "center",
        fontSize: "14px",
        markers: {
          width: 12,
          height: 12,
          radius: 6,
        },
        itemMargin: {
          horizontal: 10,
          vertical: 5,
        },
      },
      plotOptions: {
        pie: {
          size: "80%",
          donut: {
            size: "75%",
          },
        },
      },
      labels: ["Hardware Issues", "Software Issues", "Network Problems"],
      title: {
        text: "Computer Status Issues",
      },
    },
    ticketsOverTime: {
      chart: { type: "line" },
      xaxis: {
        categories: Object.keys(chartData.ticketsOverTime).sort(),
      },
      title: { text: "Tickets Over Time" },
    },
    topProblematicComputers: {
      chart: { type: "bar" },
      xaxis: { categories: Object.keys(chartData.topProblematicComputers) },
      title: { text: "Top 5 Problematic Computers" },
      tooltip: {
        y: {
          formatter: (value, { series, seriesIndex, dataPointIndex, w }) => {
            const label = w.globals.labels[dataPointIndex];
            return `${label}: ${value} tickets`;
          },
        },
      },
    },
  };

  const downloadPDF = async () => {
    const input = reportRef.current;
    setIsDownloading(true);

    try {
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("Computer_Report.pdf");
    } catch (error) {
      console.error("Error generating PDF: ", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return isAuthorized ? (
    <>
      <div className="bg-blue-gray-50 min-h-screen">
        <Header />
        <div className="flex flex-1">
          <Sidebar reportCount={todayReportCount} />
          <main className="flex-1 p-4 sm:ml-64">
            <div className="container mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <Typography
                  variant="h3"
                  color="blue-gray"
                  className="mb-4 md:mb-0"
                >
                  Computer Reports
                </Typography>
                <Button
                  onClick={downloadPDF}
                  disabled={isDownloading}
                  className="flex items-center space-x-2"
                  color="black"
                >
                  {isDownloading ? (
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
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <span>Download PDF</span>
                    </>
                  )}
                </Button>
              </div>
              <div
                id="report-content"
                ref={reportRef}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4"
              >
                <div className="md:col-span-2 flex flex-col items-center mb-4">
                  <Image
                    src="/froymon_logo.png"
                    alt="FroyMon Logo"
                    width={150}
                    height={150}
                  />
                  <Typography variant="h2" className="mt-2">
                    FroyMon: Computer Laboratory Monitoring System
                  </Typography>
                </div>
                <div className="md:col-span-1">
                  <Chart
                    options={chartOptions.labTickets}
                    series={[{ data: Object.values(chartData.labTickets) }]}
                    type="bar"
                    height={350}
                  />
                </div>
                <div className="md:col-span-1">
                  <Chart
                    options={chartOptions.statusDistribution}
                    series={Object.values(chartData.statusDistribution)}
                    type="pie"
                    height={350}
                  />
                </div>
                <div className="md:col-span-1">
                  <Chart
                    options={chartOptions.computerIssues}
                    series={Object.values(chartData.computerIssues)}
                    type="donut"
                    height={350}
                  />
                </div>
                <div className="md:col-span-1">
                  <Chart
                    options={chartOptions.topProblematicComputers}
                    series={[
                      {
                        data: Object.values(chartData.topProblematicComputers),
                      },
                    ]}
                    type="bar"
                    height={350}
                  />
                </div>
                <div className="md:col-span-2">
                  <Chart
                    options={chartOptions.ticketsOverTime}
                    series={[
                      { data: Object.values(chartData.ticketsOverTime) },
                    ]}
                    type="line"
                    height={350}
                  />
                </div>
                <div className="md:col-span-2 mt-4 text-center">
                  <Typography>Generated by: {user?.email}</Typography>
                  <Typography>
                    Date & Time Generated: {new Date().toLocaleString()}
                  </Typography>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  ) : null;
}
