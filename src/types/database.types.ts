export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          display_name: string;
          avatar_key: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          display_name: string;
          avatar_key?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          display_name?: string;
          avatar_key?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          owner_user_id: string;
          timezone: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_user_id: string;
          timezone?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_user_id?: string;
          timezone?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          nickname: string;
          role: 'owner' | 'member';
          status: 'active' | 'archived';
          joined_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          nickname: string;
          role?: 'owner' | 'member';
          status?: 'active' | 'archived';
          joined_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          nickname?: string;
          role?: 'owner' | 'member';
          status?: 'active' | 'archived';
          joined_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      daily_results: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          result_date: string;
          entry_mode: 'detailed' | 'total';
          total: number;
          blue_count: number | null;
          red_count: number | null;
          black_count: number | null;
          green_count: number | null;
          white_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          result_date: string;
          entry_mode: 'detailed' | 'total';
          total: number;
          blue_count?: number | null;
          red_count?: number | null;
          black_count?: number | null;
          green_count?: number | null;
          white_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          result_date?: string;
          entry_mode?: 'detailed' | 'total';
          total?: number;
          blue_count?: number | null;
          red_count?: number | null;
          black_count?: number | null;
          green_count?: number | null;
          white_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      group_invitations: {
        Row: {
          id: string;
          group_id: string;
          token_hash: string;
          created_by: string;
          expires_at: string;
          max_uses: number;
          uses_count: number;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          token_hash: string;
          created_by: string;
          expires_at: string;
          max_uses: number;
          uses_count?: number;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          token_hash?: string;
          created_by?: string;
          expires_at?: string;
          max_uses?: number;
          uses_count?: number;
          revoked_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_active_group_member: {
        Args: { check_group_id: string; check_user_id: string };
        Returns: boolean;
      };
      is_group_owner: {
        Args: { check_group_id: string; check_user_id: string };
        Returns: boolean;
      };
      create_group_with_owner: {
        Args: { p_name: string; p_owner_nickname: string; p_timezone?: string };
        Returns: string;
      };
      join_group_with_code: {
        Args: { p_invite_code: string; p_nickname: string };
        Returns: string;
      };
      archive_group_member: {
        Args: { p_group_id: string; p_target_user_id: string };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
