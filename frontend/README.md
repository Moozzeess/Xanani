# Xanani - Frontend de Xanani.
## Estructura del Proyecto frontend

frontend/
├── public/                     # Archivos estáticos servidos directamente
│   └── bus_icon_126644.svg     # Logo principal de la aplicación
│
├── src/                        # Código fuente principal
│   │
│   ├── app/                   # Configuración principal de la aplicación
│   │   └── (archivos de configuración de rutas y estado global)
│   │
│   ├── assets/                # Recursos estáticos
│   │   ├── images/            # Imágenes de la aplicación
│   │   └── fonts/             # Fuentes personalizadas
│   │
│   ├── auth/                  # Lógica de autenticación
│   │   ├── LoginPage.tsx      # Página de inicio de sesión
│   │   ├── RegisterPage.tsx   # Página de registro
│   │   └── authService.ts     # Servicio de autenticación
│   │
│   ├── components/            # Componentes reutilizables
│   │   ├── common/            # Componentes comunes (botones, inputs, etc.)
│   │   ├── layout/            # Componentes de diseño (header, footer, etc.)
│   │   └── ui/                # Componentes de interfaz de usuario
│   │
│   ├── hooks/                 # Custom Hooks
│   │   ├── useAuth.ts         # Hook para manejo de autenticación
│   │   └── useGeolocation.ts  # Hook para geolocalización
│   │
│   ├── layouts/               # Layouts principales
│   │   ├── MainLayout.tsx     # Layout principal de la aplicación
│   │   └── AuthLayout.tsx     # Layout para páginas de autenticación
│   │
│   ├── pages/                 # Componentes de páginas
│   │   ├── HomePage.tsx       # Página principal
│   │   ├── MapPage.tsx        # Página del mapa interactivo
│   │   └── ProfilePage.tsx    # Página de perfil de usuario
│   │
│   ├── services/              # Servicios para comunicación con APIs
│   │   ├── api.ts            # Configuración de Axios
│   │   └── mapService.ts     # Servicio para operaciones con mapas
│   │
│   ├── styles/               # Estilos globales
│   │   ├── base.css          # Estilos base
│   │   ├── login.css         # Estilos específicos para login
│   │   └── pasajero.css      # Estilos para el módulo de pasajero
│   │
│   ├── types/                # Definiciones de tipos TypeScript
│   │   └── index.ts          # Exportación de tipos
│   │
│   ├── utils/                # Utilidades
│   │   ├── constants.ts      # Constantes de la aplicación
│   │   ├── helpers.ts        # Funciones de ayuda
│   │   └── validators.ts     # Funciones de validación
│   │
│   ├── App.tsx               # Componente raíz de la aplicación
│   └── main.tsx              # Punto de entrada de la aplicación
│
├── .gitignore                # Archivos ignorados por Git
├── index.html                # Plantilla HTML principal
├── package.json              # Dependencias y scripts
├── tsconfig.json             # Configuración de TypeScript
├── tsconfig.node.json        # Configuración de TypeScript para Node
└── vite.config.ts            # Configuración de Vite

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
