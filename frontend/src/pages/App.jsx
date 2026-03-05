import { Route, Routes } from 'react-router-dom'

import Navbar from '../components/specific/Navbar.jsx'

import Home from './Home.jsx'
import About from './About.jsx'

function Users() {
  return <h1>Users</h1>;
}

function App() {
  console.log(
    '%c👾 WELCOME TO LLEGONETWORK.DEV 👾\n%cMade by Landon Lego',
    'color: #6090ff; font-size: 20px; font-weight: bold;',
    'color: #c3c8e6; font-size: 12px;'
  );
  
  return (
    <>
    <div>
      <Navbar />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/projects" element={<Users />} />
        <Route path="/contact" element={<Users />} />
      </Routes>
    </div>
    </>
  )
}

export default App
