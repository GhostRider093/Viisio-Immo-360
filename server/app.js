import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { config } from './config.js';
import { database } from './utils/database.js';
import { validateClient, validateProperty, validateEvent, validateContract } from './utils/validation.js';
import { getLeboncoinCapturePayload, runLeboncoinCapture } from './utils/leboncoinCapture.js';

const app = express();

const isApiRoute = (requestPath) => requestPath.startsWith('/api');

const parseEntityId = (value) => {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
};

const parseOptionalEntityId = (value) => {
  if (value === '' || value == null) {
    return null;
  }

  return parseEntityId(value);
};

const sendValidationResponse = (res, details) => res.status(400).json({
  error: 'Donnees invalides',
  details
});

const ensureContractRelations = async (clientId, propertyId) => {
  const [client, property] = await Promise.all([
    database.get('SELECT id FROM clients WHERE id = ?', [clientId]),
    database.get('SELECT id FROM properties WHERE id = ?', [propertyId])
  ]);

  const errors = [];

  if (!client) {
    errors.push('Le client selectionne est introuvable');
  }

  if (!property) {
    errors.push('Le bien selectionne est introuvable');
  }

  return errors;
};

const ensureEventRelations = async (clientId, propertyId) => {
  const checks = [];

  if (clientId) {
    checks.push(database.get('SELECT id FROM clients WHERE id = ?', [clientId]));
  } else {
    checks.push(Promise.resolve(null));
  }

  if (propertyId) {
    checks.push(database.get('SELECT id FROM properties WHERE id = ?', [propertyId]));
  } else {
    checks.push(Promise.resolve(null));
  }

  const [client, property] = await Promise.all(checks);
  const errors = [];

  if (clientId && !client) {
    errors.push('Le client lie a cet evenement est introuvable');
  }

  if (propertyId && !property) {
    errors.push('Le bien lie a cet evenement est introuvable');
  }

  return errors;
};

const ensureEventLinksSchema = async () => {
  const columns = await database.all('PRAGMA table_info(events)');
  const columnNames = columns.map((column) => column.name);

  if (!columnNames.includes('client_id')) {
    await database.exec('ALTER TABLE events ADD COLUMN client_id INTEGER REFERENCES clients(id)');
  }

  if (!columnNames.includes('property_id')) {
    await database.exec('ALTER TABLE events ADD COLUMN property_id INTEGER REFERENCES properties(id)');
  }
};

const ensureRuntimeDirectories = () => {
  fs.mkdirSync(config.paths.dataDir, { recursive: true });
  fs.mkdirSync(config.paths.databaseDir, { recursive: true });
  fs.mkdirSync(config.paths.capturesDir, { recursive: true });
};

const ensureDatabaseSeeded = async (shouldSeed) => {
  if (!shouldSeed) {
    return;
  }

  const schemaPath = path.join(config.paths.rootDir, 'database', 'schema.sql');
  const sampleDataPath = path.join(config.paths.rootDir, 'database', 'insert_sample_data.sql');

  const schema = fs.readFileSync(schemaPath, 'utf8');
  const sampleData = fs.readFileSync(sampleDataPath, 'utf8');

  await database.exec(schema);
  await database.exec(sampleData);

  console.log(`Base SQLite initialisee automatiquement dans ${config.database.path}`);
};

app.use(cors(config.cors));
app.use(express.json());
app.use(express.static(config.paths.staticDir));
app.use('/captures', express.static(config.paths.capturesDir));

if (config.paths.staticSource !== 'dist') {
  console.warn('Aucun build React trouve, fallback temporaire sur le dossier public');
}

const shutdown = async () => {
  console.log('\nFermeture du serveur...');
  await database.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    staticSource: config.paths.staticSource
  });
});

