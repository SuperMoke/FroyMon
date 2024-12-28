import { NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    }),
  });
}

const formatTime = (hours, minutes) => {
  const ampm = hours >= 12 ? "PM" : "AM";
  let formattedHours = hours % 12;
  formattedHours = formattedHours ? formattedHours : 12;
  const formattedMinutes = minutes.toString().padStart(2, "0");
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
};

const ERROR_MESSAGES = {
  "auth/email-already-exists": "An account with this email already exists",
  "auth/invalid-email": "The email address is not valid",
  "auth/invalid-password": "Password must be at least 6 characters long",
  "auth/weak-password": "Password is too weak. Please use a stronger password",
  INVALID_INPUT: "Please fill in all required fields",
};

export async function POST(request) {
  try {
    const { email, password, role, name } = await request.json();

    // Input validation
    if (!email || !password || !role || !name) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "Missing required fields",
            details: {
              missing: Object.entries({ email, password, role, name })
                .filter(([_, value]) => !value)
                .map(([key]) => key),
            },
          },
        },
        { status: 400 }
      );
    }

    const auth = getAuth();
    const currentTime = new Date();
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const formattedDate = currentTime.toISOString().split("T")[0];
    const formattedTime = formatTime(hours, minutes);

    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    const db = getFirestore();
    await db.collection("user").doc(userRecord.uid).set({
      name,
      email,
      role,
      id: userRecord.uid,
      date: formattedDate,
      time: formattedTime,
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        uid: userRecord.uid,
        user: {
          name,
          email,
          role,
          createdAt: {
            date: formattedDate,
            time: formattedTime,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Enhanced error response
    const errorResponse = {
      error: {
        code: error.code || "UNKNOWN_ERROR",
        message: ERROR_MESSAGES[error.code] || error.message,
        details: {
          errorCode: error.errorCode,
          errorInfo: error.errorInfo,
          technicalDetails: error.message,
          serverTimestamp: new Date().toISOString(),
          affectedFields: error.errorInfo?.affectedFields || [],
        },
      },
    };

    // Determine appropriate status code
    const statusCode =
      error.code === "auth/email-already-exists"
        ? 409
        : error.code === "auth/invalid-email"
        ? 400
        : error.code === "auth/invalid-password"
        ? 400
        : 500;

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}
