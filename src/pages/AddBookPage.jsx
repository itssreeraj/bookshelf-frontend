import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { Field, SelectField } from '../components/FormFields.jsx';
import Modal from '../components/Modal.jsx';
import IsbnScanner from '../components/IsbnScanner.jsx';

const BLANK_FORM = {
  title: '',
  subtitle: '',
  authors: '',
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
  const navigate = useNavigate();
  const [mode, setMode] = useState('isbn'); // 'isbn' | 'manual'
  const [isbn, setIsbn] = useState('');
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);

  async function performLookup(isbnValue) {
    setError(null);
    setBusy(true);
    try {
      const result = await api.lookupIsbn(token, isbnValue);
      setPreview(result);
    } catch (err) {
      setError(err.message);
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

  async function handleConfirmFromIsbn(status) {
    setBusy(true);
    setError(null);
    try {
      const book = await api.addFromIsbn(token, isbn, status);
      navigate(`/books/${book.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleManualSubmit(e) {
    e.preventDefault();
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
      navigate(`/books/${book.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
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
        <TabButton active={mode === 'isbn'} onClick={() => setMode('isbn')}>
          By ISBN
        </TabButton>
        <TabButton active={mode === 'manual'} onClick={() => setMode('manual')}>
          Enter manually
        </TabButton>
      </div>

      {error && <p className="text-stamp-red mb-4 text-sm">{error}</p>}

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
