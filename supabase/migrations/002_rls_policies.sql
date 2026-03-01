-- Prostor: Row Level Security Policies

-- ============================================
-- Enable RLS on all tables
-- ============================================
alter table public.users enable row level security;
alter table public.courses enable row level security;
alter table public.course_members enable row level security;
alter table public.weeks enable row level security;
alter table public.assignments enable row level security;
alter table public.slides enable row level security;
alter table public.slide_resources enable row level security;
alter table public.resources enable row level security;
alter table public.whiteboards enable row level security;

-- ============================================
-- Helper: Check if user is admin
-- ============================================
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ============================================
-- Helper: Check if user is member of a course
-- ============================================
create or replace function public.is_course_member(p_course_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.course_members
    where course_id = p_course_id and user_id = auth.uid()
  );
$$ language sql security definer stable;

-- ============================================
-- Users policies
-- ============================================
create policy "Users can view own profile"
  on public.users for select
  using (id = auth.uid());

create policy "Admin can view all users"
  on public.users for select
  using (public.is_admin());

create policy "Users can update own profile"
  on public.users for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ============================================
-- Courses policies
-- ============================================
create policy "Course members can view their courses"
  on public.courses for select
  using (
    public.is_admin()
    or public.is_course_member(id)
  );

create policy "Admin can create courses"
  on public.courses for insert
  with check (public.is_admin());

create policy "Admin can update courses"
  on public.courses for update
  using (public.is_admin());

create policy "Admin can delete courses"
  on public.courses for delete
  using (public.is_admin());

-- ============================================
-- Course Members policies
-- ============================================
create policy "Members can view own enrollment"
  on public.course_members for select
  using (
    user_id = auth.uid()
    or public.is_admin()
  );

create policy "Admin can manage members"
  on public.course_members for insert
  with check (public.is_admin());

create policy "Admin can remove members"
  on public.course_members for delete
  using (public.is_admin());

-- ============================================
-- Weeks policies
-- ============================================
create policy "Course members can view weeks"
  on public.weeks for select
  using (
    public.is_admin()
    or public.is_course_member(course_id)
  );

create policy "Admin can manage weeks"
  on public.weeks for insert
  with check (public.is_admin());

create policy "Admin can update weeks"
  on public.weeks for update
  using (public.is_admin());

create policy "Admin can delete weeks"
  on public.weeks for delete
  using (public.is_admin());

-- ============================================
-- Assignments policies
-- ============================================
create policy "Course members can view assignments"
  on public.assignments for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.weeks w
      where w.id = week_id
      and public.is_course_member(w.course_id)
    )
  );

create policy "Students can create own assignments"
  on public.assignments for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.weeks w
      where w.id = week_id
      and public.is_course_member(w.course_id)
    )
  );

create policy "Students can update own assignments"
  on public.assignments for update
  using (user_id = auth.uid());

create policy "Students can delete own assignments"
  on public.assignments for delete
  using (user_id = auth.uid() or public.is_admin());

-- ============================================
-- Slides policies
-- ============================================
create policy "Course members can view slides"
  on public.slides for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.weeks w
      where w.id = week_id
      and public.is_course_member(w.course_id)
    )
  );

create policy "Admin can manage slides"
  on public.slides for insert
  with check (public.is_admin());

create policy "Admin can update slides"
  on public.slides for update
  using (public.is_admin());

create policy "Admin can delete slides"
  on public.slides for delete
  using (public.is_admin());

-- ============================================
-- Slide Resources policies
-- ============================================
create policy "Course members can view slide resources"
  on public.slide_resources for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.slides s
      join public.weeks w on w.id = s.week_id
      where s.id = slide_id
      and public.is_course_member(w.course_id)
    )
  );

create policy "Admin can manage slide resources"
  on public.slide_resources for insert
  with check (public.is_admin());

create policy "Admin can update slide resources"
  on public.slide_resources for update
  using (public.is_admin());

create policy "Admin can delete slide resources"
  on public.slide_resources for delete
  using (public.is_admin());

-- ============================================
-- Resources policies
-- ============================================
create policy "Course members can view resources"
  on public.resources for select
  using (
    public.is_admin()
    or public.is_course_member(course_id)
  );

create policy "Admin can manage resources"
  on public.resources for insert
  with check (public.is_admin());

create policy "Admin can update resources"
  on public.resources for update
  using (public.is_admin());

create policy "Admin can delete resources"
  on public.resources for delete
  using (public.is_admin());

-- ============================================
-- Whiteboards policies
-- ============================================
create policy "Course members can view whiteboards"
  on public.whiteboards for select
  using (
    public.is_admin()
    or public.is_course_member(course_id)
  );

create policy "Admin can manage whiteboards"
  on public.whiteboards for insert
  with check (public.is_admin());

create policy "Admin can update whiteboards"
  on public.whiteboards for update
  using (public.is_admin());

create policy "Admin can delete whiteboards"
  on public.whiteboards for delete
  using (public.is_admin());
