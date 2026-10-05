import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, text }) => {
  if (process.env.EMAIL_ENABLED !== "true") {
    console.log(`Email skipped (disabled): ${subject} -> ${to}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
    });
  } catch (error) {
    // A failed email must never break the API request
    console.error(`Email failed: ${error.message}`);
  }
};

export default sendEmail;