-- Add source_type column to slides table
-- Allows distinguishing between Google Slides links, Google Drive PDFs, and uploaded PDFs
alter table public.slides
  add column if not exists source_type text
  check (source_type in ('google_slides', 'google_drive_pdf', 'pdf_url', 'pdf_upload'));
