const objState = {
  profile: {},
  jobs: [],
  skills: [],
  certifications: [],
  awards: [],
  savedResumes: [],
  resumeStyle: sessionStorage.getItem('resumeForgeResumeStyle') || 'classic',
  aiResumeData: null,
  selected: {
    jobs: new Set(),
    jobResponsibilities: new Set(),
    skills: new Set(),
    certifications: new Set(),
    awards: new Set()
  }
};

const objEndpoints = {
  jobs: '/api/routing/jobs',
  skills: '/api/routing/skills',
  certifications: '/api/routing/certifications',
  awards: '/api/routing/awards',
  savedResumes: '/api/routing/saved-resumes'
};

const getActiveViewId = () => document.querySelector('.app-view:not(.d-none)')?.id || 'profileView';

const refreshApplication = (strMessage) => {
  sessionStorage.setItem('resumeForgeActiveView', getActiveViewId());
  sessionStorage.setItem('resumeForgeFlashMessage', strMessage);
  window.location.reload();
};

const showError = (strMessage) => {
  Swal.fire({
    icon: 'error',
    title: 'Something needs attention',
    text: strMessage
  });
};

const showSuccess = (strMessage) => {
  Swal.fire({
    icon: 'success',
    title: 'Saved',
    text: strMessage,
    timer: 1100,
    showConfirmButton: false
  });
};

const apiRequest = async (strUrl, objOptions = {}) => {
  const objResponse = await fetch(strUrl, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...objOptions
  });

  const strResponseText = await objResponse.text();
  const objData = strResponseText ? JSON.parse(strResponseText) : {};

  if (!objResponse.ok) {
    throw new Error(objData.error || 'The request could not be completed.');
  }

  return objData;
};

