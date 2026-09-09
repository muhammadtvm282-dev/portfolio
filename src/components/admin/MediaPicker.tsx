import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";

export type MediaRow = {
  id: string;
  name: string;
  path: string;
  url: string;
  mime_type: string | null;
  size_bytes: number | null;
};

const ALLOWED = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
];

const MAX_SIZE = 8 * 1024 * 1024;

const BUCKET = "media";

/**
 * Returns the public URL for a file stored in the Supabase `media` bucket.
 */
function getPublicMediaUrl(path: string) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function useMedia() {
  const [items, setItems] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("media")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load media:", error);
      toast.error("Could not load media");
      setItems([]);
      setLoading(false);
      return;
    }

    setItems((data ?? []) as MediaRow[]);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const upload = async (file: File) => {
    if (!ALLOWED.includes(file.type)) {
      toast.error("Only image files are allowed");
      return null;
    }

    if (file.size > MAX_SIZE) {
      toast.error("Image must be smaller than 8MB");
      return null;
    }

    const ext =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "") || "bin";

    const path = `${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      toast.error(`Upload failed: ${uploadError.message}`);
      return null;
    }

    // IMPORTANT:
    // The bucket is public, so use Supabase's public storage URL
    // instead of the old /api/public/media/... route.
    const url = getPublicMediaUrl(path);

    const { error: dbError } = await supabase.from("media").insert({
      name: file.name,
      path,
      url,
      mime_type: file.type,
      size_bytes: file.size,
    });

    if (dbError) {
      console.error("Media database insert error:", dbError);

      // If the database record fails, remove the uploaded file
      // so we don't leave an orphaned file in Storage.
      await supabase.storage.from(BUCKET).remove([path]);

      toast.error(`Could not save media record: ${dbError.message}`);
      return null;
    }

    await refresh();

    toast.success("Uploaded successfully");

    return url;
  };

  const remove = async (item: MediaRow) => {
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove([item.path]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
      toast.error(`Could not delete file: ${storageError.message}`);
      return;
    }

    const { error: dbError } = await supabase
      .from("media")
      .delete()
      .eq("id", item.id);

    if (dbError) {
      console.error("Media database delete error:", dbError);
      toast.error(`Could not delete media record: ${dbError.message}`);
      return;
    }

    await refresh();

    toast.success("Deleted");
  };

  return {
    items,
    loading,
    upload,
    remove,
    refresh,
  };
}

export function ImageField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const { items, upload } = useMedia();

  const inputRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);

  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>

      <div className="flex flex-wrap items-center gap-3">
        {/* Current image preview */}
        <div className="flex size-20 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary/40">
          {value ? (
            <img
              src={value}
              alt=""
              className="size-full object-cover"
              onError={(event) => {
                console.error("Image failed to load:", value);
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <span className="text-[0.6rem] text-muted-foreground">
              none
            </span>
          )}
        </div>

        {/* Upload button */}
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Upload className="size-4" />

          {busy ? "Uploading…" : "Upload"}
        </button>

        {/* Remove button */}
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
          >
            <Trash2 className="size-4" />

            Remove
          </button>
        )}

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];

            if (!file) return;

            setBusy(true);

            try {
              const url = await upload(file);

              if (url) {
                onChange(url);
              }
            } finally {
              setBusy(false);

              // Allow selecting the same file again.
              e.target.value = "";
            }
          }}
        />
      </div>

      {/* Media library */}
      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.slice(0, 12).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.url)}
              className="size-12 overflow-hidden rounded-lg border border-border hover:ring-2 hover:ring-primary"
              title={m.name}
            >
              <img
                src={m.url}
                alt={m.name}
                className="size-full object-cover"
                onError={(event) => {
                  console.error("Media thumbnail failed to load:", m.url);
                  event.currentTarget.style.display = "none";
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Manual URL */}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="or paste an image URL"
        className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
    </div>
  );
}