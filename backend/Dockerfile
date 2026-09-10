FROM node:20-alpine

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./

# Устанавливаем клиент PostgreSQL для бэкапов
RUN apk add --no-cache postgresql-client

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Генерируем Prisma Client
RUN npx prisma generate

# Указываем порт
EXPOSE 8080

# Запускаем сервер
CMD ["npm", "start"]
