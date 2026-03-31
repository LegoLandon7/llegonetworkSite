import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Navbar from '../components/NavBar.tsx'
import Footer from '../components/Footer.tsx'

import Home from './Home.tsx'
import Projects from './Projects.tsx'
import Settings from './Settings.tsx'
import Socials from './Socials.tsx'

function App() {

  return (
    <BrowserRouter>
      <Navbar />
    
      <main className='main-content'>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/socials" element={<Socials />} />
        </Routes>
      </main>
      
      <Footer />
    </BrowserRouter>
  )
}

export default App
