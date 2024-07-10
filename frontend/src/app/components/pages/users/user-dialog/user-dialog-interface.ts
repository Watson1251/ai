import { Role } from "../../../../models/role.model";
import { User } from "../../../../models/user.model";

export interface UserDialogInterface {
  status: string;
  selectedUser: User;
  users: User[];
  roles: Role[];
}
