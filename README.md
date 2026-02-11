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
├── backend/         # API REST y lógica del servidor
│   ├── src/         # Código fuente del backend
│   └── ...          # Configuración y dependencias
│
├── frontend/        # Aplicación web del cliente
│   ├── src/         # Código fuente del frontend
│   └── ...          # Configuración y dependencias
│
└── docs/            # Documentación adicional
```

## 🚀 Comenzando

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
   cp .env.example .env
   # Editar .env con tus credenciales
   npm install
   ```

3. Configurar el frontend:
   ```bash
   cd ../frontend
   cp .env.example .env
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
   - Backend API: http://localhost:3000

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