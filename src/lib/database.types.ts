// Hand-written to match supabase/schema.sql. If the schema changes, update this alongside it.
export interface Database {
  public: {
    Tables: {
      teams: {
        Row: { id: string; name: string; focus_area: string };
        Insert: { id: string; name: string; focus_area: string };
        Update: Partial<{ id: string; name: string; focus_area: string }>;
        Relationships: [];
      };
      engineers: {
        Row: {
          id: string;
          name: string;
          team_id: string;
          role: string;
          weekly_capacity_hours: number;
          profile_id: string | null;
        };
        Insert: {
          id: string;
          name: string;
          team_id: string;
          role: string;
          weekly_capacity_hours: number;
          profile_id?: string | null;
        };
        Update: Partial<{
          id: string;
          name: string;
          team_id: string;
          role: string;
          weekly_capacity_hours: number;
          profile_id: string | null;
        }>;
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          name: string;
          team_id: string;
          status: "on-track" | "at-risk" | "off-track";
          start_date: string;
          target_date: string;
          budget_planned: number;
          budget_spent: number;
        };
        Insert: {
          id: string;
          name: string;
          team_id: string;
          status: "on-track" | "at-risk" | "off-track";
          start_date: string;
          target_date: string;
          budget_planned: number;
          budget_spent: number;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
        Relationships: [];
      };
      tickets: {
        Row: {
          id: string;
          project_id: string;
          assignee_id: string | null;
          title: string;
          status: "todo" | "in-progress" | "done" | "blocked";
          story_points: number;
          sprint: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          project_id: string;
          assignee_id?: string | null;
          title: string;
          status: "todo" | "in-progress" | "done" | "blocked";
          story_points: number;
          sprint: number;
          created_at: string;
          updated_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["tickets"]["Insert"]>;
        Relationships: [];
      };
      milestones: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          due_date: string;
          status: "on-track" | "at-risk" | "off-track";
        };
        Insert: {
          id: string;
          project_id: string;
          name: string;
          due_date: string;
          status: "on-track" | "at-risk" | "off-track";
        };
        Update: Partial<Database["public"]["Tables"]["milestones"]["Insert"]>;
        Relationships: [];
      };
      security_findings: {
        Row: {
          id: string;
          project_id: string;
          severity: "critical" | "high" | "medium" | "low";
          package_name: string;
          description: string;
          discovered_at: string;
          resolved: boolean;
        };
        Insert: {
          id: string;
          project_id: string;
          severity: "critical" | "high" | "medium" | "low";
          package_name: string;
          description: string;
          discovered_at: string;
          resolved?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["security_findings"]["Insert"]>;
        Relationships: [];
      };
      incidents: {
        Row: {
          id: string;
          project_id: string;
          severity: "sev1" | "sev2" | "sev3";
          title: string;
          started_at: string;
          resolved_at: string;
          mttr_minutes: number;
          root_cause_summary: string;
        };
        Insert: {
          id: string;
          project_id: string;
          severity: "sev1" | "sev2" | "sev3";
          title: string;
          started_at: string;
          resolved_at: string;
          mttr_minutes: number;
          root_cause_summary: string;
        };
        Update: Partial<Database["public"]["Tables"]["incidents"]["Insert"]>;
        Relationships: [];
      };
      allocations: {
        Row: { engineer_id: string; week_start: string; allocated_hours: number };
        Insert: { engineer_id: string; week_start: string; allocated_hours: number };
        Update: Partial<{ engineer_id: string; week_start: string; allocated_hours: number }>;
        Relationships: [];
      };
      narrative_docs: {
        Row: {
          id: string;
          project_id: string;
          type: "retro" | "postmortem" | "status-update" | "uploaded-doc";
          title: string;
          content: string;
          created_at: string;
          confidential: boolean;
        };
        Insert: {
          id: string;
          project_id: string;
          type: "retro" | "postmortem" | "status-update" | "uploaded-doc";
          title: string;
          content: string;
          created_at: string;
          confidential?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["narrative_docs"]["Insert"]>;
        Relationships: [];
      };
      doc_chunks: {
        Row: {
          id: number;
          doc_id: string;
          project_id: string;
          chunk_index: number;
          content: string;
          embedding: number[];
        };
        Insert: {
          doc_id: string;
          project_id: string;
          chunk_index: number;
          content: string;
          embedding: number[];
        };
        Update: Partial<Database["public"]["Tables"]["doc_chunks"]["Insert"]>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: number;
          project_id: string | null;
          title: string;
          draft_content: string;
          final_content: string | null;
          status: "draft" | "pending-review" | "approved" | "rejected";
          created_at: string;
          created_by: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
        };
        Insert: {
          project_id?: string | null;
          title: string;
          draft_content: string;
          final_content?: string | null;
          status?: "draft" | "pending-review" | "approved" | "rejected";
          created_by?: string | null;
        };
        Update: Partial<{
          project_id: string | null;
          title: string;
          draft_content: string;
          final_content: string | null;
          status: "draft" | "pending-review" | "approved" | "rejected";
          created_by: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
        }>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "project_manager" | "management" | "engineer";
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role: "project_manager" | "management" | "engineer";
        };
        Update: Partial<{
          email: string;
          full_name: string | null;
          role: "project_manager" | "management" | "engineer";
        }>;
        Relationships: [];
      };
      report_feedback: {
        Row: {
          id: number;
          report_id: number;
          author_id: string;
          author_name: string;
          comment: string;
          created_at: string;
        };
        Insert: {
          report_id: number;
          author_id: string;
          author_name: string;
          comment: string;
        };
        Update: Partial<{ comment: string }>;
        Relationships: [];
      };
      project_assignments: {
        Row: {
          id: number;
          profile_id: string;
          project_id: string;
          assigned_at: string;
        };
        Insert: {
          profile_id: string;
          project_id: string;
        };
        Update: Partial<{ profile_id: string; project_id: string }>;
        Relationships: [];
      };
      signals: {
        Row: {
          id: number;
          project_id: string;
          source: "ticket" | "document" | "project";
          source_id: string;
          severity: "minor" | "moderate" | "major";
          summary: string;
          escalated_report_id: number | null;
          created_at: string;
        };
        Insert: {
          project_id: string;
          source: "ticket" | "document" | "project";
          source_id: string;
          severity: "minor" | "moderate" | "major";
          summary: string;
          escalated_report_id?: number | null;
        };
        Update: Partial<{
          severity: "minor" | "moderate" | "major";
          summary: string;
          escalated_report_id: number | null;
        }>;
        Relationships: [];
      };
      document_reviews: {
        Row: {
          id: number;
          narrative_doc_id: string;
          project_id: string;
          compliance: string[];
          security: string[];
          timelines: string[];
          risks: string[];
          terms: string[];
          agreements: string[];
          must_read: string[];
          departments: string[];
          severity: "minor" | "moderate" | "major";
          created_at: string;
        };
        Insert: {
          narrative_doc_id: string;
          project_id: string;
          compliance?: string[];
          security?: string[];
          timelines?: string[];
          risks?: string[];
          terms?: string[];
          agreements?: string[];
          must_read?: string[];
          departments?: string[];
          severity: "minor" | "moderate" | "major";
        };
        Update: Partial<Database["public"]["Tables"]["document_reviews"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_doc_chunks: {
        Args: { query_embedding: number[]; match_count?: number };
        Returns: { id: number; doc_id: string; project_id: string; content: string; similarity: number }[];
      };
    };
  };
}
