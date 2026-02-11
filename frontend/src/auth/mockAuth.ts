// src/auth/mockAuth.ts
interface User {
    username: string;
    password: string;
    email?: string;
  }
  
  // Usuarios de prueba
  const mockUsers: User[] = [
    { username: "admin", password: "admin123", email: "admin@example.com" },
    { username: "usuario", password: "usuario123", email: "usuario@example.com" },
  ];
  
  export const mockLogin = async (username: string, password: string) => {
    const user = mockUsers.find(
      (u) => u.username === username && u.password === password
    );
  
    if (!user) {
      throw new Error("Credenciales inválidas");
    }
  
    // Simular un retraso de red
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { token: "mock-jwt-token", user };
  };
  
  export const mockRegister = async (username: string, email: string, password: string) => {
    const userExists = mockUsers.some((u) => u.username === username || u.email === email);
    
    if (userExists) {
      throw new Error("El usuario o correo ya existe");
    }
  
    mockUsers.push({ username, email, password });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { message: "Usuario registrado exitosamente" };
  };