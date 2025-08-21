import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Title from '../../components/Title'
import { useAppContext } from '../../context/AppContext'

const ListHotels = () => {

  const [hotels, setHotels] = useState([])
  const { axios, getToken, user, setShowHotelReg } = useAppContext()

  const fetchHotels = async () => {
    try {
      const { data } = await axios.get('/api/hotels/byowner', { headers: { Authorization: `Bearer ${await getToken()}` } })
      console.log(data)
      if (data.success) {
        setHotels(data.hotels)
      }
      else {
        toast.error(data.message || "Failed to fetch hotels")
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  // Toggle Availability of the Hotel
  const toggleAvailability = async (hotelId) => {
    const { data } = await axios.post('/api/hotels/toggle-availability', { hotelId }, {
      headers: {
        Authorization: `Bearer ${await getToken()}`
      }
    })
    if (data.success) {
      toast.success(data.message)
      fetchHotels()
    } else {
      toast.error(data.message)
    }
  }

  useEffect(() => {
    if (user) {
      fetchHotels()
    }
  }, [user])

  return (
    <div>
      <div className='flex justify-between items-center'>
        <Title align='left' font='outfit' title='Hotel Listings'
          subTitle='View, edit, or manage all listed hotels. Keep the information up-to-date to provide the best experience for users.' />
        <button onClick={() => setShowHotelReg(true)} className="bg-primary text-white px-5 py-2 rounded cursor-pointer">
          Add Hotel
        </button>
      </div>
      <p className='text-gray-500 mt-8'>All Hotels</p>
      <div className='w-full max-w-3x1 text-left 
            border border-gray-300 rounded-1g max-h-80
             overflow-y-scroll mt-3'>
        <table className='w-full'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='py-3 px-4 text-gray-800 font-medium'>Name</th>
              <th className='py-3 px-4 text-gray-800 font-medium max-sm:hidden'>Address</th>
              <th className='py-3 px-4 text-gray-800 font-medium text-center'>Actions</th>
            </tr>
          </thead>
          <tbody className='text-sm'>
            {
              hotels.map((items, index) => (
                <tr key={index}>
                  <td className='py-3 px-4 text-gray-700 
                          border-t border-gray-300'>
                    {items.name}
                  </td>
                  <td className='py-3 px-4 text-gray-700 
                          border-t border-gray-300 text-center'>
                    {items.address} {` ${items.city}`}
                  </td>

                  <td className='py-3 px-4 border-t border-gray-300 text-sm text-red-500 text-center'>
                    <label className='relative inline-flex items-center cursor-pointer text-gray-900 gap-3'>
                      <input onChange={() => toggleAvailability(items._id)} type="checkbox" className='sr-only peer'
                        checked={items.isAvailable} />
                      <div className="w-12 h-7 bg-slate-300 rounded-full peer peer-checked:bg-blue-600 transition-colors 
                        duration-200"></div>
                      <span className="dot absolute left-1 top-1 w-5 h-5 bg-white rounded-full 
                      transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></span>
                    </label>
                  </td>
                </tr>
              ))
            }
          </tbody>

        </table>
      </div>
    </div>
  )
}

export default ListHotels