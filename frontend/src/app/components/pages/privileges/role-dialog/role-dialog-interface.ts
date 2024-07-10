import { Role } from "../../../../models/role.model";

export interface RoleDialogInterface {
  status: string;
  roles: Role[];
  targetRole: Role;
}
