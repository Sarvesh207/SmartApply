import dotenv from 'dotenv';
import { prisma } from '@smartapply/database';
import app from './app';

// Initialize env
dotenv.config({ path: '../../.env' });
dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to db and start server
async function start() {
  try {
    await prisma.$connect();
    console.log('Successfully connected to PostgreSQL database');
    
    app.listen(PORT, () => {
      console.log(`SmartApply API server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
