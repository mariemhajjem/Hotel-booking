
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from 'react-hot-toast'

// Set the base URL for axios requests
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

const AppContext = createContext();

export const AppProvider = ({ children }) => {

    const currency = import.meta.env.VITE_CURRENCY || "TND";

    const navigate = useNavigate();
    const { user } = useUser();
    const { getToken } = useAuth();

    const [isOwner, setIsOwner] = useState(false);
    const [showHotelReg, setShowHotelReg] = useState(false);
    const [searchedCities, setSearchedCities] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [showRoomUpdate, setShowRoomUpdate] = useState(false) 
    const [updatedRoomId, setUpdatedRoomId] = useState(null)

    const fetchRooms = async () => {
        try {
            const { data } = await axios.get('/api/rooms', { headers: { Authorization: `Bearer ${await getToken()}` } });
            if (data.success) {
                setRooms(data.rooms);
            } else {
                toast.error("Failed to fetch rooms");
                
                // toast.loading("Retrying...");

            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    const fetchUser = async () => {
        try {
            const { data } = await axios.get('/api/user', { headers: { Authorization: `Bearer ${await getToken()}` } })
            if (data.success) {
                console.log("User Data:", data);
                setIsOwner(data.role === "hotelOwner");
                setSearchedCities(data.recentSearchedCities)
            } else {
                // Retry Fetching User Details after 5 seconds
                setTimeout(() => {
                    fetchUser()
                }, 5000)
            }

        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => {
        if (user) {
            fetchUser()
        }
    }, [user])

    useEffect(() => {
        fetchRooms()
    }, [])

    const value = {
        currency, navigate, user, getToken, isOwner, setIsOwner, axios,
        showHotelReg, setShowHotelReg, searchedCities, setSearchedCities, rooms, showRoomUpdate, setShowRoomUpdate,
        updatedRoomId, setUpdatedRoomId
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

// Custom hook
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
