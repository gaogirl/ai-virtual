const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

dotenv.config();

const auth = require('./routes/api/auth');
const chat = require('./routes/api/chat');
const translate = require('./routes/api/translate');
const classesRoutes = require('./routes/api/classes');
const assignmentsRoutes = require('./routes/api/assignments');
const submissionsRoutes = require('./routes/api/submissions');
const evalRoutes = require('./routes/api/eval');
const libraryRoutes = require('./routes/api/library');
const uploadRoutes = require('./routes/api/upload');
const learningProfileRoutes = require('./routes/api/learningProfile');
const { seedDemoData } = require('./demoSeed');

const app = express();
const port = process.env.PORT || 5000;
let embeddedMongo;

app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'https://gaogirl.github.io'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', auth);
app.use('/api/chat', chat);
app.use('/api/translate', translate);
app.use('/api/classes', classesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/eval', evalRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', learningProfileRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const frontendDist = path.resolve(__dirname, '../frontend/dist');
const frontendIndex = path.join(frontendDist, 'index.html');

if (fs.existsSync(frontendIndex)) {
  app.use('/ai-virtual', express.static(frontendDist));
  app.get(/^\/(?!api(?:\/|$)|uploads(?:\/|$)).*/, (req, res) => {
    res.sendFile(frontendIndex);
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running. Build frontend/ to enable the demo UI.');
  });
}

async function resolveDatabaseUri() {
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }

  if (process.env.DEMO_EMBEDDED_DB !== 'true') {
    throw new Error('Set MONGO_URI or enable DEMO_EMBEDDED_DB=true.');
  }

  const { MongoMemoryServer } = require('mongodb-memory-server');
  const dbPath = path.resolve(__dirname, '.demo-data');
  fs.mkdirSync(dbPath, { recursive: true });

  embeddedMongo = await MongoMemoryServer.create({
    instance: {
      dbName: 'ai_virtual',
      dbPath,
      storageEngine: 'wiredTiger'
    }
  });

  console.log('Embedded demo database is ready.');
  return embeddedMongo.getUri();
}

async function startServer() {
  const databaseUri = await resolveDatabaseUri();
  await mongoose.connect(databaseUri);
  console.log('MongoDB connected.');

  if (process.env.DEMO_SEED_DATA === 'true') {
    await seedDemoData();
  }

  app.listen(port, () => {
    console.log(`Server is running on port ${port}.`);
  });
}

async function shutdown() {
  await mongoose.disconnect();
  if (embeddedMongo) {
    await embeddedMongo.stop();
  }
}

startServer().catch(error => {
  console.error('Server startup failed:', error);
  process.exit(1);
});

process.on('SIGINT', async () => {
  await shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await shutdown();
  process.exit(0);
});
