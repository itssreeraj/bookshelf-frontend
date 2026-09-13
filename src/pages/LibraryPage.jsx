import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import BookCard from '../components/BookCard.jsx';

export default function LibraryPage() {
  const { token } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ genre: '', language: '', author: '' });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .listBooks(token, { status: 'owned', ...filters })
      .then((data) => {
        if (!cancelled) setBooks(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, filters.genre, filters.language, filters.author]);

  return (
    <div>
      <header className="mb-8">
        <h2 className="font-display text-3xl text-walnut">The library</h2>
        <p className="text-ink/60 mt-1">
          {books.length} {books.length === 1 ? 'book' : 'books'} on the shelf
        </p>
      </header>

      <div className="flex flex-wrap gap-6 mb-8">
        <FilterInput
          placeholder="Filter by genre"
          value={filters.genre}
          onChange={(v) => setFilters((f) => ({ ...f, genre: v }))}
        />
        <FilterInput
          placeholder="Filter by language"
          value={filters.language}
          onChange={(v) => setFilters((f) => ({ ...f, language: v }))}
        />
        <FilterInput
          placeholder="Filter by author"
          value={filters.author}
          onChange={(v) => setFilters((f) => ({ ...f, author: v }))}
        />
      </div>

      {error && <p className="text-stamp-red mb-4">{error}</p>}
      {loading ? (
        <p className="text-ink/50 font-body">Pulling cards from the drawer…</p>
      ) : books.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterInput({ placeholder, value, onChange }) {
  return (
    <input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent border-b border-ink/30 focus:border-brass outline-none px-1 py-1 text-sm font-body"
    />
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-ink/20 p-10 text-center">
      <p className="font-display text-xl text-walnut mb-2">No cards in this drawer yet</p>
      <p className="text-ink/60">Add a book to start filling your shelves.</p>
    </div>
  );
}
