import 'reflect-metadata';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { createConnection } from 'typeorm';
import productRoutes from './routes/product.routes';
import dbConfig from './config/database';
import path from 'path';
import fs from 'fs';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads/:filename', (req:any, res:any) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../public/uploads', filename);
  res.sendFile(filePath);
});
app.use('/api', productRoutes);

app.get('/health', (req:any, res:any) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

(async () => {
  try {
    await createConnection(dbConfig);
    console.log('Connected to database');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error connecting to database:', error);
  }
})();
