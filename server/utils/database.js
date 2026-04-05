import sqlite3 from 'sqlite3';
import { config } from '../config.js';

class Database {
  constructor() {
    this.db = null;
  }

  connect() {
    if (this.db) {
      return Promise.resolve(this.db);
    }

    return new Promise((resolve, reject) => {
      const sqlite = config.database.verbose ? sqlite3.verbose() : sqlite3;
      const dbInstance = new sqlite.Database(config.database.path, (connectionError) => {
        if (connectionError) {
          console.error('Erreur de connexion a la base de donnees:', connectionError);
          reject(connectionError);
          return;
        }

        dbInstance.run('PRAGMA foreign_keys = ON', (pragmaError) => {
          if (pragmaError) {
            console.error('Erreur lors de l activation des cles etrangeres:', pragmaError);
            reject(pragmaError);
            return;
          }

          this.db = dbInstance;
          console.log('Connexion a la base de donnees etablie');
          resolve(this.db);
        });
      });

      dbInstance.on('error', (err) => {
        console.error('Erreur de connexion a la base de donnees:', err);
        reject(err);
      });
    });
  }

  close() {
    if (!this.db) {
      return Promise.resolve();
    }

    const dbInstance = this.db;
    this.db = null;

    return new Promise((resolve, reject) => {
      dbInstance.close((err) => {
        if (err) {
          console.error('Erreur lors de la fermeture de la base de donnees:', err);
          reject(err);
          return;
        }

        console.log('Connexion a la base de donnees fermee');
        resolve();
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  exec(sql) {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

export const database = new Database();
export default database;
