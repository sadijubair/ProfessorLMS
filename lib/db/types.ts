type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string; // UUID
          email: string | null;
          phone: string | null;
          mobile: string | null;
          whatsapp_number: string | null;
          password_hash: string | null;
          full_name: string | null;
          student_id: string | null; // YY + 6 random digits (only for students)
          role: 'student' | 'teacher' | 'mentor' | 'admin' | 'support' | 'super_admin';
          is_active: boolean;
          email_verified_at: string | null;
          phone_verified_at: string | null;
          profile_image_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
          last_login_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
        Relationships: [];
      };
      roles: {
        Row: {
          id: string;
          name: 'student' | 'teacher' | 'mentor' | 'admin' | 'support' | 'super_admin';
          description: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['roles']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['roles']['Insert']>;
        Relationships: [];
      };
      permissions: {
        Row: {
          id: string;
          role: string;
          permission: string; // e.g., "courses:create", "exams:view"
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['permissions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['permissions']['Insert']>;
        Relationships: [];
      };
      course_instructors: {
        Row: {
          id: string;
          course_id: string;
          teacher_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['course_instructors']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['course_instructors']['Insert']>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_values: Record<string, Json> | null;
          new_values: Record<string, Json> | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
        Relationships: [];
      };
      course_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['course_categories']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['course_categories']['Insert']>;
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          title: string;
          short_description: string | null;
          description: string | null;
          slug: string;
          category: string; // BCS, Bank, Admission, Academic, Skill
          pricing_type: 'paid' | 'free';
          price_bdt: number;
          promo_code: string | null;
          discount_type: 'flat' | 'percentile';
          discount_value_bdt: number | null;
          expiry_period: 'lifetime' | 'limited';
          expiry_months: number | null;
          course_status: 'active' | 'private' | 'upcoming' | 'pending' | 'draft' | 'inactive';
          duration_days: number | null;
          is_free: boolean;
          is_self_paced: boolean;
          has_support: boolean;
          has_facebook_group: boolean;
          has_google_classroom: boolean;
          has_live_exam: boolean;
          has_written_exam: boolean;
          requires_manual_payment: boolean;
          page_sections: string[];
          curriculum_sections: Array<{
            title: string;
            items: string[];
          }>;
          thumbnail_url: string | null;
          max_students: number | null;
          teacher_id: string;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['courses']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['courses']['Insert']>;
        Relationships: [];
      };
      course_enrollments: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          roll_number: string | null; // Generated after payment approval
          enrollment_status: 'pending' | 'active' | 'completed' | 'dropped';
          payment_status: 'unpaid' | 'pending' | 'approved' | 'rejected';
          enrolled_at: string;
          activated_at: string | null;
          completed_at: string | null;
          community_token: string | null; // One-time verification token
          community_token_used_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['course_enrollments']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['course_enrollments']['Insert']>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          enrollment_id: string;
          amount_bdt: number;
          payment_method: 'bkash' | 'nagad' | 'rocket' | 'bank_transfer';
          transaction_id: string;
          sender_mobile: string;
          screenshot_url: string | null;
          status: 'pending' | 'approved' | 'rejected';
          approved_by: string | null; // support staff user_id
          rejection_reason: string | null;
          approved_at: string | null;
          submitted_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
        Relationships: [];
      };
      promo_codes: {
        Row: {
          id: string;
          code: string;
          discount_percent: number;
          discount_fixed_bdt: number | null;
          scope: 'global' | 'course_specific';
          applicable_courses: string[] | null;
          max_uses: number | null;
          uses_count: number;
          valid_from: string;
          valid_until: string;
          is_active: boolean;
          created_by: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['promo_codes']['Row'], 'id' | 'created_at' | 'uses_count'>;
        Update: Partial<Database['public']['Tables']['promo_codes']['Insert']>;
        Relationships: [];
      };
      special_pricing: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          special_price_bdt: number;
          original_price_bdt: number;
          reason: string | null;
          valid_until: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['special_pricing']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['special_pricing']['Insert']>;
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          course_id: string;
          type: 'mcq' | 'written' | 'short_answer';
          content: string; // Question text
          explanation: string | null;
          solution: string | null;
          difficulty_level: 'easy' | 'medium' | 'hard';
          subject: string; // e.g., Bengali, English, Math
          topic: string; // e.g., Tense, Algebra
          exam_year: number | null; // e.g., 2024, 2023
          created_by: string; // teacher_id
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['questions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['questions']['Insert']>;
        Relationships: [];
      };
      question_options: {
        Row: {
          id: string;
          question_id: string;
          option_text: string;
          option_label: string; // A, B, C, D
          is_correct: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['question_options']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['question_options']['Insert']>;
        Relationships: [];
      };
      exam_questions: {
        Row: {
          id: string;
          exam_id: string;
          question_id: string;
          marks: number;
          sequence_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['exam_questions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['exam_questions']['Insert']>;
        Relationships: [];
      };
      exams: {
        Row: {
          id: string;
          course_id: string | null; // null for open/platform-wide exams
          scope: 'course' | 'open';
          title: string;
          description: string | null;
          exam_type: 'mcq' | 'written' | 'combined';
          total_questions: number;
          total_marks: number;
          passing_marks: number | null;
          negative_marking: number | null; // 0.25 — MCQ and combined MCQ portion only
          window_start_at: string;
          window_end_at: string;
          individual_duration_minutes: number;
          shuffle_questions: boolean;
          show_answers_after: boolean;
          instructions: string | null;
          created_by: string;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['exams']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['exams']['Insert']>;
        Relationships: [];
      };
      exam_attempts: {
        Row: {
          id: string;
          exam_id: string;
          student_id: string;
          roll_number: string | null;
          status: 'in_progress' | 'submitted' | 'evaluated';
          started_at: string;
          submitted_at: string | null;
          total_questions_attempted: number;
          total_correct: number;
          total_wrong: number;
          total_unanswered: number;
          mcq_marks_obtained: number | null;
          written_marks_obtained: number | null;
          total_marks_obtained: number | null;
          final_rank: number | null;
          is_official: boolean; // true for exams during window, false for practice
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['exam_attempts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['exam_attempts']['Insert']>;
        Relationships: [];
      };
      answers: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          selected_option_id: string | null; // For MCQ
          answer_text: string | null; // For written questions
          is_correct: boolean | null;
          marked_for_review: boolean;
          answered_at: string;
          time_spent_seconds: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['answers']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['answers']['Insert']>;
        Relationships: [];
      };
      question_practice_attempts: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          question_id: string;
          selected_option_id: string | null;
          is_correct: boolean | null;
          practice_mode: 'topic' | 'timed' | 'random' | 'previous_year' | 'weak_area';
          time_spent_seconds: number;
          attempted_at: string;
        };
        Insert: Omit<Database['public']['Tables']['question_practice_attempts']['Row'], 'id' | 'attempted_at'>;
        Update: Partial<Database['public']['Tables']['question_practice_attempts']['Insert']>;
        Relationships: [];
      };
      submission_acknowledgments: {
        Row: {
          id: string;
          attempt_id: string;
          exam_id: string;
          student_id: string;
          roll_number: string;
          status: 'pending' | 'evaluated' | 'published';
          submission_platform: 'google_classroom' | 'google_drive' | 'teams' | 'other';
          submission_url: string | null;
          submitted_at: string; // Student's offline submission time
          acknowledged_at: string; // When student clicked "I have submitted"
          marks_entered_by: string | null;
          marks_entered_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['submission_acknowledgments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['submission_acknowledgments']['Insert']>;
        Relationships: [];
      };
      video_assets: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          provider: 'youtube' | 'bunny' | 'other';
          provider_video_id: string;
          thumbnail_url: string | null;
          duration_seconds: number | null;
          sequence_order: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['video_assets']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['video_assets']['Insert']>;
        Relationships: [];
      };
      leaderboards: {
        Row: {
          id: string;
          exam_id: string;
          student_id: string;
          rank: number;
          total_marks: number;
          accuracy_percent: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['leaderboards']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['leaderboards']['Insert']>;
        Relationships: [];
      };
      performance_stats: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          total_exams_attempted: number;
          total_correct_answers: number;
          total_wrong_answers: number;
          overall_accuracy_percent: number | null;
          current_rank: number | null;
          average_marks: number | null;
          exam_streak: number;
          last_exam_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['performance_stats']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['performance_stats']['Insert']>;
        Relationships: [];
      };
      books: {
        Row: {
          id: string;
          title: string;
          author: string | null;
          description: string | null;
          price_bdt: number;
          stock_quantity: number;
          image_url: string | null;
          is_active: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['books']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['books']['Insert']>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          student_id: string;
          book_id: string;
          quantity: number;
          total_price_bdt: number;
          payment_status: 'pending' | 'approved' | 'rejected';
          shipping_status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
          shipping_address: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: 'exam_reminder' | 'result_published' | 'payment_status' | 'enrollment' | 'announcement';
          title: string;
          message: string;
          related_entity_type: string | null;
          related_entity_id: string | null;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
        Relationships: [];
      };
      devices: {
        Row: {
          id: string;
          user_id: string;
          device_name: string;
          device_type: 'mobile' | 'tablet' | 'desktop';
          browser: string;
          os: string;
          device_fingerprint: string;
          ip_address: string;
          location_approximate: string | null;
          last_active_at: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['devices']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['devices']['Insert']>;
        Relationships: [];
      };
      community_tokens: {
        Row: {
          id: string;
          enrollment_id: string;
          token: string;
          status: 'unused' | 'used' | 'invalid';
          used_at: string | null;
          used_by: string | null; // support staff user_id
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['community_tokens']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['community_tokens']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
