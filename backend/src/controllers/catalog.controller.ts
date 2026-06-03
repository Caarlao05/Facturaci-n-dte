import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Clientes
export const getCustomers = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    if (!tenantId) return res.status(403).json({ error: 'Tenant ID is required' });

    const customers = await prisma.customer.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    if (!tenantId) return res.status(403).json({ error: 'Tenant ID is required' });

    const {
      name,
      commercialName,
      nit,
      nrc,
      dui,
      email,
      phone,
      address,
      economicActivityCode
    } = req.body;

    const newCustomer = await prisma.customer.create({
      data: {
        tenantId,
        name,
        commercialName,
        nit,
        nrc,
        dui,
        email,
        phone,
        address,
        economicActivityCode
      }
    });

    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Productos
export const getProducts = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    if (!tenantId) return res.status(403).json({ error: 'Tenant ID is required' });

    const products = await prisma.product.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    if (!tenantId) return res.status(403).json({ error: 'Tenant ID is required' });

    const {
      code,
      description,
      unitPrice,
      taxType,
      isActive
    } = req.body;

    // Verificar si ya existe el código para este tenant
    const existing = await prisma.product.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Ya existe un producto con este código en su catálogo' });
    }

    const newProduct = await prisma.product.create({
      data: {
        tenantId,
        code,
        description,
        unitPrice,
        taxType,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
