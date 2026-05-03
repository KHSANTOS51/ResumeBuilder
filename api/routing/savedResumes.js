const express = require('express');
const { getDatabase } = require('../database');
const { cleanText, sendDatabaseError, toInteger, validateLength, validateRequired } = require('./routeHelpers');

const router = express.Router();

const parseResume = (objResume) => ({
  ...objResume,
  resumeData: JSON.parse(objResume.resumeJson)
});

router.get('/', (req, res) => {
  try {
    const arrResumes = getDatabase().prepare(`
      SELECT id, name, style, resumeJson, createdAt
      FROM saved_resumes
      ORDER BY id DESC
    `).all().map(parseResume);

    res.status(200).json(arrResumes);
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

router.post('/', (req, res) => {
  const strRequiredError = validateRequired(req.body, ['name', 'style']);
  const strLengthError = validateLength(req.body, ['name', 'style']);
  const objResumeData = req.body.resumeData;

  if (strRequiredError || strLengthError) {
    return res.status(400).json({ error: strRequiredError || strLengthError });
  }

  if (!objResumeData || typeof objResumeData !== 'object') {
    return res.status(400).json({ error: 'Resume data is required.' });
  }

  try {
    const objResult = getDatabase().prepare(`
      INSERT INTO saved_resumes (name, style, resumeJson)
      VALUES (?, ?, ?)
    `).run(cleanText(req.body.name), cleanText(req.body.style), JSON.stringify(objResumeData));

    res.status(201).json({ id: Number(objResult.lastInsertRowid) });
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

router.delete('/:id', (req, res) => {
  const intId = toInteger(req.params.id);

  if (!intId) {
    return res.status(400).json({ error: 'A valid saved resume id is required.' });
  }

  try {
    const objResult = getDatabase().prepare('DELETE FROM saved_resumes WHERE id = ?').run(intId);

    if (objResult.changes === 0) {
      return res.status(404).json({ error: 'Saved resume not found.' });
    }

    res.status(200).json({ message: 'Saved resume deleted.' });
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

module.exports = router;
