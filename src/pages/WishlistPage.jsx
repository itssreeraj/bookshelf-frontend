import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import BookCard from '../components/BookCard.jsx';
import Modal from '../components/Modal.jsx';

export default function WishlistPage() {
  const { token } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchasing, setPurchasing] = useState(null); // the book currently in the modal
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.listBooks(token, { status: 'wishlist' });
      setBooks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function openPurchaseModal(book) {
    setPurchasing(book);
    setPrice('');
    setError(null);
  }

  function closePurchaseModal() {
    if (saving) return;
    setPurchasing(null);
  }

  async function handleConfirmPurchase(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.markPurchased(token, purchasing.id, price || 0);
      setPurchasing(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <header className="mb-8">
        <h2 className="font-display text-3xl text-walnut">Wishlist</h2>
        <p className="text-ink/60 mt-1">
          {books.length} {books.length === 1 ? 'book' : 'books'} waiting for a shelf
        </p>
      </header>

      {error && !purchasing && <p className="text-stamp-red mb-4">{error}</p>}
      {loading ? (
        <p className="text-ink/50 font-body">Checking the want list…</p>
      ) : books.length === 0 ? (
        <div className="border border-dashed border-ink/20 p-10 text-center">
          <p className="font-display text-xl text-walnut mb-2">Nothing on the wishlist</p>
          <p className="text-ink/60">Add a book and mark it as wishlist to track it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <div key={book.id}>
              <BookCard book={book} />
              <button
                onClick={() => openPurchaseModal(book)}
                className="mt-2 text-xs font-body text-library-green hover:text-brass underline underline-offset-4"
              >
                Mark as purchased
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!purchasing} onClose={closePurchaseModal} title="Mark as purchased">
        {purchasing && (
          <form onSubmit={handleConfirmPurchase} className="space-y-4">
            <p className="text-sm text-ink/70">
              Moving <span className="font-display text-walnut">{purchasing.title}</span> from the wishlist to
              your shelf.
            </p>
            <label className="block">
              <span className="text-xs text-ink/50">What did you pay for it?</span>
              <input
                type="number"
                step="0.01"
                min="0"
                autoFocus
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="block w-full bg-transparent border-b border-ink/30 focus:border-brass outline-none py-1.5 font-body"
              />
            </label>
            {error && <p className="text-stamp-red text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-library-green text-parchment px-4 py-2 font-body text-sm disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={closePurchaseModal}
                disabled={saving}
                className="px-4 py-2 font-body text-sm text-ink/60 hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
