export type Rol = 'SUPERUSUARIO' | 'ADMINISTRADOR' | 'CONDUCTOR' | 'PASAJERO';

export type UsuarioAutenticado = {
  id: string;
  nombreUsuario: string;
  correoElectronico: string;
  rol: Rol;
};

export type SolicitudInicioSesion = {
  nombreUsuarioOCorreo: string;
  contrasena: string;
};

export type SolicitudRegistro = {
  correoElectronico: string;
  nombreUsuario: string;
  contrasena: string;
};

export type RespuestaAutenticacion = {
  token: string;
  usuario: UsuarioAutenticado;
};
