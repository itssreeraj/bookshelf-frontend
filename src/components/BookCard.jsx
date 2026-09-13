import { Link } from 'react-router-dom';

export default function BookCard({ book }) {
  const langLabel = (book.language || 'en').slice(0, 2).toUpperCase();
  const isWishlist = book.status === 'wishlist';

  return (
    <Link
      to={`/books/${book.id}`}
      className="group relative block bg-parchment border border-ink/20 p-5 pt-6 transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(62,43,35,0.25)]"
    >
      {/* ruled guideline, like a real index card */}
      <div className="absolute top-3 left-5 right-5 h-px bg-stamp-red/40" />

      {/* language stamp */}
      <div className="absolute -top-2 -right-2 w-9 h-9 rounded-full border-2 border-dashed border-brass/70 flex items-center justify-center bg-parchment text-[10px] font-body text-brass rotate-6">
        {langLabel}
      </div>

      {isWishlist && (
        <div className="absolute top-4 right-6 rotate-[-8deg] text-stamp-red border-2 border-stamp-red rounded px-2 py-0.5 text-xs font-display tracking-wide opacity-80">
          Want
        </div>
      )}

      <h3 className="font-display text-xl text-walnut leading-snug pr-8">{book.title}</h3>
      {book.authors?.length > 0 && (
        <p className="font-body text-sm italic text-ink/70 mt-1">{book.authors.join(', ')}</p>
      )}

      <div className="mt-4 pt-3 border-t border-ink/10 text-xs font-body text-ink/60 flex items-center justify-between">
        <span>{book.genre || 'Unsorted'}</span>
        {book.shelfLocation && <span className="text-brass">{book.shelfLocation}</span>}
      </div>
    </Link>
  );
}
