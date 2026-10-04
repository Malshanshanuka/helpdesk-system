import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  token: generateToken(user._id),
});

export const registerUser = async (req, res) => {
  const { name, email, password, department } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({ message: "Email is already registered" });
  }

  // Role is never taken from the request body, new users are always employees
  const user = await User.create({ name, email, password, department });

  res.status(201).json(userResponse(user));
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  if (!user.isActive) {
    return res.status(403).json({ message: "Account is deactivated" });
  }

  res.json(userResponse(user));
};

export const getMe = async (req, res) => {
  res.json(req.user);
};