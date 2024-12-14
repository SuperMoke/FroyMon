import React, { useState } from "react";
import {
  Collapse,
  Textarea,
  Button,
  Typography,
} from "@material-tailwind/react";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";
import {
  addDoc,
  collection,
  serverTimestamp,
  arrayUnion,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase";

const RemarksSection = ({ ticket, user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newRemark, setNewRemark] = useState("");

  const handleRemarkChange = (e) => {
    setNewRemark(e.target.value);
  };

  const handleAddRemark = async () => {
    if (!newRemark.trim()) return;

    const remarkData = {
      text: newRemark,
      timestamp: new Date().toISOString(), // Use regular timestamp instead
      user: user.email,
    };

    const ticketRef = doc(db, "ticketentries", ticket.id);
    await updateDoc(ticketRef, {
      remarks: arrayUnion(remarkData),
    });

    // Save to history
    await addDoc(collection(db, "ticketHistory"), {
      ticketId: ticket.id,
      action: "Add Remark",
      newValue: newRemark,
      userId: user.email,
      timestamp: serverTimestamp(), // Keep serverTimestamp for history
    });

    setNewRemark("");
    setIsEditing(false);
  };

  return (
    <div className="w-full">
      {!isEditing ? (
        <Button size="sm" color="black" onClick={() => setIsEditing(true)}>
          <FaEdit className="mr-2" /> Add New Remark
        </Button>
      ) : (
        <Collapse open={isEditing}>
          <Textarea
            value={newRemark}
            onChange={handleRemarkChange}
            className="mb-2"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" color="red" onClick={() => setIsEditing(false)}>
              <FaTimes className="mr-2" /> Cancel
            </Button>
            <Button size="sm" color="green" onClick={handleAddRemark}>
              <FaSave className="mr-2" /> Add
            </Button>
          </div>
        </Collapse>
      )}
    </div>
  );
};

export default RemarksSection;
