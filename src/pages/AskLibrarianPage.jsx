import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

const EXAMPLES = [
  "I'm preparing for the CA exam, recommend some books",
  "I'm interested in evolution, help me explore it, budget ₹2000",
];

export default function AskLibrarianPage() {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [addedKeys, setAddedKeys] = useState(new Set());
  const [addingKey, setAddingKey] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResults(null);
    try {
      const data = await api.getRecommendations(token, query);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function keyFor(rec) {
    return `${rec.title}::${rec.author}`;
  }

  async function handleAddToWishlist(rec) {
    const key = keyFor(rec);
    setAddingKey(key);
    setError(null);
    try {
      if (rec.verified && rec.isbn13) {
        await api.addFromIsbn(token, rec.isbn13, 'wishlist');
      } else {
        await api.createBook(token, {
          title: rec.title,
          authors: rec.author ? [rec.author] : [],
          status: 'wishlist',
          notes: rec.reason ? `AI-suggested: ${rec.reason}` : 'AI-suggested (unverified title)',
        });
      }
      setAddedKeys((prev) => new Set(prev).add(key));
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingKey(null);
    }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-3xl text-walnut mb-2">Ask the librarian</h2>
      <p className="text-ink/60 text-sm mb-6">
        Describe what you're looking for -- a goal, a subject, a budget -- and get book
        suggestions. This uses AI, so prices are estimates and titles are cross-checked
        against Google Books where possible, but always double-check before buying.
      </p>

      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={EXAMPLES[0]}
          rows={3}
          required
          className="block w-full bg-parchment border border-ink/20 focus:border-brass outline-none px-3 py-2 font-body text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          className="mt-3 bg-walnut text-parchment px-5 py-2 font-body text-sm disabled:opacity-50"
        >
          {busy ? 'Consulting the shelves…' : 'Ask'}
        </button>
      </form>

      <p className="text-xs text-ink/40 mb-8">
        For example: "{EXAMPLES[0]}" or "{EXAMPLES[1]}"
      </p>

      {error && (
        <div className="mb-6">
          <p className="text-stamp-red text-sm">{error}</p>
          {error.toLowerCase().includes('not configured') && (
            <p className="text-xs text-ink/50 mt-1">
              This feature needs an Anthropic API key set up on the backend -- see the backend
              README for setup steps.
            </p>
          )}
        </div>
      )}

      {results && results.length === 0 && (
        <p className="text-ink/60 text-sm">No suggestions came back -- try rephrasing your request.</p>
      )}

      {results && results.length > 0 && (
        <div className="space-y-4">
          {results.map((rec) => {
            const key = keyFor(rec);
            const added = addedKeys.has(key);
            return (
              <div key={key} className="bg-parchment border border-ink/20 p-5 relative flex gap-4">
                <div className="absolute top-3 left-5 right-5 h-px bg-stamp-red/40" />
                {rec.coverUrl && (
                  <img
                    src={rec.coverUrl}
                    alt=""
                    className="w-16 h-24 object-cover border border-ink/10 shrink-0 mt-2"
                  />
                )}
                <div className="flex-1 mt-2">
                  <h3 className="font-display text-lg text-walnut leading-snug">{rec.title}</h3>
                  {rec.author && <p className="text-sm text-ink/70">{rec.author}</p>}
                  {rec.reason && <p className="text-sm text-ink/60 italic mt-1">{rec.reason}</p>}

                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                    {rec.estimatedPriceInr != null && (
                      <span className="text-brass font-semibold">~₹{rec.estimatedPriceInr} (estimated)</span>
                    )}
                    {rec.verified ? (
                      <span className="text-library-green">Verified in Google Books</span>
                    ) : (
                      <span className="text-stamp-red">Couldn't verify this title exists</span>
                    )}
                    {rec.publisher && <span className="text-ink/40">{rec.publisher}</span>}
                  </div>

                  <button
                    onClick={() => handleAddToWishlist(rec)}
                    disabled={addingKey === key || added}
                    className="mt-3 text-sm text-library-green hover:text-brass underline underline-offset-4 disabled:opacity-50 disabled:no-underline"
                  >
                    {added ? 'Added to wishlist' : addingKey === key ? 'Adding…' : 'Add to wishlist'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
