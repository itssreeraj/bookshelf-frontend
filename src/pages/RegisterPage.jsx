import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register(email, password, displayName);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-walnut text-center mb-1">Your Library</h1>
        <p className="text-center text-ink/50 text-sm mb-8">Set up your card catalog</p>

        <form onSubmit={handleSubmit} className="bg-white/40 border border-ink/10 p-8 space-y-4">
          <label className="block">
            <span className="text-xs text-ink/50">Name</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="block w-full bg-transparent border-b border-ink/30 focus:border-brass outline-none py-1.5 font-body"
            />
          </label>
          <label className="block">
            <span className="text-xs text-ink/50">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full bg-transparent border-b border-ink/30 focus:border-brass outline-none py-1.5 font-body"
            />
          </label>
          <label className="block">
            <span className="text-xs text-ink/50">Password (at least 8 characters)</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full bg-transparent border-b border-ink/30 focus:border-brass outline-none py-1.5 font-body"
            />
          </label>
          {error && <p className="text-stamp-red text-sm">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-walnut text-parchment py-2 font-body text-sm disabled:opacity-50"
          >
            {busy ? 'Setting up…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-ink/50 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brass underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
