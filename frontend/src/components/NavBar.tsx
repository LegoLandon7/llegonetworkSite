import { NavLink } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import './NavBar.scss';

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function closeAll() {
    setMenuOpen(false);
  }

  return (
    <nav className="navbar" ref={navRef}>
      <NavLink className="nav-brand" to="/">
        <img src="/favicon.png" />
        <span className="brand-text">
          <h2>llegonetwork</h2>
          <h3>.dev</h3>
        </span>
      </NavLink>

      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <NavLink to="/" onClick={closeAll}>Home</NavLink>
        <NavLink to="/projects" onClick={closeAll}>Projects</NavLink>
        <NavLink to="/bots" onClick={closeAll}>Discord Bots</NavLink>
        <NavLink to="/settings" onClick={closeAll}>Settings</NavLink>
        <NavLink to="/socials" onClick={closeAll}>Socials</NavLink>
      </div>

      <button
        className={`hamburger ${menuOpen ? 'open' : ''}`}
        onClick={() => {
          setMenuOpen(!menuOpen);
        }}
      >
        <span />
        <span />
        <span />
      </button>
    </nav>
  );
}