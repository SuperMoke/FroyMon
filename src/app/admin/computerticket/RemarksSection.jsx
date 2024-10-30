import React, { useState, useEffect } from "react";
import {
  Collapse,
  Textarea,
  Button,
  Typography,
} from "@material-tailwind/react";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";

const RemarksSection = ({ ticket, updateTicketRemarks, user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [remark, setRemark] = useState(ticket.remarks || "");
  const [prevRemark, setPrevRemark] = useState(ticket.remarks || "");

  useEffect(() => {
    setRemark(ticket.remarks || "");
    setPrevRemark(ticket.remarks || "");
  }, [ticket.remarks]);

  const handleRemarkChange = (e) => {
    setRemark(e.target.value);
  };

  const saveTicketHistory = async (
    ticketId,
    action,
    oldValue,
    newValue,
    userId
  ) => {
    await addDoc(collection(db, "ticketHistory"), {
      ticketId,
      action,
      oldValue,
      newValue,
      userId,
      timestamp: serverTimestamp(),
    });
  };

  const handleSaveRemark = async () => {
    // Save the history first
    await saveTicketHistory(
      ticket.id,
      "Remarks Update",
      prevRemark,
      remark,
      user.email
    );

    // Then update the remarks
    await updateTicketRemarks(ticket.id, remark);
    setIsEditing(false);
    setPrevRemark(remark);
  };

  const handleCancelEdit = () => {
    setRemark(prevRemark);
    setIsEditing(false);
  };

  return (
    <div className="w-full">
      {!isEditing ? (
        <div className="flex items-center justify-between">
          <Button size="sm" color="blue" onClick={() => setIsEditing(true)}>
            <FaEdit className="mr-2" /> Add Remarks
          </Button>
        </div>
      ) : (
        <Collapse open={isEditing}>
          <Textarea
            value={remark}
            onChange={handleRemarkChange}
            className="mb-2"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" color="red" onClick={handleCancelEdit}>
              <FaTimes className="mr-2" /> Cancel
            </Button>
            <Button size="sm" color="green" onClick={handleSaveRemark}>
              <FaSave className="mr-2" /> Save
            </Button>
          </div>
        </Collapse>
      )}
    </div>
  );
};

export default RemarksSection;
