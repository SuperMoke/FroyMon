import React from "react";
import Link from "next/link";
import { Typography, IconButton } from "@material-tailwind/react";
import {
  HomeIcon,
  AcademicCapIcon,
  QrCodeIcon,
  XMarkIcon,
  UserIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { AiOutlineAudit } from "react-icons/ai";

export default function Sidebar({ isOpen, toggleSidebar }) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
      <div className="relative">
        <aside
          className={`bg-white shadow-md w-64 h-screen fixed left-0 top-0 p-4 transition-transform duration-300 ease-in-out z-50 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          } sm:translate-x-0`}
        >
          <div className="flex justify-center items-center mb-6">
            <div className="w-1/2 p-4">
              <Image
                src="/froymon_logo.png"
                width={200}
                height={200}
                alt="Logo"
              />
            </div>
          </div>
          <nav>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/admin"
                  className="flex items-center gap-2 p-2 hover:bg-blue-gray-50 rounded-md"
                  onClick={toggleSidebar}
                >
                  <HomeIcon className="h-5 w-5" />
                  <Typography>Home</Typography>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/computerticket"
                  className="flex items-center gap-2 p-2 hover:bg-blue-gray-50 rounded-md"
                  onClick={toggleSidebar}
                >
                  <ComputerDesktopIcon className="h-5 w-5" />
                  <Typography>Computer Ticket</Typography>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/accountmanagement"
                  className="flex items-center gap-2 p-2 hover:bg-blue-gray-50 rounded-md"
                  onClick={toggleSidebar}
                >
                  <UserIcon className="h-5 w-5" />
                  <Typography>Account Management</Typography>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/generateqr"
                  className="flex items-center gap-2 p-2 hover:bg-blue-gray-50 rounded-md"
                  onClick={toggleSidebar}
                >
                  <QrCodeIcon className="h-5 w-5" />
                  <Typography>Generate QR Code</Typography>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/audit_trails"
                  className="flex items-center gap-2 p-2 hover:bg-blue-gray-50 rounded-md"
                  onClick={toggleSidebar}
                >
                  <AiOutlineAudit className="h-5 w-5" />
                  <Typography>System Log</Typography>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>
        {isOpen && (
          <IconButton
            variant="text"
            color="blue-gray"
            className="sm:hidden absolute top-4 right-4 z-50"
            onClick={toggleSidebar}
          >
            <XMarkIcon className="h-6 w-6" />
          </IconButton>
        )}
      </div>
    </>
  );
}
