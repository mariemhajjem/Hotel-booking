import express from "express";
import "dotenv/config.js";
import cors from "cors"
import connectDB from "./configs/db.js";
import { clerkMiddleware } from '@clerk/express'
import clerkWebhooks from "./controllers/clerkWebHooks.js";

connectDB()

const PORT = process.env.PORT || 3000;

const app = express()
app.use(cors())
app.use(express.json())
app.use(clerkMiddleware())

// API to listen to Clerk Webhooks
app.use("/api/clerk", clerkWebhooks);

app.get('/', (req, res) => {
    return res.send("API is workinggg")
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
