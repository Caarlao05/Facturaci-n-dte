import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'antigravity_secret_123';

// To be run once to seed the first admin user
export const createInitialUser = async () => {
  const existingUser = await prisma.user.findUnique({ where: { email: 'admin@nexxo.com' } });
  if (!existingUser) {
    const hash = await bcrypt.hash('Admin2026!', 10);
    await prisma.user.create({
      data: {
        email: 'admin@nexxo.com',
        passwordHash: hash,
        name: 'Administrador Nexxo',
        role: 'SUPERADMIN'
      }
    });
    console.log("Usuario inicial creado: admin@nexxo.com / Admin2026!");
  }
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    return { success: false, error: 'Credenciales inválidas' };
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    // Para retrocompatibilidad (por si hay contraseñas viejas con sha512, aunque idealmente deberíamos resetearlas)
    return { success: false, error: 'Credenciales inválidas' };
  }

  const token = jwt.sign(
    { userId: user.id, tenantId: user.tenantId, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  return { 
    success: true, 
    token,
    user: { id: user.id, email: user.email, name: user.name, tenantId: user.tenantId, role: user.role }
  };
};
