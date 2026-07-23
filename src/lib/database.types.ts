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
        Row: { id: string; name: string; team_id: string; role: string; weekly_capacity_hours: number };
        Insert: { id: string; name: string; team_id: string; role: string; weekly_capacity_hours: number };
        Update: Partial<{ id: string; name: string; team_id: string; role: string; weekly_capacity_hours: number }>;
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
          assignee_id: string;
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
          assignee_id: string;
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
          type: "retro" | "postmortem" | "status-update";
          title: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id: string;
          project_id: string;
          type: "retro" | "postmortem" | "status-update";
          title: string;
          content: string;
          created_at: string;
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
          status: "pending-review" | "approved" | "rejected";
          created_at: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
        };
        Insert: {
          project_id?: string | null;
          title: string;
          draft_content: string;
          final_content?: string | null;
          status?: "pending-review" | "approved" | "rejected";
        };
        Update: Partial<{
          project_id: string | null;
          title: string;
          draft_content: string;
          final_content: string | null;
          status: "pending-review" | "approved" | "rejected";
          reviewed_by: string | null;
          reviewed_at: string | null;
        }>;
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
