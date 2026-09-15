import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { to: '/', label: 'The library', end: true },
  { to: '/wishlist', label: 'Wishlist' },
  { to: '/add', label: 'Add a book' },
  { to: '/ask', label: 'Ask the librarian' },
];

export default function DrawerNav() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-56 shrink-0 bg-walnut text-parchment flex flex-col justify-between">
      <div>
        <div className="px-6 py-8 border-b border-brass/30">
          <h1 className="font-display text-2xl leading-tight">Your Library</h1>
          <p className="text-xs text-parchment/60 mt-1">Card catalog</p>
        </div>
        <nav className="mt-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `block px-6 py-3 font-display text-lg border-l-4 transition-colors ${
                  isActive
                    ? 'border-brass bg-walnut/60 text-parchment'
                    : 'border-transparent text-parchment/70 hover:text-parchment hover:border-brass/40'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="px-6 py-6 border-t border-brass/30 text-sm">
        <p className="text-parchment/60 mb-2 truncate">{user?.email}</p>
        <button onClick={logout} className="text-brass hover:text-brass-light underline underline-offset-4">
          Sign out
        </button>
      </div>
    </aside>
  );
}
