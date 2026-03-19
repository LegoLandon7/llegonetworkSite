import './Navbar.css'
import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'

const PROJECT_LINKS = [
    { to: '/projects',         label: 'All',     end: true  },
    { to: '/projects/LegoBot', label: 'LegoBot', end: false },
    { to: '/projects/LegoGPT', label: 'LegoGPT', end: false },
]

function Navbar() {
    const [menuOpen, setMenuOpen]         = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef    = useRef(null)
    const drawerGroupRef = useRef(null)
    const location       = useLocation()

    const activeProject = PROJECT_LINKS.find(p =>
        p.end ? location.pathname === p.to : location.pathname.startsWith(p.to)
    )
    const onProjectsPage = !!activeProject

    useEffect(() => {
        const handler = (e) => {
            if (
                !dropdownRef.current?.contains(e.target) &&
                !drawerGroupRef.current?.contains(e.target)
            ) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    useEffect(() => {
        const handler = () => { if (window.innerWidth > 768) setMenuOpen(false) }
        window.addEventListener('resize', handler)
        return () => window.removeEventListener('resize', handler)
    }, [])

    const closeAll = () => { setMenuOpen(false); setDropdownOpen(false) }

    return (
        <>
            <header className="navbar">
                <NavLink to="/" className="nav-brand" onClick={closeAll}>
                    <img src="/favicon.png" alt="" />
                    <span>llegonetwork<span className="tld">.dev</span></span>
                </NavLink>

                <nav className="nav-links">
                    <NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''}>Home</NavLink>
                    <NavLink to="/about" className={({isActive}) => isActive ? 'active' : ''}>About</NavLink>

                    <div className="dropdown" ref={dropdownRef}>
                        <button
                            className={`dropdown-trigger ${dropdownOpen ? 'open' : ''} ${onProjectsPage ? 'active' : ''}`}
                            onClick={() => setDropdownOpen(v => !v)}
                            aria-expanded={dropdownOpen}
                        >
                            <span className="trigger-label">
                                Projects
                                {activeProject && <span className="trigger-sub">{activeProject.label}</span>}
                            </span>
                            <svg className="chevron" width="10" height="6" viewBox="0 0 10 6">
                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                            </svg>
                        </button>

                        <div className={`dropdown-panel ${dropdownOpen ? 'open' : ''}`} aria-hidden={!dropdownOpen}>
                            {PROJECT_LINKS.map(p => (
                                <NavLink key={p.to} to={p.to} end={p.end}
                                    className={({isActive}) => isActive ? 'active' : ''}
                                    onClick={closeAll}
                                >
                                    {p.label}
                                </NavLink>
                            ))}
                        </div>
                    </div>

                    <NavLink to="/contact" className={({isActive}) => isActive ? 'active' : ''}>Contact</NavLink>
                </nav>

                <button
                    className={`hamburger ${menuOpen ? 'open' : ''}`}
                    onClick={() => setMenuOpen(v => !v)}
                    aria-label="Toggle menu"
                    aria-expanded={menuOpen}
                >
                    <span /><span /><span />
                </button>
            </header>

            <nav className={`drawer ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
                <NavLink to="/" end className={({isActive}) => isActive ? 'active' : ''} onClick={closeAll}>Home</NavLink>
                <NavLink to="/about" className={({isActive}) => isActive ? 'active' : ''} onClick={closeAll}>About</NavLink>

                <div className="drawer-group" ref={drawerGroupRef}>
                    <button
                        className={`drawer-group-btn ${dropdownOpen ? 'open' : ''} ${onProjectsPage ? 'active' : ''}`}
                        onClick={() => setDropdownOpen(v => !v)}
                    >
                        <span className="trigger-label">
                            Projects
                            {activeProject && <span className="trigger-sub">{activeProject.label}</span>}
                        </span>
                        <svg className="chevron" width="10" height="6" viewBox="0 0 10 6">
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                        </svg>
                    </button>

                    <div className={`drawer-sublinks ${dropdownOpen ? 'open' : ''}`}>
                        <div> {/* ← this wrapper is required for the grid collapse to work */}
                            {PROJECT_LINKS.map(p => (
                                <NavLink key={p.to} to={p.to} end={p.end}
                                    className={({isActive}) => isActive ? 'active' : ''}
                                    onClick={closeAll}
                                >
                                    {p.label}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </div>

                <NavLink to="/contact" className={({isActive}) => isActive ? 'active' : ''} onClick={closeAll}>Contact</NavLink>
            </nav>

            {menuOpen && <div className="nav-overlay" onClick={closeAll} aria-hidden="true" />}
        </>
    )
}

export default Navbar