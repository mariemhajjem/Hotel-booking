import { v2 as cloudinary } from "cloudinary";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";

// API to create a new room for a hotel
export const createRoom = async (req, res) => {
    try {
        const { roomType, pricePerNight, amenities, hotelId  } = req.body;
        const hotel = await Hotel.findById(hotelId)
        if (!hotel) return res.json({ success: false, message: "No Hotel found" });

        const uploadImages = req.files.map(async (file) => {
            const response = await cloudinary.uploader.upload(file.path, { folder: "rooms" });
            return response.secure_url;
        })

        // Wait for all uploads to complete
        const images = await Promise.all(uploadImages)
        await Room.create({
            hotel: hotel._id,
            roomType,
            pricePerNight: +pricePerNight,
            amenities: JSON.parse(amenities),
            images,
        })

        return res.json({ success: true, message: "Room created successfully" })
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }

}

// API to get all rooms
export const getRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ isAvailable: true }).populate({
            path: 'hotel',
            populate: {
                path: 'owner',
                select: 'image'
            },

        }).sort({ createdAt: -1 })
        return res.json({ success: true, rooms });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

// API to get all rooms for a specific hotel
export const getOwnerRooms = async (req, res) => {
    try {
        const hotelData = await Hotel.findOne({ owner: req.auth.userId })
        const rooms = await Room.find({ hotel: hotelData._id.toString() }).populate("hotel");
        return res.json({ success: true, rooms });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

// API to toggle availability of a room 
export const toggleRoomAvailability = async (req, res) => {
    try {
        const { roomId } = req.body;
        const roomData = await Room.findById(roomId);
        roomData.isAvailable = !roomData.isAvailable;
        await roomData.save();
        return res.json({ success: true, message: "Room availability Updated" });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

export const getRoomDetails = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id).populate("hotel");
        if (!room) return res.json({ success: false, message: "Room Not Found" });
        return res.json({ success: true, room });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

export const updateRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { roomType, pricePerNight, amenities, isAvailable, existingImages } = req.body;
        const userId = req.auth.userId;
        // Find the room with hotel populated
        const room = await Room.findById(roomId).populate("hotel");
        if (!room) {
            return res.status(404).json({ success: false, message: "Room not found" });
        }

        // Check if the logged-in user is the owner of the hotel
        if (room.hotel.owner !== userId) {
            return res.status(403).json({ success: false, message: "Unauthorized" });
        }
        
        // Upload new images
        let newImageUrls = [];
        if (req.files && req.files.length > 0) {
            const uploads = req.files.map(file => cloudinary.uploader.upload(file.path, { folder: "rooms" }));
            const results = await Promise.all(uploads);
            newImageUrls = results.map(r => r.secure_url);
        }

        // Handle existing images coming from frontend
        let keptImages = [];
        if (existingImages) {
            keptImages = Array.isArray(existingImages) ? existingImages : [existingImages];
        }

        // Update allowed fields
        if (roomType) room.roomType = roomType;
        if (pricePerNight) room.pricePerNight = pricePerNight;
        if (amenities) room.amenities = JSON.parse(amenities);
        if (typeof isAvailable === "boolean") room.isAvailable = isAvailable;
        room.images = [...keptImages, ...newImageUrls];

        await room.save();

        return res.json({ success: true, message: "Room updated successfully", room });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
