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

  const tickets = await populateTicket(Ticket.find(filter).sort({ createdAt: -1 }));
  res.json(tickets);
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
  } else {
    await logActivity(ticket._id, req.user._id, "unassigned");
  }

  const populated = await populateTicket(Ticket.findById(ticket._id));
  res.json(populated);
};