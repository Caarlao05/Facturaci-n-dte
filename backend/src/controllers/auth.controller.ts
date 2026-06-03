import { Request, Response } from 'express';
import { login } from '../services/auth.service';

export const loginController = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son requeridos." });
  }

  try {
    const result = await login(email, password);
    if (result.success) {
      return res.status(200).json({ token: result.token, user: result.user });
    } else {
      return res.status(401).json({ error: result.error });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};
