import { NavLink, useMatch } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import './NavBar.scss'

export default function NavBar() {
    const [open, setOpen] = useState<'projects' | 'settings' | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);

    const navRef = useRef<HTMLElement>(null);

    const projectsActive = useMatch('/projects/*');
    const projectsMatch = useMatch('/projects/:page');

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (navRef.current && !navRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
                setOpen(null);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function closeAll() {
        setOpen(null);
        setMenuOpen(false);
    }

    return (
        <nav className='navbar' ref={navRef}>

            <NavLink className='nav-brand' to='/'>
                <img src='/favicon.png' />
                <span className='brand-text'>
                    <h2>llegonetwork</h2>
                    <h3>.dev</h3>
                </span>
            </NavLink>

            <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
                <NavLink to='/' onClick={closeAll}>Home</NavLink>

                <div className='nav-dropdown'>
                    <button
                        onClick={() => setOpen(open === 'projects' ? null : 'projects')}
                        className={projectsActive ? 'active' : ''}>
                        <span>
                            Projects
                            <span className={`caret ${open === 'projects' ? 'open' : ''}`} />
                        </span>
                        {projectsMatch && <span className='subroute'>{projectsMatch.params.page}</span>}
                    </button>

                    <div className={`dropdown-menu ${open === 'projects' ? 'open' : ''}`}>
                        <NavLink to='/projects' end onClick={closeAll}>All</NavLink>
                        <NavLink to='/projects/legobot' onClick={closeAll}>LegoBot</NavLink>
                        <NavLink to='/projects/legogpt' onClick={closeAll}>LegoGPT</NavLink>
                    </div>
                </div>
            </div>

            <button className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={() => { setMenuOpen(!menuOpen); setOpen(null); }}>
                <span />
                <span />
                <span />
            </button>

        </nav>
    );
}