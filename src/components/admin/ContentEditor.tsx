import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CONTENT_SCHEMAS } from "./fields";
import { ImageField } from "./MediaPicker";

export function ContentEditor({ sectionKey }: { sectionKey: string }) {
  const schema = CONTENT_SCHEMAS[sectionKey];
  const [value, setValue] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void supabase
      .from("site_content")
      .select("data")
      .eq("key", sectionKey)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setValue((data?.data as Record<string, unknown>) ?? {});
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [sectionKey]);

  if (!schema) return null;

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_content")
      .upsert({ key: sectionKey, data: value } as never, { onConflict: "key" });
    setSaving(false);
    if (error) toast.error("Could not save changes");
    else toast.success("Published");
  };

  const set = (key: string, v: unknown) => setValue((prev) => ({ ...prev, [key]: v }));

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-2xl font-semibold">{schema.title}</h2>
      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-6 space-y-5">
          {schema.fields.map((f) => {
            const raw = value[f.key];
            if (f.type === "image") {
              return (
                <ImageField
                  key={f.key}
                  label={f.label}
                  value={typeof raw === "string" ? raw : ""}
                  onChange={(v) => set(f.key, v)}
                />
              );
            }
            if (f.type === "list") {
              const list = Array.isArray(raw) ? (raw as string[]) : [];
              return (
                <div key={f.key}>
                  <label className="mb-2 block text-sm font-medium">{f.label}</label>
                  <textarea
                    rows={4}
                    value={list.join("\n")}
                    onChange={(e) => set(f.key, e.target.value.split("\n").filter(Boolean))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">One item per line</p>
                </div>
              );
            }
            if (f.type === "select") {
              return (
                <div key={f.key}>
                  <label className="mb-2 block text-sm font-medium">{f.label}</label>
                  <select
                    value={typeof raw === "string" ? raw : ""}
                    onChange={(e) => set(f.key, e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">—</option>
                    {(f.options ?? []).map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
              );
            }
            return (
              <div key={f.key}>
                <label className="mb-2 block text-sm font-medium">{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea
                    rows={4}
                    value={typeof raw === "string" ? raw : ""}
                    onChange={(e) => set(f.key, e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                ) : (
                  <input
                    value={typeof raw === "string" ? raw : ""}
                    onChange={(e) => set(f.key, e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                )}
                {f.help && <p className="mt-1 text-xs text-muted-foreground">{f.help}</p>}
              </div>
            );
          })}
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save & publish"}
          </button>
        </div>
      )}
    </div>
  );
}
