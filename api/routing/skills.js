const express = require('express');
const { getDatabase } = require('../database');
const { cleanText, sendDatabaseError, toInteger, validateLength, validateRequired } = require('./routeHelpers');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const strSearch = cleanText(req.query.search);
    const strFilter = `%${strSearch}%`;
    const arrSkills = strSearch
      ? getDatabase().prepare(`
          SELECT * FROM skills
          WHERE category LIKE ? OR name LIKE ? OR detail LIKE ?
          ORDER BY category, sortOrder, name
        `).all(strFilter, strFilter, strFilter)
      : getDatabase().prepare('SELECT * FROM skills ORDER BY category, sortOrder, name').all();

    res.status(200).json(arrSkills);
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

router.post('/', (req, res) => {
  const strRequiredError = validateRequired(req.body, ['category', 'name']);
  const strLengthError = validateLength(req.body, ['category', 'name', 'detail']);

  if (strRequiredError || strLengthError) {
    return res.status(400).json({ error: strRequiredError || strLengthError });
  }

  try {
    const objResult = getDatabase().prepare(`
      INSERT INTO skills (category, name, detail, sortOrder)
      VALUES (?, ?, ?, ?)
    `).run(cleanText(req.body.category), cleanText(req.body.name), cleanText(req.body.detail), Number(req.body.sortOrder) || 0);

    res.status(201).json({ id: Number(objResult.lastInsertRowid) });
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

router.put('/:id', (req, res) => {
  const intId = toInteger(req.params.id);
  const strRequiredError = validateRequired(req.body, ['category', 'name']);
  const strLengthError = validateLength(req.body, ['category', 'name', 'detail']);

  if (!intId) {
    return res.status(400).json({ error: 'A valid skill id is required.' });
  }

  if (strRequiredError || strLengthError) {
    return res.status(400).json({ error: strRequiredError || strLengthError });
  }

  try {
    const objResult = getDatabase().prepare(`
      UPDATE skills
      SET category = ?, name = ?, detail = ?, sortOrder = ?
      WHERE id = ?
    `).run(cleanText(req.body.category), cleanText(req.body.name), cleanText(req.body.detail), Number(req.body.sortOrder) || 0, intId);

    if (objResult.changes === 0) {
      return res.status(404).json({ error: 'Skill not found.' });
    }

    res.status(200).json({ message: 'Skill updated.' });
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

router.delete('/:id', (req, res) => {
  const intId = toInteger(req.params.id);

  if (!intId) {
    return res.status(400).json({ error: 'A valid skill id is required.' });
  }

  try {
    const objResult = getDatabase().prepare('DELETE FROM skills WHERE id = ?').run(intId);

    if (objResult.changes === 0) {
      return res.status(404).json({ error: 'Skill not found.' });
    }

    res.status(200).json({ message: 'Skill deleted.' });
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

module.exports = router;