const escapeHtml = (strValue) => String(strValue || '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const setAiResult = (strResultId, strTitle, strText, strFinishReason = '') => {
  const objResult = document.getElementById(strResultId);

  if (!objResult) {
    return;
  }

  const objCard = document.getElementById(`${strResultId}Card`);
  objResult.innerHTML = `
    <h3 class="h5">${escapeHtml(strTitle)}</h3>
    ${strFinishReason === 'MAX_TOKENS' ? '<div class="alert alert-warning py-2">Gemini reached its response limit. Try a shorter entry or run AI Review again.</div>' : ''}
    <div>${escapeHtml(strText).replaceAll('\n', '<br>')}</div>
  `;

  if (objCard) {
    objCard.classList.remove('d-none');
    objCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

const getFormObject = (objForm) => Object.fromEntries(new FormData(objForm).entries());

const resetForm = (strFormId) => {
  const objForm = document.getElementById(strFormId);
  objForm.reset();
  objForm.querySelector('[name="id"]').value = '';
};

const showView = (strViewId) => {
  document.querySelectorAll('.app-view').forEach((objView) => objView.classList.toggle('d-none', objView.id !== strViewId));
  document.querySelectorAll('[data-view]').forEach((objButton) => objButton.classList.toggle('active', objButton.dataset.view === strViewId));

  if (strViewId === 'resumeView') {
    renderSelections();
    renderResumePreview();
  }
};

const loadProfile = async () => {
  const arrProfile = await apiRequest('/api/routing/profile');
  objState.profile = arrProfile[0] || {};

  Object.entries(objState.profile).forEach(([strKey, strValue]) => {
    const objInput = document.querySelector(`#profileForm [name="${strKey}"]`);

    if (objInput) {
      objInput.value = strValue || '';
    }
  });

  renderProfilePreview();
};

const loadSettings = async () => {
  const arrSettings = await apiRequest('/api/routing/settings');
  const blnHasGeminiKey = arrSettings.some((objSetting) => objSetting.key === 'geminiApiKey' && objSetting.value === 'saved');
  const objResumeStyle = arrSettings.find((objSetting) => objSetting.key === 'resumeStyle');

  if (objResumeStyle?.value) {
    objState.resumeStyle = objResumeStyle.value;
    sessionStorage.setItem('resumeForgeResumeStyle', objState.resumeStyle);
  }

  const objResumeStyleSelect = document.getElementById('resumeStyle');

  if (objResumeStyleSelect) {
    objResumeStyleSelect.value = objState.resumeStyle;
  }

  document.getElementById('geminiKeyStatus').textContent = blnHasGeminiKey ? 'A Gemini API key is saved locally.' : 'No key saved yet.';
};

const loadCollections = async () => {
  const [arrJobs, arrSkills, arrCertifications, arrAwards, arrSavedResumes] = await Promise.all([
    apiRequest(objEndpoints.jobs),
    apiRequest(objEndpoints.skills),
    apiRequest(objEndpoints.certifications),
    apiRequest(objEndpoints.awards),
    apiRequest(objEndpoints.savedResumes)
  ]);

  objState.jobs = arrJobs;
  objState.skills = arrSkills;
  objState.certifications = arrCertifications;
  objState.awards = arrAwards;
  objState.savedResumes = arrSavedResumes;

  syncSelectionDefaults();
  renderCollectionLists();
};

const syncSelectionDefaults = () => {
  objState.jobs.forEach((objJob) => {
    objState.selected.jobs.add(objJob.id);
    objJob.responsibilities.forEach((objResponsibility) => objState.selected.jobResponsibilities.add(objResponsibility.id));
  });
  objState.skills.forEach((objSkill) => objState.selected.skills.add(objSkill.id));
  objState.certifications.forEach((objCertification) => objState.selected.certifications.add(objCertification.id));
  objState.awards.forEach((objAward) => objState.selected.awards.add(objAward.id));
};

const renderProfilePreview = () => {
  const objPreview = document.getElementById('profilePreview');

  if (objPreview) {
    objPreview.className = `resume-paper shadow-sm resume-style-${objState.resumeStyle}`;
    objPreview.innerHTML = buildResumeHtml();
  }
};

const buildResumeHtml = () => {
  const objResumeData = objState.aiResumeData || getSelectedResumeData();
  const objProfile = objResumeData.profile || {};
  const arrContact = [objProfile.email, objProfile.phone, objProfile.location, objProfile.website].filter(Boolean);
  const arrJobs = Array.isArray(objResumeData.jobs) ? objResumeData.jobs : [];
  const arrSkills = Array.isArray(objResumeData.skills) ? objResumeData.skills : [];
  const arrCertifications = Array.isArray(objResumeData.certifications) ? objResumeData.certifications : [];
  const arrAwards = Array.isArray(objResumeData.awards) ? objResumeData.awards : [];
  const objSkillsByCategory = arrSkills.reduce((objGroups, objSkill) => {
    objGroups[objSkill.category] = objGroups[objSkill.category] || [];
    objGroups[objSkill.category].push(objSkill);
    return objGroups;
  }, {});

  return `
    <header class="text-center mb-4">
      <h1 class="mb-1">${escapeHtml(objProfile.fullName || 'Your Name')}</h1>
      <p class="fs-5 mb-1">${escapeHtml(objProfile.headline || 'Resume headline')}</p>
      <p class="small mb-0">${escapeHtml(arrContact.join(' | '))}</p>
    </header>
    ${objProfile.summary ? `<section class="mb-3"><h2 class="resume-section-title pb-1">Summary</h2><p>${escapeHtml(objProfile.summary)}</p></section>` : ''}
    ${arrJobs.length ? `<section class="mb-3"><h2 class="resume-section-title pb-1">Experience</h2>${arrJobs.map((objJob) => `
      <article class="mb-3">
        <div class="d-flex flex-wrap justify-content-between gap-2">
          <div>
            <h3 class="h6 mb-0">${escapeHtml(objJob.title)}</h3>
            <p class="fw-semibold mb-1">${escapeHtml(objJob.company)}</p>
          </div>
          <p class="resume-item-meta small mb-0">${escapeHtml([objJob.location, [objJob.startDate, objJob.endDate].filter(Boolean).join(' - ')].filter(Boolean).join(' | '))}</p>
        </div>
        <ul>${(Array.isArray(objJob.responsibilities) ? objJob.responsibilities : []).map((objResponsibility) => `<li>${escapeHtml(typeof objResponsibility === 'string' ? objResponsibility : objResponsibility.detail)}</li>`).join('')}</ul>
      </article>
    `).join('')}</section>` : ''}
    ${arrSkills.length ? `<section class="mb-3"><h2 class="resume-section-title pb-1">Skills</h2>${Object.entries(objSkillsByCategory).map(([strCategory, arrCategorySkills]) => `
      <p class="mb-1"><strong>${escapeHtml(strCategory)}:</strong> ${arrCategorySkills.map((objSkill) => escapeHtml(objSkill.detail ? `${objSkill.name} (${objSkill.detail})` : objSkill.name)).join(', ')}</p>
    `).join('')}</section>` : ''}
    ${arrCertifications.length ? `<section class="mb-3"><h2 class="resume-section-title pb-1">Certifications</h2>${arrCertifications.map((objCertification) => `
      <p class="mb-1"><strong>${escapeHtml(objCertification.name)}</strong>, ${escapeHtml(objCertification.issuer)} ${escapeHtml(objCertification.dateEarned ? `| ${objCertification.dateEarned}` : '')}${objCertification.detail ? `<br>${escapeHtml(objCertification.detail)}` : ''}</p>
    `).join('')}</section>` : ''}
    ${arrAwards.length ? `<section class="mb-3"><h2 class="resume-section-title pb-1">Awards</h2>${arrAwards.map((objAward) => `
      <p class="mb-1"><strong>${escapeHtml(objAward.name)}</strong> ${escapeHtml(objAward.issuer ? `| ${objAward.issuer}` : '')} ${escapeHtml(objAward.dateReceived ? `| ${objAward.dateReceived}` : '')}${objAward.detail ? `<br>${escapeHtml(objAward.detail)}` : ''}</p>
    `).join('')}</section>` : ''}
  `;
};

const renderResumePreview = () => {
  const objPreview = document.getElementById('resumePreview');

  if (objPreview) {
    objPreview.className = `resume-paper shadow-sm resume-style-${objState.resumeStyle}`;
    objPreview.innerHTML = buildResumeHtml();
  }
};

const getSelectedResumeData = () => ({
  profile: objState.profile,
  jobs: objState.jobs
    .filter((objJob) => objState.selected.jobs.has(objJob.id))
    .map((objJob) => ({
      ...objJob,
      responsibilities: objJob.responsibilities.filter((objResponsibility) => objState.selected.jobResponsibilities.has(objResponsibility.id))
    })),
  skills: objState.skills.filter((objSkill) => objState.selected.skills.has(objSkill.id)),
  certifications: objState.certifications.filter((objCertification) => objState.selected.certifications.has(objCertification.id)),
  awards: objState.awards.filter((objAward) => objState.selected.awards.has(objAward.id))
});

const getResumeStyleDescriptor = () => {
  const objDescriptors = {
    classic: 'classic professional',
    modern: 'modern polished',
    compact: 'compact one-page'
  };

  return objDescriptors[objState.resumeStyle] || 'professional';
};

const getAiResumeSummary = (objResume, strFallback) => {
  if (!objResume) {
    return strFallback;
  }

  const arrNotes = Array.isArray(objResume.improvementNotes) ? objResume.improvementNotes : [];
  const strSummary = objResume.profile?.summary ? `Summary:\n${objResume.profile.summary}` : '';
  const strNotes = arrNotes.length ? `\n\nImprovement Notes:\n${arrNotes.map((strNote) => `- ${strNote}`).join('\n')}` : '';

  return `${strSummary}${strNotes}`.trim() || strFallback;
};

const renderCollectionLists = () => {
  renderJobsList();
  renderSimpleList('skills', 'skillsList', 'skillForm', ['category', 'name', 'detail']);
  renderSimpleList('certifications', 'certificationsList', 'certificationForm', ['name', 'issuer', 'dateEarned', 'detail']);
  renderSimpleList('awards', 'awardsList', 'awardForm', ['name', 'issuer', 'dateReceived', 'detail']);
  renderSavedResumesList();
  renderResumePreview();
};

const renderSavedResumesList = () => {
  const objList = document.getElementById('savedResumesList');

  if (!objList) {
    return;
  }

  objList.innerHTML = objState.savedResumes.length ? objState.savedResumes.map((objResume) => `
    <article class="card">
      <div class="card-body">
        <h3 class="h6">${escapeHtml(objResume.name)}</h3>
        <p class="small text-secondary mb-2">${escapeHtml(objResume.style)} | ${escapeHtml(objResume.createdAt)}</p>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-primary btn-sm" type="button" data-load-saved-resume="${objResume.id}">Load</button>
          <button class="btn btn-outline-danger btn-sm" type="button" data-delete-type="savedResumes" data-id="${objResume.id}">Delete</button>
        </div>
      </div>
    </article>
  `).join('') : '<p class="mb-0">No AI drafts saved yet.</p>';
};

const renderJobsList = () => {
  document.getElementById('jobsList').innerHTML = objState.jobs.map((objJob) => `
    <article class="col-12 col-lg-6">
      <div class="card h-100">
        <div class="card-header bg-white">
          <h3 class="h5 mb-0">${escapeHtml(objJob.title)}</h3>
        </div>
        <div class="card-body">
          <p class="mb-1 fw-semibold">${escapeHtml(objJob.company)}</p>
          <p class="card-subtitle small text-secondary mb-2">${escapeHtml([objJob.location, objJob.startDate, objJob.endDate].filter(Boolean).join(' | '))}</p>
          <ul class="mb-3">${objJob.responsibilities.map((objResponsibility) => `<li>${escapeHtml(objResponsibility.detail)}</li>`).join('')}</ul>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary btn-sm" type="button" data-edit-type="jobs" data-id="${objJob.id}">Edit</button>
            <button class="btn btn-outline-danger btn-sm" type="button" data-delete-type="jobs" data-id="${objJob.id}">Delete</button>
          </div>
        </div>
      </div>
    </article>
  `).join('');
};

const renderSimpleList = (strType, strListId, strFormId, arrFields) => {
  document.getElementById(strListId).innerHTML = objState[strType].map((objItem) => `
    <article class="col-12 col-lg-6">
      <div class="card h-100">
        <div class="card-header bg-white">
          <h3 class="h5 mb-0">${escapeHtml(objItem.name)}</h3>
        </div>
        <div class="card-body">
          <p class="mb-1 fw-semibold">${escapeHtml(objItem.category || objItem.issuer || '')}</p>
          <p class="card-subtitle small text-secondary mb-2">${escapeHtml(objItem.dateEarned || objItem.dateReceived || '')}</p>
          ${objItem.detail ? `<p class="card-text">${escapeHtml(objItem.detail)}</p>` : ''}
          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary btn-sm" type="button" data-edit-type="${strType}" data-form="${strFormId}" data-fields="${arrFields.join(',')}" data-id="${objItem.id}">Edit</button>
            <button class="btn btn-outline-danger btn-sm" type="button" data-delete-type="${strType}" data-id="${objItem.id}">Delete</button>
          </div>
        </div>
      </div>
    </article>
  `).join('');
};

const renderSelections = () => {
  const strJobs = objState.jobs.map((objJob) => `
    <div class="card">
      <div class="card-body">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="selectJob${objJob.id}" aria-label="Include ${escapeHtml(objJob.title)}" data-select-group="jobs" data-id="${objJob.id}" ${objState.selected.jobs.has(objJob.id) ? 'checked' : ''}>
          <label class="form-check-label fw-semibold" for="selectJob${objJob.id}">${escapeHtml(objJob.title)} at ${escapeHtml(objJob.company)}</label>
        </div>
        <div class="ms-4 mt-2">${objJob.responsibilities.map((objResponsibility) => `
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="selectResponsibility${objResponsibility.id}" aria-label="Include responsibility" data-select-group="jobResponsibilities" data-id="${objResponsibility.id}" ${objState.selected.jobResponsibilities.has(objResponsibility.id) ? 'checked' : ''}>
            <label class="form-check-label small" for="selectResponsibility${objResponsibility.id}">${escapeHtml(objResponsibility.detail)}</label>
          </div>
        `).join('')}</div>
      </div>
    </div>
  `).join('');

  document.getElementById('selectionPanel').innerHTML = `
    <div><h3 class="h5">Jobs</h3><div class="vstack gap-2">${strJobs || '<p>No jobs saved yet.</p>'}</div></div>
    ${buildSelectionGroup('Skills', 'skills', objState.skills, 'name')}
    ${buildSelectionGroup('Certifications', 'certifications', objState.certifications, 'name')}
    ${buildSelectionGroup('Awards', 'awards', objState.awards, 'name')}
  `;
};

const buildSelectionGroup = (strTitle, strGroup, arrItems, strLabelField) => `
  <div>
    <h3 class="h5">${strTitle}</h3>
    <div class="card">
      <div class="card-body">
        ${arrItems.length ? arrItems.map((objItem) => `
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="select${strGroup}${objItem.id}" aria-label="Include ${escapeHtml(objItem[strLabelField])}" data-select-group="${strGroup}" data-id="${objItem.id}" ${objState.selected[strGroup].has(objItem.id) ? 'checked' : ''}>
            <label class="form-check-label" for="select${strGroup}${objItem.id}">${escapeHtml(objItem[strLabelField])}</label>
          </div>
        `).join('') : '<p class="mb-0">Nothing saved yet.</p>'}
      </div>
    </div>
  </div>
`;

const saveProfile = async (event) => {
  event.preventDefault();
  const objBody = getFormObject(event.currentTarget);
  await apiRequest('/api/routing/profile', {
    method: 'PUT',
    body: JSON.stringify(objBody)
  });
  refreshApplication('Profile updated.');
};

const saveSettings = async (event) => {
  event.preventDefault();
  const objBody = getFormObject(event.currentTarget);
  await apiRequest('/api/routing/settings', {
    method: 'PUT',
    body: JSON.stringify(objBody)
  });
  refreshApplication('Settings updated.');
};

const saveCollectionItem = async (event, strType, fnBuildBody) => {
  event.preventDefault();
  const objBody = fnBuildBody(getFormObject(event.currentTarget));
  const strId = objBody.id;
  delete objBody.id;

  await apiRequest(strId ? `${objEndpoints[strType]}/${strId}` : objEndpoints[strType], {
    method: strId ? 'PUT' : 'POST',
    body: JSON.stringify(objBody)
  });

  refreshApplication('Entry saved.');
};

const requestAiSuggestion = async (objButton) => {
  const objInput = document.getElementById(objButton.dataset.aiTarget);
  const strText = objInput.value.trim();

  if (!strText) {
    showError('Enter text first so Gemini has something to review.');
    return;
  }

  objButton.disabled = true;
  objButton.textContent = 'Reviewing...';

  try {
    const objResult = await apiRequest('/api/routing/ai-suggestions', {
      method: 'POST',
      body: JSON.stringify({
        text: strText,
        section: objButton.dataset.aiSection
      })
    });

    setAiResult(objButton.dataset.aiResult, 'Suggested Revision', objResult.suggestion, objResult.finishReason);
  } finally {
    objButton.disabled = false;
    objButton.textContent = 'AI Review';
  }
};

const buildResumeWithAi = async (objButton) => {
  objButton.disabled = true;
  objButton.textContent = 'Building...';

  try {
    const objResult = await apiRequest('/api/routing/ai-resume-builder', {
      method: 'POST',
      body: JSON.stringify({
        style: objState.resumeStyle,
        descriptor: getResumeStyleDescriptor(),
        resumeData: getSelectedResumeData()
      })
    });

    if (objResult.resume) {
      objState.aiResumeData = objResult.resume;
      renderResumePreview();
      setAiResult('resumeAiResult', 'AI Resume Draft', `${getAiResumeSummary(objResult.resume, objResult.draft)}\n\nThe formatted AI resume is now shown in the Preview card. Use Print or Save PDF to download it, or Save AI Draft to store it locally.`);
    } else {
      setAiResult('resumeAiResult', 'AI Resume Draft', `${objResult.draft}\n\nGemini did not return the structured format needed for the formatted preview. Run Build With AI again.`);
    }
  } finally {
    objButton.disabled = false;
    objButton.textContent = 'Build With AI';
  }
};

const saveAiResume = async () => {
  if (!objState.aiResumeData) {
    showError('Build an AI resume draft before saving it.');
    return;
  }

  const objNameResult = await Swal.fire({
    title: 'Save AI Draft',
    input: 'text',
    inputLabel: 'Draft name',
    inputValue: `AI ${getResumeStyleDescriptor()} resume`,
    showCancelButton: true,
    confirmButtonText: 'Save'
  });

  if (!objNameResult.isConfirmed) {
    return;
  }

  const strName = String(objNameResult.value || '').trim();

  if (!strName) {
    showError('A draft name is required.');
    return;
  }

  await apiRequest(objEndpoints.savedResumes, {
    method: 'POST',
    body: JSON.stringify({
      name: strName,
      style: objState.resumeStyle,
      resumeData: objState.aiResumeData
    })
  });

  objState.savedResumes = await apiRequest(objEndpoints.savedResumes);
  renderSavedResumesList();
  showSuccess('AI draft saved.');
};

const loadSavedResume = (intId) => {
  const objResume = objState.savedResumes.find((objSavedResume) => objSavedResume.id === intId);

  if (!objResume) {
    showError('Saved resume could not be found.');
    return;
  }

  objState.resumeStyle = objResume.style || objState.resumeStyle;
  objState.aiResumeData = objResume.resumeData;

  const objResumeStyleSelect = document.getElementById('resumeStyle');

  if (objResumeStyleSelect) {
    objResumeStyleSelect.value = objState.resumeStyle;
  }

  renderResumePreview();
  setAiResult('resumeAiResult', 'Loaded AI Resume Draft', `${objResume.name} is loaded in the Preview card. Use Print or Save PDF to download it.`);
};

const editItem = (strType, intId, strFormId, arrFields) => {
  const objItem = objState[strType].find((objEntry) => objEntry.id === intId);
  const objForm = document.getElementById(strFormId);

  if (!objItem) {
    return;
  }

  objForm.querySelector('[name="id"]').value = objItem.id;
  arrFields.forEach((strField) => {
    objForm.querySelector(`[name="${strField}"]`).value = objItem[strField] || '';
  });
};

const editJob = (intId) => {
  const objJob = objState.jobs.find((objEntry) => objEntry.id === intId);
  const objForm = document.getElementById('jobForm');

  if (!objJob) {
    return;
  }

  ['id', 'company', 'title', 'location', 'startDate', 'endDate'].forEach((strField) => {
    objForm.querySelector(`[name="${strField}"]`).value = objJob[strField] || '';
  });
  objForm.querySelector('[name="responsibilities"]').value = objJob.responsibilities.map((objResponsibility) => objResponsibility.detail).join('\n');
};

const deleteItem = async (strType, intId) => {
  const objConfirmation = await Swal.fire({
    icon: 'warning',
    title: 'Delete this entry?',
    text: 'This cannot be undone.',
    showCancelButton: true,
    confirmButtonText: 'Delete'
  });

  if (!objConfirmation.isConfirmed) {
    return;
  }

  await apiRequest(`${objEndpoints[strType]}/${intId}`, { method: 'DELETE' });
  refreshApplication('Entry deleted.');
};

document.addEventListener('click', async (event) => {
  const objTarget = event.target;

  try {
    if (objTarget.matches('[data-view]')) {
      showView(objTarget.dataset.view);
    } else if (objTarget.matches('[data-ai-target]')) {
      await requestAiSuggestion(objTarget);
    } else if (objTarget.id === 'buildResumeWithAiButton') {
      await buildResumeWithAi(objTarget);
    } else if (objTarget.id === 'saveAiResumeButton') {
      await saveAiResume();
    } else if (objTarget.matches('[data-load-saved-resume]')) {
      loadSavedResume(Number(objTarget.dataset.loadSavedResume));
    } else if (objTarget.matches('[data-reset-form]')) {
      resetForm(objTarget.dataset.resetForm);
    } else if (objTarget.matches('[data-edit-type="jobs"]')) {
      editJob(Number(objTarget.dataset.id));
    } else if (objTarget.matches('[data-edit-type]')) {
      editItem(objTarget.dataset.editType, Number(objTarget.dataset.id), objTarget.dataset.form, objTarget.dataset.fields.split(','));
    } else if (objTarget.matches('[data-delete-type]')) {
      await deleteItem(objTarget.dataset.deleteType, Number(objTarget.dataset.id));
    } else if (objTarget.id === 'printResumeButton') {
      window.print();
    } else if (objTarget.id === 'librariesButton') {
      Swal.fire('Attributions', 'ResumeForge uses Bootstrap, SweetAlert2, Express, dotenv, and the experimental Node SQLite module. All browser libraries are stored locally in this project.', 'info');
    }
  } catch (error) {
    showError(error.message);
  }
});

document.addEventListener('change', async (event) => {
  const objTarget = event.target;

  if (!objTarget.matches('[data-select-group]')) {
    if (objTarget.id === 'resumeStyle') {
      objState.resumeStyle = objTarget.value;
      objState.aiResumeData = null;
      sessionStorage.setItem('resumeForgeResumeStyle', objState.resumeStyle);
      renderProfilePreview();
      renderResumePreview();

      try {
        await apiRequest('/api/routing/settings', {
          method: 'PUT',
          body: JSON.stringify({
            resumeStyle: objState.resumeStyle
          })
        });
      } catch (error) {
        showError(error.message);
      }
    }

    return;
  }

  const strGroup = objTarget.dataset.selectGroup;
  const intId = Number(objTarget.dataset.id);

  if (objTarget.checked) {
    objState.selected[strGroup].add(intId);
  } else {
    objState.selected[strGroup].delete(intId);
  }

  objState.aiResumeData = null;
  renderResumePreview();
});

document.getElementById('profileForm').addEventListener('submit', async (event) => {
  try {
    await saveProfile(event);
  } catch (error) {
    showError(error.message);
  }
});

document.getElementById('settingsForm').addEventListener('submit', async (event) => {
  try {
    await saveSettings(event);
  } catch (error) {
    showError(error.message);
  }
});

document.getElementById('jobForm').addEventListener('submit', async (event) => {
  try {
    await saveCollectionItem(event, 'jobs', (objForm) => ({
      ...objForm,
      responsibilities: objForm.responsibilities.split('\n')
    }));
  } catch (error) {
    showError(error.message);
  }
});

document.getElementById('skillForm').addEventListener('submit', async (event) => {
  try {
    await saveCollectionItem(event, 'skills', (objForm) => objForm);
  } catch (error) {
    showError(error.message);
  }
});

document.getElementById('certificationForm').addEventListener('submit', async (event) => {
  try {
    await saveCollectionItem(event, 'certifications', (objForm) => objForm);
  } catch (error) {
    showError(error.message);
  }
});

document.getElementById('awardForm').addEventListener('submit', async (event) => {
  try {
    await saveCollectionItem(event, 'awards', (objForm) => objForm);
  } catch (error) {
    showError(error.message);
  }
});

const initializeApp = async () => {
  try {
    await Promise.all([loadProfile(), loadSettings(), loadCollections()]);
    showView(sessionStorage.getItem('resumeForgeActiveView') || 'profileView');

    const strFlashMessage = sessionStorage.getItem('resumeForgeFlashMessage');

    if (strFlashMessage) {
      sessionStorage.removeItem('resumeForgeFlashMessage');
      showSuccess(strFlashMessage);
    }
  } catch (error) {
    showError(error.message);
  }
};

initializeApp();
