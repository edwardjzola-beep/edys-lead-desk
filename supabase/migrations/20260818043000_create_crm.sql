create table public.leads (
  id bigint primary key,
  contact_name text not null,
  organization text not null default '',
  email text not null default '',
  phone text not null default '',
  country text not null default '',
  case_type text not null default '',
  source text not null default '',
  stage text not null default 'New',
  next_action text not null default '',
  follow_up_date date,
  summary text not null default '',
  email_draft text not null default '',
  tags jsonb not null default '[]'::jsonb check (jsonb_typeof(tags) = 'array'),
  status text not null default 'active' check (status in ('active', 'converted')),
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activities (
  id bigint primary key,
  lead_id bigint not null references public.leads(id) on delete cascade,
  kind text not null,
  note text not null,
  created_at timestamptz not null default now()
);

create index leads_follow_up_date_idx on public.leads(follow_up_date);
create index leads_status_idx on public.leads(status);
create index activities_lead_created_idx on public.activities(lead_id, created_at desc);

alter table public.leads enable row level security;
alter table public.activities enable row level security;

revoke all on table public.leads from anon, authenticated;
revoke all on table public.activities from anon, authenticated;
grant all on table public.leads to service_role;
grant all on table public.activities to service_role;
