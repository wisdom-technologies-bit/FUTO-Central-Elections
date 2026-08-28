-- FUTO Central Elections foundation schema
-- Supabase/PostgreSQL. No credentials or production access codes are stored here.
create extension if not exists pgcrypto;

create table if not exists academic_sessions (
  id uuid primary key default gen_random_uuid(), session_name text not null unique,
  start_year integer not null, end_year integer not null, is_current boolean not null default false,
  status text not null default 'upcoming' check (status in ('upcoming','current','closed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (end_year = start_year + 1)
);
create unique index if not exists one_current_session on academic_sessions (is_current) where is_current;

create table if not exists schools (
  id uuid primary key default gen_random_uuid(), name text not null, short_name text, code text not null unique,
  is_active boolean not null default true, display_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists departments (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references schools(id) on delete restrict,
  name text not null, short_name text, code text not null unique, is_active boolean not null default true,
  display_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (school_id, name)
);

create table if not exists admin_access_codes (
  id uuid primary key default gen_random_uuid(), code_hash text not null, label text not null,
  is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  last_used_at timestamptz, expires_at timestamptz
);
create index if not exists active_admin_codes on admin_access_codes(is_active, expires_at);

create table if not exists elections (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, description text,
  session_id uuid references academic_sessions(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft','scheduled','active','in_review','completed','published','cancelled')),
  scheduled_start_at timestamptz, scheduled_end_at timestamptz, started_at timestamptz, stopped_at timestamptz,
  results_published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (scheduled_end_at is null or scheduled_start_at is null or scheduled_end_at > scheduled_start_at),
  check ((status = 'published') = (results_published_at is not null))
);
create index if not exists elections_status_idx on elections(status, results_published_at desc);

create table if not exists election_positions (
  id uuid primary key default gen_random_uuid(), election_id uuid not null references elections(id) on delete cascade,
  name text not null, description text, display_order integer not null default 0, max_winners integer not null default 1 check (max_winners > 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(election_id, name)
);
create table if not exists candidates (
  id uuid primary key default gen_random_uuid(), election_id uuid not null references elections(id) on delete cascade,
  position_id uuid not null references election_positions(id) on delete cascade, full_name text not null, image_url text,
  manifesto text, status text not null default 'approved' check (status in ('pending','approved','withdrawn','disqualified')),
  display_order integer not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists election_eligibility (
  id uuid primary key default gen_random_uuid(), election_id uuid not null references elections(id) on delete cascade,
  school_id uuid references schools(id) on delete restrict, department_id uuid references departments(id) on delete restrict,
  level smallint check (level in (100,200,300,400,500)), created_at timestamptz not null default now()
);
create table if not exists students (
  id uuid primary key default gen_random_uuid(), jamb_registration_number text not null unique, full_name text not null,
  gender text, state_of_origin text, school_id uuid references schools(id) on delete restrict, department_id uuid references departments(id) on delete restrict,
  level smallint check (level in (100,200,300,400,500)), academic_session_id uuid references academic_sessions(id) on delete restrict,
  admission_session text, status text not null default 'active' check (status in ('active','graduated','inactive','invalid')),
  source text, source_url text, imported_at timestamptz, graduated_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists students_scope_idx on students(school_id, department_id, level, academic_session_id);

create table if not exists voting_records (
  id uuid primary key default gen_random_uuid(), election_id uuid not null references elections(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict, voted_at timestamptz not null default now(),
  unique(election_id, student_id)
);
create table if not exists ballots (
  id uuid primary key default gen_random_uuid(), voting_record_id uuid not null references voting_records(id) on delete cascade,
  position_id uuid not null references election_positions(id) on delete restrict, candidate_id uuid references candidates(id) on delete restrict,
  created_at timestamptz not null default now(), unique(voting_record_id, position_id)
);
create table if not exists published_results (
  id uuid primary key default gen_random_uuid(), election_id uuid not null references elections(id) on delete cascade,
  position_id uuid not null references election_positions(id) on delete cascade, candidate_id uuid references candidates(id) on delete restrict,
  vote_count bigint check (vote_count >= 0), is_winner boolean not null default false, rank integer check (rank > 0),
  published_at timestamptz not null default now(), unique(position_id, candidate_id)
);
create index if not exists published_results_election_idx on published_results(election_id, published_at desc);
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(), event_type text not null, admin_access_code_id uuid references admin_access_codes(id) on delete set null,
  election_id uuid references elections(id) on delete set null, ip_address inet, user_agent text, metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on audit_logs(created_at desc);

-- Seed only the stable academic taxonomy; verify names against current official FUTO sources before production use.
insert into schools (name, short_name, code, display_order) values
('School of Agriculture and Agricultural Technology','SAAT','SAAT',1),('School of Basic Medical Sciences','SBMS','SBMS',2),('School of Biological Sciences','SOBS','SOBS',3),('School of Engineering and Engineering Technology','SEET','SEET',4),('School of Electrical Systems Engineering Technology','SESET','SESET',5),('School of Environmental Science','SOES','SOES',6),('School of Health Technology','SOHT','SOHT',7),('School of Information and Communication Technology','SICT','SICT',8),('School of Logistics and Innovation Technology','SLIT','SLIT',9),('School of Physical Sciences','SOPS','SOPS',10)
on conflict (code) do nothing;
-- Departments are intentionally not guessed here: official FUTO structures change and should be reviewed before insertion.
-- No admin access-code seed row is inserted. Store only a server-generated password hash.

-- Recommended public-results query predicate:
-- where status = 'published' and results_published_at is not null
-- Never use client-side filtering as the authorization boundary.
