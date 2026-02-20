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
│   │   └── (archivos de middleware)
│   │
│   ├── models/                # Modelos de MongoDB
│   │   ├── User.js           # Modelo de usuario
│   │   └── (otros modelos)
│   │
│   ├── routes/                # Definición de rutas
│   │   ├── auth.routes.js    # Rutas de autenticación
│   │   └── user.routes.js    # Rutas de usuarios
│   │
│   ├── services/              # Lógica de negocio
│   │   └── auth.service.js   # Servicio de autenticación
│   │
│   ├── utils/                # Utilidades
│   │   └── (archivos de utilidades)
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