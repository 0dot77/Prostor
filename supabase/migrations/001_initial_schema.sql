-- Prostor: Initial Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. Users table (extends Supabase Auth)
-- ============================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  avatar_url text,
  role text not null default 'student' check (role in ('admin', 'student')),
  created_at timestamptz not null default now()
);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- 2. Courses (강의/워크숍)
-- ============================================
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cover_image_url text,
  type text not null default 'course' check (type in ('course', 'workshop')),
  created_by uuid references public.users(id) on delete set null,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

-- ============================================
-- 3. Course Members (수강 등록)
-- ============================================
create table public.course_members (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'student' check (role in ('instructor', 'student')),
  enrolled_at timestamptz not null default now(),
  unique(course_id, user_id)
);

-- ============================================
-- 4. Weeks (주차)
-- ============================================
create table public.weeks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  week_number int not null,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

-- ============================================
-- 5. Assignments (과제 - 이미지)
-- ============================================
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  title text,
  description text,
  image_url text not null,
  thumbnail_url text not null,
  created_at timestamptz not null default now()
);

-- ============================================
-- 6. Slides (슬라이드 - PDF)
-- ============================================
create table public.slides (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.weeks(id) on delete cascade,
  title text not null,
  file_url text not null,
  page_count int,
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================
-- 7. Slide Resources (슬라이드 페이지별 링크 자료)
-- ============================================
create table public.slide_resources (
  id uuid primary key default gen_random_uuid(),
  slide_id uuid not null references public.slides(id) on delete cascade,
  page_number int not null,
  url text not null,
  og_title text,
  og_description text,
  og_image text,
  og_site_name text,
  sort_order int not null default 0,
  added_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================
-- 8. Resources (일반 수업 자료 - 링크)
-- ============================================
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  week_id uuid references public.weeks(id) on delete set null,
  url text not null,
  og_title text,
  og_description text,
  og_image text,
  og_site_name text,
  added_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ============================================
-- 9. Whiteboards (화이트보드)
-- ============================================
create table public.whiteboards (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null default 'Whiteboard',
  room_id text not null unique,
  created_at timestamptz not null default now()
);

-- ============================================
-- Indexes for performance
-- ============================================
create index idx_course_members_user on public.course_members(user_id);
create index idx_course_members_course on public.course_members(course_id);
create index idx_weeks_course on public.weeks(course_id);
create index idx_assignments_week on public.assignments(week_id);
create index idx_assignments_user on public.assignments(user_id);
create index idx_slides_week on public.slides(week_id);
create index idx_slide_resources_slide_page on public.slide_resources(slide_id, page_number);
create index idx_resources_course on public.resources(course_id);
create index idx_whiteboards_course on public.whiteboards(course_id);
