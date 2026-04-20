-- Haven Collective — Initial Schema

-- Enable required extensions
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────

create type user_role as enum ('recipient', 'donor', 'admin', 'super_admin');
create type user_status as enum ('active', 'suspended', 'banned', 'pending');
create type verification_pathway as enum ('benefits', 'income');
create type request_status as enum ('draft', 'pending_review', 'active', 'claimed', 'fulfilled', 'denied', 'expired');
create type claim_status as enum ('pending', 'paid', 'lapsed', 'fulfilled');
create type fulfillment_type as enum ('money', 'goods');
create type flag_status as enum ('open', 'resolved');
create type sender_type as enum ('recipient', 'donor', 'admin');

-- ─────────────────────────────────────────
-- USERS (extends auth.users)
-- ─────────────────────────────────────────

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role user_role not null default 'donor',
  status user_status not null default 'pending',
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- RECIPIENT PROFILES
-- ─────────────────────────────────────────

create table public.recipient_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  full_name text not null,
  address text not null,
  city text not null,
  state text not null,
  zip text not null,
  phone text,
  household_size integer not null default 1,
  num_dependents integer not null default 0,
  stripe_identity_session_id text,
  stripe_identity_verified boolean not null default false,
  verification_pathway verification_pathway,
  benefits_doc_url text,
  benefits_verified boolean not null default false,
  income_doc_url text,
  income_verified boolean not null default false,
  service_area text,
  approved_at timestamptz,
  approved_by uuid references public.users(id),
  denial_reason text,
  application_step integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

-- ─────────────────────────────────────────
-- CATEGORIES (admin-configurable)
-- ─────────────────────────────────────────

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  icon text,
  fulfillment_type fulfillment_type not null default 'money',
  funding_cap numeric(10,2),
  request_frequency_days integer not null default 30,
  requires_documentation boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed default categories
insert into public.categories (name, description, icon, fulfillment_type, funding_cap, request_frequency_days) values
  ('Utility Bills', 'Help with electricity, gas, water, or internet bills', '⚡', 'money', 500.00, 60),
  ('Rent Assistance', 'Help with rent or housing costs', '🏠', 'money', 1000.00, 90),
  ('Groceries & Food', 'Help with groceries or food expenses', '🛒', 'money', 200.00, 30),
  ('Medical & Prescriptions', 'Help with medical bills or prescriptions', '💊', 'money', 500.00, 60),
  ('Transportation', 'Help with gas, bus passes, or vehicle repairs', '🚌', 'money', 200.00, 30),
  ('Clothing & Essentials', 'Clothing, hygiene products, or household essentials', '👕', 'goods', null, 30),
  ('Baby & Child Supplies', 'Diapers, formula, clothing, or child essentials', '👶', 'goods', null, 30),
  ('School Supplies', 'Books, backpacks, or school materials', '📚', 'goods', 150.00, 90),
  ('Emergency Fund', 'Urgent unexpected expenses', '🆘', 'money', 300.00, 90);

-- ─────────────────────────────────────────
-- REQUESTS
-- ─────────────────────────────────────────

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.users(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  title text not null,
  description text not null,
  amount_needed numeric(10,2),
  documentation_url text,
  documentation_note text,
  status request_status not null default 'draft',
  view_count integer not null default 0,
  denial_reason text,
  expires_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- CLAIMS
-- ─────────────────────────────────────────

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  donor_id uuid not null references public.users(id) on delete cascade,
  payment_intent_id text,
  stripe_transfer_id text,
  amount numeric(10,2),
  fee_covered boolean not null default false,
  status claim_status not null default 'pending',
  donor_message text,
  claimed_at timestamptz not null default now(),
  lapse_at timestamptz not null default (now() + interval '24 hours'),
  paid_at timestamptz,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- MESSAGES (anonymous)
-- ─────────────────────────────────────────

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  sender_id uuid not null references public.users(id),
  sender_type sender_type not null,
  content text not null,
  is_read boolean not null default false,
  sent_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- FLAGS
-- ─────────────────────────────────────────

create table public.flags (
  id uuid primary key default gen_random_uuid(),
  flagged_entity_type text not null,
  flagged_entity_id uuid not null,
  flagged_by uuid not null references public.users(id),
  reason text not null,
  status flag_status not null default 'open',
  resolved_by uuid references public.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- AUDIT LOG (immutable)
-- ─────────────────────────────────────────

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create or replace rule audit_log_no_update as on update to public.audit_log do instead nothing;
create or replace rule audit_log_no_delete as on delete to public.audit_log do instead nothing;

-- ─────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  action_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- BAN LIST
-- ─────────────────────────────────────────

create table public.ban_list (
  id uuid primary key default gen_random_uuid(),
  stripe_identity_id text,
  email_hash text not null,
  reason text not null,
  banned_by uuid references public.users(id),
  banned_at timestamptz not null default now()
);

create index ban_list_email_hash_idx on public.ban_list(email_hash);
create index ban_list_stripe_identity_idx on public.ban_list(stripe_identity_id);

-- ─────────────────────────────────────────
-- DONOR PREFERENCES
-- ─────────────────────────────────────────

create table public.donor_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  created_at timestamptz not null default now(),
  unique(user_id, category_id)
);

-- ─────────────────────────────────────────
-- RECURRING GIVING
-- ─────────────────────────────────────────

create table public.recurring_gifts (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.users(id) on delete cascade,
  stripe_subscription_id text not null unique,
  amount_per_month numeric(10,2) not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.users for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.recipient_profiles for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.categories for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.requests for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.claims for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.recurring_gifts for each row execute function public.handle_updated_at();

-- ─────────────────────────────────────────
-- AUTO-CREATE USER ON SIGNUP
-- ─────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, role, status)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'donor'),
    'pending'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────

