import './Navbar.css'

import { NavLink } from 'react-router-dom';
import { useState, useEffect } from "react";

import hamburgerIcon from '../../assets/hamburger.png'

function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const close = () => setMenuOpen(false);
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, []);

    return (
        <nav className="navbar">
            <NavLink to="/" className="nav-brand"><img src="/favicon.png" />llegonetwork.dev</NavLink>

            <div className={`nav-links ${menuOpen ? "open" : ""}`}>
                <NavLink to="/" onClick={() => setMenuOpen(false)}>Home</NavLink>
                <NavLink to="/about" onClick={() => setMenuOpen(false)}>About</NavLink>
                <NavLink to="/projects" onClick={() => setMenuOpen(false)}>Projects</NavLink>
                <NavLink to="/contact" onClick={() => setMenuOpen(false)}>Contact</NavLink>
            </div>

            <button className="nav-hamburger" onClick={
                (e) => { e.stopPropagation();
                setMenuOpen(!menuOpen); 
            }}><img src={hamburgerIcon} /></button>
        </nav>
    );
}

export default Navbar