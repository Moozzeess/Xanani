export type Rol = 'SUPERUSUARIO' | 'ADMINISTRADOR' | 'CONDUCTOR' | 'PASAJERO';

export type UsuarioAutenticado = {
  id: string;
  username: string;
  email: string;
  role: Rol;
};

export type SolicitudInicioSesion = {
  usernameOCorreo: string;
  password: string;
};

export type SolicitudRegistro = {
  email: string;
  username: string;
  password: string;
};

export type RespuestaAutenticacion = {
  token: string;
  user: UsuarioAutenticado;
};
