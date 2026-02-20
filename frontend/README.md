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
│   │   └── (archivos de configuración de rutas y estado global)
│   │
│   ├── assets/                # Recursos estáticos
│   │   └── (recursos adicionales)
│   │
│   ├── auth/                  # Lógica de autenticación
│   │   ├── LandingPage.tsx    # Página de aterrizaje
│   │   ├── LoginPage.tsx      # Página de inicio de sesión
│   │   ├── mockAuth.ts        # Mock de autenticación
│   │   └── useAuth.ts         # Hook de autenticación
│   │
│   ├── components/            # Componentes reutilizables
│   │   ├── administrador/     # Componentes para administrador
│   │   ├── common/            # Componentes comunes
│   │   ├── conductor/         # Componentes para conductor
│   │   ├── pasajero/          # Componentes para pasajero
│   │   └── superuser/         # Componentes para superusuario
│   │
│   ├── hooks/                 # Custom Hooks
│   │   └── (hooks personalizados)
│   │
│   ├── layouts/               # Layouts principales
│   │   ├── AdminLayaout.tsx   # Layout para administrador
│   │   ├── ConductorLayout.tsx # Layout para conductor
│   │   ├── PasajeroLayout.tsx  # Layout para pasajero
│   │   └── PublicLayout.tsx   # Layout público
│   │
│   ├── pages/                 # Componentes de páginas
│   │   ├── administrador/     # Páginas de administrador
│   │   ├── conductor/         # Páginas de conductor
│   │   ├── pasajero/          # Páginas de pasajero
│   │   └── superuser/         # Páginas de superusuario
│   │
│   ├── services/              # Servicios para comunicación con APIs
│   │   └── (servicios de API)
│   │
│   ├── styles/               # Estilos globales
│   │   └── (archivos de estilos)
│   │
│   ├── types/                # Definiciones de tipos TypeScript
│   │   └── (tipos globales)
│   │
│   ├── utils/                # Utilidades
│   │   └── (funciones de ayuda)
│   │
│   ├── App.tsx               # Componente raíz de la aplicación
│   ├── main.tsx              # Punto de entrada de la aplicación
│   └── vite-env.d.ts         # Definiciones de tipos para Vite
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

## Tecnologías Clave

- **React 19** - Biblioteca principal para la interfaz de usuario
- **TypeScript** - Para tipado estático y mejor experiencia de desarrollo
- **Vite** - Herramienta de construcción y servidor de desarrollo
- **React Router** - Para el enrutamiento de la aplicación
- **Axios** - Cliente HTTP para peticiones a la API
- **Leaflet** - Para mapas interactivos
- **Tailwind CSS** - Framework CSS para estilos
- **ESLint** - Para mantener la calidad del código

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

## Estructura de Componentes

La aplicación sigue una arquitectura modular donde cada carpeta tiene un propósito específico:

- **/auth**: Maneja todo lo relacionado con autenticación
- **/components**: Componentes reutilizables organizados por dominio
- **/pages**: Componentes de página que representan rutas
- **/services**: Lógica para interactuar con APIs externas
- **/styles**: Estilos globales y específicos
- **/utils**: Funciones de utilidad y helpers
