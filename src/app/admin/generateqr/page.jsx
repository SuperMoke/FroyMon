"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  Card,
  Input,
  Select,
  Option,
  Typography,
} from "@material-tailwind/react";
import { QRCode } from "react-qr-code";
import html2canvas from "html2canvas";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../../utils/auth";
import Header from "../header";
import Sidebar from "../sidebar";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import { FaQrcode, FaDownload } from "react-icons/fa";

export default function Admin_GenerateQR() {
  const [computerNumber, setComputerNumber] = useState("");
  const [computerLab, setComputerLab] = useState("");
  const [qrCodeValue, setQrCodeValue] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const qrCodeRef = useRef(null);
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
      const authorized = await isAuthenticated("Admin");
      setIsAuthorized(authorized);
    };
    checkAuth();
  }, [user, loading, router]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const combinedValue = `${computerNumber} ${computerLab}`;
    setQrCodeValue(combinedValue);
  };

  const handleSaveAsImage = () => {
    html2canvas(qrCodeRef.current).then((canvas) => {
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `QR_${computerLab}_${computerNumber}.png`;
      link.click();
    });
  };

  const labOptions = [
    { value: "CLAB1", label: "Computer Laboratory 1" },
    { value: "CLAB2", label: "Computer Laboratory 2" },
    { value: "CLAB3", label: "Computer Laboratory 3" },
    { value: "CLAB4", label: "Computer Laboratory 4" },
    { value: "CLAB5", label: "Computer Laboratory 5" },
    { value: "CLAB6", label: "Computer Laboratory 6" },
    { value: "CiscoLab", label: "Cisco Laboratory" },
    { value: "AccountingLab", label: "Accounting Laboratory" },
    { value: "HardwareLab", label: "Hardware Laboratory" },
    { value: "ContactCenterLab", label: "Contact Center Laboratory" },
  ];

  return isAuthorized ? (
    <div className="bg-gray-100 min-h-screen">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8 sm:ml-64">
          <div className="max-w-4xl mx-auto">
            <Typography
              variant="h2"
              className="mb-8 text-center text-blue-gray-800"
            >
              Generate QR Code
            </Typography>
            <div className="flex flex-col md:flex-row gap-8">
              <Card className="w-full md:w-1/2 p-6 shadow-lg flex flex-col justify-center h-100">
                <form
                  onSubmit={handleFormSubmit}
                  className="space-y-6 flex flex-col items-center justify-center h-full"
                >
                  <div className="w-full">
                    <Typography
                      color="blue-gray"
                      className="mb-2 font-medium text-left"
                    >
                      Computer Number
                    </Typography>
                    <Input
                      type="number"
                      label="Enter The Computer Number"
                      onChange={(e) => setComputerNumber(e.target.value)}
                      value={computerNumber}
                      required
                      min="1"
                      max="40"
                      className="w-full"
                    />
                  </div>
                  <div className="w-full">
                    <Typography
                      color="blue-gray"
                      className="mb-2 font-medium text-left"
                    >
                      Computer Laboratory
                    </Typography>
                    <Select
                      label="Select Computer Laboratory"
                      onChange={(value) => setComputerLab(value)}
                      value={computerLab}
                      required
                      className="w-full"
                    >
                      {labOptions.map((lab) => (
                        <Option key={lab.value} value={lab.value}>
                          {lab.label}
                        </Option>
                      ))}
                    </Select>
                  </div>
                  <Button
                    type="submit"
                    className="w-full flex items-center justify-center"
                    color="black"
                    size="lg"
                  >
                    <FaQrcode className="mr-2" />
                    Generate QR Code
                  </Button>
                </form>
              </Card>
              <Card className="w-full md:w-1/2 p-6 shadow-lg flex flex-col items-center justify-center h-100">
                {qrCodeValue ? (
                  <>
                    <div className="mb-4" ref={qrCodeRef}>
                      <QRCode
                        value={qrCodeValue}
                        size={256}
                        viewBox={`0 0 256 256`}
                      />
                    </div>
                    <Typography color="blue-gray" className="mb-4 text-center">
                      {`${computerLab} - Computer ${computerNumber}`}
                    </Typography>
                    <Button
                      onClick={handleSaveAsImage}
                      color="black"
                      size="lg"
                      className="w-full flex items-center justify-center"
                    >
                      <FaDownload className="mr-2" />
                      Save as Image
                    </Button>
                  </>
                ) : (
                  <Typography color="blue-gray" className="text-center">
                    Generate a QR code to see it here
                  </Typography>
                )}
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  ) : null;
}
