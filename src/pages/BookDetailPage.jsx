import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import BookEditForm from '../components/BookEditForm.jsx';

export default function BookDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [error, setError] = useState(null);
  const [research, setResearch] = useState([]);
  const [researching, setResearching] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getBook(token, id).then(setBook).catch((err) => setError(err.message));
    api.getResearch(token, id).then(setResearch).catch(() => {});
  }, [token, id]);

  async function handleResearch() {
    setResearching(true);
    setError(null);
    try {
      const results = await api.runResearch(token, id, false);
      setResearch(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setResearching(false);
    }
  }

  async function handleSaveEdit(payload) {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateBook(token, id, payload);
      setBook(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Remove "${book.title}" from your library?`)) return;
    await api.deleteBook(token, id);
    navigate(book.status === 'wishlist' ? '/wishlist' : '/');
  }

  if (error && !book) return <p className="text-stamp-red">{error}</p>;
  if (!book) return <p className="text-ink/50 font-body">Pulling the card…</p>;

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate(-1)} className="text-sm text-ink/50 hover:text-brass mb-6">
        ← Back to the drawer
      </button>

      <div className="bg-parchment border border-ink/20 p-8 relative">
        <div className="absolute top-4 left-8 right-8 h-px bg-stamp-red/40" />

        {editing ? (
          <div className="mt-4">
            <h2 className="font-display text-2xl text-walnut mb-6">Edit this card</h2>
            <BookEditForm book={book} onSave={handleSaveEdit} onCancel={() => setEditing(false)} busy={saving} />
            {error && <p className="text-stamp-red mt-4 text-sm">{error}</p>}
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl text-walnut mt-4">{book.title}</h2>
                {book.subtitle && <p className="font-display text-lg text-ink/60 italic">{book.subtitle}</p>}
              </div>
              <button
                onClick={() => setEditing(true)}
                className="mt-4 text-sm text-brass hover:text-brass-light underline underline-offset-4 whitespace-nowrap"
              >
                Edit
              </button>
            </div>
            {book.authors?.length > 0 && <p className="font-body text-ink/70 mt-2">{book.authors.join(', ')}</p>}

            <dl className="grid grid-cols-2 gap-4 mt-6 text-sm font-body">
              <Detail label="Genre" value={book.genre} />
              <Detail label="Language" value={book.language} />
              <Detail label="Type" value={book.type} />
              <Detail label="Status" value={book.status} />
              <Detail label="Condition" value={book.condition} />
              <Detail label="ISBN" value={book.isbn13 || book.isbn10} />
              <Detail label="Publisher" value={book.publisher} />
              <Detail label="Published" value={book.publicationYear} />
              <Detail label="Pages" value={book.pageCount} />
              <Detail label="Shelf" value={book.shelfLocation} />
            </dl>

            {book.subjects?.length > 0 && (
              <p className="mt-4 text-sm text-ink/60">
                <span className="text-ink/40">Subjects: </span>
                {book.subjects.join(', ')}
              </p>
            )}

            {book.description && <p className="mt-6 text-sm leading-relaxed text-ink/80">{book.description}</p>}

            <div className="mt-8 flex gap-4">
              <button
                onClick={handleResearch}
                disabled={researching}
                className="bg-library-green text-parchment px-4 py-2 font-body text-sm hover:bg-library-green/90 disabled:opacity-50"
              >
                {researching ? 'Researching…' : 'Research this book'}
              </button>
              <button
                onClick={handleDelete}
                className="border border-stamp-red text-stamp-red px-4 py-2 font-body text-sm hover:bg-stamp-red hover:text-parchment"
              >
                Remove from library
              </button>
            </div>

            {error && <p className="text-stamp-red mt-4 text-sm">{error}</p>}

            {research.length > 0 && (
              <div className="mt-8 pt-6 border-t border-ink/10">
                <h3 className="font-display text-lg text-walnut mb-3">What we found</h3>
                <ul className="space-y-2">
                  {research.map((r) => (
                    <li key={r.source} className="flex items-center justify-between text-sm font-body">
                      <span className="text-ink/70">
                        {r.source}
                        {r.availability ? ` — ${r.availability}` : ''}
                      </span>
                      <span className="flex items-center gap-3">
                        {r.price != null && (
                          <span className="text-brass font-semibold">
                            {r.currency} {r.price}
                          </span>
                        )}
                        {r.listingUrl && (
                          <a
                            href={r.listingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-library-green underline underline-offset-4"
                          >
                            Open
                          </a>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-ink/40 text-xs">{label}</dt>
      <dd className="text-ink/80">{value}</dd>
    </div>
  );
}
