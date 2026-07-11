# Minds Makers — Admin Dashboard

This is the **standalone admin dashboard** for the Minds Makers website.
It connects to a Supabase database — every change you make here (add,
edit, or delete a service, team member, project, or page text) is saved
to the database and shows up **live on the public website** for every
visitor, automatically.

## ⚠️ Required setup (5 minutes)

This dashboard does nothing until it's connected to a Supabase database.
Follow these steps once:

### 1. Create the database tables
1. Open your Supabase project → **SQL Editor** → **New query**
2. Open `supabase-schema.sql` from this folder, copy everything, paste it in, click **Run**
3. Open `seed-data.sql` from this folder, copy everything, paste it in, click **Run**
   (this loads your current site content into the database)

### 2. Connect this dashboard to your database
1. In Supabase: **Project Settings → API**
2. Copy the **Project URL** and the **anon public key**
3. Open `src/lib/supabaseClient.js` in this project
4. Replace `PASTE_YOUR_SUPABASE_URL_HERE` and `PASTE_YOUR_SUPABASE_ANON_KEY_HERE` with your values

### 3. Connect the PUBLIC WEBSITE to the same database
For dashboard edits to actually appear on your live site, the website
project must point at the **same** Supabase project. Open
`src/lib/supabaseClient.js` in the **website** project (separate ZIP)
and paste the same two values there.

That's it — both projects now read/write the same data.

## Running locally
```bash
npm install
npm run dev
```

## Deploying to Vercel
1. Push this folder to its own GitHub repository (separate from the website repo)
2. Vercel → New Project → Import this repo → Deploy
3. Visit your dashboard URL, e.g. `https://mindsmakers-admin.vercel.app`

**Tip:** Since this is a separate project from the public site, you can
restrict who can even reach the dashboard URL later (e.g. password-protect
the whole deployment in Vercel settings) for an extra layer of security
on top of the login screen.

## Creating admin accounts
**Default invite code:** `MM-ADMIN-2024`
Change it in `src/context/AuthContext.jsx` (`INVITE_CODE` constant).

Anyone with the invite code can create a dashboard account from the
"Request access" link on the login screen. Admin accounts are stored in
the `admin_accounts` table in your Supabase project — you can remove
any admin from the **Admin Accounts** panel inside the dashboard.

## What you can manage
- **Home Content** — hero text, process steps, CTA
- **Services** — add, edit, delete services (shown on Home + Services page)
- **About Page** — vision, mission, principles
- **Team Members** — add, edit, remove team members
- **Work / Projects** — add, edit, delete case studies
- **Site Settings** — name, tagline, email, LinkedIn, location
- **Admin Accounts** — see and remove dashboard admins

Every "Save" button writes directly to the database — changes are live
within seconds.

## Security notes
- This dashboard uses a simple custom email/password system (not
  Supabase Auth) for speed of setup. Passwords are hashed before storage.
- The Supabase **anon key** is safe to expose in frontend code by design
  — but the current database policies allow anyone with that key to
  read/write your tables directly via the API, not just through this
  dashboard. For a public production launch, consider tightening Row
  Level Security policies further or migrating to Supabase Auth — ask
  your developer (or Claude) to help lock this down before going fully
  live with sensitive data.
