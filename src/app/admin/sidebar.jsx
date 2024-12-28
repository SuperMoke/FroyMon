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
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { AiOutlineAudit } from "react-icons/ai";
import { usePathname } from "next/navigation";

export default function Sidebar({ isOpen, toggleSidebar, reportCount = 0 }) {
  const pathname = usePathname();

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
                  className={`flex items-center gap-2 p-2 rounded-md ${
                    pathname === "/admin"
                      ? "bg-black text-white"
                      : "hover:bg-blue-gray-50"
                  }`}
                  onClick={toggleSidebar}
                >
                  <HomeIcon className="h-5 w-5" />
                  <Typography>Home</Typography>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/computerticket"
                  className={`flex items-center gap-2 p-2 rounded-md ${
                    pathname === "/admin/computerticket"
                      ? "bg-black text-white"
                      : "hover:bg-blue-gray-50"
                  }`}
                  onClick={toggleSidebar}
                >
                  <DocumentTextIcon className="h-5 w-5" />
                  <Typography>Computer Problem</Typography>
                  {reportCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {reportCount}
                    </span>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/computer_report"
                  className={`flex items-center gap-2 p-2 rounded-md ${
                    pathname === "/admin/computer_report"
                      ? "bg-black text-white"
                      : "hover:bg-blue-gray-50"
                  }`}
                  onClick={toggleSidebar}
                >
                  <AiOutlineAudit className="h-5 w-5" />
                  <Typography>Computer Report</Typography>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/accountmanagement"
                  className={`flex items-center gap-2 p-2 rounded-md ${
                    pathname === "/admin/accountmanagement"
                      ? "bg-black text-white"
                      : "hover:bg-blue-gray-50"
                  }`}
                  onClick={toggleSidebar}
                >
                  <UserIcon className="h-5 w-5" />
                  <Typography>Account Management</Typography>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/generateqr"
                  className={`flex items-center gap-2 p-2 rounded-md ${
                    pathname === "/admin/generateqr"
                      ? "bg-black text-white"
                      : "hover:bg-blue-gray-50"
                  }`}
                  onClick={toggleSidebar}
                >
                  <QrCodeIcon className="h-5 w-5" />
                  <Typography>Generate QR Code</Typography>
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/audit_trails"
                  className={`flex items-center gap-2 p-2 rounded-md ${
                    pathname === "/admin/audit_trails"
                      ? "bg-black text-white"
                      : "hover:bg-blue-gray-50"
                  }`}
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
