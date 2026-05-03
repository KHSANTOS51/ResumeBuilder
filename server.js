const path = require('path');
const express = require('express');
require('dotenv').config();

const { getDatabase, initializeDatabase } = require('./api/database');
const { saveEnvValue } = require('./api/envFile');
const profileRoutes = require('./api/routing/profile');
const settingsRoutes = require('./api/routing/settings');
const jobRoutes = require('./api/routing/jobs');
const skillRoutes = require('./api/routing/skills');
const certificationRoutes = require('./api/routing/certifications');
const awardRoutes = require('./api/routing/awards');
const savedResumeRoutes = require('./api/routing/savedResumes');
const aiRoutes = require('./api/routing/aiSuggestions');
const aiResumeBuilderRoutes = require('./api/routing/aiResumeBuilder');

const app = express();
const intPort = Number(process.env.PORT) || 3000;

initializeDatabase();

const objStoredGeminiKey = getDatabase().prepare("SELECT value FROM settings WHERE key = 'geminiApiKey'").get();

if (objStoredGeminiKey?.value) {
  saveEnvValue('GEMINI_API_KEY', objStoredGeminiKey.value);
}

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/routing/profile', profileRoutes);
app.use('/api/routing/settings', settingsRoutes);
app.use('/api/routing/jobs', jobRoutes);
app.use('/api/routing/skills', skillRoutes);
app.use('/api/routing/certifications', certificationRoutes);
app.use('/api/routing/awards', awardRoutes);
app.use('/api/routing/saved-resumes', savedResumeRoutes);
app.use('/api/routing/ai-suggestions', aiRoutes);
app.use('/api/routing/ai-resume-builder', aiResumeBuilderRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'The requested resource was not found.' });
});

const startServer = (intRequestedPort = intPort) => new Promise((resolve) => {
  const objServer = app.listen(intRequestedPort, () => {
    const intActivePort = objServer.address().port;
    console.log(`Republic Resumes is running at http://localhost:${intActivePort}`);
    resolve({
      app,
      server: objServer,
      port: intActivePort
    });
  });
});

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer
};
