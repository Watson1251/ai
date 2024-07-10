import { Note } from "./note.model";

export interface Movement {
  id: string;
  movement_timestamp: number;
  movement_from: string;
  movement_to: string;
  moved_by: string;
  notes: string[];
}
