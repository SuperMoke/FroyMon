// pages/api/auth/[...nextauth].js

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { auth } from "../../../src/app/firebase";
import { redirect } from "next/dist/server/api-utils";

export const authOptions = {
  pages: {
    signIn: "/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {},
      async authorize(credentials) {
        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email || "",
            credentials.password || ""
          );
          if (userCredential.user) {
            const db = getFirestore();
            const userQuery = query(collection(db, "user"), where("email", "==", credentials.email));
            const querySnapshot = await getDocs(userQuery);
            if (!querySnapshot.empty) {
              const userData = querySnapshot.docs[0].data();
              return { ...userData, email: credentials.email };
            }
          }
        } catch (error) {
          console.error("Error signing in:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session(session, user) {
      session.user.roles = user.roles;
      return session;
    },
    async redirect(url, baseUrl) {
      if(url.startWith(baseUrl)){
        const {roles} = uri;
        if(roles.includes('teacher')){
          return '/teacher'
        }
        if(roles.includes('student')){
          return '/user'
        }
        if(roles.includes('admin')){
          return '/admin'
        }
      }
      return baseUrl;
    }
  },
};

export default NextAuth(authOptions);
