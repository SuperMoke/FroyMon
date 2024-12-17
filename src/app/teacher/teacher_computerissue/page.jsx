"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Input,
  Stepper,
  Step,
  Typography,
  Select,
  Option,
  Alert,
} from "@material-tailwind/react";
import Image from "next/image";
import { addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { Html5Qrcode } from "html5-qrcode";
import { isAuthenticated } from "../../utils/auth";
import { useRouter } from "next/navigation";

import Header from "../header";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import { FaQrcode, FaKeyboard, FaCheckCircle } from "react-icons/fa";
import Sidebar from "../sidebar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function QrScannerPage() {
  const [data, setData] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [isLastStep, setIsLastStep] = useState(false);
  const [isFirstStep, setIsFirstStep] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [formData, setFormData] = useState({
    computerLab: "",
    computerNumber: "",
    description: "",
    computerStatus: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
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
  }, [user, loading, router]);

  useEffect(() => {
    let html5QrCode;
    if (scanning) {
      const qrCodeSuccessCallback = async (decodedText) => {
        setData(decodedText);
        const [computerNumber, computerLab] = decodedText.split(" ");
        setFormData((prev) => ({ ...prev, computerNumber, computerLab }));
        setActiveStep(1);
        setScanning(false);
      };

      html5QrCode = new Html5Qrcode("qr-code-reader");
      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        qrCodeSuccessCallback
      );
    }

    return () => {
      if (html5QrCode) {
        html5QrCode
          .stop()
          .then((ignore) => {})
          .catch((err) => console.error(err));
      }
    };
  }, [scanning]);

  const startScan = () => {
    setScanning(true);
  };

  const stopScan = () => {
    setScanning(false);
  };

  const formatTime = (hours, minutes) => {
    const ampm = hours >= 12 ? "PM" : "AM";
    let formattedHours = hours % 12;
    formattedHours = formattedHours ? formattedHours : 12;
    const formattedMinutes = minutes.toString().padStart(2, "0");
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  const handleSubmit = async () => {
    if (!formData.computerStatus || !formData.description) {
      toast.error("Both Computer Status and Description are required");
      return;
    }
    try {
      const userQuery = query(
        collection(db, "user"),
        where("email", "==", user.email)
      );

      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        const currentTime = new Date();
        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes();
        const formattedTime = formatTime(hours, minutes);
        const formattedDate = currentTime.toISOString().split("T")[0];

        await addDoc(collection(db, "ticketentries"), {
          studentName: userData.name,
          ccaEmail: userData.email,
          computerStatus: formData.computerStatus,
          description: formData.description,
          computerNumber: formData.computerNumber,
          computerLab: formData.computerLab,
          timeIn: formattedTime,
          date: formattedDate,
          ticketStatus: "Pending",
        });
        setActiveStep(2);
      }
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const handleEndSession = async () => {
    router.push("/teacher");
  };

  const handleManualSubmit = () => {
    if (!formData.computerLab || !formData.computerNumber) {
      toast.error("Both Computer Laboratory and Computer Number are required");
      return;
    }
    setActiveStep(1);
  };

  return isAuthorized ? (
    <>
      <div className="flex flex-col bg-blue-gray-50 min-h-screen">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <div className="flex-1 p-4 sm:ml-64">
            <div className="container mx-auto px-4 py-8 ">
              <Card className="w-full max-w-4xl mx-auto shadow-lg ">
                <div className="p-6">
                  <Stepper
                    activeStep={activeStep}
                    isLastStep={(value) => setIsLastStep(value)}
                    isFirstStep={(value) => setIsFirstStep(value)}
                    className="mb-8"
                  >
                    <Step>
                      <FaQrcode className="h-5 w-5" />
                    </Step>
                    <Step>
                      <FaKeyboard className="h-5 w-5" />
                    </Step>
                    <Step>
                      <FaCheckCircle className="h-5 w-5" />
                    </Step>
                  </Stepper>

                  {activeStep === 0 && (
                    <div className="space-y-4">
                      <Typography variant="h5" className="text-center">
                        Scan The QR Code
                      </Typography>
                      <div className="flex justify-center">
                        <Card className="w-full max-w-md p-4">
                          <div
                            id="qr-code-reader"
                            className={`w-[300px] h-[300px] relative mx-auto border-2 border-gray-300 rounded-lg overflow-hidden ${
                              scanning ? "block" : "hidden"
                            }`}
                          ></div>

                          <Button
                            onClick={scanning ? stopScan : startScan}
                            color={scanning ? "red" : "black"}
                            fullWidth
                          >
                            {scanning ? "Stop Scanning" : "Start Scanning"}
                          </Button>
                        </Card>
                      </div>
                      <div className="flex justify-center">
                        <Typography variant="h5" className="text-center">
                          Or put the computer laboratory and computer number
                        </Typography>
                      </div>
                      <div className="flex justify-center">
                        <Card className="w-full max-w-md p-4">
                          <div className="space-y-4">
                            <div>
                              <Typography
                                variant="small"
                                color="blue-gray"
                                className="mb-2 font-medium"
                              >
                                Computer Laboratory
                              </Typography>
                              <Select
                                label="Select Computer Laboratory"
                                placeholder={undefined}
                                required
                                onChange={(value) =>
                                  setFormData({
                                    ...formData,
                                    computerLab: value,
                                  })
                                }
                              >
                                <Option value="CLAB1">
                                  Computer Laboratory 1
                                </Option>
                                <Option value="CLAB2">
                                  Computer Laboratory 2
                                </Option>
                                <Option value="CLAB3">
                                  Computer Laboratory 3
                                </Option>
                                <Option value="CLAB4">
                                  Computer Laboratory 4
                                </Option>
                                <Option value="CLAB5">
                                  Computer Laboratory 5
                                </Option>
                                <Option value="CLAB6">
                                  Computer Laboratory 6
                                </Option>
                                <Option value="CiscoLab">
                                  Cisco Laboratory
                                </Option>
                                <Option value="AccountingLab">
                                  Accounting Laboratory
                                </Option>
                                <Option value="HardwareLab">
                                  Hardware Laboratory
                                </Option>
                                <Option value="ContactCenterLab">
                                  Contact Center Laboratory
                                </Option>
                              </Select>
                            </div>
                            <div>
                              <Typography
                                variant="small"
                                color="blue-gray"
                                className="mb-2 font-medium"
                              >
                                Computer Number
                              </Typography>
                              <Input
                                label="Enter the computer number"
                                type="number"
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    computerNumber: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <Button
                              onClick={handleManualSubmit}
                              color="black"
                              fullWidth
                            >
                              Submit
                            </Button>
                          </div>
                        </Card>
                      </div>
                    </div>
                  )}

                  {activeStep === 1 && (
                    <div className="space-y-4">
                      <Typography variant="h5" className="text-center">
                        Fill out the details
                      </Typography>
                      <Card className="w-full p-5 ">
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="mb-2 font-medium"
                        >
                          Computer Status
                        </Typography>
                        <Select
                          label="Select Computer Status"
                          onChange={(value) =>
                            setFormData({ ...formData, computerStatus: value })
                          }
                          className="mb-5"
                        >
                          <Option value="Hardware Issues">
                            Hardware Issues
                          </Option>
                          <Option value="Software Issues">
                            Software Issues
                          </Option>
                          <Option value="Network Problems">
                            Network Problems
                          </Option>
                          <Option value="Other Issues">Other Issues</Option>
                        </Select>
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="mb-2 font-medium"
                        >
                          Description
                        </Typography>
                        <Input
                          label="Enter the description of the issue"
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                        />

                        <Button
                          className="mt-5"
                          onClick={handleSubmit}
                          color="black"
                          fullWidth
                        >
                          Submit
                        </Button>
                      </Card>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="text-center space-y-6">
                      <Image
                        src="/thankyou.jpeg"
                        width={200}
                        height={200}
                        alt="Thank You Picture"
                        className="mx-auto rounded-full shadow-md"
                      />
                      <Typography variant="h5" color="blue-gray">
                        Thank you for submitting a ticket!
                      </Typography>
                      <Button onClick={handleEndSession} color="black">
                        Go back to homepage
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
        <ToastContainer />
      </div>
    </>
  ) : null;
}
