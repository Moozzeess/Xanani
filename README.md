#  Xanani - Plataforma de Movilidad Inteligente

Xanani es una plataforma de movilidad inteligente diseñada para optimizar el transporte público, ofreciendo información en tiempo real, seguimiento de unidades y una experiencia de usuario mejorada para pasajeros y operadores.

##  Características Principales

-  **Seguimiento en Tiempo Real**: Visualización de unidades de transporte en tiempo real
-  **Interfaz Intuitiva**: Diseño moderno y fácil de usar
-  **Autenticación Segura**: Sistema de usuarios con roles y permisos
-  **Mapas Interactivos**: Integración con mapas para seguimiento de rutas
-  **Panel de Administración**: Gestión de unidades, rutas y usuarios
-  **Responsive**: Funciona en dispositivos móviles y de escritorio

##  Estructura del Proyecto

```
Xanani/
├── .git/                     # Control de versiones
├── .gitignore               # Archivos ignorados por Git
├── .vscode/                 # Configuración de VS Code
├── README.md                # Documentación principal
├── package.json             # Dependencias del proyecto raíz
├── package-lock.json        # Lock de dependencias
│
├── backend/                 # API REST y lógica del servidor
│   ├── src/                 # Código fuente del backend
│   ├── .env                 # Variables de entorno
│   ├── app.js               # Configuración principal de Express
│   ├── package.json         # Dependencias del backend
│   ├── routes.js            # Configuración de rutas principal
│   ├── server.js            # Punto de entrada del servidor
│   └── README.md            # Documentación detallada del backend
│
├── frontend/                # Aplicación web del cliente
│   ├── src/                 # Código fuente del frontend
│   │   ├── components/      # Componentes reutilizables
│   │   │   ├── common/      # Componentes compartidos (Mapa, Navbar)
│   │   │   └── pasajero/    # Componentes específicos (Alerta, Asientos, TarjetaBus)
│   │   ├── pages/           # Páginas principales
│   │   │   └── pasajero/    # Vista de pasajero (Pasajero.jsx)
│   │   └── ...
│   ├── public/              # Archivos estáticos
│   ├── package.json         # Dependencias del frontend
│   ├── vite.config.ts       # Configuración de Vite
│   ├── tsconfig.json        # Configuración TypeScript
│   └── README.md            # Documentación detallada del frontend
│
└── Test/                    # Archivos de prueba
    ├── README.MD            # Documentación de pruebas
    ├── admin.html           # Interfaz admin
    ├── conductor.html       # Interfaz conductor
    ├── landing pasajero.html # Landing pasajero
    ├── login.html           # Interfaz login
    └── pasajero_autenticado.html # Interfaz pasajero autenticado


### Requisitos Previos

- Node.js 18+
- MongoDB 6.0+
- npm o yarn

### Instalación

1. Clonar el repositorio:
   ```bash
   git clone 
   cd xanani
   ```

2. Configurar el backend:
   ```bash
   cd backend
   cp .env
   # Editar .env con las credenciales coresponientes
   npm install
   ```

3. Configurar el frontend:
   ```bash
   cd ../frontend
   npm install
   ```

4. Iniciar los servicios:
   ```bash
   # En una terminal (backend)
   cd backend
   npm run dev

   # En otra terminal (frontend)
   cd ../frontend
   npm run dev
   ```

5. Acceder a las aplicaciones:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:4000

## 📚 Documentación

- [Documentación del Frontend](./frontend/README.md)
- [Documentación del Backend](./backend/README.md)

##  Tecnologías Utilizadas

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Leaflet (mapas)
- React Router

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- JWT (Autenticación)
- Socket.IO (Tiempo real)