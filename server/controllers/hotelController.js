import Hotel from "../models/Hotel.js";
import User from "../models/User.js";

export const registerHotel = async (req, res) => {
    try {
        const { name, address, contact, city } = req.body; 
        const owner = req.auth.userId
        // Check if hotel already registered
        const hotel = await Hotel.findOne({ name, owner })
        if (hotel) {
            return res.json({ success: false, message: "Hotel Already Registered" })
        }

        const newHotel = await Hotel.create({ name, address, contact, city, owner });
        await User.findByIdAndUpdate(owner, { role: "hotelOwner" });
        return res.json({ success: true, message: "Hotel Registered Successfully" })
    } catch (error) {
        return res.json({ success: false, message: error.message })
    }

}

export const getHotelDetails = async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id).populate("owner");
        if (!hotel) return res.json({ success: false, message: "Hotel Not Found" });
        return res.json({ success: true, hotel });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

export const getHotels = async (req, res) => {
    const ownerId = req.user._id
    try {
        const hotels = await Hotel.find({ owner:  ownerId});
        return res.json({ success: true, hotels });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
}

export const updateHotel = async (req, res) => {
  try {
    const hotelId = req.params.id;
    const owner = req.user._id;

    const hotel = await Hotel.findOne({ _id: hotelId, owner });

    if (!hotel) {
      return res.json({ success: false, message: "Hotel not found or access denied" });
    }

    const { name, address, contact, city } = req.body;

    if (name) hotel.name = name;
    if (address) hotel.address = address;
    if (contact) hotel.contact = contact;
    if (city) hotel.city = city;

    await hotel.save();

    return res.json({ success: true, message: "Hotel updated successfully", hotel });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
