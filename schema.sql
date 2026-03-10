-- create table public.users

create table public.users (
  id uuid not null default auth.uid (),
  first_name text null,
  last_name text null,
  email text null,
  created_at timestamp with time zone not null default now(),
  constraint users_pkey primary key (id),
  constraint users_id_fkey foreign KEY (id) references auth.users (id)
) TABLESPACE pg_default;

-- inserts a row into public.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, first_name, last_name, email)
  values (new.id, new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name', new.email);
  return new;
end;
$$;

-- trigger the function every time a user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- create table public.sessions
create table public.sessions (
  session_code text not null,
  host_id uuid not null default gen_random_uuid (),
  offer jsonb null,
  answer jsonb null,
  created_at timestamp with time zone not null default now(),
  constraint sessions_pkey primary key (session_code, host_id),
  constraint sessions_host_id_fkey foreign KEY (host_id) references users (id)
) TABLESPACE pg_default;

-- create table public.candidates
create table public.candidates (
  id uuid not null default gen_random_uuid (),
  offer_code text not null,
  direction text null,
  candidate jsonb null,
  constraint candidates_pkey primary key (id)
) TABLESPACE pg_default;