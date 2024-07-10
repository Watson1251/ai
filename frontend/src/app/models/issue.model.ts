export interface Issue {
  id: string;
  issue: string;
  issue_timestamp: number;
  issue_status: string;
  issued_by: string;
  assigned_to: string[];
  notes: string[];
}
