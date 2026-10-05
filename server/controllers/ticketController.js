import sendEmail from "../utils/sendEmail.js";
import logActivity from "../utils/logActivity.js";
import Ticket from "../models/Ticket.js";
import User from "../models/User.js";

const isStaff = (user) => user.role === "admin" || user.role === "it_support";

const populateTicket = (query) =>
  query
    .populate("createdBy", "name email department")
    .populate("assignedTo", "name email");

export const createTicket = async (req, res) => {
  const { title, description, category, priority } = req.body;

  if (!title || !description || !category) {

    return res.status(400).json({ message: "Title, description and category are required" });
  }

  const ticket = await Ticket.create({
    title,
    description,
    category,
    priority,
    createdBy: req.user._id,
  });

  await logActivity(ticket._id, req.user._id, "created", `Priority: ${ticket.priority}`);

  const populated = await populateTicket(Ticket.findById(ticket._id));
  sendEmail({
  to: req.user.email,
  subject: `Ticket #${ticket.ticketNumber} created`,
  text: `Hi ${req.user.name},\n\nYour ticket "${ticket.title}" has been received. Our IT team will get back to you soon.\n\nTicket number: #${ticket.ticketNumber}\nPriority: ${ticket.priority}`,
});
  res.status(201).json(populated);
};

export const getTickets = async (req, res) => {
  const filter = {};

  // Employees only see their own tickets
  if (!isStaff(req.user)) {
    filter.createdBy = req.user._id;
  }

  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.category) filter.category = req.query.category;

  if (req.query.assignedTo === "me") {
    filter.assignedTo = req.user._id;
  } else if (req.query.assignedTo === "unassigned") {
    filter.assignedTo = null;
  }

  if (req.query.search) {
    const term = req.query.search.trim();
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");

    const or = [{ title: regex }, { description: regex }];
    if (/^#?\d+$/.test(term)) {
      or.push({ ticketNumber: Number(term.replace("#", "")) });
    }
    filter.$or = or;
  }

  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

  const [tickets, total] = await Promise.all([
    populateTicket(
      Ticket.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
    ),
    Ticket.countDocuments(filter),
  ]);

  res.json({
    tickets,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

export const getTicketById = async (req, res) => {
  const ticket = await populateTicket(Ticket.findById(req.params.id));

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  const isOwner = ticket.createdBy._id.toString() === req.user._id.toString();
  if (!isOwner && !isStaff(req.user)) {
    return res.status(403).json({ message: "You do not have access to this ticket" });
  }

  res.json(ticket);
};

export const updateTicketStatus = async (req, res) => {
  const { status } = req.body;
  const allowed = ["open", "in_progress", "resolved", "closed"];

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  const previous = ticket.status;
  ticket.status = status;
  await ticket.save();

  await logActivity(ticket._id, req.user._id, "status_changed", `${previous} to ${status}`);
  const owner = await User.findById(ticket.createdBy);
sendEmail({
  to: owner.email,
  subject: `Ticket #${ticket.ticketNumber} is now ${status.replace("_", " ")}`,
  text: `Hi ${owner.name},\n\nThe status of your ticket "${ticket.title}" changed from ${previous.replace("_", " ")} to ${status.replace("_", " ")}.`,
});

  const populated = await populateTicket(Ticket.findById(ticket._id));
  res.json(populated);
};

export const assignTicket = async (req, res) => {
  const { assignedTo } = req.body;

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  let agent = null;
  if (assignedTo) {
    agent = await User.findById(assignedTo);
    if (!agent || !["it_support", "admin"].includes(agent.role)) {
      return res.status(400).json({ message: "Tickets can only be assigned to IT support staff" });
    }
  }

  ticket.assignedTo = assignedTo || null;
  await ticket.save();

  if (agent) {
    await logActivity(ticket._id, req.user._id, "assigned", `Assigned to ${agent.name}`);
    sendEmail({
  to: agent.email,
  subject: `Ticket #${ticket.ticketNumber} assigned to you`,
  text: `Hi ${agent.name},\n\nTicket "${ticket.title}" has been assigned to you.\nPriority: ${ticket.priority}`,
});
  } else {
    await logActivity(ticket._id, req.user._id, "unassigned");
  }

  const populated = await populateTicket(Ticket.findById(ticket._id));
  res.json(populated);
};