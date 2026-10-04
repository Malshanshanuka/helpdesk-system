import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }

  const existing = await User.findOne({ email });

  if (existing) {
    existing.role = "admin";
    await existing.save();
    console.log(`Existing user promoted to admin: ${email}`);
  } else {
    await User.create({ name: "System Admin", email, password, role: "admin" });
    console.log(`Admin created: ${email}`);
  }

  await mongoose.disconnect();
};

run();