alter table public.users enable row level security;
alter table public.recipient_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.requests enable row level security;
alter table public.claims enable row level security;
alter table public.messages enable row level security;
alter table public.flags enable row level security;
alter table public.audit_log enable row level security;
alter table public.notifications enable row level security;
alter table public.ban_list enable row level security;
alter table public.donor_preferences enable row level security;
alter table public.recurring_gifts enable row level security;

create or replace function public.current_user_role()
returns user_role language sql security definer stable as $$
  select role from public.users where id = auth.uid()
$$;

-- USERS
create policy "Users can read own record" on public.users for select using (id = auth.uid());
create policy "Admins can read all users" on public.users for select using (public.current_user_role() in ('admin', 'super_admin'));
create policy "Admins can update users" on public.users for update using (public.current_user_role() in ('admin', 'super_admin'));

-- RECIPIENT PROFILES
create policy "Recipients can manage own profile" on public.recipient_profiles for all using (user_id = auth.uid());
create policy "Admins can read all profiles" on public.recipient_profiles for select using (public.current_user_role() in ('admin', 'super_admin'));
create policy "Admins can update profiles" on public.recipient_profiles for update using (public.current_user_role() in ('admin', 'super_admin'));

-- CATEGORIES
create policy "Anyone can read active categories" on public.categories for select using (is_active = true);
create policy "Admins can manage categories" on public.categories for all using (public.current_user_role() in ('admin', 'super_admin'));

-- REQUESTS
create policy "Recipients can manage own requests" on public.requests for all using (recipient_id = auth.uid());
create policy "Donors can read active requests" on public.requests for select using (status = 'active');
create policy "Admins can read all requests" on public.requests for select using (public.current_user_role() in ('admin', 'super_admin'));
create policy "Admins can update requests" on public.requests for update using (public.current_user_role() in ('admin', 'super_admin'));

-- CLAIMS
create policy "Donors can manage own claims" on public.claims for all using (donor_id = auth.uid());
create policy "Recipients can read claims on own requests" on public.claims for select using (
  exists (select 1 from public.requests where id = request_id and recipient_id = auth.uid())
);
create policy "Admins can read all claims" on public.claims for select using (public.current_user_role() in ('admin', 'super_admin'));
create policy "Admins can update claims" on public.claims for update using (public.current_user_role() in ('admin', 'super_admin'));

-- MESSAGES
create policy "Parties can read messages" on public.messages for select using (
  sender_id = auth.uid()
  or exists (select 1 from public.requests where id = request_id and recipient_id = auth.uid())
  or exists (select 1 from public.claims where request_id = messages.request_id and donor_id = auth.uid())
  or public.current_user_role() in ('admin', 'super_admin')
);
create policy "Parties can send messages" on public.messages for insert with check (
  sender_id = auth.uid()
  and (
    exists (select 1 from public.requests where id = request_id and recipient_id = auth.uid())
    or exists (select 1 from public.claims where request_id = messages.request_id and donor_id = auth.uid())
  )
);

-- NOTIFICATIONS
create policy "Users can read own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "Users can mark own notifications read" on public.notifications for update using (user_id = auth.uid());

-- FLAGS
create policy "Users can create flags" on public.flags for insert with check (flagged_by = auth.uid());
create policy "Admins can manage flags" on public.flags for all using (public.current_user_role() in ('admin', 'super_admin'));

-- AUDIT LOG
create policy "Admins can read audit log" on public.audit_log for select using (public.current_user_role() in ('admin', 'super_admin'));

-- BAN LIST
create policy "Admins can manage ban list" on public.ban_list for all using (public.current_user_role() in ('admin', 'super_admin'));
create policy "Anyone can check ban list" on public.ban_list for select using (true);

-- DONOR PREFERENCES
create policy "Donors can manage own preferences" on public.donor_preferences for all using (user_id = auth.uid());

-- RECURRING GIFTS
create policy "Donors can manage own recurring gifts" on public.recurring_gifts for all using (donor_id = auth.uid());
create policy "Admins can read recurring gifts" on public.recurring_gifts for select using (public.current_user_role() in ('admin', 'super_admin'));

-- ─────────────────────────────────────────
-- STORAGE BUCKETS
-- ─────────────────────────────────────────

insert into storage.buckets (id, name, public) values
  ('recipient-docs', 'recipient-docs', false),
  ('request-docs', 'request-docs', false);

create policy "Recipients can upload own docs" on storage.objects for insert with check (
  bucket_id = 'recipient-docs' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Admins can read recipient docs" on storage.objects for select using (
  bucket_id = 'recipient-docs' and public.current_user_role() in ('admin', 'super_admin')
);
create policy "Authenticated users can upload request docs" on storage.objects for insert with check (
  bucket_id = 'request-docs' and auth.role() = 'authenticated'
);
create policy "Admins can read request docs" on storage.objects for select using (
  bucket_id = 'request-docs' and public.current_user_role() in ('admin', 'super_admin')
);
create policy "Recipients can read own request docs" on storage.objects for select using (
  bucket_id = 'request-docs' and auth.uid()::text = (storage.foldername(name))[1]
);
