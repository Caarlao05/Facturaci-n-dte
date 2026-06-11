FROM node:22-alpine

# Instalar dependencias necesarias para Prisma y builds nativos
RUN apk add --no-cache openssl ca-certificates libc6-compat

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./
COPY backend/package.json ./backend/
COPY nexxo/package.json ./nexxo/

# Instalar TODAS las dependencias (evitar --omit=dev para asegurar Prisma)
RUN npm install

# Copiar el código fuente
COPY . .

# Generar Prisma y compilar ambos proyectos (Backend + Frontend)
RUN npm run build

# Exponer el puerto
EXPOSE 3000

# Iniciar el servidor
CMD ["npm", "start"]
