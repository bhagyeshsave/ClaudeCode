export interface User {
  id: number;
  email: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthData {
  user: User;
  token: string;
}
