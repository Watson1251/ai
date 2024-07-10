import { Permission } from "./permission.model";

export interface Role {
  id: string;
  role: string;
  permissions: Permission[];
}
