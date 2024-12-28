import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Typography,
  Input,
  Button,
  Select,
  Option,
  Chip,
} from "@material-tailwind/react";
import {
  PaperAirplaneIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";

const AnnouncementComponent = ({
  userProfile,
  announcements,
  onAddAnnouncement,
  onEditAnnouncement,
  onDeleteAnnouncement,
}) => {
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [selectedType, setSelectedType] = useState("general");
  const [isPosting, setIsPosting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;
    setIsPosting(true);

    try {
      await onAddAnnouncement({
        content: newAnnouncement,
        important: document.getElementById("importantCheck").checked,
        type: selectedType,
      });
      setNewAnnouncement("");
    } finally {
      setIsPosting(false);
    }
  };

  const filteredAnnouncements = announcements

    .sort((a, b) => {
      if (a.important && !b.important) return -1;
      if (!a.important && b.important) return 1;

      return b.timestamp.toDate() - a.timestamp.toDate();
    })

    .filter((announcement) => {
      if (filter === "important") return announcement.important;
      if (filter === "regular") return !announcement.important;
      return true;
    })
    .filter(
      (announcement) =>
        announcement.content
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        announcement.postedBy.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <Card className="w-full">
      <CardBody className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <BellIcon className="h-6 w-6 text-gray-700" />
            <Typography variant="h5" color="gray-800">
              Laboratory Announcements
            </Typography>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex flex-col space-y-4">
            <div className="w-full">
              <textarea
                placeholder="New Announcement"
                value={newAnnouncement}
                onChange={(e) => setNewAnnouncement(e.target.value)}
                className="w-full h-32 p-2 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="flex items-center justify-between space-x-4">
              <div className="flex flex-wrap gap-2">
                <Chip
                  value="general"
                  variant={selectedType === "general" ? "filled" : "outlined"}
                  color="blue-gray"
                  onClick={() => setSelectedType("general")}
                  className="cursor-pointer"
                >
                  General
                </Chip>
                <Chip
                  value="maintenance"
                  variant={
                    selectedType === "maintenance" ? "filled" : "outlined"
                  }
                  color="yellow"
                  onClick={() => setSelectedType("maintenance")}
                  className="cursor-pointer"
                >
                  Maintenance
                </Chip>
                <Chip
                  value="event"
                  variant={selectedType === "event" ? "filled" : "outlined"}
                  color="green"
                  onClick={() => setSelectedType("event")}
                  className="cursor-pointer"
                >
                  Event
                </Chip>
                <Chip
                  value="alert"
                  variant={selectedType === "alert" ? "filled" : "outlined"}
                  color="red"
                  onClick={() => setSelectedType("alert")}
                  className="cursor-pointer"
                >
                  Alert
                </Chip>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="importantCheck"
                  className="w-4 h-4"
                />
                <label
                  htmlFor="importantCheck"
                  className="text-sm text-gray-700"
                >
                  Mark as Important
                </label>
              </div>

              <Button
                type="submit"
                className="flex items-center space-x-2"
                color="black"
                disabled={isPosting}
              >
                {isPosting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-5 w-5" />
                    <span>Post Announcement</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        <div className="flex space-x-4 mb-2">
          <Select
            value={filter}
            onChange={(value) => setFilter(value)}
            className="min-w-[150px]"
          >
            <Option value="all">All Announcements</Option>
            <Option value="important">Important Only</Option>
            <Option value="regular">Regular Updates</Option>
          </Select>
          <Input
            type="search"
            label="Search Announcement"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-w-[200px]"
          />
        </div>

        <div className="space-y-4 max-h-full overflow-y-auto">
          {filteredAnnouncements.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
              <BellIcon className="h-12 w-12 mb-2" />
              <Typography variant="h6">No announcements found</Typography>
              <Typography variant="small">
                {filter === "important"
                  ? "There are no important announcements at this time"
                  : filter === "regular"
                  ? "There are no regular updates at this time"
                  : "There are no announcements matching your search"}
              </Typography>
            </div>
          ) : (
            filteredAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className={`p-4 rounded-lg border ${
                  announcement.important ? "border-red-300" : "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {userProfile?.photoURL ? (
                      <Image
                        src={userProfile.photoURL}
                        alt={announcement.postedBy}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold">
                        {announcement.postedBy[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <Typography variant="h6" color="gray-800">
                        {announcement.postedBy}
                      </Typography>
                      <Typography variant="small" color="gray">
                        {format(announcement.timestamp.toDate(), "PPpp")}
                      </Typography>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
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
                    {editingId === announcement.id ? (
                      <>
                        <Button
                          size="sm"
                          variant="text"
                          color="green"
                          onClick={() => {
                            onEditAnnouncement(announcement.id, editContent);
                            setEditingId(null);
                          }}
                        >
                          <CheckIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="text"
                          color="red"
                          onClick={() => setEditingId(null)}
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="text"
                          onClick={() => {
                            setEditingId(announcement.id);
                            setEditContent(announcement.content);
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="text"
                          color="red"
                          onClick={() => onDeleteAnnouncement(announcement.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {editingId === announcement.id ? (
                  <Input
                    type="text"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="mt-2"
                  />
                ) : (
                  <ReactMarkdown className="prose mt-2 text-gray-800">
                    {announcement.content}
                  </ReactMarkdown>
                )}

                {announcement.edited && (
                  <Typography
                    variant="small"
                    color="gray"
                    className="mt-2 italic"
                  >
                    Edited: {format(announcement.editedAt.toDate(), "PPpp")}
                  </Typography>
                )}
              </div>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default AnnouncementComponent;
