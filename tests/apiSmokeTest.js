const assert = require('assert');

const strBaseUrl = 'http://localhost:3000';

const requestJson = async (strPath, objOptions = {}) => {
  const objResponse = await fetch(`${strBaseUrl}${strPath}`, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...objOptions
  });

  const objData = await objResponse.json();
  return { objResponse, objData };
};

const run = async () => {
  const arrGetRoutes = [
    '/api/routing/profile',
    '/api/routing/jobs',
    '/api/routing/skills',
    '/api/routing/certifications',
    '/api/routing/awards',
    '/api/routing/saved-resumes',
    '/api/routing/settings'
  ];

  for (const strRoute of arrGetRoutes) {
    const { objResponse, objData } = await requestJson(strRoute);
    assert.strictEqual(objResponse.status, 200, `${strRoute} should return 200`);
    assert.ok(Array.isArray(objData), `${strRoute} should return a JSON array`);
  }

  const { objResponse } = await requestJson('/api/routing/jobs', {
    method: 'POST',
    body: JSON.stringify({ company: '', title: '' })
  });

  assert.strictEqual(objResponse.status, 400, 'POST /jobs should validate required fields');
  console.log('API smoke tests passed.');
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
