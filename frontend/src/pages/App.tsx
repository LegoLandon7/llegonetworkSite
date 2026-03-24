import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Navbar from '../components/NavBar.tsx'

import Home from './Home.tsx'
import Projects from './Projects.tsx'

function App() {

  return (
    <BrowserRouter>
      <Navbar />
    
      <main className='main-content'>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
