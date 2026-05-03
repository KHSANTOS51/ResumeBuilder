const express = require('express');
const { getDatabase } = require('../database');
const { cleanText, sendDatabaseError, toInteger, validateLength, validateRequired } = require('./routeHelpers');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const arrCertifications = getDatabase().prepare('SELECT * FROM certifications ORDER BY sortOrder, dateEarned DESC, name').all();
    res.status(200).json(arrCertifications);
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

router.post('/', (req, res) => {
  const strRequiredError = validateRequired(req.body, ['name', 'issuer']);
  const strLengthError = validateLength(req.body, ['name', 'issuer', 'dateEarned', 'detail']);

  if (strRequiredError || strLengthError) {
    return res.status(400).json({ error: strRequiredError || strLengthError });
  }

  try {
    const objResult = getDatabase().prepare(`
      INSERT INTO certifications (name, issuer, dateEarned, detail, sortOrder)
      VALUES (?, ?, ?, ?, ?)
    `).run(cleanText(req.body.name), cleanText(req.body.issuer), cleanText(req.body.dateEarned), cleanText(req.body.detail), Number(req.body.sortOrder) || 0);

    res.status(201).json({ id: Number(objResult.lastInsertRowid) });
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

router.put('/:id', (req, res) => {
  const intId = toInteger(req.params.id);
  const strRequiredError = validateRequired(req.body, ['name', 'issuer']);
  const strLengthError = validateLength(req.body, ['name', 'issuer', 'dateEarned', 'detail']);

  if (!intId) {
    return res.status(400).json({ error: 'A valid certification id is required.' });
  }

  if (strRequiredError || strLengthError) {
    return res.status(400).json({ error: strRequiredError || strLengthError });
  }

  try {
    const objResult = getDatabase().prepare(`
      UPDATE certifications
      SET name = ?, issuer = ?, dateEarned = ?, detail = ?, sortOrder = ?
      WHERE id = ?
    `).run(cleanText(req.body.name), cleanText(req.body.issuer), cleanText(req.body.dateEarned), cleanText(req.body.detail), Number(req.body.sortOrder) || 0, intId);

    if (objResult.changes === 0) {
      return res.status(404).json({ error: 'Certification not found.' });
    }

    res.status(200).json({ message: 'Certification updated.' });
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

router.delete('/:id', (req, res) => {
  const intId = toInteger(req.params.id);

  if (!intId) {
    return res.status(400).json({ error: 'A valid certification id is required.' });
  }

  try {
    const objResult = getDatabase().prepare('DELETE FROM certifications WHERE id = ?').run(intId);

    if (objResult.changes === 0) {
      return res.status(404).json({ error: 'Certification not found.' });
    }

    res.status(200).json({ message: 'Certification deleted.' });
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

module.exports = router;
