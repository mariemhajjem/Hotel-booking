import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Title from '../../components/Title'
import { assets } from '../../assets/assets'
import { useAppContext } from '../../context/AppContext'

const UpdateRoom = () => {
    const { setShowRoomUpdate, updatedRoomId, axios, getToken } = useAppContext()
    const [loading, setLoading] = useState(false)
    const [images, setImages] = useState({ 0: null, 1: null, 2: null, 3: null })
    const [existingImages, setExistingImages] = useState([]) // store URLs from backend
    const [inputs, setInputs] = useState({
        roomType: '',
        pricePerNight: 0,
        amenities: {
            'Free WiFi': false,
            'Free Breakfast': false,
            'Room Service': false,
            'Mountain View': false,
            'Pool Access': false
        }
    })

    // Fetch room details for prefill
    useEffect(() => {
        if (!updatedRoomId) return
        const fetchRoomDetails = async () => {
            try {
                const token = await getToken()
                const { data } = await axios.get(`/api/rooms/${updatedRoomId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (data.success && data.room) {
                    const room = data.room
                    setInputs({
                        roomType: room.roomType || '',
                        pricePerNight: room.pricePerNight || 0,
                        amenities: {
                            'Free WiFi': room.amenities.includes('Free WiFi'),
                            'Free Breakfast': room.amenities.includes('Free Breakfast'),
                            'Room Service': room.amenities.includes('Room Service'),
                            'Mountain View': room.amenities.includes('Mountain View'),
                            'Pool Access': room.amenities.includes('Pool Access'),
                        }
                    })
                    setExistingImages(room.images || [])
                } else {
                    toast.error('Failed to load room details')
                }
            } catch (err) {
                toast.error(err.message)
            }
        }
        fetchRoomDetails()
    }, [updatedRoomId])

    const onSubmitHandler = async (e) => {
        console.log(existingImages)
        e.preventDefault()
        if (!inputs.roomType || !inputs.pricePerNight) {
            toast.error('Please fill all fields')
            return
        }
        setLoading(true)
        try {
            const formData = new FormData()
            formData.append('roomType', inputs.roomType)
            formData.append('pricePerNight', inputs.pricePerNight)
            const amenities = Object.keys(inputs.amenities).filter(key => inputs.amenities[key])
            formData.append('amenities', JSON.stringify(amenities))
            Object.keys(images).forEach((key, i) => {
                if (images[key]) {
                    // new file selected
                    formData.append('newImages', images[key])
                } else if (existingImages[i]) {
                    // keep old URL
                    formData.append('existingImages', existingImages[key])
                }
            })

            const token = await getToken()
            const { data } = await axios.put(`/api/rooms/${updatedRoomId}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (data.success) {
                toast.success('Room updated successfully')
                setShowRoomUpdate(false)
            } else {
                toast.error(data.message || 'Failed to update room')
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div onClick={() => setShowRoomUpdate(false)}
            className='fixed top-0 left-0 bottom-0 right-0 flex items-center text-sm text-gray-600 bg-black/50 z-30 overflow-y-auto'>
            <form onSubmit={onSubmitHandler} onClick={(e) => e.stopPropagation()} className="flex flex-col gap-4 m-auto items-start p-8 py-12 w-80 sm:w-[352px] rounded-lg shadow-xl border border-gray-200 bg-white">
                <div className="w-full flex justify-end">
                    <img
                        src={assets.closeIcon}
                        alt="close_icon"
                        className="cursor-pointer"
                        onClick={() => setShowRoomUpdate(false)}
                    />
                </div>
                <Title align='left' font='outfit' title='Update Room' />

                {/* Images */}
                <p className='text-gray-800 mt-10'>Images</p>
                <div className='grid grid-cols-2 sm:flex gap-4 my-2 flex-wrap'>
                    {Object.keys(images).map((key, index) => (
                        <label htmlFor={`roomImage${key}`} key={key}>
                            <img
                                className='max-h-13 cursor-pointer opacity-80'
                                src={images[key]
                                    ? URL.createObjectURL(images[key])
                                    : existingImages[index] || assets.uploadArea}
                                alt=""
                            />
                            <input type="file" accept='image/*' id={`roomImage${key}`} hidden
                                onChange={e => setImages({ ...images, [key]: e.target.files[0] })} />
                        </label>
                    ))}
                </div>

                {/* Room type & price */}
                <div className='w-full flex max-sm:flex-col sm:gap-4 mt-4'>
                    <div className='flex-1 max-w-48'>
                        <p className='text-gray-800 mt-4'>Room Type</p>
                        <select value={inputs.roomType} onChange={e => setInputs({ ...inputs, roomType: e.target.value })}
                            className='border opacity-70 border-gray-300 mt-1 rounded p-2 w-full'>
                            <option value="">Select Room Type</option>
                            <option value="Single Bed">Single Bed</option>
                            <option value="Double Bed">Double Bed</option>
                            <option value="Luxury Room">Luxury Room</option>
                            <option value="Family Suite">Family Suite</option>
                        </select>
                    </div>
                    <div>
                        <p className='mt-4 text-gray-800'>
                            Price <span className='text-xs'>/night</span>
                        </p>
                        <input type="number" placeholder='0' className='border border-gray-300 mt-1 rounded p-2 w-24'
                            value={inputs.pricePerNight}
                            onChange={e => setInputs({ ...inputs, pricePerNight: e.target.value })} />
                    </div>
                </div>

                {/* Amenities */}
                <p className='text-gray-800 mt-4'>Amenities</p>
                <div className='flex flex-col flex-wrap mt-1 text-gray-400 max-w-sm'>
                    {Object.keys(inputs.amenities).map((amenity, index) => (
                        <div key={index}>
                            <input type="checkbox" id={`amenities${index + 1}`}
                                checked={inputs.amenities[amenity]}
                                onChange={() => setInputs({
                                    ...inputs,
                                    amenities: {
                                        ...inputs.amenities,
                                        [amenity]: !inputs.amenities[amenity]
                                    }
                                })} />
                            <label htmlFor={`amenities${index + 1}`}> {amenity}</label>
                        </div>
                    ))}
                </div>

                <button className='bg-primary text-white px-8 py-2 rounded mt-8 cursor-pointer' disabled={loading}>
                    {loading ? 'Updating Room...' : 'Update Room'}
                </button>
            </form>
        </div>
    )
}

export default UpdateRoom
