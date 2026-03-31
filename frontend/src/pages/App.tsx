import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Navbar from '../components/NavBar.tsx'
import Footer from '../components/Footer.tsx'

import Home from './Home.tsx'
import Projects from './Projects.tsx'
import Settings from './Settings.tsx'
import Socials from './Socials.tsx'

import ReactMarkdown from "react-markdown";
import React from 'react'

function App() {

  const [termsMd, setTermsMd] = React.useState('');
  const [privacyMd, setPrivacyMd] = React.useState('');

  React.useEffect(() => {
    fetch('/terms.md')
      .then(res => res.text())
      .then(setTermsMd);

    fetch('/privacy.md')
      .then(res => res.text())
      .then(setPrivacyMd);
  }, []);

  return (
    <BrowserRouter>
      <Navbar />
    
      <main className='main-content'>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/socials" element={<Socials />} />

          <Route path="/terms" element={<div className="markdown"><ReactMarkdown>{termsMd}</ReactMarkdown></div>} />
          <Route path="/privacy" element={<div className="markdown"><ReactMarkdown>{privacyMd}</ReactMarkdown></div>} />
        </Routes>
      </main>
      
      <Footer />
    </BrowserRouter>
  )
}

export default App
