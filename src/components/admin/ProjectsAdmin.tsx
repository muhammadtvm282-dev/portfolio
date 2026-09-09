import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Plus,
  RefreshCw,
  Star,
  Trash2,
} from "lucide-react";
import { generateProjectPreview } from "@/lib/preview.functions";
import type { Project } from "@/lib/cms-types";
import { ImageField } from "./MediaPicker";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

export function ProjectsAdmin() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewing, setPreviewing] = useState(false);

  const runPreview = useServerFn(generateProjectPreview);

  const refresh = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("sort_order");

    if (error) {
      console.error("Failed to load projects:", error);
      toast.error("Could not load projects");
      setProjects([]);
      setLoading(false);
      return;
    }

    setProjects((data ?? []) as Project[]);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const patch = (changes: Partial<Project>) => {
    setEditing((prev) =>
      prev ? { ...prev, ...changes } : prev
    );
  };

  const create = async () => {
    const name = "New project";
    const slug = `new-project-${Date.now().toString(36)}`;

    const { data, error } = await supabase
      .from("projects")
      .insert({
        name,
        slug,
        sort_order: projects.length + 1,
      } as never)
      .select()
      .single();

    if (error) {
      console.error("Create project error:", error);
      toast.error("Could not create project");
      return;
    }

    await refresh();
    setEditing(data as Project);
  };

  const save = async () => {
    if (!editing) return;

    const { id, ...rest } = editing;

    const { error } = await supabase
      .from("projects")
      .update(rest as never)
      .eq("id", id);

    if (error) {
      console.error("Save project error:", error);
      toast.error(`Could not save project: ${error.message}`);
      return;
    }

    toast.success("Project saved");
    await refresh();

    // Keep the editor open with the latest saved data.
    setEditing((prev) =>
      prev?.id === editing.id ? editing : prev
    );
  };

  const duplicate = async (project: Project) => {
    const copy = { ...project } as Partial<Project>;

    delete copy.id;

    copy.name = `${project.name} copy`;
    copy.slug = `${project.slug}-copy-${Date.now().toString(36)}`;
    copy.sort_order = projects.length + 1;

    const { error } = await supabase
      .from("projects")
      .insert(copy as never);

    if (error) {
      console.error("Duplicate project error:", error);
      toast.error(`Could not duplicate: ${error.message}`);
      return;
    }

    toast.success("Project duplicated");
    await refresh();
  };

  const remove = async (project: Project) => {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);

    if (error) {
      console.error("Delete project error:", error);
      toast.error(`Could not delete project: ${error.message}`);
      return;
    }

    if (editing?.id === project.id) {
      setEditing(null);
    }

    toast.success("Project deleted");
    await refresh();
  };

  const quick = async (
    project: Project,
    changes: Partial<Project>
  ) => {
    const { error } = await supabase
      .from("projects")
      .update(changes as never)
      .eq("id", project.id);

    if (error) {
      console.error("Quick update error:", error);
      toast.error(`Could not update project: ${error.message}`);
      return;
    }

    await refresh();

    // Update editor too if the same project is being edited.
    if (editing?.id === project.id) {
      setEditing((prev) =>
        prev ? { ...prev, ...changes } : prev
      );
    }
  };

  /**
   * Generate metadata + screenshot information from the project URL.
   *
   * IMPORTANT:
   * - We do NOT blindly overwrite a manually uploaded preview image.
   * - A real OG image is preferred.
   * - Screenshot is kept as a fallback.
   */
  const generate = async () => {
    if (!editing?.project_url?.trim()) {
      toast.error("Add a project URL first");
      return;
    }

    setPreviewing(true);

    try {
      const result = await runPreview({
        data: {
          url: editing.project_url.trim(),
        },
      });

      if (!result.ok) {
        toast.error(result.error || "Could not generate preview");
        return;
      }

      const changes: Partial<Project> = {
        // Generated screenshot is only the screenshot fallback.
        screenshot:
          result.screenshot ?? editing.screenshot ?? null,

        // Never delete an existing custom preview image.
        preview_image:
          result.image ?? editing.preview_image ?? null,

        preview_title:
          result.title ?? editing.preview_title ?? null,

        preview_description:
          result.description ??
          editing.preview_description ??
          null,

        preview_site_name:
          result.siteName ??
          editing.preview_site_name ??
          null,

        preview_favicon:
          result.favicon ??
          editing.preview_favicon ??
          null,
      };

      patch(changes);

      toast.success(
        result.partial
          ? "Preview generated — some website details unavailable"
          : "Preview generated"
      );
    } catch (error) {
      console.error("Preview generation error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Preview generation failed"
      );
    } finally {
      setPreviewing(false);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading…
      </p>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      {/* PROJECT LIST */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold">
            Projects
          </h2>

          <button
            type="button"
            onClick={create}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="size-4" />
            New
          </button>
        </div>

        <ul className="mt-4 space-y-2">
          {projects.map((project) => (
            <li
              key={project.id}
              className={`rounded-xl border p-3 ${
                editing?.id === project.id
                  ? "border-primary"
                  : "border-border"
              }`}
            >
              <button
                type="button"
                onClick={() => setEditing(project)}
                className="block w-full text-left"
              >
                <span className="text-sm font-medium">
                  {project.name}
                </span>

                <span className="block text-xs text-muted-foreground">
                  {project.status}
                </span>
              </button>

              <div className="mt-2 flex gap-1">
                {/* VISIBILITY */}
                <button
                  type="button"
                  onClick={() =>
                    quick(project, {
                      visible: !project.visible,
                    })
                  }
                  title={
                    project.visible ? "Hide" : "Show"
                  }
                  className="rounded-md border border-border p-1.5 text-muted-foreground"
                >
                  {project.visible ? (
                    <Eye className="size-3.5" />
                  ) : (
                    <EyeOff className="size-3.5" />
                  )}
                </button>

                {/* FEATURED */}
                <button
                  type="button"
                  onClick={() =>
                    quick(project, {
                      featured: !project.featured,
                    })
                  }
                  title="Feature"
                  className={`rounded-md border border-border p-1.5 ${
                    project.featured
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <Star className="size-3.5" />
                </button>

                {/* DUPLICATE */}
                <button
                  type="button"
                  onClick={() => duplicate(project)}
                  title="Duplicate"
                  className="rounded-md border border-border p-1.5 text-muted-foreground"
                >
                  <Copy className="size-3.5" />
                </button>

                {/* DELETE */}
                <button
                  type="button"
                  onClick={() => remove(project)}
                  title="Delete"
                  className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* PROJECT EDITOR */}
      {editing ? (
        <div className="max-w-2xl space-y-5">
          <h3 className="font-display text-xl font-semibold">
            Edit project
          </h3>

          {/* BASIC INFORMATION */}

          <Text
            label="Name"
            value={editing.name}
            onChange={(value) =>
              patch({
                name: value,
                slug:
                  editing.slug ||
                  slugify(value),
              })
            }
          />

          <Text
            label="Slug"
            value={editing.slug}
            onChange={(value) =>
              patch({
                slug: slugify(value),
              })
            }
          />

          <Text
            label="Category"
            value={editing.category}
            onChange={(value) =>
              patch({
                category: value,
              })
            }
          />

          <Text
            label="Status"
            value={editing.status}
            onChange={(value) =>
              patch({
                status: value,
              })
            }
          />

          {/* DESCRIPTION */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Description
            </label>

            <textarea
              rows={4}
              value={editing.description}
              onChange={(event) =>
                patch({
                  description:
                    event.target.value,
                })
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* TECHNOLOGIES */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Technologies
            </label>

            <input
              value={editing.technologies.join(", ")}
              onChange={(event) =>
                patch({
                  technologies:
                    event.target.value
                      .split(",")
                      .map((technology) =>
                        technology.trim()
                      )
                      .filter(Boolean),
                })
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />

            <p className="mt-1 text-xs text-muted-foreground">
              Separate with commas
            </p>
          </div>

          {/* PROJECT URL */}

          <Text
            label="Project URL"
            value={editing.project_url ?? ""}
            onChange={(value) =>
              patch({
                project_url: value,
              })
            }
          />

          {/* GITHUB URL */}

          <Text
            label="GitHub URL"
            value={editing.github_url ?? ""}
            onChange={(value) =>
              patch({
                github_url: value,
              })
            }
          />

          {/* GENERATE PREVIEW */}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={generate}
              disabled={
                previewing ||
                !editing.project_url?.trim()
              }
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`size-4 ${
                  previewing
                    ? "animate-spin"
                    : ""
                }`}
              />

              {previewing
                ? "Generating…"
                : "Generate preview"}
            </button>

            {editing.project_url && (
              <a
                href={editing.project_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"
              >
                <ExternalLink className="size-4" />
                Open project
              </a>
            )}
          </div>

          {/* PREVIEW */}

          {(editing.preview_image ||
            editing.screenshot) && (
            <div className="overflow-hidden rounded-xl border border-border bg-secondary/20">
              <div className="relative aspect-video w-full overflow-hidden">
                <img
                  /*
                   * IMPORTANT:
                   * Custom preview_image has priority.
                   * Generated screenshot is fallback.
                   */
                  src={
                    editing.preview_image ||
                    editing.screenshot ||
                    ""
                  }
                  alt={
                    editing.preview_title ||
                    editing.name ||
                    "Project preview"
                  }
                  className="size-full object-cover"
                  onError={(event) => {
                    console.error(
                      "Project preview failed:",
                      event.currentTarget.src
                    );

                    /*
                     * If custom image fails and a screenshot exists,
                     * automatically try the screenshot.
                     */
                    if (
                      editing.preview_image &&
                      editing.screenshot &&
                      event.currentTarget.src !==
                        editing.screenshot
                    ) {
                      event.currentTarget.src =
                        editing.screenshot;
                    }
                  }}
                />
              </div>

              <div className="border-t border-border p-4">
                <p className="text-sm font-medium">
                  {editing.preview_title ||
                    editing.name}
                </p>

                {editing.preview_description && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {editing.preview_description}
                  </p>
                )}

                {editing.preview_site_name && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {editing.preview_site_name}
                  </p>
                )}

                {editing.project_url && (
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {editing.project_url}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* PREVIEW DETAILS */}

          <Text
            label="Preview title"
            value={editing.preview_title ?? ""}
            onChange={(value) =>
              patch({
                preview_title: value,
              })
            }
          />

          <Text
            label="Preview description"
            value={
              editing.preview_description ?? ""
            }
            onChange={(value) =>
              patch({
                preview_description: value,
              })
            }
          />

          <Text
            label="Screenshot URL"
            value={editing.screenshot ?? ""}
            onChange={(value) =>
              patch({
                screenshot: value,
              })
            }
          />

          {/* CUSTOM IMAGE */}

          <ImageField
            label="Custom preview image"
            value={editing.preview_image ?? ""}
            onChange={(value) =>
              patch({
                preview_image: value,
              })
            }
          />

          {/* CTA */}

          <Text
            label="CTA text"
            value={editing.cta_text}
            onChange={(value) =>
              patch({
                cta_text: value,
              })
            }
          />

          {/* SETTINGS */}

          <div className="flex flex-wrap items-center gap-5">
            <Toggle
              label="Featured"
              checked={editing.featured}
              onChange={(value) =>
                patch({
                  featured: value,
                })
              }
            />

            <Toggle
              label="Visible"
              checked={editing.visible}
              onChange={(value) =>
                patch({
                  visible: value,
                })
              }
            />

            <Toggle
              label="Published"
              checked={editing.published}
              onChange={(value) =>
                patch({
                  published: value,
                })
              }
            />

            <div className="flex items-center gap-2">
              <label className="text-sm">
                Order
              </label>

              <input
                type="number"
                value={editing.sort_order}
                onChange={(event) =>
                  patch({
                    sort_order: Number(
                      event.target.value
                    ),
                  })
                }
                className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* SAVE */}

          <button
            type="button"
            onClick={save}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Save & publish
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Select a project to edit, or create a new
          one.
        </p>
      )}
    </div>
  );
}

function Text({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="size-4"
      />

      {label}
    </label>
  );
}