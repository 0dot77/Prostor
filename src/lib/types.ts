// Database types for Prostor

export type UserRole = "admin" | "student";
export type CourseType = "course" | "workshop";
export type CourseMemberRole = "instructor" | "student";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  type: CourseType;
  created_by: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface CourseMember {
  id: string;
  course_id: string;
  user_id: string;
  role: CourseMemberRole;
  enrolled_at: string;
}

export interface CourseMemberWithUser extends CourseMember {
  users: User;
}

export interface Week {
  id: string;
  course_id: string;
  week_number: number;
  title: string;
  description: string | null;
  created_at: string;
}

export interface Assignment {
  id: string;
  week_id: string;
  user_id: string;
  title: string | null;
  description: string | null;
  image_url: string;
  thumbnail_url: string;
  created_at: string;
}

export interface AssignmentWithUser extends Assignment {
  users: Pick<User, "id" | "name" | "avatar_url">;
}

export interface Slide {
  id: string;
  week_id: string;
  title: string;
  file_url: string;
  page_count: number | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface SlideResource {
  id: string;
  slide_id: string;
  page_number: number;
  url: string;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_site_name: string | null;
  sort_order: number;
  added_by: string | null;
  created_at: string;
}

export interface Resource {
  id: string;
  course_id: string;
  week_id: string | null;
  url: string;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  og_site_name: string | null;
  added_by: string | null;
  created_at: string;
}

export interface Whiteboard {
  id: string;
  course_id: string;
  title: string;
  room_id: string;
  created_at: string;
}
