# Xanani - Frontend de Xanani.
## Estructura del Proyecto frontend

```
frontend/
├── public/                     # Archivos estáticos servidos directamente
│   ├── LOGO.png               # Logo principal de la aplicación
│   ├── bus_icon_126644.svg    # Ícono de autobús
│   └── combi.svg              # Ícono de combi
│
├── src/                        # Código fuente principal
│   │
│   ├── app/                   # Configuración principal de la aplicación
│   │   ├── configuracionRoles.ts      # Configuración de roles
│   │   ├── enrutador.tsx         # Router principal
│   │   └── rutas.tsx         # Definición de rutas
│   │
│   ├── assets/                # Recursos estáticos
│   │   └── react.svg          # Logo de React
│   │
│   ├── autenticacion/                  # Lógica de autenticación
│   │   ├── LandingPage.tsx    # Página de aterrizaje
│   │   ├── PaginaInicioSesion.tsx      # Página de inicio de sesión
│   │   └── usarAutenticacion.ts         # Hook de autenticación
│   │
│   ├── components/            # Componentes reutilizables
│   │   ├── administrador/     # Componentes para administrador
│   │   ├── common/            # Componentes comunes
│   │   ├── conductor/         # Componentes para conductor
│   │   ├── pasajero/          # Componentes para pasajero
│   │   └── superusuario/         # Componentes para superusuario
│   │
│   ├── hooks/                 # Custom Hooks
│   │   └── usarRol.ts         # Hook de manejo de roles
│   │
│   ├── layouts/               # Layouts principales
│   │   ├── LayoutAdministrador.tsx   # Layout para administrador
│   │   ├── LayoutConductor.tsx # Layout para conductor
│   │   ├── LayoutPasajero.tsx  # Layout para pasajero
│   │   └── LayoutPublico.tsx   # Layout público
│   │
│   ├── pages/                 # Componentes de páginas
│   │   ├── administrador/     # Páginas de administrador
│   │   ├── conductor/         # Páginas de conductor
│   │   ├── pasajero/          # Páginas de pasajero
│   │   └── superusuario/         # Páginas de superusuario
│   │
│   ├── services/              # Servicios para comunicación con APIs
│   │   ├── autenticacion.simulada.ts       # Mock de autenticación para desarrollo
│   │   └── autenticacion.ts            # Servicio de autenticación
│   │
│   ├── styles/               # Estilos globales
│   │   ├── App.css            # Estilos principales de la aplicación
│   │   ├── index.css          # Estilos globales
│   │   ├── login.css          # Estilos específicos para login
│   │   └── pasajero.css       # Estilos para el módulo de pasajero
│   │
│   ├── types/                # Definiciones de tipos TypeScript
│   │   └── autenticacion.ts            # Tipos para autenticación
│   │
│   ├── utils/                # Utilidades
│   │   └── (funciones de ayuda)
│   │
│   ├── App.tsx               # Componente raíz de la aplicación
│   ├── main.tsx              # Punto de entrada de la aplicación
│   ├── vite-env.d.ts         # Definiciones de tipos para Vite
│   └── jsx.d.ts              # Definiciones de tipos JSX
│
├── .gitignore                # Archivos ignorados por Git
├── eslint.config.js          # Configuración de ESLint
├── index.html                # Plantilla HTML principal
├── package.json              # Dependencias y scripts
├── tsconfig.app.json         # Configuración de TypeScript para la app
├── tsconfig.json             # Configuración de TypeScript principal
├── tsconfig.node.json        # Configuración de TypeScript para Node
├── vite.config.ts            # Configuración de Vite
└── README.md                 # Documentación del proyecto
```

## Tecnologías Clave

- **React 19** - Biblioteca principal para la interfaz de usuario
- **TypeScript** - Para tipado estático y mejor experiencia de desarrollo
- **Vite** - Herramienta de construcción y servidor de desarrollo
- **React Router** - Para el enrutamiento de la aplicación
- **Axios** - Cliente HTTP para peticiones a la API
- **Leaflet** - Para mapas interactivos
- **Tailwind CSS** - Framework CSS para estilos
- **ESLint** - Para mantener la calidad del código

## Estructura de Componentes

La aplicación sigue una arquitectura modular donde cada carpeta tiene un propósito específico:

### Roles de Usuario
La aplicación está organizada por roles de usuario:

- **/administrador**: Componentes y páginas para administradores del sistema
- **/conductor**: Componentes y páginas para conductores de transporte
- **/pasajero**: Componentes y páginas para pasajeros
- **/superusuario**: Componentes y páginas para superusuarios
- **/common**: Componentes compartidos entre todos los roles
- **/public**: Layouts y componentes públicos

### Autenticación
- **LandingPage.tsx**: Página principal de bienvenida
- **PaginaInicioSesion.tsx**: Formulario de inicio de sesión
- **usarAutenticacion.ts**: Hook personalizado para manejo de autenticación

### Layouts
- **LayoutPublico.tsx**: Layout para páginas públicas
- **LayoutAdministrador.tsx**: Layout para administradores
- **LayoutConductor.tsx**: Layout para conductores
- **LayoutPasajero.tsx**: Layout para pasajeros

## Inicio Rápido

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```

3. Abrir en el navegador:
   ```
   http://localhost:5173
   ```

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la versión de producción
- `npm run lint` - Ejecuta el linter
- `npm run type-check` - Verifica los tipos de TypeScript

## Flujo de Autenticación

1. **Landing Page**: Página de bienvenida con opciones de login
2. **Login**: Autenticación con credenciales (username/email + password)
3. **Token Storage**: Almacenamiento del token JWT en localStorage
4. **Role-based Routing**: Redirección según el rol del usuario
5. **Rutas protegidas**: Rutas protegidas con verificación de autenticación

## Configuración de Rutas

La aplicación utiliza React Router con configuración basada en roles:

- **Rutas Públicas**: Accesibles sin autenticación
- **Rutas Protegidas**: Requieren token JWT válido
- **Rutas por Rol**: Acceso según el rol del usuario (PASAJERO, CONDUCTOR, ADMINISTRADOR, SUPERUSUARIO)

## Estilos

La aplicación utiliza una combinación de:

- **Tailwind CSS**: Para estilos rápidos y responsivos
- **CSS Modules**: Para estilos específicos de componentes
- **CSS Global**: Para estilos base y comunes

## Desarrollo

### Estructura de Archivos TypeScript
- **Tipado estricto** habilitado
- **Definiciones de tipos** para autenticación y API
- **Configuración Vite** para desarrollo rápido