app.get('/api/clients', async (req, res) => {
  try {
    const clients = await database.all('SELECT * FROM clients ORDER BY created_at DESC');
    res.json(clients);
  } catch (error) {
    console.error('Erreur lors de la recuperation des clients:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const validation = validateClient(req.body);

    if (!validation.isValid) {
      return sendValidationResponse(res, validation.errors);
    }

    const { name, firstname, email, phone, address, city, postal_code, country } = req.body;
    const sql = `INSERT INTO clients (name, firstname, email, phone, address, city, postal_code, country)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    const result = await database.run(sql, [name, firstname, email, phone, address, city, postal_code, country]);

    res.status(201).json({
      id: result.id,
      message: 'Client cree avec succes'
    });
  } catch (error) {
    console.error('Erreur lors de la creation du client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    const id = parseEntityId(req.params.id);

    if (!id) {
      return sendValidationResponse(res, ['ID client invalide']);
    }

    const result = await database.run('DELETE FROM clients WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Client non trouve' });
    }

    res.json({ message: 'Client supprime avec succes' });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({
        error: 'Suppression impossible',
        details: ['Ce client est lie a un ou plusieurs contrats ou evenements']
      });
    }

    console.error('Erreur lors de la suppression du client:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/properties', async (req, res) => {
  try {
    const properties = await database.all('SELECT * FROM properties ORDER BY created_at DESC');
    res.json(properties);
  } catch (error) {
    console.error('Erreur lors de la recuperation des biens:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/properties', async (req, res) => {
  try {
    const validation = validateProperty(req.body);

    if (!validation.isValid) {
      return sendValidationResponse(res, validation.errors);
    }

    const { address, type, price, area, rooms, description, photo_url } = req.body;
    const sql = `INSERT INTO properties (address, type, price, area, rooms, description, photo_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const result = await database.run(sql, [address, type, price, area, rooms, description ?? null, photo_url ?? null]);

    res.status(201).json({
      id: result.id,
      message: 'Bien cree avec succes'
    });
  } catch (error) {
    console.error('Erreur lors de la creation du bien:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const events = await database.all(
      `SELECT
         events.*,
         clients.firstname AS client_firstname,
         clients.name AS client_name,
         properties.address AS property_address,
         properties.type AS property_type
       FROM events
       LEFT JOIN clients ON clients.id = events.client_id
       LEFT JOIN properties ON properties.id = events.property_id
       ORDER BY events.start_date`
    );

    res.json(events);
  } catch (error) {
    console.error('Erreur lors de la recuperation des evenements:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const validation = validateEvent(req.body);

    if (!validation.isValid) {
      return sendValidationResponse(res, validation.errors);
    }

    const clientId = parseOptionalEntityId(req.body.client_id);
    const propertyId = parseOptionalEntityId(req.body.property_id);
    const relationErrors = await ensureEventRelations(clientId, propertyId);

    if (relationErrors.length > 0) {
      return sendValidationResponse(res, relationErrors);
    }

    const { title, start_date, end_date, description } = req.body;
    const sql = `INSERT INTO events (title, start_date, end_date, description, client_id, property_id)
                 VALUES (?, ?, ?, ?, ?, ?)`;

    const result = await database.run(sql, [title, start_date, end_date, description ?? null, clientId, propertyId]);

    res.status(201).json({
      id: result.id,
      message: 'Evenement cree avec succes'
    });
  } catch (error) {
    console.error("Erreur lors de la creation de l'evenement:", error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/contracts', async (req, res) => {
  try {
    const contracts = await database.all('SELECT * FROM contracts ORDER BY created_at DESC');
    res.json(contracts);
  } catch (error) {
    console.error('Erreur lors de la recuperation des contrats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/contracts', async (req, res) => {
  try {
    const validation = validateContract(req.body);

    if (!validation.isValid) {
      return sendValidationResponse(res, validation.errors);
    }

    const { client_id, property_id, type, start_date, end_date, amount, status } = req.body;
    const relationErrors = await ensureContractRelations(Number(client_id), Number(property_id));

    if (relationErrors.length > 0) {
      return sendValidationResponse(res, relationErrors);
    }

    const sql = `INSERT INTO contracts (client_id, property_id, type, start_date, end_date, amount, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const result = await database.run(sql, [client_id, property_id, type, start_date, end_date, amount, status]);

    res.status(201).json({
      id: result.id,
      message: 'Contrat cree avec succes'
    });
  } catch (error) {
    console.error('Erreur lors de la creation du contrat:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.delete('/api/contracts/:id', async (req, res) => {
  try {
    const id = parseEntityId(req.params.id);

    if (!id) {
      return sendValidationResponse(res, ['ID contrat invalide']);
    }

    const result = await database.run('DELETE FROM contracts WHERE id = ?', [id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Contrat non trouve' });
    }

    res.json({ message: 'Contrat supprime avec succes' });
  } catch (error) {
    console.error('Erreur lors de la suppression du contrat:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/watch/leboncoin', async (req, res) => {
  try {
    res.json(getLeboncoinCapturePayload());
  } catch (error) {
    console.error('Erreur lors de la lecture de la veille Leboncoin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/watch/leboncoin/capture', async (req, res) => {
  try {
    const capture = await runLeboncoinCapture({
      url: req.body?.url || config.watch.leboncoin.defaultUrl,
      segments: req.body?.segments || config.watch.leboncoin.maxSegments
    });

    res.status(201).json({
      message: 'Capture Leboncoin terminee',
      capture,
      payload: getLeboncoinCapturePayload()
    });
  } catch (error) {
    if (error.code === 'CAPTURE_BUSY') {
      return res.status(409).json({
        error: 'Capture en cours',
        details: ['Une capture est deja lancee']
      });
    }

    if (error.code === 'LEBONCOIN_BLOCKED') {
      return res.status(422).json({
        error: 'Capture bloquee',
        details: [error.message]
      });
    }

    console.error('Erreur lors de la capture Leboncoin:', error);
    res.status(500).json({
      error: 'Capture impossible',
      details: [error.message]
    });
  }
});

app.use('*', (req, res) => {
  if (isApiRoute(req.originalUrl)) {
    return res.status(404).json({ error: 'Route non trouvee' });
  }

  if (req.method === 'GET' && !path.extname(req.path)) {
    return res.sendFile(config.paths.indexFile);
  }

  res.status(404).json({ error: 'Route non trouvee' });
});

app.use((error, req, res, next) => {
  console.error('Erreur non geree:', error);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

const startServer = async () => {
  try {
    ensureRuntimeDirectories();
    const shouldSeedDatabase = !fs.existsSync(config.database.path);
    await database.connect();
    await ensureDatabaseSeeded(shouldSeedDatabase);
    await ensureEventLinksSchema();

    const server = app.listen(config.port, () => {
      console.log(`Serveur demarre sur http://localhost:${config.port}`);
      console.log(`Frontend servi depuis ${config.paths.staticSource}/`);
    });

    server.on('error', async (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Le port ${config.port} est deja utilise. Definis PORT sur une autre valeur puis relance.`);
      } else {
        console.error('Erreur lors du demarrage du serveur:', error);
      }

      await database.close().catch(() => {});
      process.exit(1);
    });
  } catch (err) {
    console.error('Erreur critique: impossible de se connecter a la base de donnees', err);
    process.exit(1);
  }
};

startServer();
