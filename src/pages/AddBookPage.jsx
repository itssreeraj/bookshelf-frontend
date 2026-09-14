import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { Field, SelectField } from '../components/FormFields.jsx';
import Modal from '../components/Modal.jsx';
import IsbnScanner from '../components/IsbnScanner.jsx';

const BLANK_FORM = {
  title: '',
  subtitle: '',
  authors: '',
  isbn13: '',
  genre: '',
  subjects: '',
  type: 'physical',
  language: 'en',
  status: 'owned',
  shelfLocation: '',
  notes: '',
  publisher: '',
  publicationYear: '',
  pageCount: '',
};

export default function AddBookPage() {
  const { token } = useAuth();
  const [mode, setMode] = useState('isbn'); // 'isbn' | 'manual'
  const [isbn, setIsbn] = useState('');
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [error, setError] = useState(null);
  const [lookupFailed, setLookupFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastAdded, setLastAdded] = useState(null); // { id, title, status }
  const [duplicate, setDuplicate] = useState(null); // the existing Book, when one is found
  const [pendingAction, setPendingAction] = useState(null); // () => void, runs on "Add anyway"

  async function performLookup(isbnValue) {
    setError(null);
    setLookupFailed(false);
    setLastAdded(null);
    setBusy(true);
    try {
      const result = await api.lookupIsbn(token, isbnValue);
      setPreview(result);
    } catch (err) {
      setError(err.message);
      setLookupFailed(true);
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }

  function handleLookup(e) {
    e.preventDefault();
    performLookup(isbn);
  }

  function handleScanned(scannedIsbn) {
    setScanning(false);
    setIsbn(scannedIsbn);
    performLookup(scannedIsbn);
  }

  async function addFromIsbnNow(status) {
    setBusy(true);
    setError(null);
    try {
      const book = await api.addFromIsbn(token, isbn, status);
      // Stay on this page instead of navigating away, so scanning/adding a
      // stack of books in one sitting doesn't require re-opening this tab
      // every time. A confirmation with a link covers anyone who does want
      // to jump straight to the new book.
      setLastAdded({ id: book.id, title: book.title, status: book.status });
      setPreview(null);
      setIsbn('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmFromIsbn(status) {
    setBusy(true);
    setError(null);
    try {
      const existing = await api.checkIsbnExists(token, isbn);
      setBusy(false);
      if (existing) {
        setDuplicate(existing);
        setPendingAction(() => () => addFromIsbnNow(status));
        return;
      }
      await addFromIsbnNow(status);
    } catch (err) {
      setBusy(false);
      setError(err.message);
    }
  }

  async function submitManualNow() {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        ...form,
        authors: splitList(form.authors),
        subjects: splitList(form.subjects),
        publicationYear: form.publicationYear ? Number(form.publicationYear) : null,
        pageCount: form.pageCount ? Number(form.pageCount) : null,
      };
      const book = await api.createBook(token, payload);
      setLastAdded({ id: book.id, title: book.title, status: book.status });
      setForm(BLANK_FORM);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleManualSubmit(e) {
    e.preventDefault();
    const isbnValue = form.isbn13.trim();
    if (!isbnValue) {
      submitManualNow();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const existing = await api.checkIsbnExists(token, isbnValue);
      setBusy(false);
      if (existing) {
        setDuplicate(existing);
        setPendingAction(() => () => submitManualNow());
        return;
      }
      await submitManualNow();
    } catch (err) {
      setBusy(false);
      setError(err.message);
    }
  }

  function handleAddManuallyInstead() {
    setForm((f) => ({ ...f, isbn13: isbn }));
    setMode('manual');
    setError(null);
    setLookupFailed(false);
  }

  function confirmDuplicateAnyway() {
    const action = pendingAction;
    setDuplicate(null);
    setPendingAction(null);
    action?.();
  }

  function cancelDuplicate() {
    setDuplicate(null);
    setPendingAction(null);
  }

  function splitList(value) {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-3xl text-walnut mb-6">Add a book</h2>

      <div className="flex gap-6 mb-8 border-b border-ink/10">
        <TabButton
          active={mode === 'isbn'}
          onClick={() => {
            setMode('isbn');
            setError(null);
          }}
        >
          By ISBN
        </TabButton>
        <TabButton
          active={mode === 'manual'}
          onClick={() => {
            setMode('manual');
            setError(null);
          }}
        >
          Enter manually
        </TabButton>
      </div>

      {lastAdded && (
        <div className="mb-6 bg-library-green/10 border border-library-green/30 px-4 py-3 flex items-center justify-between text-sm font-body">
          <span className="text-ink/80">
            Added <span className="font-display text-walnut">{lastAdded.title}</span> to your{' '}
            {lastAdded.status === 'wishlist' ? 'wishlist' : 'library'}.
          </span>
          <Link to={`/books/${lastAdded.id}`} className="text-library-green underline underline-offset-4 whitespace-nowrap ml-4">
            View it
          </Link>
        </div>
      )}

      <Modal open={!!duplicate} onClose={cancelDuplicate} title="You already have this book">
        {duplicate && (
          <div>
            <p className="text-sm text-ink/70 mb-4">
              A book with this ISBN is already in your {duplicate.status === 'wishlist' ? 'wishlist' : 'library'}:
            </p>
            <div className="bg-parchment border border-ink/20 p-4 relative mb-4">
              <div className="absolute top-2 left-4 right-4 h-px bg-stamp-red/40" />
              <h4 className="font-display text-lg text-walnut mt-2">{duplicate.title}</h4>
              {duplicate.authors?.length > 0 && <p className="text-sm text-ink/70 mt-1">{duplicate.authors.join(', ')}</p>}
              <p className="text-xs text-ink/40 mt-2">
                {duplicate.status === 'wishlist' ? 'On your wishlist' : 'In your library'}
                {duplicate.shelfLocation ? ` — ${duplicate.shelfLocation}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={confirmDuplicateAnyway}
                disabled={busy}
                className="bg-walnut text-parchment px-4 py-2 font-body text-sm disabled:opacity-50"
              >
                Add it anyway
              </button>
              <button onClick={cancelDuplicate} className="px-4 py-2 font-body text-sm text-ink/60 hover:text-ink">
                Cancel
              </button>
              <Link
                to={`/books/${duplicate.id}`}
                className="text-sm text-library-green underline underline-offset-4"
              >
                View existing
              </Link>
            </div>
          </div>
        )}
      </Modal>

      {error && (
        <div className="mb-4">
          <p className="text-stamp-red text-sm">{error}</p>
          {lookupFailed && mode === 'isbn' && (
            <p className="text-sm mt-1 space-x-3">
              <a
                href={`https://www.google.com/search?q=isbn+${encodeURIComponent(isbn)}`}
                target="_blank"
                rel="noreferrer"
                className="text-brass hover:text-brass-light underline underline-offset-4"
              >
                Search Google for this ISBN
              </a>
              <button
                type="button"
                onClick={handleAddManuallyInstead}
                className="text-library-green hover:text-brass underline underline-offset-4"
              >
                Add it manually instead
              </button>
            </p>
          )}
        </div>
      )}

      {mode === 'isbn' ? (
        <div>
          <form onSubmit={handleLookup} className="flex gap-3 mb-3">
            <input
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="Type an ISBN"
              className="flex-1 bg-transparent border-b border-ink/30 focus:border-brass outline-none px-1 py-2 font-body"
              required
            />
            <button
              type="submit"
              disabled={busy}
              className="bg-walnut text-parchment px-4 py-2 font-body text-sm disabled:opacity-50"
            >
              Look up
            </button>
          </form>

          <button
            type="button"
            onClick={() => setScanning(true)}
            className="mb-6 text-sm text-brass hover:text-brass-light underline underline-offset-4"
          >
            Or scan the barcode with your camera
          </button>

          <Modal open={scanning} onClose={() => setScanning(false)} title="Scan a barcode">
            {scanning && <IsbnScanner onDetected={handleScanned} onClose={() => setScanning(false)} />}
          </Modal>

          {preview && (
            <div className="bg-parchment border border-ink/20 p-6 relative">
              <div className="absolute top-3 left-6 right-6 h-px bg-stamp-red/40" />
              <h3 className="font-display text-xl text-walnut mt-3">{preview.title}</h3>
              {preview.authors?.length > 0 && <p className="text-ink/70 mt-1">{preview.authors.join(', ')}</p>}
              <p className="text-xs text-ink/40 mt-3">Found via {preview.source}</p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleConfirmFromIsbn('owned')}
                  disabled={busy}
                  className="bg-library-green text-parchment px-4 py-2 font-body text-sm disabled:opacity-50"
                >
                  Add to library
                </button>
                <button
                  onClick={() => handleConfirmFromIsbn('wishlist')}
                  disabled={busy}
                  className="border border-brass text-brass px-4 py-2 font-body text-sm hover:bg-brass hover:text-walnut disabled:opacity-50"
                >
                  Add to wishlist
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <Field label="Title" required value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} />
          <Field label="Subtitle" value={form.subtitle} onChange={(v) => setForm((f) => ({ ...f, subtitle: v }))} />
          <Field
            label="Authors (comma separated)"
            value={form.authors}
            onChange={(v) => setForm((f) => ({ ...f, authors: v }))}
          />
          <Field label="ISBN" value={form.isbn13} onChange={(v) => setForm((f) => ({ ...f, isbn13: v }))} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Genre" value={form.genre} onChange={(v) => setForm((f) => ({ ...f, genre: v }))} />
            <Field
              label="Language"
              value={form.language}
              onChange={(v) => setForm((f) => ({ ...f, language: v }))}
            />
          </div>
          <Field
            label="Subjects (comma separated)"
            value={form.subjects}
            onChange={(v) => setForm((f) => ({ ...f, subjects: v }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Type"
              value={form.type}
              onChange={(v) => setForm((f) => ({ ...f, type: v }))}
              options={['physical', 'ebook', 'audiobook']}
            />
            <SelectField
              label="Status"
              value={form.status}
              onChange={(v) => setForm((f) => ({ ...f, status: v }))}
              options={['owned', 'wishlist']}
            />
          </div>
          <Field
            label="Shelf location"
            value={form.shelfLocation}
            onChange={(v) => setForm((f) => ({ ...f, shelfLocation: v }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Publisher"
              value={form.publisher}
              onChange={(v) => setForm((f) => ({ ...f, publisher: v }))}
            />
            <Field
              label="Published year"
              type="number"
              value={form.publicationYear}
              onChange={(v) => setForm((f) => ({ ...f, publicationYear: v }))}
            />
          </div>
          <Field label="Notes" value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} />

          <button
            type="submit"
            disabled={busy}
            className="bg-walnut text-parchment px-5 py-2 font-body text-sm disabled:opacity-50"
          >
            {busy ? 'Filing it away…' : 'Add to shelf'}
          </button>
        </form>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 font-display text-lg border-b-2 -mb-px ${
        active ? 'border-brass text-walnut' : 'border-transparent text-ink/40 hover:text-ink/70'
      }`}
    >
      {children}
    </button>
  );
}
