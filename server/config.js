// Configuration centrale de l'application
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const publicDir = path.join(rootDir, 'public');
const capturesDir = path.join(rootDir, 'captures');
const staticDir = fs.existsSync(distDir) ? distDir : publicDir;

export const config = {
  port: process.env.PORT || 3000,
  database: {
    path: path.join(__dirname, '../database/real_estate.db'),
    verbose: process.env.NODE_ENV === 'development'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  },
  paths: {
    rootDir,
    distDir,
    publicDir,
    capturesDir,
    staticDir,
    indexFile: path.join(staticDir, 'index.html'),
    staticSource: staticDir === distDir ? 'dist' : 'public'
  },
  watch: {
    leboncoin: {
      defaultUrl: process.env.LEBONCOIN_URL || 'https://www.leboncoin.fr/recherche?category=9&locations=Colombiers_34440__43.31402_3.13967_5000&owner_type=all&sort=time&order=desc&from=ms&sa=2026-03-23T23%3A45%3A26.097608Z',
      maxSegments: 6
    }
  }
};

export default config;
