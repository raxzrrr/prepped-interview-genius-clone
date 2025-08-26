export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_credentials: {
        Row: {
          clerk_publishable_key: string | null
          company_name: string | null
          created_at: string
          gemini_api_key: string | null
          google_tts_api_key: string | null
          id: string
          password_hash: string
          pro_plan_price_inr: number | null
          razorpay_key_id: string | null
          razorpay_key_secret: string | null
          updated_at: string
          username: string
        }
        Insert: {
          clerk_publishable_key?: string | null
          company_name?: string | null
          created_at?: string
          gemini_api_key?: string | null
          google_tts_api_key?: string | null
          id?: string
          password_hash: string
          pro_plan_price_inr?: number | null
          razorpay_key_id?: string | null
          razorpay_key_secret?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          clerk_publishable_key?: string | null
          company_name?: string | null
          created_at?: string
          gemini_api_key?: string | null
          google_tts_api_key?: string | null
          id?: string
          password_hash?: string
          pro_plan_price_inr?: number | null
          razorpay_key_id?: string | null
          razorpay_key_secret?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      certificate_templates: {
        Row: {
          created_at: string | null
          description: string | null
          html_template: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          placeholders: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          html_template: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          placeholders?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          html_template?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          placeholders?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          auto_issue: boolean | null
          certificate_type: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          requirements: Json | null
          template_data: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          auto_issue?: boolean | null
          certificate_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          requirements?: Json | null
          template_data?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          auto_issue?: boolean | null
          certificate_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          requirements?: Json | null
          template_data?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      course_questions: {
        Row: {
          correct_answer: number
          course_id: string
          created_at: string
          difficulty_level: string
          explanation: string | null
          id: string
          is_active: boolean
          option_1: string
          option_2: string
          option_3: string
          option_4: string
          order_index: number
          question_text: string
          updated_at: string
        }
        Insert: {
          correct_answer: number
          course_id: string
          created_at?: string
          difficulty_level: string
          explanation?: string | null
          id?: string
          is_active?: boolean
          option_1: string
          option_2: string
          option_3: string
          option_4: string
          order_index?: number
          question_text: string
          updated_at?: string
        }
        Update: {
          correct_answer?: number
          course_id?: string
          created_at?: string
          difficulty_level?: string
          explanation?: string | null
          id?: string
          is_active?: boolean
          option_1?: string
          option_2?: string
          option_3?: string
          option_4?: string
          order_index?: number
          question_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_videos: {
        Row: {
          content_type: string | null
          course_id: string
          created_at: string
          description: string | null
          duration: string | null
          file_path: string | null
          file_size: number | null
          id: string
          is_active: boolean
          order_index: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          content_type?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          duration?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean
          order_index?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          content_type?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          duration?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          is_active?: boolean
          order_index?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_videos_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          order_index: number
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      interview_reports: {
        Row: {
          answers: Json
          created_at: string
          evaluations: Json
          id: string
          interview_type: string
          job_role: string | null
          overall_grade: string
          overall_score: number
          pdf_url: string | null
          questions: Json
          recommendation: string
          report_data: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          answers?: Json
          created_at?: string
          evaluations?: Json
          id?: string
          interview_type?: string
          job_role?: string | null
          overall_grade?: string
          overall_score?: number
          pdf_url?: string | null
          questions?: Json
          recommendation?: string
          report_data?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          answers?: Json
          created_at?: string
          evaluations?: Json
          id?: string
          interview_type?: string
          job_role?: string | null
          overall_grade?: string
          overall_score?: number
          pdf_url?: string | null
          questions?: Json
          recommendation?: string
          report_data?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_interview_reports_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_resources: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_active: boolean
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      interview_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          evaluations: Json | null
          id: string
          ideal_answers: Json
          interview_type: string
          job_role: string | null
          overall_score: number | null
          question_count: number
          questions: Json
          session_status: string
          updated_at: string
          user_answers: Json | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          evaluations?: Json | null
          id?: string
          ideal_answers?: Json
          interview_type: string
          job_role?: string | null
          overall_score?: number | null
          question_count: number
          questions?: Json
          session_status?: string
          updated_at?: string
          user_answers?: Json | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          evaluations?: Json | null
          id?: string
          ideal_answers?: Json
          interview_type?: string
          job_role?: string | null
          overall_score?: number | null
          question_count?: number
          questions?: Json
          session_status?: string
          updated_at?: string
          user_answers?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          plan_type: string
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          plan_type: string
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          plan_type?: string
          razorpay_order_id?: string
          razorpay_payment_id?: string
          razorpay_signature?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_payments_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          auth_provider: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          email_verified: boolean | null
          full_name: string
          id: string
          last_active: string | null
          password_hash: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string | null
          updated_at: string
        }
        Insert: {
          auth_provider?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          email_verified?: boolean | null
          full_name: string
          id: string
          last_active?: string | null
          password_hash?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          updated_at?: string
        }
        Update: {
          auth_provider?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          email_verified?: boolean | null
          full_name?: string
          id?: string
          last_active?: string | null
          password_hash?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_certificates: {
        Row: {
          certificate_hash: string | null
          certificate_id: string
          certificate_url: string | null
          completion_data: Json | null
          created_at: string
          id: string
          is_active: boolean
          issued_date: string
          populated_html: string | null
          score: number | null
          template_id: string | null
          updated_at: string
          user_id: string
          verification_code: string
        }
        Insert: {
          certificate_hash?: string | null
          certificate_id: string
          certificate_url?: string | null
          completion_data?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          issued_date?: string
          populated_html?: string | null
          score?: number | null
          template_id?: string | null
          updated_at?: string
          user_id: string
          verification_code: string
        }
        Update: {
          certificate_hash?: string | null
          certificate_id?: string
          certificate_url?: string | null
          completion_data?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          issued_date?: string
          populated_html?: string | null
          score?: number | null
          template_id?: string | null
          updated_at?: string
          user_id?: string
          verification_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_certificates_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_certificates_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interview_usage: {
        Row: {
          created_at: string | null
          free_interview_used: boolean | null
          id: string
          last_interview_date: string | null
          updated_at: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          free_interview_used?: boolean | null
          id?: string
          last_interview_date?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          free_interview_used?: boolean | null
          id?: string
          last_interview_date?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_interview_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_learning: {
        Row: {
          assessment_attempted: boolean | null
          assessment_completed_at: string | null
          assessment_passed: boolean | null
          assessment_score: number | null
          completed_modules_count: number | null
          course_id: string
          created_at: string | null
          id: string
          is_completed: boolean | null
          last_assessment_score: number | null
          progress: Json | null
          total_modules_count: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assessment_attempted?: boolean | null
          assessment_completed_at?: string | null
          assessment_passed?: boolean | null
          assessment_score?: number | null
          completed_modules_count?: number | null
          course_id: string
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          last_assessment_score?: number | null
          progress?: Json | null
          total_modules_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assessment_attempted?: boolean | null
          assessment_completed_at?: string | null
          assessment_passed?: boolean | null
          assessment_score?: number | null
          completed_modules_count?: number | null
          course_id?: string
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          last_assessment_score?: number | null
          progress?: Json | null
          total_modules_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_learning_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_learning_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reports: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          pdf_data: string | null
          pdf_url: string | null
          report_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          pdf_data?: string | null
          pdf_url?: string | null
          report_type?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          pdf_data?: string | null
          pdf_url?: string | null
          report_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_type: string
          status: string
          updated_at: string
          user_id: string
          was_granted: boolean | null
        }
        Insert: {
          created_at?: string
          current_period_end: string
          current_period_start: string
          id?: string
          plan_type: string
          status?: string
          updated_at?: string
          user_id: string
          was_granted?: boolean | null
        }
        Update: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_type?: string
          status?: string
          updated_at?: string
          user_id?: string
          was_granted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_subscriptions_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authenticate_admin: {
        Args: { admin_password: string; admin_username: string }
        Returns: boolean
      }
      authenticate_user: {
        Args: { user_email: string; user_password: string }
        Returns: {
          user_data: Json
          user_id: string
        }[]
      }
      generate_certificate_hash: {
        Args: {
          completion_data: Json
          issued_date: string
          template_id: string
          user_id: string
        }
        Returns: string
      }
      get_api_keys: {
        Args: Record<PropertyKey, never>
        Returns: {
          clerk_publishable_key: string
          gemini_api_key: string
          google_tts_api_key: string
          pro_plan_price_inr: number
          razorpay_key_id: string
          razorpay_key_secret: string
        }[]
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_owner_by_email: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      jwt_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      populate_certificate_template: {
        Args: {
          completion_date?: string
          course_name: string
          score?: number
          template_id: string
          user_id: string
        }
        Returns: string
      }
      register_manual_user: {
        Args: {
          user_email: string
          user_full_name: string
          user_password: string
          user_role?: string
        }
        Returns: string
      }
      update_admin_credentials: {
        Args: {
          new_password: string
          new_username: string
          old_password: string
          old_username: string
        }
        Returns: boolean
      }
      update_api_keys: {
        Args: {
          p_clerk_key?: string
          p_company_name?: string
          p_gemini_key?: string
          p_pro_plan_price_inr?: number
          p_razorpay_key_id?: string
          p_razorpay_key_secret?: string
          p_tts_key?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "student" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["student", "admin"],
    },
  },
} as const
