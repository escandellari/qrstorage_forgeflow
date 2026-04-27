-- Add category and notes columns to box_items, replacing description
alter table public.box_items
  add column if not exists category text,
  add column if not exists notes text;
