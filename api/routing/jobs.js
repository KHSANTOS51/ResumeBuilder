const express = require('express');
const { getDatabase } = require('../database');
const { cleanText, sendDatabaseError, toInteger, validateLength, validateRequired } = require('./routeHelpers');

const router = express.Router();

const getResponsibilities = (objDb, intJobId) => objDb.prepare(`
  SELECT id, detail, sortOrder
  FROM job_responsibilities
  WHERE jobId = ?
  ORDER BY sortOrder, id
`).all(intJobId);

const getJobs = (objDb, strSearch) => {
  const strFilter = `%${strSearch}%`;
  const arrJobs = strSearch
    ? objDb.prepare(`
        SELECT * FROM jobs
        WHERE company LIKE ? OR title LIKE ? OR location LIKE ?
        ORDER BY sortOrder, id DESC
      `).all(strFilter, strFilter, strFilter)
    : objDb.prepare('SELECT * FROM jobs ORDER BY sortOrder, id DESC').all();

  return arrJobs.map((objJob) => ({
    ...objJob,
    responsibilities: getResponsibilities(objDb, objJob.id)
  }));
};

const saveResponsibilities = (objDb, intJobId, arrResponsibilities) => {
  objDb.prepare('DELETE FROM job_responsibilities WHERE jobId = ?').run(intJobId);

  const objInsert = objDb.prepare('INSERT INTO job_responsibilities (jobId, detail, sortOrder) VALUES (?, ?, ?)');
  arrResponsibilities
    .map((strDetail) => cleanText(strDetail))
    .filter(Boolean)
    .forEach((strDetail, intIndex) => {
      objInsert.run(intJobId, strDetail, intIndex);
    });
};

router.get('/', (req, res) => {
  try {
    res.status(200).json(getJobs(getDatabase(), cleanText(req.query.search)));
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

router.post('/', (req, res) => {
  const strRequiredError = validateRequired(req.body, ['company', 'title']);
  const strLengthError = validateLength(req.body, ['company', 'title', 'location', 'startDate', 'endDate']);

  if (strRequiredError || strLengthError) {
    return res.status(400).json({ error: strRequiredError || strLengthError });
  }

  try {
    const objDb = getDatabase();
    const objResult = objDb.prepare(`
      INSERT INTO jobs (company, title, location, startDate, endDate, sortOrder)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      cleanText(req.body.company),
      cleanText(req.body.title),
      cleanText(req.body.location),
      cleanText(req.body.startDate),
      cleanText(req.body.endDate),
      Number(req.body.sortOrder) || 0
    );

    saveResponsibilities(objDb, Number(objResult.lastInsertRowid), Array.isArray(req.body.responsibilities) ? req.body.responsibilities : []);
    res.status(201).json({ id: Number(objResult.lastInsertRowid) });
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

router.put('/:id', (req, res) => {
  const intId = toInteger(req.params.id);
  const strRequiredError = validateRequired(req.body, ['company', 'title']);
  const strLengthError = validateLength(req.body, ['company', 'title', 'location', 'startDate', 'endDate']);

  if (!intId) {
    return res.status(400).json({ error: 'A valid job id is required.' });
  }

  if (strRequiredError || strLengthError) {
    return res.status(400).json({ error: strRequiredError || strLengthError });
  }

  try {
    const objDb = getDatabase();
    const objResult = objDb.prepare(`
      UPDATE jobs
      SET company = ?, title = ?, location = ?, startDate = ?, endDate = ?, sortOrder = ?
      WHERE id = ?
    `).run(
      cleanText(req.body.company),
      cleanText(req.body.title),
      cleanText(req.body.location),
      cleanText(req.body.startDate),
      cleanText(req.body.endDate),
      Number(req.body.sortOrder) || 0,
      intId
    );

    if (objResult.changes === 0) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    saveResponsibilities(objDb, intId, Array.isArray(req.body.responsibilities) ? req.body.responsibilities : []);
    res.status(200).json({ message: 'Job updated.' });
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

router.delete('/:id', (req, res) => {
  const intId = toInteger(req.params.id);

  if (!intId) {
    return res.status(400).json({ error: 'A valid job id is required.' });
  }

  try {
    const objResult = getDatabase().prepare('DELETE FROM jobs WHERE id = ?').run(intId);

    if (objResult.changes === 0) {
      return res.status(404).json({ error: 'Job not found.' });
    }

    res.status(200).json({ message: 'Job deleted.' });
  } catch (error) {
    sendDatabaseError(res, error);
  }
});

module.exports = router;
