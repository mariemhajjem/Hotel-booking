import stripe from "stripe";

import transporter from "../configs/nodemailer.js";
import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";

// Function to Check Availablity of Room
const checkAvailability = async ({ checkInDate, checkOutDate, room }) => {
    try {
        const bookings = await Booking.find({
            room,
            checkInDate: { $lte: checkOutDate },
            checkOutDate: { $gte: checkInDate },
        });

        const isAvailable = bookings.length === 0;
        return isAvailable;
    } catch (error) {
        console.error(error.message);
    }
}

// API to check availability of room
// POST /api/bookings/check-availability
export const checkAvailabilityAPI = async (req, res) => {
    try {
        const { room, checkInDate, checkOutDate } = req.body;
        const isAvailable = await checkAvailability({ checkInDate, checkOutDate, room });
        return res.json({ success: true, isAvailable })
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }
}


// API to create a new booking
// POST /api/bookings/book
export const createBooking = async (req, res) => {
    try {
        const { room, checkInDate, checkOutDate, guests } = req.body;
        const user = req.user._id;
        // Before Booking Check Availability
        const isAvailable = await checkAvailability({
            checkInDate,
            checkOutDate,
            room
        });

        if (!isAvailable) {
            return res.json({ success: false, message: "Room is not available" })
        }

        // Get totalPrice from Room
        const roomData = await Room.findById(room).populate("hotel");
        let totalPrice = roomData.pricePerNight;
        // Calculate totalPrice based on nights
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const timeDiff = checkOut.getTime() - checkIn.getTime();
        const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
        totalPrice *= nights;


        const booking = await Booking.create({
            user,
            room,
            hotel: roomData.hotel._id,
            guests: +guests,
            checkInDate,
            checkOutDate,
            totalPrice,
        })

        const mailOptions = {
            from: process.env.NODemailer_USER,
            to: req.user.email,
            subject: "Booking Confirmation",
            html: `
            <h2>Your booking is confirmed!</h2>
            <p>Dear ${req.user.username},</p>
            <p>Thank you for booking with us. Here are your booking details:</p>
            <ul>
                <li>Booking ID: ${booking._id}</li>
                <li>Hotel Name: ${roomData.hotel.name}</li>
                <li>Location: ${roomData.hotel.address}</li>
                <li>Date: ${booking.checkInDate.toDateString()}</li>
                <li>Check-out: ${booking.checkOutDate.toDateString()}</li>
                <li>Total Price: ${booking.totalPrice}</li>
            </ul>
            <p>Thank you for choosing us!</p>
            <p>We look forward to welcoming you.</p>
            <p>If you need to make any changes or have questions, feel free to contact us.</p>
            <p>Best regards,</p>
            `
        }

        await transporter.sendMail(mailOptions);

        return res.json({ success: true, message: "Booking created successfully" })
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: "Failed to create booking" })
    }
}

// API to get all bookings for a user
// GET /api/bookings/user
export const getUserBookings = async (req, res) => {
    try {
        const user = req.user._id;
        const bookings = await Booking.find({ user }).populate("room hotel").sort({ createdAt: -1 })
        return res.json({ success: true, bookings })
    } catch (error) {
        return res.json({ success: false, message: "Failed to fetch bookings" });
    }
}


export const getHotelBookings = async (req, res) => {
    try {
        const hotel = await Hotel.findOne({ owner: req.auth.userId });
        if (!hotel) {
            return res.json({ success: false, message: "No Hotel found" });
        }
        const bookings = await Booking.find({ hotel: hotel._id }).populate("room hotel user").sort({ createdAt: -1 });
        // Total Bookings
        const totalBookings = bookings.length;
        // Total Revenue
        const totalRevenue = bookings.reduce((acc, booking) => acc + booking.totalPrice, 0);
        return res.json({
            success: true,
            dashboardData: { totalBookings, totalRevenue, bookings }
        });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

export const stripePayment = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId);
        const roomData = await Room.findById(booking.room).populate('hotel');
        const totalPrice = booking.totalPrice;
        const { origin } = req.headers;
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);

        const line_items =[
        {
            price_data: {
                currency: "usd",
                product_data: {
                    name: roomData.hotel.name,
                },
                unit_amount: totalPrice * 100,
            },
            quantity: 1,
        }]
        
        // Create Checkout Session
        const session = await stripeInstance.checkout.sessions.create({
            line_items,
            mode: "payment",
            success_url: `${origin}/loader/my-bookings`,
            cancel_url: `${origin}/my-bookings`,
            metadata: {
                bookingId,
            }
        })
        
        return res.json({ success: true, url: session.url })
    } catch (error) {
        console.error("Stripe Payment Error:", error.message);
        return res.json({ success: false, message: "Payment Failed" })
    }
}
