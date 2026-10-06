import Ticket from "../models/Ticket.js";
import Comment from "../models/Comment.js";
import Activity from "../models/Activity.js";
import logActivity from "../utils/logActivity.js";

const isStaff = (user) => user.role === "admin" || user.role === "it_support";

const getAccessibleTicket = async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    res.status(404).json({ message: "Ticket not found" });
    return null;
  }

  const isOwner = ticket.createdBy.toString() === req.user._id.toString();
  if (!isOwner && !isStaff(req.user)) {
    res.status(403).json({ message: "You do not have access to this ticket" });
    return null;
  }

  return ticket;
};

export const getComments = async (req, res) => {
  try {
    const ticket = await getAccessibleTicket(req, res);
    if (!ticket) return;

    const comments = await Comment.find({ ticket: ticket._id })
      .sort({ createdAt: 1 })
      .populate("author", "name role");

    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addComment = async (req, res) => {
  try {
    const ticket = await getAccessibleTicket(req, res);
    if (!ticket) return;

    const message = (req.body.message || "").trim();
    const files = req.files || [];

    if (!message && files.length === 0) {
      return res.status(400).json({ message: "A message or an attachment is required" });
    }

    const attachments = files.map((f) => ({
      filename: f.filename,
      originalName: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
    }));

    const comment = await Comment.create({
      ticket: ticket._id,
      author: req.user._id,
      message,
      attachments,
    });

    await logActivity(ticket._id, req.user._id, "commented");

    const populated = await comment.populate("author", "name role");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getActivity = async (req, res) => {
  try {
    const ticket = await getAccessibleTicket(req, res);
    if (!ticket) return;

    const activity = await Activity.find({ ticket: ticket._id })
      .sort({ createdAt: 1 })
      .populate("actor", "name role");

    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};