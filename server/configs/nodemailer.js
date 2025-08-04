import nodemailer from "nodemailer";

// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.NODemailer_USER,
        pass: process.env.NODemailer_PASS,
    }
});

export default transporter;