const fs = require('fs');
const path = require('path');

const replacements = [
  { match: /['"]\.\.\/lib\/prisma['"]/g, replace: "'../config/database'" },
  { match: /['"]\.\.\/integrations\/hacienda\.api['"]/g, replace: "'../infrastructure/hacienda/hacienda.client'" },
  { match: /['"]\.\/pdfGenerator\.service['"]/g, replace: "'../infrastructure/pdf/pdfGenerator.service'" },
  { match: /['"]\.\.\/services\/pdfGenerator\.service['"]/g, replace: "'../infrastructure/pdf/pdfGenerator.service'" },
  { match: /['"]\.\/email\.service['"]/g, replace: "'../infrastructure/email/email.service'" },
  { match: /['"]\.\.\/services\/email\.service['"]/g, replace: "'../infrastructure/email/email.service'" },
  { match: /['"]\.\/storage\.service['"]/g, replace: "'../infrastructure/storage/storage.service'" },
  { match: /['"]\.\.\/services\/firmador\.service['"]/g, replace: "'../infrastructure/security/firmador.service'" },
  { match: /['"]\.\.\/services\/auth\.service['"]/g, replace: "'../../application/tenant/auth.service'" },
  { match: /['"]\.\.\/services\/billing\.service['"]/g, replace: "'../../application/dte/billing.service'" },
  { match: /['"]\.\.\/services\/invalidation\.service['"]/g, replace: "'../../application/dte/invalidation.service'" },
  { match: /['"]\.\.\/services\/accountsPayable\.service['"]/g, replace: "'../../application/tenant/accountsPayable.service'" },
  { match: /['"]\.\/middlewares\/auth\.middleware['"]/g, replace: "'../middlewares/auth.middleware'" }, // in server.ts
  { match: /['"]\.\/services\/auth\.service['"]/g, replace: "'../../application/tenant/auth.service'" }, // in server.ts
  { match: /['"]\.\/middlewares\/apiKey\.middleware['"]/g, replace: "'../middlewares/apiKey.middleware'" }, // in server.ts
  { match: /['"]\.\/middlewares\/validate\.middleware['"]/g, replace: "'../middlewares/validate.middleware'" }, // in server.ts
  { match: /['"]\.\/schemas\/catalog\.schema['"]/g, replace: "'../../domain/dte/schemas/catalog.schema'" }, // in server.ts
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Simple relative depth adjustments since we moved controllers from src/controllers to src/presentation/api/controllers
      if (fullPath.includes('presentation/api/controllers') || fullPath.includes('presentation/middlewares') || fullPath.includes('application/dte')) {
         // Replace '../lib/prisma' with '../../config/database'
         content = content.replace(/['"]\.\.\/lib\/prisma['"]/g, "'../../config/database'");
         // Replace '../../config/database' if we already replaced it in a deeper folder
         // This is a naive regex so we just have to be careful
         content = content.replace(/['"]\.\.\/middlewares\/(.*?)['"]/g, "'../../presentation/middlewares/$1'");
         content = content.replace(/['"]\.\.\/services\/(.*?)['"]/g, "/* REPLACE MANUALLY */ '../services/$1'");
      }

      // We will do another pass manually or carefully
      fs.writeFileSync(fullPath, content);
    }
  }
}
