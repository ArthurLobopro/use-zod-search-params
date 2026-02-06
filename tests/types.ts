export enum UserStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
  PENDING = "Pending",
}

export enum UserRole {
  ADMIN = "Admin",
  EDITOR = "Editor",
  VIEWER = "Viewer",
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLogin: string;
}
