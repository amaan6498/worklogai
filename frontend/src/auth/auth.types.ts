export interface User {
  id: string;
  email: string;
  isVerified?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}
