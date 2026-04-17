import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ReactMarkdown from "react-markdown";
import { useEffect, useState } from 'react'

import Navbar from '../components/NavBar.tsx'
import Footer from '../components/Footer.tsx'

import Home from './Home.tsx'
import Bots from './Bots.tsx'
import Settings from './Settings.tsx'
import Socials from './Socials.tsx'

import ScrollToTop from '../utils/ScrollToTop.tsx'

function App() {

  const [termsMd, setTermsMd] = useState('');
  const [privacyMd, setPrivacyMd] = useState('');

  useEffect(() => {
    fetch('/terms.md')
      .then(res => res.text())
      .then(setTermsMd);

    fetch('/privacy.md')
      .then(res => res.text())
      .then(setPrivacyMd);
  }, []);

  return (
    <BrowserRouter>
    <ScrollToTop />
      <Navbar />
    
      <main className='main-content'>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/bots" element={<Bots />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/socials" element={<Socials />} />

          <Route path="/terms" element={<div className="markdown"><ReactMarkdown>{termsMd}</ReactMarkdown></div>} />
          <Route path="/privacy" element={<div className="markdown"><ReactMarkdown>{privacyMd}</ReactMarkdown></div>} />

          <Route path="/bots/legobot" element={<Bots />} />
          <Route path="/bots/legogpt" element={<Bots />} />
          <Route path="/bots/welcomer" element={<Bots />} />
        </Routes>
      </main>
      
      <Footer />
    </BrowserRouter>
  )
}

export default App