# Backend de Xanani
Desarrollado con Node.js y Express. Optimizado con balanceo de carga nativo y tolerancia a fallos.

## Tecnologías y Características
- **Balanceo de Carga Multi-Core**: Integrado nativamente con el módulo `cluster`, genera una instancia del servidor por cada núcleo lógico del CPU host, previendo y auto-reiniciando caídas para garantizar altísima disponibilidad.
- **Rendimiento de Red**: Compresión gzip configurada en la capa de transmisión HTTP, junto con control asíncrono de *Timeouts* e incremento de conexiones al Data Pool de base de datos.


## Estructura del Proyecto

```
backend/
├── src/                        # Directorio fuente principal
│   │
│   ├── config/                # Ajustes Core
│   │   ├── db.js             # Enlace a MongoDB
│   │   ├── env.js            # Extractor central de variables ocultas
│   │   └── optimizaciones.js # Reguladores de timeouts y network pool
│   │
│   ├── controllers/           # Controladores (Lógica de API)
│   │   ├── administrador, recorrido, unidad, hardware (etc).
│   │
│   ├── middlewares/           # Funciones interceptoras
│   │   ├── auth.middleware.js # Filtro de Tokens y Roles (Rol-Based Access)
│   │
│   ├── models/                # Esquemas y Entidades Mongoose (Pluralizadas)
│   │   ├── Usuario, Conductor, Unidad, Ruta, Parada
│   │
│   ├── routes/                # Gateway / Directorio de Rutas
│   │   ├── index.js          # Main Router consolidado
│   │   └── *.routes.js       # Rutas encapsuladas modularmente
│   │
│   ├── services/              # Puentes hacia agentes externos
│   │   ├── socketService.js  # Telemetría WebSocket en vivo
│   │   └── mqttService.js    # Conexiones Broker hacia hardware ESP32
│   │
│   └── utils/                # Utilidades
│       ├── jwt.js           # Firmado de JWT
│       └── catchAsync.js    # Envoltura try-catch
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
