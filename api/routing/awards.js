const express = require('express');
const { getDatabase } = require('../database');
const { cleanText, sendDatabaseError, toInteger, validateLength, validateRequired } = require('./routeHelpers');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const arrAwards = getDatabase().prepare('SELECT * FROM awards ORDER BY sortOrder, dateReceived DESC, name').all();
    res.status(200).json(arrAwards);
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

router.post('/', (req, res) => {
  const strRequiredError = validateRequired(req.body, ['name']);
  const strLengthError = validateLength(req.body, ['name', 'issuer', 'dateReceived', 'detail']);

  if (strRequiredError || strLengthError) {
    return res.status(400).json({ error: strRequiredError || strLengthError });
  }

  try {
    const objResult = getDatabase().prepare(`
      INSERT INTO awards (name, issuer, dateReceived, detail, sortOrder)
      VALUES (?, ?, ?, ?, ?)
    `).run(cleanText(req.body.name), cleanText(req.body.issuer), cleanText(req.body.dateReceived), cleanText(req.body.detail), Number(req.body.sortOrder) || 0);

    res.status(201).json({ id: Number(objResult.lastInsertRowid) });
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

router.put('/:id', (req, res) => {
  const intId = toInteger(req.params.id);
  const strRequiredError = validateRequired(req.body, ['name']);
  const strLengthError = validateLength(req.body, ['name', 'issuer', 'dateReceived', 'detail']);

  if (!intId) {
    return res.status(400).json({ error: 'A valid award id is required.' });
  }

  if (strRequiredError || strLengthError) {
    return res.status(400).json({ error: strRequiredError || strLengthError });
  }

  try {
    const objResult = getDatabase().prepare(`
      UPDATE awards
      SET name = ?, issuer = ?, dateReceived = ?, detail = ?, sortOrder = ?
      WHERE id = ?
    `).run(cleanText(req.body.name), cleanText(req.body.issuer), cleanText(req.body.dateReceived), cleanText(req.body.detail), Number(req.body.sortOrder) || 0, intId);

    if (objResult.changes === 0) {
      return res.status(404).json({ error: 'Award not found.' });
    }

    res.status(200).json({ message: 'Award updated.' });
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

router.delete('/:id', (req, res) => {
  const intId = toInteger(req.params.id);

  if (!intId) {
    return res.status(400).json({ error: 'A valid award id is required.' });
  }

  try {
    const objResult = getDatabase().prepare('DELETE FROM awards WHERE id = ?').run(intId);

    if (objResult.changes === 0) {
      return res.status(404).json({ error: 'Award not found.' });
    }

    res.status(200).json({ message: 'Award deleted.' });
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

module.exports = router;
