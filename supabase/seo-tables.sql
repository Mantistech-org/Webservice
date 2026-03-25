-- Run this in the Supabase SQL editor to create the SEO tables.

-- SEO meta tags for each page of the Mantis Tech website
CREATE TABLE IF NOT EXISTS public.seo_meta (
  id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path     text        NOT NULL,
  page_label    text        NOT NULL,
  meta_title    text,
  meta_description text,
  og_title      text,
  og_description text,
  og_image      text,
  status        text        NOT NULL DEFAULT 'draft',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS seo_meta_page_path_idx ON public.seo_meta (page_path);

-- Location-specific landing pages (e.g. /locations/austin-tx)
CREATE TABLE IF NOT EXISTS public.seo_location_pages (
  id               uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city             text        NOT NULL,
  state            text        NOT NULL,
  slug             text        NOT NULL,
  meta_title       text,
  meta_description text,
  headline         text,
  content          text,
  status           text        NOT NULL DEFAULT 'draft',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  published_at     timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS seo_location_pages_slug_idx ON public.seo_location_pages (slug);

-- Blog posts (e.g. /blog/how-to-get-more-google-reviews)
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id               uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title            text        NOT NULL,
  slug             text        NOT NULL,
  meta_description text,
  content          text,
  status           text        NOT NULL DEFAULT 'draft',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  published_at     timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_idx ON public.blog_posts (slug);
