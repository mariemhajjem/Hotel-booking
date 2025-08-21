import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getHotelDetails, getHotels, registerHotel } from "../controllers/hotelController.js";

const hotelRouter = express.Router();
hotelRouter.post('/', protect, registerHotel);
hotelRouter.get('/hotel/:id', protect, getHotelDetails);
hotelRouter.get('/byowner', protect, getHotels);

export default hotelRouter;