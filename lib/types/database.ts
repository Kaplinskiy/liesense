export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      topic: {
        Row: {
          id: string;
          slug: string;
          name: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["topic"]["Row"]>;
      };
      question_set: {
        Row: {
          id: string;
          topic_id: string;
          type: "regular" | "daily" | "duel" | "code";
          code: string | null;
          title: string | null;
          seed_version: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          type: "regular" | "daily" | "duel" | "code";
          code?: string | null;
          title?: string | null;
          seed_version?: number;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["question_set"]["Row"]>;
      };
      question: {
        Row: {
          id: string;
          topic_id: string;
          question_set_id: string;
          prompt: string;
          stmt_a: string;
          stmt_b: string;
          stmt_c: string;
          lie_option: "A" | "B" | "C";
          explanation: string;
          correct_fact: string;
          trap_type: string;
          difficulty: number;
          source_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          question_set_id: string;
          prompt: string;
          stmt_a: string;
          stmt_b: string;
          stmt_c: string;
          lie_option: "A" | "B" | "C";
          explanation: string;
          correct_fact: string;
          trap_type: string;
          difficulty?: number;
          source_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["question"]["Row"]>;
      };
      user_profile: {
        Row: {
          id: string;
          guest_id: string;
          first_seen_at: string;
          last_seen_at: string | null;
          locale: string | null;
          streak_current: number;
          streak_last_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          guest_id: string;
          first_seen_at?: string;
          last_seen_at?: string | null;
          locale?: string | null;
          streak_current?: number;
          streak_last_date?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["user_profile"]["Row"]>;
      };
      session: {
        Row: {
          id: string;
          user_id: string;
          question_set_id: string;
          mode: "regular" | "daily" | "duel";
          duel_id: string | null;
          started_at: string;
          completed_at: string | null;
          score: number;
          num_questions: number;
          client_fingerprint: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_set_id: string;
          mode: "regular" | "daily" | "duel";
          duel_id?: string | null;
          started_at?: string;
          completed_at?: string | null;
          score?: number;
          num_questions: number;
          client_fingerprint?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["session"]["Row"]>;
      };
      session_answer: {
        Row: {
          id: string;
          session_id: string;
          question_id: string;
          chosen_option: "A" | "B" | "C";
          is_correct: boolean;
          answered_at: string;
          time_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          question_id: string;
          chosen_option: "A" | "B" | "C";
          is_correct: boolean;
          answered_at?: string;
          time_ms?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["session_answer"]["Row"]>;
      };
      duel: {
        Row: {
          id: string;
          token: string;
          question_set_id: string;
          creator_user_id: string;
          creator_session_id: string;
          opponent_user_id: string | null;
          opponent_session_id: string | null;
          status: "open" | "completed" | "expired";
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          token: string;
          question_set_id: string;
          creator_user_id: string;
          creator_session_id: string;
          opponent_user_id?: string | null;
          opponent_session_id?: string | null;
          status?: "open" | "completed" | "expired";
          expires_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["duel"]["Row"]>;
      };
      share_event: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          duel_id: string | null;
          share_type: "result" | "duel_invite" | "daily";
          channel: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id?: string | null;
          duel_id?: string | null;
          share_type: "result" | "duel_invite" | "daily";
          channel?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["share_event"]["Row"]>;
      };
      daily_challenge: {
        Row: {
          date: string;
          question_set_id: string;
          published_at: string;
          created_at: string;
        };
        Insert: {
          date: string;
          question_set_id: string;
          published_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["daily_challenge"]["Row"]>;
      };
    };
  };
}
