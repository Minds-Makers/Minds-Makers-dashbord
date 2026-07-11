-- ════════════════════════════════════════════════════════
--  Minds Makers — Supabase Schema
--  Run this once in Supabase SQL Editor (Project > SQL Editor > New query)
-- ════════════════════════════════════════════════════════

-- ── site_content ──────────────────────────────────────────
-- Single source of truth for all editable site content.
-- We store everything as one JSON blob per "section" for simplicity
-- (matches the structure of data.json: site, home, services, about, work)
create table if not exists site_content (
  id text primary key,           -- 'site' | 'home' | 'services' | 'about' | 'work'
  content jsonb not null,
  updated_at timestamptz default now()
);

-- ── admin_accounts ────────────────────────────────────────
create table if not exists admin_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

-- ════════════════════════════════════════════════════════
--  Row Level Security
-- ════════════════════════════════════════════════════════

alter table site_content enable row level security;
alter table admin_accounts enable row level security;

-- Anyone (including anonymous visitors) can READ site content —
-- this is what makes the public site work.
create policy "Public can read site content"
  on site_content for select
  using (true);

-- Only authenticated requests using the anon key from OUR dashboard
-- can write. Since this is a simple custom-auth system (not Supabase Auth),
-- we allow anon key writes here — protect this by keeping your anon key
-- and invite code private, and consider upgrading to Supabase Auth later
-- for stronger security.
create policy "Anon can update site content"
  on site_content for update
  using (true);

create policy "Anon can insert site content"
  on site_content for insert
  with check (true);

-- Admin accounts: allow insert (signup) and select (login check) via anon key.
-- Email/password are never exposed to the public site, only the dashboard.
create policy "Anon can read admin accounts"
  on admin_accounts for select
  using (true);

create policy "Anon can create admin accounts"
  on admin_accounts for insert
  with check (true);

create policy "Anon can delete admin accounts"
  on admin_accounts for delete
  using (true);

-- ════════════════════════════════════════════════════════
--  Seed initial content
--  (Replace the JSON below if you've customized data.json)
-- ════════════════════════════════════════════════════════

insert into site_content (id, content) values
('site', '{"name":"Minds Makers","tagline":"AI Software & Cybersecurity Studio","description":{"en":"An AI software & cybersecurity studio — built in MENA, built for the world.","ar":"استوديو برمجيات وأمن سيبراني بالذكاء الاصطناعي — اتبنى في الشرق الأوسط وشمال أفريقيا، لخدمة العالم."},"email":"hello@mindsmakers.io","linkedin":"https://www.linkedin.com/company/minds-makers0","location":{"en":"Alexandria, Egypt","ar":"الإسكندرية، مصر"}}')
on conflict (id) do nothing;

-- NOTE: For 'home', 'services', 'about', 'work' — run the companion
-- seed-data.sql file (generated alongside this schema) which contains
-- the full default content matching your current live site.
