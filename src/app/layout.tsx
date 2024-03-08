import { Inter } from "next/font/google";
import './globals.css'
import SessionProvider from './SessionProvider';
import React, {createContext, useContext, useState} from 'react';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FroyMon",
  description: "Computer Laboratory System",
};


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" >
      <body className={inter.className}>
      <SessionProvider>
        {children}
      </SessionProvider>
      </body>
    </html>
  )
}
