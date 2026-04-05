import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(import.meta.dirname, 'real_estate.db');

async function initializeDatabase() {
  try {
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('Base existante supprimee pour une reinitialisation propre');
    }

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    const schema = fs.readFileSync(path.join(import.meta.dirname, 'schema.sql'), 'utf8');
    await db.exec(schema);
    console.log('Schema cree avec succes');

    const sampleData = fs.readFileSync(path.join(import.meta.dirname, 'insert_sample_data.sql'), 'utf8');
    await db.exec(sampleData);
    console.log('Donnees d exemple inserees avec succes');

    await db.close();
    console.log('Base de donnees fermee');
  } catch (err) {
    console.error("Erreur lors de l'initialisation de la base de donnees:", err);
  }
}

initializeDatabase();
