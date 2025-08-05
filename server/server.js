import express from "express";
import "dotenv/config.js";
import cors from "cors"
import connectDB from "./configs/db.js";
import { clerkMiddleware } from '@clerk/express'
import clerkWebhooks from "./controllers/clerkWebHooks.js";
import userRouter from "./routes/userRoutes.js";
import hotelRouter from "./routes/hotelRoutes.js";
import connectCloudinary from "./configs/cloudinary.js";
import roomRouter from "./routes/roomRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import { stripeWebhooks } from "./controllers/stripeWebhooks.js";

connectDB()
connectCloudinary();

const PORT = process.env.PORT || 3000;

const app = express()
app.use(cors())

app.post('/api/stripe', express.raw({ type: 'application/json' }), stripeWebhooks);

app.use(express.json())
app.use(clerkMiddleware())

// API to listen to Clerk Webhooks
app.use("/api/clerk", clerkWebhooks);

app.get('/', (req, res) => {
    return res.send("API is workinggg")
})
app.use("/api/user", userRouter);
app.use("/api/hotels", hotelRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/bookings", bookingRouter);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
