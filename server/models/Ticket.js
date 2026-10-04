import mongoose from "mongoose";
import Counter from "./Counter.js";

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: Number, unique: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["computer", "network", "account", "email", "software", "other"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

ticketSchema.pre("save", async function () {
  if (!this.isNew) return;

  // Atomically increment the counter so two tickets never get the same number
  const counter = await Counter.findOneAndUpdate(
    { name: "ticket" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  this.ticketNumber = counter.seq;
});

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;