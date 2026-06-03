import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Sembrando Catálogos del MH...");

  // Catálogo 016: Condiciones de Operación
  const cat016 = [
    { catalogId: '016', code: '1', value: 'Contado' },
    { catalogId: '016', code: '2', value: 'Crédito' },
    { catalogId: '016', code: '3', value: 'Otro' },
  ];

  // Catálogo 024: Tipos de Invalidación
  const cat024 = [
    { catalogId: '024', code: '1', value: 'Resciliación' },
    { catalogId: '024', code: '2', value: 'Resolución' },
    { catalogId: '024', code: '3', value: 'Nulidad' },
    { catalogId: '024', code: '4', value: 'Otros' },
  ];

  const items = [...cat016, ...cat024];

  for (const item of items) {
    await prisma.catalogItem.upsert({
      where: {
        catalogId_code: {
          catalogId: item.catalogId,
          code: item.code,
        }
      },
      update: {},
      create: item,
    });
  }

  console.log("Catálogos sembrados exitosamente.");

  // Crear Cliente B2B Demo para el SaaS (Prepago)
  const tenant = await prisma.tenant.upsert({
    where: { nit: '0614-010190-111-2' },
    update: {},
    create: {
      businessName: 'Farmacia La Salud (SaaS Client)',
      nit: '0614-010190-111-2',
      quotas: {
        create: {
          balanceDtes: 100 // Paquete Prepago de 100 Folios
        }
      },
      apiKeys: {
        create: {
          name: 'POS Farmacia Central',
          keyHash: 'gg_live_demo1234567890'
        }
      }
    }
  });

  console.log(`Cliente SaaS creado: ${tenant.businessName}`);
  console.log(`Tu API Key de prueba es: gg_live_demo1234567890`);
}

main()
  .catch((e) => {
    console.error(e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
