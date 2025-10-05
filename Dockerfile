FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências de build primeiro
RUN apk add --no-cache python3 make g++

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências (usar npm install ao invés de npm ci)
RUN npm install --production

# Copiar código da aplicação
COPY . .

# Criar pasta public se não existir
RUN mkdir -p public

# Expor porta
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/clientes', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando para iniciar
CMD ["npm", "start"]