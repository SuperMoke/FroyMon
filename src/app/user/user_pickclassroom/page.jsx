"use client";
import React from "react";
import Sidebar from "../sidebar";
import Header from "../header";
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
  query,
  getDocs,
  where,
  addDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../../utils/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import { SiGoogleclassroom } from "react-icons/si";
import { RiLockPasswordLine } from "react-icons/ri";
import { FaCheckCircle } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function PickClassroom() {
  const [classrooms, setClassrooms] = useState([]);
  const [selectedLab, setSelectedLab] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [pinCode, setPinCode] = useState("");
  const [pinCodeError, setPinCodeError] = useState("");
  const [activeStep, setActiveStep] = React.useState(0);
  const [isLastStep, setIsLastStep] = React.useState(false);
  const [isFirstStep, setIsFirstStep] = React.useState(false);
  const [userData, setUserData] = useState({ name: "", email: "" });

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
      const authorized = await isAuthenticated("Student");
      setIsAuthorized(authorized);
    };
    checkAuth();
  }, [user, loading, router]);

  useEffect(() => {
    let unsubscribe = listenForClassroomUpdates();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const listenForClassroomUpdates = () => {
    const unsubscribe = onSnapshot(
      collection(db, "lobbies"),
      (querySnapshot) => {
        const classroomData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          classroomData.push(data);
        });
        setClassrooms(classroomData);
      }
    );

    return unsubscribe;
  };

  // Modify the useEffect that listens for lobby deletion
  useEffect(() => {
    if (selectedLab) {
      const unsubscribe = onSnapshot(
        query(
          collection(db, "lobbies"),
          where("computerLab", "==", selectedLab)
        ),
        async (snapshot) => {
          if (snapshot.empty) {
            // Lobby no longer exists
            const currentTime = new Date();
            const hours = currentTime.getHours();
            const minutes = currentTime.getMinutes();
            const formattedTime = formatTime(hours, minutes);

            // Update timeOut for the student
            const endsessionquery = query(
              collection(db, "studententries"),
              where("ccaEmail", "==", user.email)
            );
            const querySnapshot = await getDocs(endsessionquery);
            if (!querySnapshot.empty) {
              const docRef = querySnapshot.docs[0].ref;
              await updateDoc(docRef, {
                timeOut: formattedTime,
              });
            }

            // Reset states and show alert
            setSelectedLab(null);
            setSelectedTeacher(null);
            setActiveStep(0);
            toast.info(
              "The classroom session has ended. Please select another classroom."
            );
          }
        }
      );

      return () => unsubscribe();
    }
  }, [selectedLab]);

  const handleCardClick = (computerLab, teacherName) => {
    setSelectedLab(computerLab);
    setSelectedTeacher(teacherName);
    setActiveStep(1);
    console.log("Selected lab:", computerLab);
  };

  const handleSubmitPinCode = async () => {
    try {
      const pinCodeQuery = query(
        collection(db, "lobbies"),
        where("computerLab", "==", selectedLab)
      );
      const querySnapshot = await getDocs(pinCodeQuery);

      if (!querySnapshot.empty) {
        const lobbyData = querySnapshot.docs[0].data();
        const correctPinCode = lobbyData.pin;
        console.log("Correct pin code:", correctPinCode);
        console.log("Pin code entered:", pinCode);
        if (pinCode == correctPinCode) {
          if (!user || !user.email) {
            console.error("User object or user email is undefined");
            toast.error("User data not found. Please try again later.");

            return;
          }

          const userQuery = query(
            collection(db, "user"),
            where("email", "==", user.email)
          );
          console.log("User Email:", user.email);
          const userSnapshot = await getDocs(userQuery);
          console.log("User snapshot:", userSnapshot);

          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            const currentTime = new Date();
            const hours = currentTime.getHours();
            const minutes = currentTime.getMinutes();
            const formattedDate = currentTime.toISOString().split("T")[0];
            const formattedTime = formatTime(hours, minutes);

            await addDoc(collection(db, "studententries"), {
              studentName: userData.name,
              lobbypassword: correctPinCode,
              ccaEmail: userData.email,
              computerLab: selectedLab,
              teacherName: selectedTeacher,
              timeIn: formattedTime,
              date: formattedDate,
            });
            setActiveStep(2);
          } else {
            console.error("User data not found in the 'user' collection");
            toast.error("User data not found. Please try again later.");
          }
        } else {
          toast.error("Incorrect pin code. Please try again.");
        }
      } else {
        toast.error("Pin code data not found for this computer lab.");
      }
    } catch (error) {
      console.error("Error retrieving pin code: ", error);
      toast.error("Error retrieving pin code. Please try again later.");
    }
  };

  const handleFormDataChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const formatTime = (hours, minutes) => {
    const seconds = new Date().getSeconds();
    const ampm = hours >= 12 ? "PM" : "AM";
    let formattedHours = hours % 12;
    formattedHours = formattedHours ? formattedHours : 12;
    const formattedMinutes = minutes.toString().padStart(2, "0");
    const formattedSeconds = seconds.toString().padStart(2, "0");
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds} ${ampm}`;
  };

  const handleEndSession = async () => {
    try {
      const currentTime = new Date();
      const hours = currentTime.getHours();
      const minutes = currentTime.getMinutes();
      const formattedTime = formatTime(hours, minutes);

      const endsessionquery = query(
        collection(db, "studententries"),
        where("ccaEmail", "==", user.email)
      );
      const querySnapshot = await getDocs(endsessionquery);
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          timeOut: formattedTime,
        });
      }
      router.push("/user");
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  return isAuthorized ? (
    <>
      <div className="bg-blue-gray-50 min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="w-full max-w-4xl mx-auto shadow-lg ">
            <div className="p-6">
              <Stepper
                activeStep={activeStep}
                isLastStep={(value) => setIsLastStep(value)}
                isFirstStep={(value) => setIsFirstStep(value)}
                className="mb-8"
              >
                <Step>
                  <SiGoogleclassroom className="h-5 w-5" />
                </Step>
                <Step>
                  <RiLockPasswordLine className="h-5 w-5" />
                </Step>
                <Step>
                  <FaCheckCircle className="h-5 w-5" />
                </Step>
              </Stepper>

              {pinCodeError && (
                <Alert color="red" className="mb-4">
                  {pinCodeError}
                </Alert>
              )}

              {activeStep === 0 && (
                <div className="space-y-4">
                  <Typography variant="h5" className="text-center">
                    Pick A Classroom
                  </Typography>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {classrooms.length > 0 ? (
                      classrooms.map((classroom, index) => (
                        <Card
                          key={index}
                          className="p-4 cursor-pointer hover:shadow-lg transition duration-300"
                          onClick={() =>
                            handleCardClick(
                              classroom.computerLab,
                              classroom.name
                            )
                          }
                        >
                          <h3 className="font-semibold mb-2">
                            Teacher: {classroom.name}
                          </h3>
                          <p className="font-semibold mb-2">
                            Computer Lab: {classroom.computerLab}
                          </p>
                          <p className="font-semibold mb-2">
                            Class Section: {classroom.classSection}
                          </p>
                        </Card>
                      ))
                    ) : (
                      <div className="flex justify-center items-center col-span-full">
                        <p className="text-gray-600">
                          There are no lobbies available.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeStep === 1 && (
                <div className="space-y-4">
                  <Typography variant="h5" className="text-center">
                    Lobby Code
                  </Typography>
                  <Card className="w-full p-5">
                    <h2 className="text-black text-sm font-normal mb-2">
                      Lobby Code:
                    </h2>
                    <Input
                      className="mb-3"
                      label="Enter the Pin Code"
                      type="text"
                      onChange={(e) => setPinCode(e.target.value)}
                    ></Input>
                    <Button
                      className="mt-3"
                      onClick={handleSubmitPinCode}
                      color="blue"
                    >
                      Submit
                    </Button>
                    <Button
                      className="mt-3"
                      onClick={handleSubmitPinCode}
                      color="blue"
                    >
                      Back
                    </Button>
                  </Card>
                </div>
              )}

              {activeStep === 2 && (
                <div className="w-full">
                  <Typography className="text-center mt-5" variant="h6">
                    Wait for the class session to end
                  </Typography>
                  <Card className="w-full p-5 flex flex-col items-center">
                    <Image
                      src="/thankyou.jpeg"
                      width={200}
                      height={200}
                      alt="Thank You Picture"
                      className="mx-auto"
                    />
                    <h1 className="text-black text-sm font-normal text-center mt-2 mb-2">
                      Thank you for submitting the form!
                    </h1>
                    <h2 className="text-black text-sm font-normal text-center mt-2 mb-2">
                      I recommend that you stay on this page until your class
                      session has ended so that your time out will be recorded.
                    </h2>
                    <Button
                      className="mt-3"
                      onClick={handleEndSession}
                      color="blue"
                    >
                      End of Session
                    </Button>
                  </Card>
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
