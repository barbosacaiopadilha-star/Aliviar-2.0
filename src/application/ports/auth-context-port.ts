export interface AuthContext {
  userId: string;
}

export interface AuthContextPort {
  requireActiveStaff(): Promise<AuthContext>;
}
