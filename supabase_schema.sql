-- ============================================
-- Scroli Database Schema + RLS Policies
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- NOTE: Run charities BEFORE transactions (foreign key dependency)

-- 1. Charities
create table charities (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  logo_url text,
  website_url text,
  is_active boolean default true
);

alter table charities enable row level security;
create policy "Charities are viewable by everyone" on charities
  for select using (true);

-- 2. Profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamptz,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  has_completed_onboarding boolean default false
);

alter table profiles enable row level security;
create policy "Users can view their own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);
create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);

-- 3. Goals
create table goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  daily_limit_minutes int not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table goals enable row level security;
create policy "Users can view their own goals" on goals
  for select using (auth.uid() = user_id);
create policy "Users can insert their own goals" on goals
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own goals" on goals
  for update using (auth.uid() = user_id);
create policy "Users can delete their own goals" on goals
  for delete using (auth.uid() = user_id);

-- 4. Wallet Balances
create table wallet_balances (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  balance_cents int default 0,
  currency text default 'usd',
  updated_at timestamptz default now()
);

alter table wallet_balances enable row level security;
create policy "Users can view their own wallet" on wallet_balances
  for select using (auth.uid() = user_id);
create policy "Users can update their own wallet" on wallet_balances
  for update using (auth.uid() = user_id);
create policy "Users can insert their own wallet" on wallet_balances
  for insert with check (auth.uid() = user_id);

-- 5. Daily Records
create table daily_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  duration_minutes int not null,
  goal_id uuid references goals(id),
  status text default 'pending' check (status in ('success', 'failure', 'pending'))
);

alter table daily_records enable row level security;
create policy "Users can view their own records" on daily_records
  for select using (auth.uid() = user_id);
create policy "Users can insert their own records" on daily_records
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own records" on daily_records
  for update using (auth.uid() = user_id);

-- 6. Transactions
create table transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  amount_cents int not null,
  type text not null check (type in ('charge', 'refund', 'donation')),
  charity_id uuid references charities(id),
  created_at timestamptz default now()
);

alter table transactions enable row level security;
create policy "Users can view their own transactions" on transactions
  for select using (auth.uid() = user_id);
create policy "Users can insert their own transactions" on transactions
  for insert with check (auth.uid() = user_id);

-- ============================================
-- Auto-create profile on user signup (trigger)
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
