import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: {
      type: String,
      enum: ["created", "status_changed", "assigned", "unassigned", "commented", "priority_changed"],
      required: true,
    },
    details: { type: String, default: "" },
  },
  { timestamps: true }
);

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;