import User from "../models/User.js";

const ROLES = ["employee", "it_support", "admin"];

export const getUsers = async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;

  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json(users);
};

export const updateUserRole = async (req, res) => {
  const { role } = req.body;

  if (!ROLES.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ message: "You cannot change your own role" });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.role = role;
  await user.save();

  res.json(user);
};

export const updateUserStatus = async (req, res) => {
  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    return res.status(400).json({ message: "isActive must be true or false" });
  }

  if (req.params.id === req.user._id.toString()) {
    return res.status(400).json({ message: "You cannot deactivate your own account" });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.isActive = isActive;
  await user.save();

  res.json(user);
};