import nodemailer from "nodemailer";

let transporter;

// Created on first use so the environment variables are always loaded by then
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, text }) => {
  if (process.env.EMAIL_ENABLED !== "true") {
    console.log(`Email skipped (disabled): ${subject} -> ${to}`);
    return;
  }

  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
    });
    console.log(`Email sent: ${subject} -> ${to}`);
  } catch (error) {
    // A failed email must never break the API request
    console.error(`Email failed: ${error.message}`);
  }
};

export default sendEmail;