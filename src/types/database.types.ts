export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    updated_at: string | null
                    username: string | null
                    full_name: string | null
                    avatar_url: string | null
                    website: string | null
                }
                Insert: {
                    id: string
                    updated_at?: string | null
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    website?: string | null
                }
                Update: {
                    id?: string
                    updated_at?: string | null
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    website?: string | null
                }
            }
            masks: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    sex: 'H' | 'F'
                    age: number
                    city: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    sex: 'H' | 'F'
                    age: number
                    city: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    sex?: 'H' | 'F'
                    age?: number
                    city?: string
                    created_at?: string
                }
            }
            confessions: {
                Row: {
                    id: string
                    user_id: string
                    mask_id: string
                    content: string
                    status: 'pending' | 'validated' | 'rejected'
                    created_at: string
                    audio_url: string | null
                    audio_duration: number | null
                    confession_type: 'text' | 'audio'
                }
                Insert: {
                    id?: string
                    user_id: string
                    mask_id: string
                    content: string
                    status?: 'pending' | 'validated' | 'rejected'
                    created_at?: string
                    audio_url?: string | null
                    audio_duration?: number | null
                    confession_type?: 'text' | 'audio'
                }
                Update: {
                    id?: string
                    user_id?: string
                    mask_id?: string
                    content?: string
                    status?: 'pending' | 'validated' | 'rejected'
                    created_at?: string
                    audio_url?: string | null
                    audio_duration?: number | null
                    confession_type?: 'text' | 'audio'
                }
            }
            likes: {
                Row: {
                    id: string
                    user_id: string
                    confession_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    confession_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    confession_id?: string
                    created_at?: string
                }
            }
            comments: {
                Row: {
                    id: string
                    user_id: string
                    confession_id: string
                    mask_id: string
                    content: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    confession_id: string
                    mask_id: string
                    content: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    confession_id?: string
                    mask_id?: string
                    content?: string
                    created_at?: string
                }
            }
            validations: {
                Row: {
                    id: string
                    user_id: string
                    confession_id: string
                    vote: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    confession_id: string
                    vote: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    confession_id?: string
                    vote?: boolean
                    created_at?: string
                }
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    type: 'like' | 'comment' | 'validation' | 'message'
                    content: string
                    related_id: string | null
                    read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    type: 'like' | 'comment' | 'validation' | 'message'
                    content: string
                    related_id?: string | null
                    read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    type?: 'like' | 'comment' | 'validation' | 'message'
                    content?: string
                    related_id?: string | null
                    read?: boolean
                    created_at?: string
                }
            }
            conversations: {
                Row: {
                    id: string
                    participant_a_id: string
                    participant_b_id: string
                    last_message_at: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    participant_a_id: string
                    participant_b_id: string
                    last_message_at?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    participant_a_id?: string
                    participant_b_id?: string
                    last_message_at?: string
                    created_at?: string
                }
            }
            messages: {
                Row: {
                    id: string
                    conversation_id: string
                    sender_id: string
                    content: string
                    read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    conversation_id: string
                    sender_id: string
                    content: string
                    read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    conversation_id?: string
                    sender_id?: string
                    content?: string
                    read?: boolean
                    created_at?: string
                }
            },
            veilles: {
                Row: {
                    id: string
                    user_id: string
                    mask_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    mask_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    mask_id?: string
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
