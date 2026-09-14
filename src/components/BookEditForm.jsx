import { useState } from 'react';
import { Field, SelectField, TextAreaField } from './FormFields.jsx';

function toFormState(book) {
  return {
    title: book.title || '',
    subtitle: book.subtitle || '',
    authors: (book.authors || []).join(', '),
    isbn10: book.isbn10 || '',
    isbn13: book.isbn13 || '',
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

// Checksum validation, not just a shape check -- catches typos and mis-scans,
// not just wrong lengths. Mirrors the algorithm the backend uses for ISBN-10/13
// conversion, run here in reverse as a pass/fail check.
function isValidIsbn10(value) {
  if (!/^\d{9}[\dXx]$/.test(value)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += (i + 1) * Number(value[i]);
  const last = value[9].toUpperCase();
  sum += 10 * (last === 'X' ? 10 : Number(last));
  return sum % 11 === 0;
}

function isValidIsbn13(value) {
  if (!/^\d{13}$/.test(value)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(value[i]) * (i % 2 === 0 ? 1 : 3);
  const check = (10 - (sum % 10)) % 10;
  return check === Number(value[12]);
}

export default function BookEditForm({ book, onSave, onCancel, busy }) {
  const [form, setForm] = useState(() => toFormState(book));
  const [forceSave, setForceSave] = useState(false);

  function set(key) {
    return (value) => setForm((f) => ({ ...f, [key]: value }));
  }

  const isbn10Invalid = form.isbn10.trim() !== '' && !isValidIsbn10(form.isbn10.trim());
  const isbn13Invalid = form.isbn13.trim() !== '' && !isValidIsbn13(form.isbn13.trim());
  const hasInvalidIsbn = isbn10Invalid || isbn13Invalid;

  const blockedBySave = hasInvalidIsbn && !forceSave;

  function handleSubmit(e) {
    e.preventDefault();
    if (blockedBySave) return; // shouldn't happen since the button is disabled, but stay safe
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
        <div>
          <Field label="ISBN-10" value={form.isbn10} onChange={set('isbn10')} />
          {isbn10Invalid && (
            <p className="text-xs text-stamp-red mt-1">
              This doesn't check out as a valid ISBN-10 -- double check it, or use "save anyway" below.
            </p>
          )}
        </div>
        <div>
          <Field label="ISBN-13" value={form.isbn13} onChange={set('isbn13')} />
          {isbn13Invalid && (
            <p className="text-xs text-stamp-red mt-1">
              This doesn't check out as a valid ISBN-13 -- double check it, or use "save anyway" below.
            </p>
          )}
        </div>
      </div>

      {hasInvalidIsbn && (
        <label className="flex items-center gap-2 text-sm text-ink/70 font-body">
          <input type="checkbox" checked={forceSave} onChange={(e) => setForceSave(e.target.checked)} />
          Save anyway -- ISBN lookups aren't always right, and this might be a real edition the
          checksum math doesn't expect.
        </label>
      )}

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
          disabled={busy || blockedBySave}
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
