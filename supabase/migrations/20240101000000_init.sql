-- Enable required extensions
create extension if not exists postgis;
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id           uuid references auth.users on delete cascade primary key,
  username     text unique not null,
  full_name    text,
  avatar_url   text,
  bio          text,
  location     geography(Point, 4326),
  city         text,
  neighborhood text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- POSTS
-- ============================================================
create type post_category as enum ('general', 'events', 'marketplace', 'lost_found');

create table public.posts (
  id           uuid default gen_random_uuid() primary key,
  author_id    uuid references public.profiles(id) on delete cascade not null,
  title        text not null,
  body         text not null,
  category     post_category not null default 'general',
  location     geography(Point, 4326),
  city         text,
  neighborhood text,
  image_urls   text[] default '{}',
  is_resolved  boolean default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Spatial index for 20km radius queries
create index posts_location_idx on public.posts using gist(location);
create index posts_category_idx on public.posts(category);
create index posts_created_at_idx on public.posts(created_at desc);
create index posts_author_idx on public.posts(author_id);

-- ============================================================
-- EVENTS
-- ============================================================
create table public.events (
  id             uuid default gen_random_uuid() primary key,
  post_id        uuid references public.posts(id) on delete cascade unique,
  organizer_id   uuid references public.profiles(id) on delete cascade not null,
  title          text not null,
  description    text,
  location_name  text,
  location       geography(Point, 4326),
  starts_at      timestamptz not null,
  ends_at        timestamptz,
  max_attendees  int,
  image_url      text,
  created_at     timestamptz default now()
);

create index events_location_idx on public.events using gist(location);
create index events_starts_at_idx on public.events(starts_at);

create table public.event_attendees (
  event_id  uuid references public.events(id) on delete cascade,
  user_id   uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (event_id, user_id)
);

-- ============================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================
create table public.conversations (
  id         uuid default gen_random_uuid() primary key,
  created_at timestamptz default now()
);

create table public.conversation_participants (
  conversation_id uuid references public.conversations(id) on delete cascade,
  user_id         uuid references public.profiles(id) on delete cascade,
  last_read_at    timestamptz default now(),
  primary key (conversation_id, user_id)
);

create table public.messages (
  id              uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id       uuid references public.profiles(id) on delete cascade not null,
  body            text not null,
  created_at      timestamptz default now()
);

create index messages_conversation_idx on public.messages(conversation_id, created_at);

-- ============================================================
-- POST LIKES / REACTIONS
-- ============================================================
create table public.post_likes (
  post_id    uuid references public.posts(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Find or create a DM conversation between two users
create or replace function public.get_or_create_conversation(other_user_id uuid)
returns uuid language plpgsql security definer as $$
declare
  conv_id uuid;
  me uuid := auth.uid();
begin
  -- Look for existing 1-on-1 conversation between the two users
  select cp1.conversation_id into conv_id
  from public.conversation_participants cp1
  join public.conversation_participants cp2
    on cp1.conversation_id = cp2.conversation_id
  where cp1.user_id = me
    and cp2.user_id = other_user_id
  limit 1;

  if conv_id is null then
    insert into public.conversations default values returning id into conv_id;
    insert into public.conversation_participants (conversation_id, user_id) values (conv_id, me);
    insert into public.conversation_participants (conversation_id, user_id) values (conv_id, other_user_id);
  end if;

  return conv_id;
end;
$$;

-- Posts within radius (meters) of a point
create or replace function public.posts_near(
  lat double precision,
  lng double precision,
  radius_m double precision default 20000,
  lim int default 50,
  offs int default 0,
  cat text default null
)
returns setof public.posts language sql stable as $$
  select p.*
  from public.posts p
  where p.location is not null
    and st_dwithin(p.location, st_makepoint(lng, lat)::geography, radius_m)
    and (cat is null or p.category::text = cat)
  order by p.created_at desc
  limit lim offset offs;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.events enable row level security;
alter table public.event_attendees enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.post_likes enable row level security;

-- Profiles: public read, owner write
create policy "Profiles are publicly viewable" on public.profiles for select using (true);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Posts: public read, owner write
create policy "Posts are publicly viewable" on public.posts for select using (true);
create policy "Authenticated users can create posts" on public.posts for insert with check (auth.uid() = author_id);
create policy "Authors can update their posts" on public.posts for update using (auth.uid() = author_id);
create policy "Authors can delete their posts" on public.posts for delete using (auth.uid() = author_id);

-- Events: public read, organizer write
create policy "Events are publicly viewable" on public.events for select using (true);
create policy "Authenticated users can create events" on public.events for insert with check (auth.uid() = organizer_id);
create policy "Organizers can update events" on public.events for update using (auth.uid() = organizer_id);

-- Event attendees
create policy "Attendees are publicly viewable" on public.event_attendees for select using (true);
create policy "Users can join events" on public.event_attendees for insert with check (auth.uid() = user_id);
create policy "Users can leave events" on public.event_attendees for delete using (auth.uid() = user_id);

-- Conversations & messages: participants only
create policy "Participants can view conversations" on public.conversations
  for select using (
    exists (select 1 from public.conversation_participants cp where cp.conversation_id = id and cp.user_id = auth.uid())
  );

create policy "Participants viewable by members" on public.conversation_participants
  for select using (
    exists (select 1 from public.conversation_participants cp where cp.conversation_id = conversation_id and cp.user_id = auth.uid())
  );

create policy "Participants can view messages" on public.messages
  for select using (
    exists (select 1 from public.conversation_participants cp where cp.conversation_id = conversation_id and cp.user_id = auth.uid())
  );

create policy "Participants can send messages" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (select 1 from public.conversation_participants cp where cp.conversation_id = conversation_id and cp.user_id = auth.uid())
  );

-- Post likes
create policy "Likes are publicly viewable" on public.post_likes for select using (true);
create policy "Users can like posts" on public.post_likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike posts" on public.post_likes for delete using (auth.uid() = user_id);

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.posts;
