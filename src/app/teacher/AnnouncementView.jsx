import React from "react";
import { Typography } from "@material-tailwind/react";
import { BellIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import Image from "next/image";

const AnnouncementView = ({ announcements }) => {
  return (
    <div className="space-y-4">
      {announcements.map((announcement) => (
        <div key={announcement.id} className="p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              {announcement.photoURL ? (
                <Image
                  src={announcement.photoURL}
                  alt={announcement.postedBy}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-black font-bold">
                  {announcement.postedBy[0].toUpperCase()}
                </div>
              )}
              <div>
                <Typography variant="h6" color="black">
                  {announcement.postedBy}
                </Typography>
                <Typography variant="small" color="black">
                  {format(announcement.timestamp.toDate(), "PPpp")}
                </Typography>
              </div>
            </div>
            {announcement.type && (
              <span
                className={`px-3 py-1 rounded-full text-xs capitalize ${
                  {
                    general: "bg-gray-100 text-gray-800",
                    maintenance: "bg-yellow-100 text-yellow-800",
                    event: "bg-green-100 text-green-800",
                    alert: "bg-red-100 text-red-800",
                  }[announcement.type]
                }`}
              >
                {announcement.type}
              </span>
            )}
          </div>
          <ReactMarkdown className="prose mt-2 text-gray-800">
            {announcement.content}
          </ReactMarkdown>
        </div>
      ))}
    </div>
  );
};

export default AnnouncementView;
