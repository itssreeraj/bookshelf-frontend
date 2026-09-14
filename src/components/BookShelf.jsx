import BookCard from './BookCard.jsx';

export default function BookShelf({ label, books }) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        {/* shelf label plate, like the label holders on a real library shelf edge */}
        <span className="inline-block bg-brass/10 border border-brass/50 text-brass px-3 py-1 font-display text-sm">
          {label}
        </span>
        <span className="text-xs text-ink/40 font-body">
          {books.length} {books.length === 1 ? 'book' : 'books'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>

      {/* the shelf plank itself */}
      <div className="h-4 bg-walnut relative shadow-[0_6px_10px_-4px_rgba(62,43,35,0.5)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-brass/40" />
      </div>
    </section>
  );
}
