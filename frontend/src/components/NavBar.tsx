import { NavLink, useMatch } from 'react-router';
import { useState, useEffect, useRef } from 'react';
import './NavBar.scss';

import legobotIcon from '../assets/legobot.png';
import legogptIcon from '../assets/legogpt.png';
import statsbotIcon from '../assets/statsbot.png';

type User = {
  userId: string;
  username: string;
  avatar: string | null;
};

type DropdownItem = {
  label: string;
  to: string;
  icon?: string;
  divider?: boolean;
};

const botItems: DropdownItem[] = [
  { label: 'Overview', to: '/bots' },
  { divider: true, label: '', to: ''},
  { label: 'LegoBot', to: '/bots/legobot', icon: legobotIcon },
  { label: 'LegoGPT', to: '/bots/legogpt', icon: legogptIcon },
  { label: 'StatsBot', to: '/bots/statsbot', icon: statsbotIcon },
];

export default function NavBar() {
  const [open, setOpen] = useState<'bots' | 'user' | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const navRef = useRef<HTMLElement>(null);

  const botsActive = useMatch('/bots/*');
  const botsMatch = useMatch('/bots/:page');

  useEffect(() => {
    fetch('https://api.llegonetwork.dev/user', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d) setUser(d);
      });
  }, []);

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
    <nav className="navbar" ref={navRef}>
      <NavLink className="nav-brand" to="/">
        <img src="/favicon.png" />
        <span className="brand-text">
          <h2>llegonetwork</h2>
          <h3>.dev</h3>
        </span>
      </NavLink>

      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        {user ? (
          <div className="nav-dropdown user">
            <button onClick={() => setOpen(open === 'user' ? null : 'user')}>
              <span>
                <img src={avatarUrl} />
                <span className="username">{user.username}</span>
                <span className={`caret ${open === 'user' ? 'open' : ''}`} />
              </span>
            </button>

            <div className={`dropdown-menu ${open === 'user' ? 'open' : ''}`}>
              <a
                href={`https://api.llegonetwork.dev/auth/logout?redirect=${encodeURIComponent(
                  window.location.href
                )}`}
              >
                Logout
              </a>
            </div>
          </div>
        ) : (
          <a
            className="login"
            href={`https://api.llegonetwork.dev/auth/login?redirect=${encodeURIComponent(
              window.location.href
            )}`}
          >
            Login with Discord
          </a>
        )}

        <NavLink to="/" onClick={closeAll}>
          Home
        </NavLink>

        <NavLink to="/projects" onClick={closeAll}>
          Projects
        </NavLink>

        <div className="nav-dropdown">
          <button
            onClick={() => setOpen(open === 'bots' ? null : 'bots')}
            className={botsActive ? 'active' : ''}
          >
            <span>
              Discord Bots
              <span className={`caret ${open === 'bots' ? 'open' : ''}`} />
            </span>

            {botsMatch && (
              <span className="subroute">{botsMatch.params.page}</span>
            )}
          </button>

          <div className={`dropdown-menu ${open === 'bots' ? 'open' : ''}`}>
            {botItems.map((item, idx) =>
              item.divider ? (
                <div key={`divider-${idx}`} className="dropdown-divider" />
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/bots'}
                  onClick={closeAll}
                  className="dropdown-item"
                >
                  {item.icon && (
                    <img
                      src={item.icon}
                      alt={item.label}
                      className="dropdown-icon"
                    />
                  )}
                  <span>{item.label}</span>
                </NavLink>
              )
            )}
          </div>
        </div>

        <NavLink to="/settings" onClick={closeAll}>
          Settings
        </NavLink>
        <NavLink to="/socials" onClick={closeAll}>
          Socials
        </NavLink>
      </div>

      <button
        className={`hamburger ${menuOpen ? 'open' : ''}`}
        onClick={() => {
          setMenuOpen(!menuOpen);
          setOpen(null);
        }}
      >
        <span />
        <span />
        <span />
      </button>
    </nav>
  );
}