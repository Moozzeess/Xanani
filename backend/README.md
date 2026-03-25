# Backend de Xanani, construido con Node.js y Express.

## Estructura del Proyecto

```
backend/
├── src/                        # Código fuente principal
│   │
│   ├── config/                # Configuraciones de la aplicación
│   │   ├── db.js             # Configuración de la base de datos MongoDB
│   │   ├── env.js            # Manejo de variables de entorno
│   │   └── routes.js         # Configuración de rutas
│   │
│   ├── controllers/           # Controladores para las rutas
│   │   ├── auth.controller.js # Controlador de autenticación
│   │   └── user.controller.js # Controlador de usuarios
│   │
│   ├── middlewares/           # Middlewares personalizados
│   │   └── auth.middleware.js # Middleware de autenticación JWT
│   │
│   ├── models/                # Modelos de MongoDB
│   │   └── User.js           # Modelo de usuario con roles
│   │
│   ├── routes/                # Definición de rutas
│   │   ├── auth.routes.js    # Rutas de autenticación
│   │   └── user.routes.js    # Rutas de usuarios
│   │
│   ├── services/              # Lógica de negocio
│   │   └── auth.service.js   # Servicio de autenticación
│   │
│   ├── utils/                # Utilidades
│   │   └── jwt.js           # Manejo de tokens JWT
│   │
│   └── modules/              # Módulos adicionales
│
├── .env                      # Variables de entorno
├── .gitignore              # Archivos ignorados por Git
├── app.js                  # Configuración principal de Express
├── package.json            # Dependencias y scripts
├── routes.js               # Configuración de rutas principal
├── server.js               # Punto de entrada de la aplicación
└── README.md               # Documentación del proyecto
```

Configurar el backend:
   ```bash
   cd backend
   cp .env
   # Editar .env con las credenciales coresponientes
   npm install
   ```
## Estructura del archivo de variables de entorno .env
```
# Configuración del servidor
# Base de datos MongoDB
MONGO_URI='mongodb+srv://ENLACE_DE_MONGO_EN_ATLAS'
# JSON WEB TOKEN (USAR EL PROGRAMA https://jwtsecretkeygenerator.com/es/)
JWT_SECRET="TOKEN"
```

 Iniciar los servicios:
   ```bash
   # En una terminal (backend)
   cd backend
   npm run dev
