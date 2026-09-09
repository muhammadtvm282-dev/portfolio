CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.admin_allowlist (
  email text PRIMARY KEY
);
GRANT ALL ON public.admin_allowlist TO service_role;
ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;
INSERT INTO public.admin_allowlist (email) VALUES ('muhammadtvm282@gmail.com');

CREATE OR REPLACE FUNCTION public.claim_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _email text;
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  IF _email IS NULL THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.admin_allowlist WHERE lower(email) = lower(_email)) THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.site_content (
  key text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read content" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "admin manage content" ON public.site_content FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER site_content_updated BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'IN PROGRESS',
  technologies text[] NOT NULL DEFAULT '{}',
  project_url text,
  github_url text,
  preview_image text,
  screenshot text,
  gallery text[] NOT NULL DEFAULT '{}',
  preview_title text,
  preview_description text,
  preview_site_name text,
  preview_favicon text,
  cta_text text NOT NULL DEFAULT 'View Project',
  featured boolean NOT NULL DEFAULT true,
  visible boolean NOT NULL DEFAULT true,
  published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read visible projects" ON public.projects FOR SELECT USING (visible AND published);
CREATE POLICY "admin read all projects" ON public.projects FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage projects" ON public.projects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.skills TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read skills" ON public.skills FOR SELECT USING (true);
CREATE POLICY "admin manage skills" ON public.skills FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.building_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'IN PROGRESS',
  sort_order int NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.building_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.building_items TO authenticated;
GRANT ALL ON public.building_items TO service_role;
ALTER TABLE public.building_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read building" ON public.building_items FOR SELECT USING (visible);
CREATE POLICY "admin manage building" ON public.building_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  path text NOT NULL,
  url text NOT NULL,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media TO authenticated;
GRANT ALL ON public.media TO service_role;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read media" ON public.media FOR SELECT USING (true);
CREATE POLICY "admin manage media" ON public.media FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.site_content (key, data) VALUES
('hero', '{"name":"MUHAMMAD","eyebrow":"AI SPECIALIST · SOFTWARE ENGINEER · WORDPRESS DEVELOPER","headline":"Building intelligent systems for the real world.","description":"Artificial Intelligence & Data Science student at MGM Polytechnic College, Kilimanoor, building AI systems, software products, and data-driven applications.","primaryCtaText":"Explore My Work","primaryCtaUrl":"#projects","secondaryCtaText":"Contact Me","secondaryCtaUrl":"#contact","statusText":"CURRENTLY BUILDING","badgeText":"SYSTEM ONLINE","portraitLabel":"MUHAMMAD  ·  AI / SOFTWARE / DATA","profileImage":""}'::jsonb),
('about', '{"heading":"More than a student. A builder.","paragraph1":"I''m Muhammad, an Artificial Intelligence & Data Science student at MGM Polytechnic College, Kilimanoor. I enjoy building intelligent systems, software products, AI-powered applications, data-driven tools, and modern web experiences.","paragraph2":"My goal is to combine AI, software engineering, and data science to solve practical problems and turn ideas into useful products.","timeline":["STUDENT","BUILDER","AI SPECIALIST"]}'::jsonb),
('projects_section', '{"heading":"Things I''m building.","subheading":"Real projects, experiments, and products I''m working on."}'::jsonb),
('building_section', '{"heading":"Currently Building"}'::jsonb),
('skills_section', '{"heading":"What I work with."}'::jsonb),
('education', '{"heading":"Education","institution":"MGM Polytechnic College, Kilimanoor","program":"Artificial Intelligence & Data Science","status":"Student","note":""}'::jsonb),
('contact', '{"heading":"Have an idea worth building?","subheading":"Let''s turn it into something real.","primaryCtaText":"Contact Me","email":"muhammadtvm282@gmail.com","secondaryCtaText":"View GitHub","githubUrl":""}'::jsonb),
('social', '{"github":"","linkedin":"","instagram":"","other":""}'::jsonb),
('footer', '{"name":"MUHAMMAD","tagline":"AI Specialist · Software Engineer · WordPress Developer","line2":"Artificial Intelligence & Data Science Student","line3":"MGM Polytechnic College, Kilimanoor"}'::jsonb),
('seo', '{"title":"Muhammad | AI Specialist & Software Engineer","description":"Muhammad is an Artificial Intelligence & Data Science student at MGM Polytechnic College, building AI systems, software products, and data-driven applications.","ogTitle":"Muhammad | AI Specialist & Software Engineer","ogDescription":"Muhammad is an Artificial Intelligence & Data Science student at MGM Polytechnic College, building AI systems, software products, and data-driven applications.","ogImage":"","keywords":"AI, Data Science, Software Engineer, WordPress Developer, Muhammad"}'::jsonb),
('appearance', '{"accent":"#3B82F6","accentSecondary":"#8B5CF6","radius":"1rem","animationIntensity":"balanced","threeDIntensity":"medium","portraitShape":"organic","heroLayout":"two-column","preset":"Cinematic 3D"}'::jsonb);

INSERT INTO public.projects (name, slug, category, description, status, technologies, project_url, cta_text, featured, sort_order) VALUES
('ORIA','oria','AI PERSONAL ASSISTANT','An intelligent personal assistant designed to understand natural language and voice commands, automate tasks, and create a more capable digital experience.','IN PROGRESS','{"AI","Voice","AI Agents","Automation"}',NULL,'View Project',true,1),
('FESTIEEV','festieev','LIVE PROJECT','A real-world digital platform designed to make event discovery and event experiences simpler and more accessible.','LIVE','{"Web Development","Software Engineering","Product"}','https://festieev.vercel.app','Visit Live Project',true,2),
('AI DATA ANALYSIS PLATFORM','ai-data-analysis-platform','AI × DATA SCIENCE','An AI-powered platform designed to help users analyze datasets, discover patterns, generate insights, and understand data through natural language.','IN PROGRESS','{"AI","Data Science","Analytics","Visualization"}',NULL,'View Project',true,3);

INSERT INTO public.building_items (title, subtitle, status, sort_order) VALUES
('ORIA','AI Personal Assistant','IN PROGRESS',1),
('AI DATA ANALYSIS PLATFORM','AI × Data Science','IN PROGRESS',2);

INSERT INTO public.skills (name, category, sort_order) VALUES
('AI','Artificial Intelligence',1),('Machine Learning','Artificial Intelligence',2),('LLMs','Artificial Intelligence',3),('AI Agents','Artificial Intelligence',4),('Automation','Artificial Intelligence',5),('Voice AI','Artificial Intelligence',6),
('Python','Software Engineering',1),('JavaScript','Software Engineering',2),('APIs','Software Engineering',3),('Backend Development','Software Engineering',4),('Full-Stack Development','Software Engineering',5),('Git','Software Engineering',6),
('Data Analysis','Data Science',1),('Pandas','Data Science',2),('NumPy','Data Science',3),('Data Visualization','Data Science',4),('Machine Learning','Data Science',5),
('WordPress','Web Development',1),('HTML','Web Development',2),('CSS','Web Development',3),('JavaScript','Web Development',4);