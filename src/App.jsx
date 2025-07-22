import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AllRooms from './pages/AllRooms'
import RooomDetails from './pages/RooomDetails'

const App = () => {
  const isOwnerPath = useLocation().pathname.includes("owner")

  return (
    <div>
      {!isOwnerPath && <Navbar />}
      <div className='min-h-[70vh]'> 
        <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/rooms' element={<AllRooms />} />
            <Route path='/rooms/:id' element={<RooomDetails />} />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}

export default App