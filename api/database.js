const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const strDataDirectory = path.join(__dirname, '..', 'data');
const strDatabasePath = path.join(strDataDirectory, 'resume-builder.sqlite');

let objDatabase;

const getDatabase = () => {
  if (!objDatabase) {
    if (!fs.existsSync(strDataDirectory)) {
      fs.mkdirSync(strDataDirectory, { recursive: true });
    }

    objDatabase = new DatabaseSync(strDatabasePath);
    objDatabase.exec('PRAGMA foreign_keys = ON;');
  }

  return objDatabase;
};

const initializeDatabase = () => {
  const objDb = getDatabase();

  objDb.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      fullName TEXT NOT NULL DEFAULT '',
      headline TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      website TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT ''
    );

    INSERT OR IGNORE INTO profile (id) VALUES (1);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company TEXT NOT NULL,
      title TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT '',
      startDate TEXT NOT NULL DEFAULT '',
      endDate TEXT NOT NULL DEFAULT '',
      sortOrder INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS job_responsibilities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jobId INTEGER NOT NULL,
      detail TEXT NOT NULL,
      sortOrder INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT '',
      sortOrder INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS certifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      issuer TEXT NOT NULL,
      dateEarned TEXT NOT NULL DEFAULT '',
      detail TEXT NOT NULL DEFAULT '',
      sortOrder INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS awards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      issuer TEXT NOT NULL DEFAULT '',
      dateReceived TEXT NOT NULL DEFAULT '',
      detail TEXT NOT NULL DEFAULT '',
      sortOrder INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS saved_resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      style TEXT NOT NULL DEFAULT 'classic',
      resumeJson TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

module.exports = {
  getDatabase,
  initializeDatabase
};
