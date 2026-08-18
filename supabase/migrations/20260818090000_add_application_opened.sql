alter table public.leads
add column if not exists application_opened boolean not null default false;
