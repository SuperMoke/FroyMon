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
import {
  addDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase";
import { Html5Qrcode } from "html5-qrcode";
import { isAuthenticated } from "../../utils/auth";
import { useRouter } from "next/navigation";

import Header from "../header";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import { FaQrcode, FaKeyboard, FaCheckCircle } from "react-icons/fa";
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
  const [showComputerInput, setShowComputerInput] = useState(false);
  const [laboratories, setLaboratories] = useState([]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      console.log("User is not authenticated, redirecting to home...");
      router.push("/");
      return;
    }
    const checkAuth = async () => {
      const authorized = await isAuthenticated("Student");
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
    let html5QrCode;
    if (scanning) {
      const qrCodeSuccessCallback = async (decodedText) => {
        setData(decodedText);

        if (decodedText.includes(" ")) {
          const [computerNumber, computerLab] = decodedText.split(" ");
          setFormData((prev) => ({ ...prev, computerNumber, computerLab }));
          setActiveStep(1);
        } else {
          setFormData((prev) => ({ ...prev, computerLab: decodedText }));
          setShowComputerInput(true);
          setScanning(false);
        }
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
          .then()
          .catch((err) => console.error(err));
      }
    };
  }, [scanning]);

  const handleComputerNumberSubmit = () => {
    if (!formData.computerNumber) {
      toast.error("Please enter a computer number");
      return;
    }
    setShowComputerInput(false);
    setActiveStep(1);
  };

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
    router.push("/user");
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
      <div className="bg-blue-gray-50 min-h-screen">
        <Header />
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
                <div className="space-y-8">
                  <div className="space-y-4">
                    <Typography variant="h5" className="text-center">
                      Scan The QR Code
                    </Typography>
                    <div className="flex justify-center">
                      <Card className="w-full max-w-md p-4">
                        {!showComputerInput ? (
                          <>
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
                          </>
                        ) : (
                          <div className="space-y-4">
                            <Typography variant="h6" className="text-center">
                              Computer Lab: {formData.computerLab}
                            </Typography>
                            <Input
                              label="Enter Computer Number"
                              type="number"
                              value={formData.computerNumber}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  computerNumber: e.target.value,
                                }))
                              }
                            />
                            <Button
                              onClick={handleComputerNumberSubmit}
                              color="black"
                              fullWidth
                            >
                              Continue
                            </Button>
                          </div>
                        )}
                      </Card>
                    </div>
                  </div>

                  {/* Manual entry section only shows when not in computer input mode */}
                  {!showComputerInput && (
                    <div className="space-y-4">
                      <Typography variant="h5" className="text-center">
                        Or Enter Details Manually
                      </Typography>
                      <Card className="w-full max-w-md mx-auto p-4">
                        <div className="space-y-4">
                          <Select
                            label="Select Computer Laboratory"
                            value={formData.computerLab || ""}
                            onChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                computerLab: value,
                              }))
                            }
                          >
                            {laboratories
                              .filter((lab) => lab.status !== "Maintenance")
                              .map((lab) => (
                                <Option key={lab.id} value={lab.labCode}>
                                  {lab.labName}
                                </Option>
                              ))}
                          </Select>

                          <Input
                            label="Enter Computer Number"
                            type="number"
                            value={formData.computerNumber}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                computerNumber: e.target.value,
                              }))
                            }
                          />
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
                  )}
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
                      <Option value="Hardware Issues">Hardware Issues</Option>
                      <Option value="Software Issues">Software Issues</Option>
                      <Option value="Network Problems">Network Problems</Option>
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

      <ToastContainer />
    </>
  ) : null;
}
