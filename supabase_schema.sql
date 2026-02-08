-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Users)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  updated_at timestamp with time zone,
  constraint username_length check (char_length(username) >= 3)
);

-- MASKS (Anonymous Identities)
create table masks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  sex text check (sex in ('H', 'F')),
  age int check (age >= 13),
  city text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CONFESSIONS (Posts)
create table confessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  mask_id uuid references masks(id) on delete set null,
  content text not null,
  status text check (status in ('pending', 'validated', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- LIKES
create table likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  confession_id uuid references confessions(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, confession_id)
);

-- COMMENTS (Advice)
create table comments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  confession_id uuid references confessions(id) on delete cascade not null,
  mask_id uuid references masks(id) on delete set null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- VALIDATIONS (Votes)
create table validations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  confession_id uuid references confessions(id) on delete cascade not null,
  vote boolean not null, -- true = validate, false = reject
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- NOTIFICATIONS
create table notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text check (type in ('like', 'comment', 'validation', 'message')),
  content text,
  related_id uuid, -- ID of the like, comment, etc.
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CONVERSATIONS
create table conversations (
  id uuid default uuid_generate_v4() primary key,
  participant_a_id uuid references auth.users on delete cascade not null,
  participant_b_id uuid references auth.users on delete cascade not null,
  last_message_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(participant_a_id, participant_b_id)
);

-- MESSAGES
create table messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id uuid references auth.users on delete cascade not null,
  content text not null,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ROW LEVEL SECURITY (RLS)
alter table profiles enable row level security;
alter table masks enable row level security;
alter table confessions enable row level security;
alter table likes enable row level security;
alter table comments enable row level security;
alter table validations enable row level security;
alter table notifications enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

-- POLICIES (Simplified for MVP)
-- Profiles: Any checked in user can view, only self can update
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );

-- Confessions: Public read, User create
create policy "Confessions are public" on confessions for select using ( true );
create policy "Users can create confessions" on confessions for insert with check ( auth.uid() = user_id );

-- Masks: Public read, User create
create policy "Masks are public" on masks for select using ( true );
create policy "Users can create masks" on masks for insert with check ( auth.uid() = user_id );

-- Interactions: Similar logic...
-- (Add specific policies as needed for privacy)

-- KARMA SYSTEM (Added Phase 3)
ALTER TABLE masks ADD COLUMN IF NOT EXISTS karma INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION update_karma()
RETURNS TRIGGER AS $$
DECLARE
    target_mask_id uuid;
    points_change integer := 0;
BEGIN
    -- CAS 1 : Nouveau commentaire (+2 points)
    IF (TG_TABLE_NAME = 'comments' AND TG_OP = 'INSERT') THEN
         UPDATE masks SET karma = karma + 2 WHERE id = NEW.mask_id;
         RETURN NEW;
    END IF;

    -- CAS 2 : Vote sur un commentaire
    IF (TG_TABLE_NAME = 'comment_votes') THEN
        SELECT mask_id INTO target_mask_id FROM comments WHERE id = COALESCE(NEW.comment_id, OLD.comment_id);
        
        IF (TG_OP = 'INSERT') THEN
            points_change := CASE WHEN NEW.vote = true THEN 10 ELSE -5 END;
        ELSIF (TG_OP = 'DELETE') THEN
            points_change := CASE WHEN OLD.vote = true THEN -10 ELSE 5 END;
        ELSIF (TG_OP = 'UPDATE' AND NEW.vote IS DISTINCT FROM OLD.vote) THEN
            points_change := CASE WHEN NEW.vote = true THEN 15 ELSE -15 END;
        END IF;

        IF target_mask_id IS NOT NULL THEN
            UPDATE masks SET karma = karma + points_change WHERE id = target_mask_id;
        END IF;
        
        RETURN NEW;
    END IF;

    -- CAS 3 : Like sur une Confession (+5 points)
    IF (TG_TABLE_NAME = 'likes') THEN
        SELECT mask_id INTO target_mask_id FROM confessions WHERE id = COALESCE(NEW.confession_id, OLD.confession_id);

        IF (TG_OP = 'INSERT') THEN
            points_change := 5;
        ELSIF (TG_OP = 'DELETE') THEN
            points_change := -5;
        END IF;

        IF target_mask_id IS NOT NULL THEN
            UPDATE masks SET karma = karma + points_change WHERE id = target_mask_id;
        END IF;
        
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
DROP TRIGGER IF EXISTS on_comment_posted ON comments;
CREATE TRIGGER on_comment_posted AFTER INSERT ON comments FOR EACH ROW EXECUTE FUNCTION update_karma();

DROP TRIGGER IF EXISTS on_comment_vote ON comment_votes;
CREATE TRIGGER on_comment_vote AFTER INSERT OR UPDATE OR DELETE ON comment_votes FOR EACH ROW EXECUTE FUNCTION update_karma();

DROP TRIGGER IF EXISTS on_confession_like ON likes;
CREATE TRIGGER on_confession_like AFTER INSERT OR DELETE ON likes FOR EACH ROW EXECUTE FUNCTION update_karma();
