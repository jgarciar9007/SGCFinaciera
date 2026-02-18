FROM node:20
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
# Install production deps + global prisma CLI for generation
RUN npm ci --omit=dev && npm install -g prisma
COPY dist ./dist
RUN npx prisma generate
EXPOSE 3000
CMD ["node", "dist/index.js"]
