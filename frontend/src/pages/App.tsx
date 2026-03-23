import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from '../components/NavBar.tsx'
import Home from './Home.tsx'

function App() {

  return (
    <BrowserRouter>
      <Navbar />
    
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
