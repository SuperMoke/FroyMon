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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
  const [participantCount, setParticipantCount] = useState(0);

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

  // Add this new useEffect for checking active lobbies
  useEffect(() => {
    const checkActiveLobby = async () => {
      const storedPin = localStorage.getItem("pin");
      if (!storedPin) return;

      const lobbiesRef = collection(db, "lobbies");
      const lobbyQuery = query(lobbiesRef, where("pin", "==", storedPin));
      const lobbySnapshot = await getDocs(lobbyQuery);

      if (!lobbySnapshot.empty) {
        const lobbyData = lobbySnapshot.docs[0].data();
        setFormData({
          name: lobbyData.name,
          email: lobbyData.email,
          course: lobbyData.course,
          classSection: lobbyData.classSection,
          computerLab: lobbyData.computerLab,
        });
        setPin(storedPin);
        setFormSubmitted(true);
        setComputerLab(lobbyData.computerLab);

        // Store these values in localStorage
        localStorage.setItem("course", lobbyData.course);
        localStorage.setItem("classSection", lobbyData.classSection);
        localStorage.setItem("computerLab", lobbyData.computerLab);

        setActiveStep(1);
      } else {
        // If no active lobby, try to restore saved form data
        const storedCourse = localStorage.getItem("course");
        const storedClassSection = localStorage.getItem("classSection");
        const storedComputerLab = localStorage.getItem("computerLab");

        setFormData((prevData) => ({
          ...prevData,
          course: storedCourse || "",
          classSection: storedClassSection || "",
          computerLab: storedComputerLab || "",
        }));
      }
    };

    if (user) {
      checkActiveLobby();
    }
  }, [user]);

  useEffect(() => {
    if (!pin) return;

    const unsubscribe = onSnapshot(
      query(
        collection(db, "studententries"),
        where("lobbypassword", "==", pin)
      ),
      (snapshot) => {
        const uniqueStudents = {};
        const emailList = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          uniqueStudents[data.ccaEmail] = data;
          emailList.push(data.ccaEmail);
        });

        const studentsData = Object.values(uniqueStudents);
        setStudents(studentsData);
        localStorage.setItem("students", JSON.stringify(studentsData));

        // Only fetch profile URLs if there are emails in the list
        if (emailList.length > 0) {
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
      }
    );

    return () => unsubscribe();
  }, [pin]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("name");
      const storedEmail = localStorage.getItem("email");
      const storedClassSection = localStorage.getItem("classSection");
      const storedComputerLab = localStorage.getItem("computerLab");
      const storedCourse = localStorage.getItem("course");

      const storedStudents = JSON.parse(
        localStorage.getItem("students") || "[]"
      );

      setFormData({
        name: storedName || "",
        email: storedEmail || "",
        course: storedCourse || "",

        classSection: storedClassSection || "",
        computerLab: storedComputerLab || "",
      });
      setStudents(storedStudents);
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
          const uniqueStudents = {};
          const emailList = [];

          snapshot.forEach((doc) => {
            const data = doc.data();
            uniqueStudents[data.ccaEmail] = data;
            emailList.push(data.ccaEmail);
          });

          const studentsData = Object.values(uniqueStudents);

          setStudents(studentsData);
          setParticipantCount(studentsData.length); // Add this line
          localStorage.setItem("students", JSON.stringify(studentsData));

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
    const lobbiesRef = collection(db, "lobbies");
    const labQuery = query(
      lobbiesRef,
      where("computerLab", "==", formData.computerLab)
    );
    const labSnapshot = await getDocs(labQuery);

    if (!labSnapshot.empty) {
      toast.error(
        `${formData.computerLab} is currently in use. Please select a different laboratory.`
      );
      return false;
    }

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

      // Add this in the saveFormDataToFirestore function after creating the lobby
      await addDoc(collection(db, "teacherLogs"), {
        teacherName: formData.name,
        teacherEmail: formData.email,
        course: formData.course,
        classSection: formData.classSection,
        computerLab: formData.computerLab,
        action: "Created Classroom",
        date: formattedDate,
        time: formattedTime,
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
      return true;
    } catch (error) {
      console.error("Error adding document: ", error);
      return false;
    }
  };

  const endSession = async (pin, isSaving = false) => {
    try {
      const promptMessage = isSaving
        ? "Are you sure you want to save this session and proceed to attendance form?"
        : "Are you sure you want to end this session your data wont be saved?";

      const confirmed = window.confirm(promptMessage);
      if (!confirmed) return;

      const user = auth.currentUser;
      if (!user) {
        console.error("No user is currently logged in");
        return;
      }
      const teacherId = user.uid;

      // Get current time for timeout
      const currentTime = new Date();
      const hours = currentTime.getHours();
      const minutes = currentTime.getMinutes();
      const formattedTime = formatTime(hours, minutes);
      const currentDate = new Date().toISOString().split("T")[0];

      // Get all student entries for this lobby
      const studentEntriesQuery = query(
        collection(db, "studententries"),
        where("lobbypassword", "==", pin)
      );
      const studentEntriesSnap = await getDocs(studentEntriesQuery);

      const batch = writeBatch(db);
      studentEntriesSnap.forEach((studentDoc) => {
        const studentData = studentDoc.data();
        const lobbyDataRef = doc(db, `lobbydata`, studentDoc.id);
        batch.set(lobbyDataRef, {
          ...studentData,
          classSection: formData.classSection,
          date: currentDate,
          teacherId: teacherId,
          timeOut: formattedTime, // Add timeout for all students
        });
      });

      // Rest of your existing endSession code...
      await batch.commit();
      const lobbyQuery = query(
        collection(db, "lobbies"),
        where("pin", "==", pin)
      );
      const lobbyQuerySnapshot = await getDocs(lobbyQuery);
      const lobbyDoc = lobbyQuerySnapshot.docs[0];
      await deleteDoc(lobbyDoc.ref);

      if (isSaving) {
        router.push("/teacher/attendance_form");
      } else {
        setActiveStep(0);
        localStorage.clear();
        setStudents([]);
        setFormData({
          name: "",
          email: "",
          classSection: "",
          computerLab: "",
          course: "",
        });
        setFormSubmitted(false);
        setPin(null);
        setComputerLab("");
      }

      // Reset states
      setStudents([]);
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

  const validateForm = () => {
    if (!formData.course) {
      toast.error("Please select a course");
      return false;
    }
    if (!formData.classSection) {
      toast.error("Please enter a class section");
      return false;
    }
    if (!formData.computerLab) {
      toast.error("Please select a computer laboratory");
      return false;
    }
    return true;
  };

  function generateMockStudents(count) {
    const mockStudents = [];
    for (let i = 1; i <= count; i++) {
      mockStudents.push({
        ccaEmail: `student${i}@cca.edu.ph`,
        studentName: `Student ${i}`,
        lobbypassword: pin,
      });
    }
    return mockStudents;
  }

  function simulateStudentJoining() {
    const mockStudents = generateMockStudents(40);
    const currentStudents = [...students];

    mockStudents.forEach((student, index) => {
      setTimeout(() => {
        currentStudents.push(student);
        setStudents([...currentStudents]);
        localStorage.setItem("students", JSON.stringify(currentStudents));
      }, index * 500); // Adds a student every 500ms
    });
  }

  return isAuthorized ? (
    <>
      <div className="flex flex-col bg-blue-gray-50 min-h-screen">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <div className="flex-1 p-4 sm:ml-64">
            <div className="container mx-auto px-4 py-8">
              <Card className="w-full max-w-5xl mx-auto max-h-4xl shadow-lg p-8">
                <div className="p-6">
                  <Stepper
                    activeStep={activeStep}
                    isLastStep={(value) => setIsLastStep(value)}
                    isFirstStep={(value) => setIsFirstStep(value)}
                    className="mb-8"
                  >
                    <Step>
                      <FaChalkboardTeacher className="h-5 w-5" />
                    </Step>
                    <Step>
                      <FaUsers className="h-5 w-5" />
                    </Step>
                  </Stepper>

                  {activeStep === 0 && (
                    <div className="space-y-4">
                      <Typography variant="h5" className="text-center">
                        Create a Classroom
                      </Typography>
                      <Card className="w-full max-w-2xl p-6 mx-auto">
                        <div className="space-y-4">
                          <Select
                            label="Select Course"
                            value={formData.course}
                            onChange={(value) => {
                              setFormData((prevData) => ({
                                ...prevData,
                                course: value,
                              }));
                              localStorage.setItem("course", value);
                            }}
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
                            label="Enter Class Section"
                            name="classSection"
                            value={formData.classSection}
                            onChange={(e) => {
                              handleInputChange(e);
                              localStorage.setItem(
                                "classSection",
                                e.target.value
                              );
                            }}
                          />
                          <Select
                            label="Select Computer Laboratory"
                            value={formData.computerLab}
                            onChange={(value) => {
                              setFormData((prevData) => ({
                                ...prevData,
                                computerLab: value,
                              }));
                              localStorage.setItem("computerLab", value);
                            }}
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
                            onClick={async () => {
                              if (!validateForm()) return;
                              const confirmed = window.confirm(
                                "Are you sure you want to create this lobby?"
                              );
                              if (confirmed) {
                                const success = await saveFormDataToFirestore();
                                if (success) {
                                  setActiveStep(1);
                                }
                              }
                            }}
                            color="black"
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
                        <div className="flex gap-4 mt-2">
                          <Button
                            onClick={() => endSession(pin, true)}
                            color="black"
                            fullWidth
                          >
                            Save Session
                          </Button>
                          <Button
                            onClick={() => endSession(pin, false)}
                            color="black"
                            fullWidth
                          >
                            End Session
                          </Button>
                        </div>
                      </Card>
                    </div>
                  )}
                </div>

                {activeStep === 1 && (
                  <>
                    <Typography variant="h6" className="mb-2">
                      Student Participants ({participantCount})
                    </Typography>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-64 overflow-y-auto">
                      {students.map((student, index) => (
                        <div
                          key={index}
                          className="flex flex-col items-center p-2 bg-white rounded-lg shadow"
                        >
                          <Image
                            src={profileUrls[student.ccaEmail] || "/Avatar.jpg"}
                            width={60}
                            height={60}
                            alt="Student Avatar"
                            className="rounded-full mb-2"
                          />
                          <Typography className="text-center text-sm">
                            {student.studentName}
                          </Typography>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            </div>
          </div>
        </div>
        <ToastContainer />
      </div>
    </>
  ) : null;
}
