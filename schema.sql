-- Smart Planner - Sprint 1
-- The profile is linked to Supabase Auth and cannot be accessed across users.

create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) >= 2),
  email text not null,
  consentimiento_ley_21719 boolean not null default false,
  fecha_consentimiento timestamptz,
  rol text not null default 'estudiante' check (rol in ('estudiante', 'admin')),
  constraint consentimiento_fecha_coherente check (
    (consentimiento_ley_21719 = true and fecha_consentimiento is not null)
    or (consentimiento_ley_21719 = false and fecha_consentimiento is null)
  )
);

alter table public.perfiles enable row level security;

drop policy if exists "Users can read their own profile" on public.perfiles;
create policy "Users can read their own profile"
  on public.perfiles for select
  using (auth.uid() = id);

drop policy if exists "Users can create their own profile" on public.perfiles;
create policy "Users can create their own profile"
  on public.perfiles for insert
  with check (auth.uid() = id and consentimiento_ley_21719 = true);

drop policy if exists "Users can update their own profile" on public.perfiles;
create policy "Users can update their own profile"
  on public.perfiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Keeps profiles available even when Supabase email confirmation is enabled.
create or replace function public.crear_perfil_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfiles (
    id, nombre, email, consentimiento_ley_21719, fecha_consentimiento, rol
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', 'Usuario'),
    new.email,
    coalesce(new.raw_user_meta_data->>'consentimiento_ley_21719', 'false') = 'true',
    case
      when coalesce(new.raw_user_meta_data->>'consentimiento_ley_21719', 'false') = 'true'
      then now()
      else null
    end,
    'estudiante'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists al_crear_usuario_crear_perfil on auth.users;
create trigger al_crear_usuario_crear_perfil
  after insert on auth.users
  for each row execute procedure public.crear_perfil_usuario();
