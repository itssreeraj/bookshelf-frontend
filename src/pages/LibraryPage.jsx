import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import BookCard from '../components/BookCard.jsx';
import BookShelf from '../components/BookShelf.jsx';

const GROUP_OPTIONS = [
  { value: 'genre', label: 'Genre' },
  { value: 'language', label: 'Language' },
  { value: 'author', label: 'Author' },
  { value: 'subject', label: 'Subject' },
  { value: 'none', label: 'All books' },
];

const LANGUAGE_NAMES = {
  en: 'English',
  hi: 'Hindi',
  ml: 'Malayalam',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ja: 'Japanese',
  zh: 'Chinese',
  ar: 'Arabic',
  ru: 'Russian',
};

function languageLabel(code) {
  if (!code) return 'Unspecified';
  const key = code.toLowerCase().slice(0, 2);
  return LANGUAGE_NAMES[key] || code.toUpperCase();
}

const CATCH_ALL_KEYS = new Set(['unsorted', 'unspecified', 'unknown-author', 'unclassified']);

/**
 * Groups books into labeled shelves by the chosen dimension. Genre and
 * language are one value per book; author and subject are arrays, so a
 * book can legitimately land on more than one shelf there -- the same way
 * a real catalog lists a book under every subject heading it fits, even
 * though it only physically sits on one shelf.
 */
function groupBooks(books, groupBy) {
  if (groupBy === 'none') return null;

  const buckets = new Map(); // key -> { label, books: [] }
  function addTo(key, label, book) {
    if (!buckets.has(key)) buckets.set(key, { label, books: [] });
    buckets.get(key).books.push(book);
  }

  for (const book of books) {
    if (groupBy === 'genre') {
      const label = book.genre?.trim() || 'Unsorted';
      addTo(label.toLowerCase(), label, book);
    } else if (groupBy === 'language') {
      const label = languageLabel(book.language);
      addTo(label.toLowerCase(), label, book);
    } else if (groupBy === 'author') {
      if (book.authors?.length) {
        for (const author of book.authors) addTo(author.toLowerCase(), author, book);
      } else {
        addTo('unknown-author', 'Unknown author', book);
      }
    } else if (groupBy === 'subject') {
      if (book.subjects?.length) {
        for (const subject of book.subjects) addTo(subject.toLowerCase(), subject, book);
      } else {
        addTo('unclassified', 'Unclassified', book);
      }
    }
  }

  return [...buckets.entries()]
    .sort(([keyA], [keyB]) => {
      const aCatch = CATCH_ALL_KEYS.has(keyA);
      const bCatch = CATCH_ALL_KEYS.has(keyB);
      if (aCatch !== bCatch) return aCatch ? 1 : -1;
      return keyA.localeCompare(keyB);
    })
    .map(([key, value]) => ({ key, ...value }));
}

export default function LibraryPage() {
  const { token } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ title: '', genre: '', language: '', author: '' });
  const [groupBy, setGroupBy] = useState('genre');

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
  }, [token, filters.title, filters.genre, filters.language, filters.author]);

  const shelves = useMemo(() => groupBooks(books, groupBy), [books, groupBy]);

  return (
    <div>
      <header className="mb-8">
        <h2 className="font-display text-3xl text-walnut">The library</h2>
        <p className="text-ink/60 mt-1">
          {books.length} {books.length === 1 ? 'book' : 'books'} on the shelf
        </p>
      </header>

      <div className="flex flex-wrap gap-6 mb-6">
        <FilterInput
          placeholder="Filter by title"
          value={filters.title}
          onChange={(v) => setFilters((f) => ({ ...f, title: v }))}
        />
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

      <div className="flex flex-wrap items-center gap-2 mb-8">
        <span className="text-xs text-ink/40 font-body mr-1">Arrange by shelf:</span>
        {GROUP_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setGroupBy(opt.value)}
            className={`px-3 py-1 text-xs font-body border transition-colors ${
              groupBy === opt.value
                ? 'bg-brass text-walnut border-brass'
                : 'border-ink/20 text-ink/60 hover:border-brass hover:text-brass'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && <p className="text-stamp-red mb-4">{error}</p>}
      {loading ? (
        <p className="text-ink/50 font-body">Pulling cards from the drawer…</p>
      ) : books.length === 0 ? (
        <EmptyState />
      ) : shelves ? (
        shelves.map((shelf) => <BookShelf key={shelf.key} label={shelf.label} books={shelf.books} />)
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
