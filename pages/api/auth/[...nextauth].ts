import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app/firebase";

export const authOptions = {
  // Configure one or more authentication providers
  pages: {
    signIn: "/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {},
      async authorize(credentials): Promise<any> {
        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email || "",
            credentials.password || ""
          );
          if (userCredential.user) {
            return userCredential.user;
          }
          return null;
        } catch (error) {
          console.error("Error during sign in:", error);
          throw new Error("Failed to sign in");
        }
      },
    }),
  ],
};

export default NextAuth(authOptions);
