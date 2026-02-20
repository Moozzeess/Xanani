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

## Tecnologías Utilizadas

- **Node.js** - Entorno de ejecución JavaScript
- **Express.js** - Framework web para Node.js
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación basada en tokens
- **bcryptjs** - Hasheo de contraseñas
- **dotenv** - Manejo de variables de entorno

## Variables de Entorno

Crear un archivo `.env` en la raíz del directorio backend:

```env
# Configuración del servidor
PORT=4000

# Base de datos MongoDB
MONGO_URI=mongodb://localhost:27017/

# Secreto para JWT (debe ser una cadena larga y segura)
JWT_SECRET=token_secreto__seguro_aqui
```

## Estructura de Autenticación

### Roles de Usuario
- **PASAJERO**: Usuario básico del sistema
- **CONDUCTOR**: Usuario que puede conducir vehículos
- **ADMINISTRADOR**: Usuario con privilegios administrativos
- **SUPERUSUARIO**: Primer usuario registrado con máximos privilegios

### Flujo de Autenticación
1. **Registro**: Creación de usuario con rol PASAJERO (primer usuario = SUPERUSUARIO)
2. **Login**: Autenticación con username/email y contraseña
3. **Token JWT**: Generación de token válido por 7 días
4. **Middleware**: Verificación de token en rutas protegidas

### Estructura del Token JWT
```json
{
  "sub": "id_del_usuario",
  "role": "PASAJERO",
  "username": "nombre_usuario",
  "email": "correo@ejemplo.com",
  "iat": 1708234567,
  "exp": 1708839367
}
```

## Scripts Disponibles

- `npm start` - Inicia el servidor en modo producción
- `npm run dev` - Inicia el servidor en modo desarrollo con nodemon
- `npm test` - Ejecuta las pruebas unitarias

## Endpoints Principales

### Autenticación
- `POST /api/auth/register` - Registro de nuevos usuarios
- `POST /api/auth/login` - Inicio de sesión

### Usuarios
- `GET /api/users/profile` - Obtener perfil de usuario
- `PUT /api/users/profile` - Actualizar perfil de usuario

## Inicio Rápido

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   # Editar .env con tus credenciales
   ```

3. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. El servidor estará disponible en:
   ```
   http://localhost:4000
   ```

## Características de Seguridad

- **Contraseñas hasheadas** con bcryptjs
- **Tokens JWT** con expiración configurable
- **Middleware de autenticación** para rutas protegidas
- **Validación de datos** en controladores
- **Manejo de errores** centralizado

## Arquitectura

El backend sigue una arquitectura modular con separación de responsabilidades:

- **Controllers**: Manejan las peticiones HTTP y respuestas
- **Services**: Contienen la lógica de negocio
- **Models**: Definen la estructura de datos
- **Middlewares**: Procesan peticiones antes de llegar a los controladores
- **Routes**: Definen las rutas de la API
- **Utils**: Funciones de utilidad reutilizables