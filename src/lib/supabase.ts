import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing from environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  email: string;
  status: 'pending' | 'active';
  payment_screenshot_url?: string;
  gemini_api_key?: string;
  created_at: string;
}

export interface Video {
  id: string;
  user_id: string;
  youtube_url: string;
  youtube_id: string;
  title: string;
  summary: {
    about: string;
    summary: string;
    takeaways: {
      timestamp: string;
      seconds: number;
      text: string;
    }[];
  };
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  video_id: string;
  content: string;
  created_at: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  user_id: string;
  video_id: string;
  messages: ChatMessage[];
  created_at: string;
}
