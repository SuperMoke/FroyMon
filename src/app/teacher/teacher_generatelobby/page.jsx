"use client";
import React, { useEffect, useState } from "react";

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
import {
  collection,
  addDoc,
  getDocs,
  query,
  onSnapshot,
  where,
  getFirestore,
  deleteDoc,
  writeBatch,
  doc,
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import { useRecoilState } from "recoil";
import { ComputerLabState } from "../../atoms";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../../utils/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import Header from "../header";
import { FaChalkboardTeacher, FaUsers, FaCheckCircle } from "react-icons/fa";
import Sidebar from "../sidebar";

function generateRandomPin() {
  return Math.floor(100000 + Math.random() * 900000);
}

export default function Generatelobby() {
  const [students, setStudents] = useState([]);
  const [profileUrls, setProfileUrls] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    course: "",
    classSection: "",
    computerLab: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [pin, setPin] = useState(null);
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [computerLab, setComputerLab] = useRecoilState(ComputerLabState);

  const [activeStep, setActiveStep] = useState(0);
  const [isLastStep, setIsLastStep] = useState(false);
  const [isFirstStep, setIsFirstStep] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  useEffect(() => {
    if (!user) return;
    const fetchUserData = async () => {
      try {
        const userEmail = user.email;
        const db = getFirestore();
        const userQuery = query(
          collection(db, "user"),
          where("email", "==", userEmail)
        );
        const querySnapshot = await getDocs(userQuery);
        if (!querySnapshot.empty) {
          querySnapshot.forEach((doc) => {
            const userData = doc.data();
            console.log("User data fetched:", userData);
            setFormData((prevData) => ({
              ...prevData,
              name: userData.name || "",
              email: userData.email || "",
            }));
          });
        } else {
          console.error("User not found or role not specified");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, [user]);

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
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("name");
      const storedEmail = localStorage.getItem("email");
      const storedClassSection = localStorage.getItem("classSection");
      const storedComputerLab = localStorage.getItem("computerLab");
      setFormData({
        name: storedName || "",
        email: storedEmail || "",
        classSection: storedClassSection || "",
        computerLab: storedComputerLab || "",
      });
      setComputerLab(storedComputerLab);
      const storedFormSubmitted = localStorage.getItem("formSubmitted");
      if (storedFormSubmitted === "true") {
        setFormSubmitted(true);
      }
      const storedPin = localStorage.getItem("pin");
      setPin(storedPin);

      const unsubscribe = onSnapshot(
        query(
          collection(db, "studententries"),
          where("lobbypassword", "==", pin)
        ),
        (snapshot) => {
          const studentsData = [];
          const emailList = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            studentsData.push(data);
            emailList.push(data.ccaEmail);
          });
          setStudents(studentsData);
          const userQuery = query(
            collection(db, "user"),
            where("email", "in", emailList)
          );
          getDocs(userQuery).then((userSnapshot) => {
            const profileUrlsData = {};
            userSnapshot.forEach((doc) => {
              const userData = doc.data();
              profileUrlsData[userData.email] = userData.profileUrl;
            });
            setProfileUrls(profileUrlsData);
          });
        }
      );

      return () => unsubscribe();
    }
  }, [computerLab]);

  const formatTime = (hours, minutes) => {
    const ampm = hours >= 12 ? "PM" : "AM";
    let formattedHours = hours % 12;
    formattedHours = formattedHours ? formattedHours : 12;
    const formattedMinutes = minutes.toString().padStart(2, "0");
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  const saveFormDataToFirestore = async () => {
    const pin = formData.course + generateRandomPin();
    try {
      const currentTime = new Date();
      const hours = currentTime.getHours();
      const minutes = currentTime.getMinutes();
      const formattedDate = currentTime.toISOString().split("T")[0];
      const formattedTime = formatTime(hours, minutes);

      // Save data to the lobbies collection
      const lobbyDocRef = await addDoc(collection(db, "lobbies"), {
        name: formData.name,
        email: formData.email,
        course: formData.course,
        classSection: formData.classSection,
        computerLab: formData.computerLab,
        pin: pin,
        time: formattedTime,
        date: formattedDate,
        computerLab: formData.computerLab,
      });

      setPin(pin);
      setFormSubmitted(true);
      if (typeof window !== "undefined") {
        localStorage.removeItem("name");
        localStorage.removeItem("email");
        localStorage.setItem("classSection", formData.classSection);
        localStorage.setItem("computerLab", formData.computerLab);
        localStorage.setItem("formSubmitted", true);
        localStorage.setItem("pin", pin);
        setComputerLab(formData.computerLab);
      }
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const endSession = async (pin) => {
    try {
      // Get the current user's UID
      const user = auth.currentUser;
      if (!user) {
        console.error("No user is currently logged in");
        return;
      }
      const teacherId = user.uid;

      // Query to get the lobby document with the matching pin
      const lobbyQuery = query(
        collection(db, "lobbies"),
        where("pin", "==", pin)
      );
      const lobbyQuerySnapshot = await getDocs(lobbyQuery);

      // Check if the lobby exists
      if (lobbyQuerySnapshot.empty) {
        console.error("Lobby does not exist");
        return;
      }

      // Get the lobby document reference
      const lobbyDoc = lobbyQuerySnapshot.docs[0];

      // Query to get all student entries for the lobby
      const studentEntriesQuery = query(
        collection(db, "studententries"),
        where("lobbypassword", "==", pin)
      );
      const studentEntriesSnap = await getDocs(studentEntriesQuery);

      // Get current date
      const currentDate = new Date().toISOString().split("T")[0];

      // Move student entries to the teacherdata collection
      const batch = writeBatch(db);
      studentEntriesSnap.forEach((studentDoc) => {
        const studentData = studentDoc.data();
        const lobbyDataRef = doc(db, `lobbydata`, studentDoc.id);
        // Include the classSection in the data being written
        batch.set(lobbyDataRef, {
          ...studentData,
          classSection: formData.classSection,
          date: currentDate,
          teacherId: teacherId,
        });
      });

      // Commit the batch
      await batch.commit();
      await deleteDoc(lobbyDoc.ref);

      console.log("Session ended successfully");
      localStorage.clear();
      setFormData({
        name: "",
        email: "",
        classSection: "",
      });
      setFormSubmitted(false);
      setPin(null);
      setComputerLab("");
      setActiveStep(2);
    } catch (error) {
      console.error("Error ending session: ", error);
    }
  };

  return isAuthorized ? (
    <>
      <div className="flex flex-col bg-blue-gray-50 min-h-screen">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <div className="flex-1 p-4 sm:ml-64">
            <div className="container mx-auto px-4 py-8">
              <Card className="w-full max-w-5xl mx-auto shadow-lg p-8">
                <div className="p-6">
                  <Stepper
                    activeStep={activeStep}
                    isLastStep={(value) => setIsLastStep(value)}
                    isFirstStep={(value) => setIsFirstStep(value)}
                    className="mb-8"
                  >
                    <Step onClick={() => setActiveStep(0)}>
                      <FaChalkboardTeacher className="h-5 w-5" />
                    </Step>
                    <Step onClick={() => setActiveStep(1)}>
                      <FaUsers className="h-5 w-5" />
                    </Step>
                    <Step onClick={() => setActiveStep(2)}>
                      <FaCheckCircle className="h-5 w-5" />
                    </Step>
                  </Stepper>

                  {errorMessage && (
                    <Alert variant="outlined" color="red" className="mb-4">
                      <span>{errorMessage}</span>
                    </Alert>
                  )}

                  {activeStep === 0 && (
                    <div className="space-y-4">
                      <Typography variant="h5" className="text-center">
                        Create a Lobby
                      </Typography>
                      <Card className="w-full max-w-2xl p-6 mx-auto">
                        <div className="space-y-4">
                          <Select
                            label="Select Course"
                            value={formData.course}
                            onChange={(value) =>
                              setFormData((prevData) => ({
                                ...prevData,
                                course: value,
                              }))
                            }
                          >
                            <Option value="CS">
                              Bachelor of Science in Computer Science
                            </Option>
                            <Option value="IS">
                              Bachelor of Science in Information System
                            </Option>
                            <Option value="BLIS">
                              Bachelor of Library and Information Science
                            </Option>
                          </Select>
                          <Input
                            type="text"
                            label="Enter The Class Section"
                            name="classSection"
                            value={formData.classSection}
                            onChange={handleInputChange}
                          />
                          <Select
                            label="Select Computer Laboratory"
                            value={formData.computerLab}
                            onChange={(value) =>
                              setFormData((prevData) => ({
                                ...prevData,
                                computerLab: value,
                              }))
                            }
                          >
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
                            <Option value="HardwareLab">
                              Hardware Laboratory
                            </Option>
                            <Option value="ContactCenterLab">
                              Contact Center Laboratory
                            </Option>
                          </Select>
                          <Button
                            onClick={() => {
                              saveFormDataToFirestore();
                              setActiveStep(1);
                            }}
                            color="blue"
                            fullWidth
                          >
                            Create Lobby
                          </Button>
                        </div>
                      </Card>
                    </div>
                  )}

                  {activeStep === 1 && (
                    <div className="space-y-4">
                      <Typography variant="h5" className="text-center">
                        Lobby Information
                      </Typography>
                      <Card className="w-full max-w-2xl p-6 mx-auto">
                        <Typography variant="h6" className="mb-2">
                          Code Generated: {pin}
                        </Typography>
                        <Typography variant="h6" className="mb-4">
                          Computer Lab: {computerLab}
                        </Typography>
                        <Typography variant="h6" className="mb-2">
                          Student List:
                        </Typography>
                        <div className="max-h-64 overflow-y-auto">
                          {students.map((student, index) => (
                            <div key={index} className="flex items-center mb-2">
                              <Image
                                src={
                                  profileUrls[student.ccaEmail] || "/Avatar.jpg"
                                }
                                width={40}
                                height={40}
                                alt="Student Avatar"
                                className="rounded-full mr-2"
                              />
                              <Typography>{student.studentName}</Typography>
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={() => {
                            endSession(pin);
                          }}
                          color="blue"
                          fullWidth
                          className="mt-4"
                        >
                          Saved Session
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
                        Save the Session Successfully
                      </Typography>
                      <Button
                        onClick={() => {
                          router.push("/teacher");
                        }}
                        color="blue"
                      >
                        Return to Teacher Homepage
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  ) : null;
}
