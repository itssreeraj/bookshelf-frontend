export function Field({ label, value, onChange, type = 'text', required }) {
  return (
    <label className="block">
      <span className="text-xs text-ink/50">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full bg-transparent border-b border-ink/30 focus:border-brass outline-none py-1.5 font-body"
      />
    </label>
  );
}

export function TextAreaField({ label, value, onChange, rows = 3 }) {
  return (
    <label className="block">
      <span className="text-xs text-ink/50">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full bg-transparent border-b border-ink/30 focus:border-brass outline-none py-1.5 font-body resize-none"
      />
    </label>
  );
}

export function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-xs text-ink/50">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full bg-transparent border-b border-ink/30 focus:border-brass outline-none py-1.5 font-body"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
