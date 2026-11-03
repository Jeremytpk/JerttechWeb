-- JertTech database schema. Run this once in Supabase: SQL Editor > New query > paste > Run.

create extension if not exists pgcrypto;

-- People (customers and admins). One row per login.
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','admin')),
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

-- Create a profile automatically when someone gets a login.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, lower(new.email)) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create sequence public.tracking_seq start 1001;

-- Apps and websites.
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  tracking text unique not null default ('JT-' || nextval('public.tracking_seq')),
  customer_id uuid not null references public.profiles on delete cascade,
  type text not null check (type in ('Mobile app','Website')),
  name text not null,
  idea text not null,
  plan text not null check (plan in ('starter','standard','pro','business')),
  addons text[] not null default '{}',
  deadline text,
  stage int not null default 0 check (stage between 0 and 6),
  status text not null default 'building' check (status in ('building','live','maintenance','closing','cancelled','bought')),
  quote_cents int not null default 0,          -- setup fee + add-ons due at start
  stripe_subscription_id text unique,
  offline_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  amount_cents int not null,
  description text not null,
  status text not null check (status in ('paid','failed','pending')),
  stripe_ref text unique,
  created_at timestamptz not null default now()
);

create table public.change_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  kind text not null check (kind in ('small','medium','large')),
  urgency text not null default 'normal' check (urgency in ('normal','urgent','emergency')),
  description text not null,
  included boolean not null default false,
  urgent_included boolean not null default false,
  price_cents int,                               -- null means "to be quoted"
  status text not null default 'new' check (status in ('new','progress','done','declined')),
  billed boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.code_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  price_cents int not null,
  status text not null default 'pending' check (status in ('pending','approved','declined','paid')),
  created_at timestamptz not null default now()
);

create table public.cancellations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  option text not null check (option in ('maintenance','buyout','shutdown')),
  status text not null default 'pending' check (status in ('pending','processed')),
  created_at timestamptz not null default now()
);

create table public.activity (
  id bigserial primary key,
  message text not null,
  created_at timestamptz not null default now()
);

-- Security: customers can only read their own data. All writes go through the server.
create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create function public.owns_project(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.projects where id = pid and customer_id = auth.uid());
$$;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.payments enable row level security;
alter table public.change_requests enable row level security;
alter table public.code_requests enable row level security;
alter table public.cancellations enable row level security;
alter table public.activity enable row level security;

create policy "read own profile" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "read own projects" on public.projects for select using (customer_id = auth.uid() or public.is_admin());
create policy "read own payments" on public.payments for select using (public.owns_project(project_id) or public.is_admin());
create policy "read own changes" on public.change_requests for select using (public.owns_project(project_id) or public.is_admin());
create policy "read own code requests" on public.code_requests for select using (public.owns_project(project_id) or public.is_admin());
create policy "read own cancellations" on public.cancellations for select using (public.owns_project(project_id) or public.is_admin());
create policy "admins read activity" on public.activity for select using (public.is_admin());

-- After you sign in once with your own email, make yourself the admin:
-- update public.profiles set role = 'admin' where email = 'you@example.com';
