export type Role = 'SUPERUSUARIO' | 'ADMINISTRADOR' | 'CONDUCTOR' | 'PASAJERO';

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: Role;
};

export type LoginRequest = {
  usernameOrEmail: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  username: string;
  password: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};
