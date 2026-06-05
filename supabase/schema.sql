-- 반려동물 통합 케어 모바일 웹 MVP schema
-- Apply in the Supabase SQL editor or with `supabase db query` after reviewing project settings.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.care_spaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.care_space_members (
  space_id uuid not null references public.care_spaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'caregiver', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (space_id, user_id)
);

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.care_spaces (id) on delete cascade,
  name text not null,
  species text not null,
  breed text,
  birth_date date,
  sex text,
  weight_kg numeric(5, 2),
  life_stage text not null default 'adult' check (life_stage in ('puppy', 'kitten', 'adult', 'senior')),
  activity_level text not null default 'normal' check (activity_level in ('low', 'normal', 'active')),
  created_at timestamptz not null default now()
);

create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.care_spaces (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  title text not null,
  category text not null check (category in ('meal', 'walk', 'health', 'memory')),
  scheduled_time time not null,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly')),
  reminder_minutes_before int not null default 10 check (reminder_minutes_before >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.care_logs (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.care_spaces (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  routine_id uuid references public.routines (id) on delete set null,
  category text not null check (category in ('meal', 'walk', 'health', 'memory')),
  title text not null,
  notes text,
  tags text[] not null default '{}',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.health_records (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.care_spaces (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  care_log_id uuid references public.care_logs (id) on delete cascade,
  record_type text not null check (record_type in ('weight', 'vaccine', 'medication', 'hospital', 'symptom')),
  value text not null,
  recorded_at timestamptz not null default now()
);

create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.care_spaces (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  care_log_id uuid references public.care_logs (id) on delete cascade,
  food_name text,
  amount_grams numeric(7, 2),
  calories_kcal int,
  meal_kind text not null default 'feed' check (meal_kind in ('feed', 'snack', 'water')),
  recorded_at timestamptz not null default now()
);

create table if not exists public.walk_logs (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.care_spaces (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  care_log_id uuid references public.care_logs (id) on delete cascade,
  duration_minutes int check (duration_minutes is null or duration_minutes >= 0),
  distance_km numeric(6, 2),
  route_points jsonb not null default '[]',
  location_consent boolean not null default false,
  recorded_at timestamptz not null default now()
);

create table if not exists public.memory_entries (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.care_spaces (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  care_log_id uuid references public.care_logs (id) on delete cascade,
  title text not null,
  body text,
  photo_path text,
  tags text[] not null default '{}',
  recorded_at timestamptz not null default now()
);

create table if not exists public.expert_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('vet', 'groomer', 'trainer', 'sitter')),
  specialties text[] not null default '{}',
  area text not null,
  rating numeric(2, 1) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.recommendation_feedback (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.care_spaces (id) on delete cascade,
  pet_id uuid not null references public.pets (id) on delete cascade,
  expert_id uuid not null references public.expert_profiles (id) on delete cascade,
  feedback text not null check (feedback in ('saved', 'hidden', 'contacted')),
  created_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  space_id uuid not null references public.care_spaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  email_enabled boolean not null default true,
  calendar_enabled boolean not null default true,
  browser_push_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (space_id, user_id)
);

alter table public.profiles enable row level security;
alter table public.care_spaces enable row level security;
alter table public.care_space_members enable row level security;
alter table public.pets enable row level security;
alter table public.routines enable row level security;
alter table public.care_logs enable row level security;
alter table public.health_records enable row level security;
alter table public.meal_logs enable row level security;
alter table public.walk_logs enable row level security;
alter table public.memory_entries enable row level security;
alter table public.expert_profiles enable row level security;
alter table public.recommendation_feedback enable row level security;
alter table public.notification_preferences enable row level security;

create policy "Users read own profile"
  on public.profiles for select
  using ((select auth.uid()) = id);

create policy "Users insert own profile"
  on public.profiles for insert
  with check ((select auth.uid()) = id);

create policy "Users update own profile"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Members read care spaces"
  on public.care_spaces for select
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1 from public.care_space_members members
      where members.space_id = care_spaces.id
        and members.user_id = (select auth.uid())
    )
  );

create policy "Users create owned care spaces"
  on public.care_spaces for insert
  with check (owner_id = (select auth.uid()));

create policy "Owners update care spaces"
  on public.care_spaces for update
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Members read memberships"
  on public.care_space_members for select
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.care_space_members members
      where members.space_id = care_space_members.space_id
        and members.user_id = (select auth.uid())
    )
  );

create policy "Owners add memberships"
  on public.care_space_members for insert
  with check (
    exists (
      select 1 from public.care_spaces spaces
      where spaces.id = care_space_members.space_id
        and spaces.owner_id = (select auth.uid())
    )
  );

create policy "Members read pets"
  on public.pets for select
  using (
    exists (
      select 1 from public.care_space_members members
      where members.space_id = pets.space_id
        and members.user_id = (select auth.uid())
    )
  );

create policy "Caregivers write pets"
  on public.pets for all
  using (
    exists (
      select 1 from public.care_space_members members
      where members.space_id = pets.space_id
        and members.user_id = (select auth.uid())
        and members.role in ('owner', 'caregiver')
    )
  )
  with check (
    exists (
      select 1 from public.care_space_members members
      where members.space_id = pets.space_id
        and members.user_id = (select auth.uid())
        and members.role in ('owner', 'caregiver')
    )
  );

create policy "Members read routines"
  on public.routines for select
  using (
    exists (
      select 1 from public.care_space_members members
      where members.space_id = routines.space_id
        and members.user_id = (select auth.uid())
    )
  );

create policy "Caregivers write routines"
  on public.routines for all
  using (
    exists (
      select 1 from public.care_space_members members
      where members.space_id = routines.space_id
        and members.user_id = (select auth.uid())
        and members.role in ('owner', 'caregiver')
    )
  )
  with check (
    exists (
      select 1 from public.care_space_members members
      where members.space_id = routines.space_id
        and members.user_id = (select auth.uid())
        and members.role in ('owner', 'caregiver')
    )
  );

create policy "Members manage care logs"
  on public.care_logs for all
  using (
    exists (
      select 1 from public.care_space_members members
      where members.space_id = care_logs.space_id
        and members.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.care_space_members members
      where members.space_id = care_logs.space_id
        and members.user_id = (select auth.uid())
        and members.role in ('owner', 'caregiver')
    )
  );

create policy "Members manage health records"
  on public.health_records for all
  using (
    exists (
      select 1 from public.care_space_members members
      where members.space_id = health_records.space_id
        and members.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.care_space_members members
      where members.space_id = health_records.space_id
        and members.user_id = (select auth.uid())
        and members.role in ('owner', 'caregiver')
    )
  );

create policy "Members manage meal logs"
  on public.meal_logs for all
  using (
    exists (
      select 1 from public.care_space_members members
      where members.space_id = meal_logs.space_id
        and members.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.care_space_members members
      where members.space_id = meal_logs.space_id
        and members.user_id = (select auth.uid())
        and members.role in ('owner', 'caregiver')
    )
  );

create policy "Members manage walk logs"
  on public.walk_logs for all
  using (
    exists (
      select 1 from public.care_space_members members
      where members.space_id = walk_logs.space_id
        and members.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.care_space_members members
      where members.space_id = walk_logs.space_id
        and members.user_id = (select auth.uid())
        and members.role in ('owner', 'caregiver')
    )
  );

create policy "Members manage memory entries"
  on public.memory_entries for all
  using (
    exists (
      select 1 from public.care_space_members members
      where members.space_id = memory_entries.space_id
        and members.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.care_space_members members
      where members.space_id = memory_entries.space_id
        and members.user_id = (select auth.uid())
        and members.role in ('owner', 'caregiver')
    )
  );

create policy "Authenticated users read active experts"
  on public.expert_profiles for select
  to authenticated
  using (active = true);

create policy "Members manage recommendation feedback"
  on public.recommendation_feedback for all
  using (
    exists (
      select 1 from public.care_space_members members
      where members.space_id = recommendation_feedback.space_id
        and members.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.care_space_members members
      where members.space_id = recommendation_feedback.space_id
        and members.user_id = (select auth.uid())
    )
  );

create policy "Users manage own notification preferences"
  on public.notification_preferences for all
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.care_space_members members
      where members.space_id = notification_preferences.space_id
        and members.user_id = (select auth.uid())
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.care_space_members members
      where members.space_id = notification_preferences.space_id
        and members.user_id = (select auth.uid())
    )
  );

insert into storage.buckets (id, name, public)
values ('pet-memories', 'pet-memories', false)
on conflict (id) do nothing;

create policy "Users read own memory photos"
  on storage.objects for select
  using (
    bucket_id = 'pet-memories'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users upload own memory photos"
  on storage.objects for insert
  with check (
    bucket_id = 'pet-memories'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users update own memory photos"
  on storage.objects for update
  using (
    bucket_id = 'pet-memories'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'pet-memories'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
