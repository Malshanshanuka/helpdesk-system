import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";
import Article from "./models/Article.js";

const articles = [
  {
    title: "How to connect to office WiFi",
    summary: "Steps to join the office wireless network and fix common connection problems.",
    category: "network",
    content: `1. Open the WiFi menu on your laptop.
2. Select the network named "Office-Secure".
3. Sign in with your company email and password.

If the connection fails:
- Turn WiFi off and on again.
- Choose "Forget this network", then connect again.
- Restart your laptop.

If it still does not work, create a ticket and tell us the exact error message you see.`,
  },
  {
    title: "How to reset your password",
    summary: "Reset your company account password in a few minutes.",
    category: "account",
    content: `1. Go to the company sign-in page and choose "Forgot password".
2. Enter your company email address.
3. Open the reset link we send you and choose a new password.

A good password has at least 8 characters and mixes letters, numbers and symbols. Never share your password with anyone, including IT staff.

If you did not receive the email within 10 minutes, check your spam folder or create a ticket.`,
  },
  {
    title: "Email setup guide",
    summary: "Add your company mailbox to Outlook on your computer or phone.",
    category: "email",
    content: `On a computer:
1. Open Outlook and choose "Add account".
2. Enter your company email address and select Connect.
3. Sign in with your password when asked.

On a phone:
1. Install the Outlook app from your app store.
2. Add your company email address and sign in.
3. Allow notifications if you want to be alerted about new mail.

If you see "cannot verify account", create a ticket and include a screenshot.`,
  },
  {
    title: "How to add a printer",
    summary: "Connect your laptop to a shared office printer.",
    category: "computer",
    content: `1. Open your computer's printer settings.
2. Choose "Add printer" and wait for the list to load.
3. Select the printer shown on the label on the printer itself.
4. Print a test page to confirm it works.

You must be connected to the office network. If the printer does not appear in the list, ask IT support for its network address.`,
  },
  {
    title: "VPN connection guide",
    summary: "Connect securely to company systems when working from home.",
    category: "network",
    content: `1. Install the company VPN app (ask IT support if you do not have it).
2. Open the app and sign in with your company account.
3. Select your region and press Connect.
4. Wait until the status shows Connected before opening company systems.

Disconnect the VPN when you finish work. If the VPN keeps disconnecting, switch to a different network and try again.`,
  },
  {
    title: "How to spot a phishing email",
    summary: "Learn the warning signs of fake emails and what to do about them.",
    category: "security",
    content: `Be careful when an email:
- Asks for your password or bank details.
- Creates urgency, such as "your account will be closed today".
- Comes from an address that looks almost right but is slightly different.
- Contains links that do not match the company website.

What to do:
1. Do not click any links or open attachments.
2. Do not reply to the email.
3. Create a ticket and attach a screenshot so IT can investigate.`,
  },
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const admin = await User.findOne({ role: "admin" });
  if (!admin) {
    console.error("No admin found. Run npm run seed:admin first");
    process.exit(1);
  }

  const existing = await Article.countDocuments();
  if (existing > 0) {
    console.log(`Skipped: ${existing} articles already exist`);
  } else {
    await Article.insertMany(articles.map((a) => ({ ...a, author: admin._id })));
    console.log(`${articles.length} articles created`);
  }

  await mongoose.disconnect();
};

run();