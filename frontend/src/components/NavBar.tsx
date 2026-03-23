import { NavLink, useLocation } from 'react-router';
import { useState } from 'react';
import './NavBar.scss'

function NavBar() {
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const [mobileProjectsOpen, setMobileProjectsOpen] = useState(false)
    const location = useLocation()

    const isProjectsActive = location.pathname.startsWith('/projects')

    const activeSub = location.pathname.startsWith('/projects/legobot') ? 'LegoBot'
        : location.pathname.startsWith('/projects/legogpt') ? 'LegoGPT'
        : null

    return (
        <nav className='navbar'>

            <NavLink className='nav-brand' to='/'>
                <img src='favicon.png' />
                <h2>llegonetwork</h2>
                <h3>.dev</h3>
            </NavLink>

            <div className='nav-links'>
                <NavLink to='/'>Home</NavLink>

                <div className={`dropdown ${dropdownOpen ? 'open' : ''}`}>
                    <button
                        className={`dropdown-trigger ${dropdownOpen ? 'open' : ''} ${isProjectsActive ? 'active' : ''}`}
                        onClick={() => setDropdownOpen(o => !o)}
                    >
                        <span className='trigger-label'>
                            Projects
                            {activeSub && <span className='trigger-sub'>{activeSub}</span>}
                        </span>
                        <span className='chevron'>
                            ˅
                        </span>
                    </button>

                    <div className={`dropdown-panel ${dropdownOpen ? 'open' : ''}`}>
                        <NavLink to='/projects' end onClick={() => setDropdownOpen(false)}>All</NavLink>
                        <NavLink to='/projects/legobot' onClick={() => setDropdownOpen(false)}>LegoBot</NavLink>
                        <NavLink to='/projects/legogpt' onClick={() => setDropdownOpen(false)}>LegoGPT</NavLink>
                    </div>
                </div>
            </div>

            <button
                className={`hamburger ${menuOpen ? 'open' : ''}`}
                onClick={() => setMenuOpen(o => !o)}
            >
                <span /><span /><span />
            </button>

            <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
                <NavLink to='/' onClick={() => setMenuOpen(false)}>Home</NavLink>

                <div className={`mobile-group ${mobileProjectsOpen ? 'open' : ''}`}>
                    <button
                        className={`mobile-group-btn ${mobileProjectsOpen ? 'open' : ''}`}
                        onClick={() => setMobileProjectsOpen(o => !o)}
                    >
                        Projects
                        <span className='chevron'>▾</span>
                    </button>

                    <div className={`mobile-sublinks ${mobileProjectsOpen ? 'open' : ''}`}>
                        <div>
                            <NavLink to='/projects' end onClick={() => setMenuOpen(false)}>All</NavLink>
                            <NavLink to='/projects/legobot' onClick={() => setMenuOpen(false)}>LegoBot</NavLink>
                            <NavLink to='/projects/legogpt' onClick={() => setMenuOpen(false)}>LegoGPT</NavLink>
                        </div>
                    </div>
                </div>
            </div>

        </nav>
    );
}

export default NavBar;