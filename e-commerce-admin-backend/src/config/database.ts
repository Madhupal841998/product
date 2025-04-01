import { ConnectionOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const dbConfig: ConnectionOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: 15413,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false,
    ca: process.env.DB_SSL_CA
  },
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  entities: [__dirname + '/../entities/**/*.{js,ts}'],
  migrations: [__dirname + '/../migrations/**/*.{js,ts}'],
  subscribers: [__dirname + '/../subscribers/**/*.{js,ts}'],
  cli: {
    entitiesDir: 'src/entities',
    migrationsDir: 'src/migrations',
    subscribersDir: 'src/subscribers'
  }
};

export default dbConfig;