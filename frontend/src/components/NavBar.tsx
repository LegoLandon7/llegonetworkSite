import { NavLink, useMatch } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import './NavBar.scss'

type User = { userId: string, username: string, avatar: string | null };

export default function NavBar() {
    const [open, setOpen] = useState<'projects' | 'user' | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    const navRef = useRef<HTMLElement>(null);
    const projectsActive = useMatch('/projects/*');
    const projectsMatch = useMatch('/projects/:page');

    // fetch user data
    useEffect(() => {
        fetch('https://api.llegonetwork.dev/user', { credentials: 'include' })
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d) setUser(d); });
    }, []);

    // closes dropdowns
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

    const avatarUrl = user?.avatar
        ? `https://cdn.discordapp.com/avatars/${user.userId}/${user.avatar}.png`
        : '/favicon.png';

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
                {user ? (
                    <div className='nav-dropdown user'>
                        <button onClick={() => setOpen(open === 'user' ? null : 'user')}>
                            <span>
                                <img src={avatarUrl} />
                                <span className='username'>{user.username}</span>
                                <span className={`caret ${open === 'user' ? 'open' : ''}`} />
                            </span>
                        </button>

                        <div className={`dropdown-menu ${open === 'user' ? 'open' : ''}`}>
                            <a href={`https://api.llegonetwork.dev/auth/logout?redirect=${encodeURIComponent(window.location.href)}`}>Logout</a>
                        </div>
                    </div>
                ) : (
                    <a className='login' href={`https://api.llegonetwork.dev/auth/login?redirect=${encodeURIComponent(window.location.href)}`}>Login with Discord</a>
                )}

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
                        <NavLink to='/projects' end onClick={closeAll}>Overview</NavLink>
                        <NavLink to='/projects/legobot' onClick={closeAll}>LegoBot</NavLink>
                        <NavLink to='/projects/legogpt' onClick={closeAll}>LegoGPT</NavLink>
                        <NavLink to='/projects/welcomer' onClick={closeAll}>Welcomer</NavLink>
                    </div>
                </div>

                <NavLink to='/settings' onClick={closeAll}>Settings</NavLink>
                <NavLink to='/socials' onClick={closeAll}>Socials</NavLink>
            </div>

            <button
                className={`hamburger ${menuOpen ? 'open' : ''}`}
                onClick={() => { setMenuOpen(!menuOpen); setOpen(null); }}>
                <span />
                <span />
                <span />
            </button>

        </nav>
    );
}