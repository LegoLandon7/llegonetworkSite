import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'

import Navbar from '../components/specific/Navbar.jsx'

import Home from './Home.jsx'
import About from './About.jsx'

function Users() {
  return <h1>Users</h1>;
}

function App() {
  return (
    <>
      <Navbar />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/projects" element={<Users />} />
        <Route path="/contact" element={<Users />} />
      </Routes>
    </>
  )
}

export default App
