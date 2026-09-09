import { useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { useMedia } from "./MediaPicker";

export function MediaAdmin() {
  const { items, loading, upload, remove } = useMedia();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  const filtered = items.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold">Media library</h2>
        <button
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Upload className="size-4" /> Upload
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) await upload(file);
            e.target.value = "";
          }}
        />
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search files"
        className="mt-4 w-full max-w-sm rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No files yet.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((m) => (
            <li key={m.id} className="overflow-hidden rounded-xl border border-border">
              <img src={m.url} alt={m.name} className="aspect-square w-full object-cover" loading="lazy" />
              <div className="flex items-center justify-between gap-2 p-2">
                <span className="truncate text-xs text-muted-foreground">{m.name}</span>
                <button
                  onClick={() => remove(m)}
                  aria-label={`Delete ${m.name}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
