import { useState } from 'react';
import { Field, SelectField, TextAreaField } from './FormFields.jsx';

function toFormState(book) {
  return {
    title: book.title || '',
    subtitle: book.subtitle || '',
    authors: (book.authors || []).join(', '),
    genre: book.genre || '',
    subjects: (book.subjects || []).join(', '),
    type: book.type || 'physical',
    status: book.status || 'owned',
    condition: book.condition || '',
    language: book.language || 'en',
    shelfLocation: book.shelfLocation || '',
    publisher: book.publisher || '',
    publicationYear: book.publicationYear ?? '',
    pageCount: book.pageCount ?? '',
    notes: book.notes || '',
    description: book.description || '',
  };
}

function splitList(value) {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function BookEditForm({ book, onSave, onCancel, busy }) {
  const [form, setForm] = useState(() => toFormState(book));

  function set(key) {
    return (value) => setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      ...form,
      authors: splitList(form.authors),
      subjects: splitList(form.subjects),
      condition: form.condition || null,
      publicationYear: form.publicationYear ? Number(form.publicationYear) : null,
      pageCount: form.pageCount ? Number(form.pageCount) : null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Title" required value={form.title} onChange={set('title')} />
      <Field label="Subtitle" value={form.subtitle} onChange={set('subtitle')} />
      <Field label="Authors (comma separated)" value={form.authors} onChange={set('authors')} />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Genre" value={form.genre} onChange={set('genre')} />
        <Field label="Language" value={form.language} onChange={set('language')} />
      </div>

      <Field label="Subjects (comma separated)" value={form.subjects} onChange={set('subjects')} />

      <div className="grid grid-cols-3 gap-4">
        <SelectField label="Type" value={form.type} onChange={set('type')} options={['physical', 'ebook', 'audiobook']} />
        <SelectField label="Status" value={form.status} onChange={set('status')} options={['owned', 'wishlist', 'borrowed', 'lent_out']} />
        <SelectField
          label="Condition"
          value={form.condition}
          onChange={set('condition')}
          options={['', 'NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']}
        />
      </div>

      <Field label="Shelf location" value={form.shelfLocation} onChange={set('shelfLocation')} />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Publisher" value={form.publisher} onChange={set('publisher')} />
        <Field label="Published year" type="number" value={form.publicationYear} onChange={set('publicationYear')} />
      </div>

      <Field label="Page count" type="number" value={form.pageCount} onChange={set('pageCount')} />
      <TextAreaField label="Description" value={form.description} onChange={set('description')} />
      <TextAreaField label="Notes" value={form.notes} onChange={set('notes')} rows={2} />

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="bg-walnut text-parchment px-5 py-2 font-body text-sm disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="px-5 py-2 font-body text-sm text-ink/60 hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
