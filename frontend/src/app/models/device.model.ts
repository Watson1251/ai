export interface Device {
  id: string;
  serial: string;
  assigned_department: string;
  location: string;
  deployment_timestamp: number;
  default_password: string;
  version: string;
  openIssues: number;
  movements: string[];
  issues: string[];
  notes: string[];
}
