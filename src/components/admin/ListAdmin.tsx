import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

type Row = Record<string, unknown> & { id: string };

export function ListAdmin({
  table,
  title,
  columns,
  blank,
}: {
  table: "skills" | "building_items";
  title: string;
  columns: { key: string; label: string; type?: "text" | "number" }[];
  blank: Record<string, unknown>;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { data } = await supabase.from(table).select("*").order("sort_order", { ascending: true });
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  const update = async (id: string, patch: Record<string, unknown>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    const { error } = await supabase.from(table).update(patch as never).eq("id", id);
    if (error) toast.error("Could not save");
  };

  const add = async () => {
    const { error } = await supabase.from(table).insert({ ...blank, sort_order: rows.length + 1 } as never);
    if (error) toast.error("Could not add");
    else await refresh();
  };

  const remove = async (id: string) => {
    await supabase.from(table).delete().eq("id", id);
    await refresh();
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        <button
          onClick={add}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="size-4" /> Add
        </button>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Nothing here yet.</p>
      ) : (
        <ul className="mt-6 space-y-2">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3">
              {columns.map((c) => (
                <input
                  key={c.key}
                  type={c.type === "number" ? "number" : "text"}
                  value={String(row[c.key] ?? "")}
                  placeholder={c.label}
                  onChange={(e) =>
                    update(row.id, {
                      [c.key]: c.type === "number" ? Number(e.target.value) : e.target.value,
                    })
                  }
                  className={`rounded-lg border border-border bg-background px-3 py-2 text-sm ${
                    c.type === "number" ? "w-20" : "min-w-40 flex-1"
                  }`}
                />
              ))}
              <button
                onClick={() => remove(row.id)}
                aria-label="Delete"
                className="rounded-lg border border-border p-2 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted-foreground">Changes save automatically as you type.</p>
    </div>
  );
}
