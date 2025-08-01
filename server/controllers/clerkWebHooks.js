import User from "../models/User.js";
import { Webhook } from "svix";

const clerkWebhooks = async (req, res) => {
    try {
        // Create an Svix instance with clerk webhook secret.
        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET)
        // Getting Headers
        const headers = {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"],
        };
        // Verifying Headers
        await whook.verify(JSON.stringify(req.body), headers)
        // Getting Data from request body
        const { data, type } = req.body
        const userData = {
            _id: data.id,
            email: data.email_addresses[0].email_address,
            username: data.first_name + " " + data.last_name,
            image: data.image_url,
        }
        console.log("Webhook Data:", data, type);

        // Switch Cases for differernt Events
        switch (type) {
            case "user.created": {
                await User.create(userData); 
                console.log("User Created:", userData);
                break;
            }
            case "user.updated": {
                await User.findByIdAndUpdate(data.id, userData);
                break;
            }
            case "user.deleted": {
                await User.findByIdAndDelete(data.id);
                console.log("User Deleted:", data.id);
                break;
            }
            default:
                break;
        }

        return res.json({ success: true, message: "Webhook Received" })

    } catch (error) {
        console.log(error.message);
        return res.json({ success: false, message: error.message });
    }
}

export default clerkWebhooks;