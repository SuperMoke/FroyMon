import React from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  Typography,
} from "@material-tailwind/react";

const HistoryModal = ({ open, handleOpen, history }) => {
  return (
    <Dialog open={open} handler={handleOpen} size="md">
      <DialogHeader>Ticket History</DialogHeader>
      <DialogBody divider className="max-h-[400px] overflow-y-auto">
        {history.map((entry, index) => (
          <div key={index} className="mb-4 p-2 border-b">
            <Typography variant="small" color="blue-gray">
              {new Date(entry.timestamp?.toDate()).toLocaleString()}
            </Typography>
            <Typography>Action: {entry.action}</Typography>
            <Typography>Previous Value: {entry.oldValue || "None"}</Typography>
            <Typography>New Value: {entry.newValue}</Typography>
            <Typography>Changed By: {entry.userId}</Typography>
          </div>
        ))}
      </DialogBody>
    </Dialog>
  );
};

export default HistoryModal;
