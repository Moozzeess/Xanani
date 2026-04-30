/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Puerto del servidor de desarrollo */
  readonly VITE_PORT: string;
  /** URL base para las peticiones a la API REST */
  readonly VITE_API_BASE_URL: string;
  /** URL para la conexión de WebSockets (Socket.io) */
  readonly VITE_SOCKET_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
