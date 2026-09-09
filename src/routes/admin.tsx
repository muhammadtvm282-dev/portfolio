import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { ListAdmin } from "@/components/admin/ListAdmin";
import { ProjectsAdmin } from "@/components/admin/ProjectsAdmin";
import { MediaAdmin } from "@/components/admin/MediaAdmin";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminPage,
});

const NAV = [
  { id: "overview", label: "Overview" },
  { id: "hero", label: "Hero" },
  { id: "about", label: "About" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "building", label: "Currently Building" },
  { id: "contact", label: "Contact" },
  { id: "social", label: "Social Links" },
  { id: "footer", label: "Footer" },
  { id: "media", label: "Media" },
  { id: "appearance", label: "Appearance" },
  { id: "seo", label: "SEO" },
];

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setIsAdmin(null);
      return;
    }
    void (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (data) {
        setIsAdmin(true);
        return;
      }
      const { data: claimed } = await supabase.rpc("claim_admin");
      setIsAdmin(Boolean(claimed));
    })();
  }, [session]);

  if (!session) return <SignIn />;
  if (isAdmin === null) return <Centered>Checking access…</Centered>;
  if (!isAdmin)
    return (
      <Centered>
        <p>This account does not have administrator access.</p>
        <button onClick={() => supabase.auth.signOut()} className="mt-4 text-sm text-primary">
          Sign out
        </button>
      </Centered>
    );

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-sidebar p-4 md:block">
        <p className="px-3 font-display text-sm font-bold tracking-[0.24em]">DASHBOARD</p>
        <nav className="mt-6 space-y-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                tab === n.id ? "bg-primary/12 text-foreground" : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {n.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm md:hidden"
          >
            {NAV.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
          <span className="hidden truncate text-sm text-muted-foreground md:block">
            {session.user.email}
          </span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </header>

        <main className="p-6">
          {tab === "overview" && <Overview />}
          {tab === "projects" && <ProjectsAdmin />}
          {tab === "media" && <MediaAdmin />}
          {tab === "skills" && (
            <ListAdmin
              table="skills"
              title="Skills"
              blank={{ name: "New skill", category: "Artificial Intelligence" }}
              columns={[
                { key: "name", label: "Skill" },
                { key: "category", label: "Category" },
                { key: "sort_order", label: "Order", type: "number" },
              ]}
            />
          )}
          {tab === "building" && (
            <>
              <ContentEditor sectionKey="building_section" />
              <div className="mt-10">
                <ListAdmin
                  table="building_items"
                  title="Currently building items"
                  blank={{ title: "New item", subtitle: "", status: "IN PROGRESS" }}
                  columns={[
                    { key: "title", label: "Title" },
                    { key: "subtitle", label: "Subtitle" },
                    { key: "status", label: "Status" },
                    { key: "sort_order", label: "Order", type: "number" },
                  ]}
                />
              </div>
            </>
          )}
          {["hero", "about", "education", "contact", "social", "footer", "appearance", "seo"].includes(tab) && (
            <ContentEditor sectionKey={tab} />
          )}
        </main>
      </div>
    </div>
  );
}

function Overview() {
  const [stats, setStats] = useState<Record<string, string | number> | null>(null);

  useEffect(() => {
    void (async () => {
      const [projects, skills, hero, content] = await Promise.all([
        supabase.from("projects").select("status,visible,published"),
        supabase.from("skills").select("id"),
        supabase.from("site_content").select("data").eq("key", "hero").maybeSingle(),
        supabase.from("site_content").select("updated_at").order("updated_at", { ascending: false }).limit(1),
      ]);
      const rows = projects.data ?? [];
      const heroData = (hero.data?.data ?? {}) as { profileImage?: string };
      const last = content.data?.[0]?.updated_at;
      setStats({
        "Total projects": rows.length,
        "Live projects": rows.filter((r) => (r.status ?? "").toUpperCase() === "LIVE").length,
        "In progress": rows.filter((r) => (r.status ?? "").toUpperCase().includes("PROGRESS")).length,
        Skills: (skills.data ?? []).length,
        "Profile photo": heroData.profileImage ? "Uploaded" : "Not set",
        "Last update": last ? new Date(last as string).toLocaleString() : "—",
      });
    })();
  }, []);

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold">Overview</h2>
      {!stats ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(stats).map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-border p-5">
              <dt className="eyebrow">{k}</dt>
              <dd className="mt-2 font-display text-2xl font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || password.length < 8) {
      toast.error("Enter a valid email and a password of at least 8 characters");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={submit} className="glass w-full max-w-sm rounded-2xl p-8">
        <h1 className="font-display text-xl font-semibold">Administrator</h1>
        <p className="mt-1 text-sm text-muted-foreground">Private area.</p>
        <label className="mt-6 block text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <label className="mt-4 block text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Please wait…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
