# Backend de Xanani, construido con Node.js y Express.

## Estructura del Proyecto

```
backend/
├── src/                        # Código fuerte principal
│   │
│   ├── config/                # Configuraciones de la aplicación
│   │   ├── db.js             # Configuración de la base de datos MongoDB
│   │   ├── env.js            # Manejo de variables de entorno
│   │   ├── passport.js       # Configuración de autenticación Passport
│   │   └── server.js         # Configuración del servidor Express
│   │
│   ├── controllers/           # Controladores para las rutas
│   │   ├── auth.controller.js # Controlador de autenticación
│   │   ├── user.controller.js # Controlador de usuarios
│   │   └── vehicle.controller.js # Controlador de vehículos
│   │
│   ├── middlewares/           # Middlewares personalizados
│   │   ├── auth.middleware.js # Middleware de autenticación
│   │   ├── error.middleware.js # Manejo de errores
│   │   └── validation.middleware.js # Validación de datos
│   │
│   ├── models/                # Modelos de MongoDB
│   │   ├── User.js           # Modelo de usuario
│   │   ├── Vehicle.js        # Modelo de vehículo
│   │   └── index.js          # Exportación de modelos
│   │
│   ├── routes/                # Definición de rutas
│   │   ├── auth.routes.js    # Rutas de autenticación
│   │   ├── user.routes.js    # Rutas de usuarios
│   │   └── vehicle.routes.js # Rutas de vehículos
│   │
│   ├── services/              # Lógica de negocio
│   │   ├── auth.service.js   # Servicio de autenticación
│   │   ├── user.service.js   # Servicio de usuarios
│   │   └── vehicle.service.js # Servicio de vehículos
│   │
│   ├── utils/                # Utilidades
│   │   ├── apiError.js       # Clase personalizada para errores
│   │   ├── logger.js         # Utilidad para logs
│   │   └── validators.js     # Funciones de validación
│   │
│   └── app.js               # Configuración principal de Express
│
├── .env.example             # Plantilla de variables de entorno
├── .gitignore              # Archivos ignorados por Git
├── package.json            # Dependencias y scripts
└── server.js               # Punto de entrada de la aplicación