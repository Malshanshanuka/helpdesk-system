import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  token: generateToken(user._id),
});

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const user = await User.create({ name, email, password, department });

    res.status(201).json(userResponse(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    res.json(userResponse(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMe = async (req, res) => {
  res.json(req.user);
};

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

export const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase();

    const reply = { message: "If an account exists for that email, a reset link has been sent" };

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.json(reply);
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = hashToken(token);
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const clientUrl = (process.env.CLIENT_URL || "").split(",")[0].trim();
    const link = `${clientUrl}/reset-password/${token}`;

    if (process.env.EMAIL_ENABLED !== "true" && process.env.NODE_ENV !== "production") {
      console.log(`Password reset link for ${email}: ${link}`);
    }

    sendEmail({
      to: user.email,
      subject: "Reset your HelpDesk password",
      text: `Hi ${user.name},\n\nUse this link to choose a new password. It expires in 30 minutes.\n\n${link}\n\nIf you did not ask for this, you can ignore this email.`,
    });

    res.json(reply);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findOne({
      passwordResetToken: hashToken(req.params.token),
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "This reset link is invalid or has expired" });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: "Password updated. You can now sign in." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};