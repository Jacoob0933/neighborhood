export type PostCategory = 'general' | 'events' | 'marketplace' | 'lost_found'

export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  location: unknown | null  // geography type
  city: string | null
  neighborhood: string | null
  full_name_locked?: boolean
  username_updated_at?: string | null
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  author_id: string
  title: string
  body: string
  category: PostCategory
  location: unknown | null
  city: string | null
  neighborhood: string | null
  image_urls: string[]
  is_resolved: boolean
  created_at: string
  updated_at: string
  // joined
  profiles?: Profile
  post_likes?: { user_id: string }[]
  _likes_count?: number
}

export interface Event {
  id: string
  post_id: string | null
  organizer_id: string
  title: string
  description: string | null
  location_name: string | null
  location: unknown | null
  starts_at: string
  ends_at: string | null
  max_attendees: number | null
  image_url: string | null
  created_at: string
  // joined
  profiles?: Profile
  event_attendees?: { user_id: string }[]
}

export interface Conversation {
  id: string
  created_at: string
  conversation_participants?: ConversationParticipant[]
}

export interface ConversationParticipant {
  conversation_id: string
  user_id: string
  last_read_at: string
  profiles?: Profile
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  profiles?: Profile
}

export interface PostLike {
  post_id: string
  user_id: string
  created_at: string
}

// Supabase Database type shim
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      posts: { Row: Post; Insert: Omit<Post, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Post> }
      events: { Row: Event; Insert: Omit<Event, 'id' | 'created_at'>; Update: Partial<Event> }
      event_attendees: { Row: { event_id: string; user_id: string; joined_at: string }; Insert: { event_id: string; user_id: string }; Update: never }
      conversations: { Row: Conversation; Insert: Record<string, never>; Update: never }
      conversation_participants: { Row: ConversationParticipant; Insert: Omit<ConversationParticipant, 'last_read_at'>; Update: Partial<ConversationParticipant> }
      messages: { Row: Message; Insert: Omit<Message, 'id' | 'created_at'>; Update: never }
      post_likes: { Row: PostLike; Insert: Omit<PostLike, 'created_at'>; Update: never }
    }
    Views: Record<string, never>
    Functions: {
      get_or_create_conversation: { Args: { other_user_id: string }; Returns: string }
      posts_near: {
        Args: { lat: number; lng: number; radius_m?: number; lim?: number; offs?: number; cat?: string | null }
        Returns: Post[]
      }
    }
    Enums: { post_category: PostCategory }
  }
}
