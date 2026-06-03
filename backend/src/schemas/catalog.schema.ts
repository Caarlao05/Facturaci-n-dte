import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: "El nombre o razón social es obligatorio"
    }).min(2, "El nombre debe tener al menos 2 caracteres"),
    
    commercialName: z.string().optional().nullable(),
    
    nit: z.string().regex(/^[0-9]{4}-[0-9]{6}-[0-9]{3}-[0-9]{1}$/, {
      message: "El NIT debe tener el formato 0000-000000-000-0"
    }).optional().nullable().or(z.literal('')),
    
    nrc: z.string().optional().nullable().or(z.literal('')),
    dui: z.string().optional().nullable().or(z.literal('')),
    
    email: z.string().email({
      message: "Debe ser un correo electrónico válido"
    }).optional().nullable().or(z.literal('')),
    
    phone: z.string().optional().nullable().or(z.literal('')),
    address: z.string().optional().nullable().or(z.literal('')),
    economicActivityCode: z.string().optional().nullable().or(z.literal(''))
  })
});

export const createProductSchema = z.object({
  body: z.object({
    code: z.string({
      required_error: "El código es obligatorio"
    }).min(1, "El código no puede estar vacío"),
    
    description: z.string({
      required_error: "La descripción es obligatoria"
    }).min(2, "La descripción debe tener al menos 2 caracteres"),
    
    unitPrice: z.number({
      required_error: "El precio unitario es obligatorio",
      invalid_type_error: "El precio debe ser un número"
    }).min(0, "El precio no puede ser negativo"),
    
    taxType: z.enum(['IVA', 'EXENTO', 'NO_SUJETO'], {
      required_error: "El tipo de tributo es obligatorio",
      invalid_type_error: "El tipo de tributo debe ser IVA, EXENTO o NO_SUJETO"
    }),
    
    isActive: z.boolean().optional()
  })
});
