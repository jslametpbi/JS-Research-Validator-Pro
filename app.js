(() => {
  const STORAGE_KEY = 'jsResearchValidatorPro.v1';
  const PIN_KEY = 'jsResearchValidatorPro.pin';
  const DEFAULT_PIN = 'JS2026';

  const workflowSteps = [
    'Create Project',
    'Upload Instrument',
    'Expert Validation',
    'Revise Items',
    'Pilot Testing',
    'Reliability/Validity Calculation',
    'Ethics Check',
    'Methodology Check',
    'Manuscript Check',
    'Publication Readiness Report',
    'Download Research Validity Passport'
  ];

  const ethicsItems = [
    ['Participant information sheet prepared', 'Researchers clearly explain aim, procedures, duration, benefits, risks, and voluntary participation.'],
    ['Informed consent form prepared', 'Consent includes withdrawal rights and contact details for questions or complaints.'],
    ['Anonymity and confidentiality protected', 'Names, IDs, voices, images, and institutional traces are managed responsibly.'],
    ['Data storage plan documented', 'The project states where data are stored, who can access them, and when they will be deleted.'],
    ['Risk level identified', 'Low, moderate, or high risk is justified with mitigation strategies.'],
    ['Vulnerable participants protected', 'Children, students, patients, employees, and dependent participants receive special safeguards.'],
    ['AI-use declaration prepared', 'Any use of AI for design, analysis, writing, translation, or editing is transparently reported.'],
    ['Conflict of interest statement prepared', 'Financial, supervisory, institutional, or authorship conflicts are disclosed.'],
    ['Permission for instruments obtained', 'Copyrighted, adapted, or translated instruments have proper permission or citation.'],
    ['Ethical clearance pathway identified', 'The study knows whether full review, expedited review, or exemption is required.']
  ];

  const methodologyItems = [
    ['Research gap is explicit', 'The problem, gap, novelty, and contribution are clearly connected.'],
    ['Research questions match the design', 'Questions are answerable through the chosen quantitative, qualitative, mixed, R&D, or design-based approach.'],
    ['Participants match the research purpose', 'Population, sampling, inclusion criteria, and context are justified.'],
    ['Instrument matches construct', 'Each item or dimension directly measures the intended variable or phenomenon.'],
    ['Procedure is transparent', 'Data collection stages, timing, and implementation details are replicable.'],
    ['Analysis matches the data type', 'Statistical tests, coding, thematic analysis, or mixed-methods integration fit the evidence.'],
    ['Validity and trustworthiness are addressed', 'The study explains reliability, content validity, triangulation, audit trail, or member checking.'],
    ['Claims are limited to evidence', 'The discussion does not overgeneralize beyond data and design.'],
    ['Limitations are honest', 'Sampling, context, measurement, and analysis limitations are acknowledged.'],
    ['Contribution is field-specific', 'The manuscript explains how the findings advance theory, pedagogy, method, policy, or practice.']
  ];

  const manuscriptItems = [
    ['Title is precise and journal-fit', 'The title signals scope, method, context, and contribution without being too long.'],
    ['Abstract is structured and complete', 'The abstract includes purpose, method, participants/data, findings, and implications.'],
    ['Introduction builds a strong argument', 'It moves from problem to gap to novelty to research questions.'],
    ['Literature review is critical', 'It synthesizes debates instead of listing previous studies.'],
    ['Method is transparent', 'Design, participants, instruments, data collection, and analysis are detailed.'],
    ['Results are evidence-based', 'Tables, statistics, themes, and excerpts are clearly reported.'],
    ['Discussion is analytical', 'Findings are interpreted, compared with literature, and tied to contribution.'],
    ['References follow target style', 'All citations are complete, consistent, current, and relevant.'],
    ['Reporting guideline checked', 'CONSORT, PRISMA, STROBE, COREQ, SRQR, or another relevant checklist is considered.'],
    ['Publication declarations prepared', 'Ethics, funding, conflict of interest, data availability, AI use, and CRediT roles are ready.']
  ];

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  let state = loadState();
  let activeProjectId = state.activeProjectId || null;

  function uid(prefix = 'id') {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function hashPin(pin) {
    return btoa(unescape(encodeURIComponent(`rvp:${pin}:2026`)));
  }

  function getStoredPinHash() {
    const stored = localStorage.getItem(PIN_KEY);
    if (stored) return stored;
    const defaultHash = hashPin(DEFAULT_PIN);
    localStorage.setItem(PIN_KEY, defaultHash);
    return defaultHash;
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        projects: [],
        activeProjectId: null,
        createdAt: new Date().toISOString()
      };
    }
    try {
      const parsed = JSON.parse(raw);
      parsed.projects = Array.isArray(parsed.projects) ? parsed.projects : [];
      return parsed;
    } catch (error) {
      console.warn('State reset because stored JSON was invalid.', error);
      return { projects: [], activeProjectId: null, createdAt: new Date().toISOString() };
    }
  }

  function saveState() {
    state.activeProjectId = activeProjectId;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function toast(message) {
    const box = $('#toast');
    box.textContent = message;
    box.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => box.classList.remove('show'), 2800);
  }

  function currentProject() {
    return state.projects.find((project) => project.id === activeProjectId) || null;
  }

  function newProjectDefaults(data = {}) {
    return {
      id: data.id || uid('project'),
      title: data.title || '',
      field: data.field || '',
      design: data.design || 'Sequential Mixed-Methods',
      sample: data.sample || '',
      journal: data.journal || '',
      status: data.status || 'Drafting',
      purpose: data.purpose || '',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      workflow: data.workflow || workflowSteps.map((name, index) => ({ name, done: index === 0 ? false : false })),
      instrument: data.instrument || null,
      items: data.items || [],
      experts: data.experts || [{ id: uid('expert'), name: 'Expert 1', role: 'Validator' }],
      ratings: data.ratings || {},
      revisionNotes: data.revisionNotes || {},
      revisedItems: data.revisedItems || {},
      pilot: data.pilot || { n: '', csv: '', alpha: null, items: 0, cases: 0 },
      ethics: data.ethics || boolArray(ethicsItems.length, false),
      methodology: data.methodology || boolArray(methodologyItems.length, false),
      manuscript: data.manuscript || boolArray(manuscriptItems.length, false)
    };
  }

  function boolArray(length, value) {
    return Array.from({ length }, () => value);
  }

  function ensureActiveProject() {
    if (state.projects.length === 0) {
      const demo = newProjectDefaults({
        title: 'Demo Research Validation Project',
        field: 'English Language Teaching / Research Methodology',
        design: 'Sequential Mixed-Methods',
        sample: 'Pilot participants and expert validators',
        journal: 'Publication-readiness prototype',
        status: 'Under Validation',
        purpose: 'This demo project shows how the app validates instruments, methodology, ethics, pilot reliability, and manuscript readiness.'
      });
      state.projects.push(demo);
      activeProjectId = demo.id;
      saveState();
    } else if (!activeProjectId || !state.projects.some((project) => project.id === activeProjectId)) {
      activeProjectId = state.projects[0].id;
      saveState();
    }
  }

  function setStep(project, stepName, done = true) {
    const step = project.workflow.find((item) => item.name === stepName);
    if (step) step.done = done;
  }

  function percentage(count, total) {
    return total ? Math.round((count / total) * 100) : 0;
  }

  function getScores(project) {
    if (!project) {
      return { instrument: 0, reliability: 0, ethics: 0, methodology: 0, manuscript: 0, publication: 0, aiken: 0, cvi: 0, agreement: 0 };
    }
    const validation = calculateValidation(project);
    const instrument = Math.round(((validation.aiken * 0.55) + (validation.cvi * 0.45)) * 100) || 0;
    const alpha = Number(project.pilot?.alpha || 0);
    const reliability = alpha >= .9 ? 100 : alpha >= .8 ? 88 : alpha >= .7 ? 76 : alpha >= .6 ? 62 : alpha > 0 ? 45 : 0;
    const ethics = percentage((project.ethics || []).filter(Boolean).length, ethicsItems.length);
    const methodology = percentage((project.methodology || []).filter(Boolean).length, methodologyItems.length);
    const manuscript = percentage((project.manuscript || []).filter(Boolean).length, manuscriptItems.length);
    const publication = Math.round((instrument * .24) + (reliability * .16) + (ethics * .2) + (methodology * .22) + (manuscript * .18));
    return { instrument, reliability, ethics, methodology, manuscript, publication, ...validation };
  }

  function ratingKey(itemId, expertId, dimension) {
    return `${itemId}::${expertId}::${dimension}`;
  }

  function getRating(project, itemId, expertId, dimension = 'relevance') {
    return Number(project.ratings?.[ratingKey(itemId, expertId, dimension)] || 0);
  }

  function calculateValidation(project) {
    const items = project?.items || [];
    const experts = project?.experts || [];
    if (!items.length || !experts.length) return { aiken: 0, cvi: 0, agreement: 0, itemStats: [] };
    const low = 1;
    const high = 4;
    const itemStats = items.map((item) => {
      const relevanceRatings = experts.map((expert) => getRating(project, item.id, expert.id, 'relevance')).filter((value) => value > 0);
      const clarityRatings = experts.map((expert) => getRating(project, item.id, expert.id, 'clarity')).filter((value) => value > 0);
      const allRatings = relevanceRatings.concat(clarityRatings);
      const n = relevanceRatings.length;
      const aiken = n ? relevanceRatings.reduce((sum, score) => sum + (score - low), 0) / (n * (high - low)) : 0;
      const cvi = n ? relevanceRatings.filter((score) => score >= 3).length / n : 0;
      const agreement = allRatings.length ? allRatings.filter((score) => score >= 3).length / allRatings.length : 0;
      return { itemId: item.id, aiken, cvi, agreement };
    });
    const aiken = average(itemStats.map((item) => item.aiken));
    const cvi = average(itemStats.map((item) => item.cvi));
    const agreement = average(itemStats.map((item) => item.agreement));
    return { aiken, cvi, agreement, itemStats };
  }

  function average(values) {
    const valid = values.filter((value) => Number.isFinite(value));
    return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : 0;
  }

  function safe(text) {
    return String(text ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function renderAll() {
    ensureActiveProject();
    renderProjectSelect();
    renderDashboard();
    renderProjectForm();
    renderProjectCards();
    renderInstrument();
    renderItemsTable();
    renderExpertList();
    renderValidationMatrix();
    renderRevisionBoard();
    renderPilot();
    renderChecklist('ethics');
    renderChecklist('methodology');
    renderChecklist('manuscript');
    renderReport();
    updateTitle();
  }

  function renderProjectSelect() {
    const select = $('#activeProject');
    select.innerHTML = state.projects.map((project) => `<option value="${project.id}" ${project.id === activeProjectId ? 'selected' : ''}>${safe(project.title || 'Untitled Project')}</option>`).join('');
  }

  function renderDashboard() {
    const project = currentProject();
    const scores = getScores(project);
    $('#metricProjects').textContent = state.projects.length;
    $('#metricInstrument').textContent = `${scores.instrument}%`;
    $('#metricEthics').textContent = `${scores.ethics}%`;
    $('#metricPublication').textContent = `${scores.publication}%`;
    $('#heroScore').textContent = `${scores.publication}%`;
    $('.readiness-ring').style.background = `conic-gradient(var(--good) ${scores.publication * 3.6}deg, rgba(255,255,255,.12) 0deg)`;
    $('#barInstrument').value = scores.instrument;
    $('#barReliability').value = scores.reliability;
    $('#barEthics').value = scores.ethics;
    $('#barMethodology').value = scores.methodology;
    $('#barManuscript').value = scores.manuscript;

    const workflow = project?.workflow || [];
    $('#workflowList').innerHTML = workflow.map((step, index) => `
      <div class="workflow-item ${step.done ? 'done' : ''}">
        <i class="dot"></i>
        <span>${index + 1}. ${safe(step.name)}</span>
        <small>${step.done ? 'Done' : 'Pending'}</small>
      </div>`).join('');

    const weakest = Object.entries({ Instrument: scores.instrument, Reliability: scores.reliability, Ethics: scores.ethics, Methodology: scores.methodology, Manuscript: scores.manuscript }).sort((a, b) => a[1] - b[1])[0];
    const status = scores.publication >= 85 ? 'Strong and close to submission-ready.' : scores.publication >= 70 ? 'Promising but still needs targeted refinement.' : scores.publication >= 50 ? 'Developing; several validation areas require revision.' : 'Early-stage; complete the core workflow first.';
    $('#adviceBox').innerHTML = `<strong>${status}</strong><br>The weakest area is <b>${weakest[0]}</b> (${weakest[1]}%). Prioritize this module before downloading the final passport.`;
  }

  function renderProjectForm() {
    const project = currentProject();
    $('#projectId').value = project?.id || '';
    $('#projectTitle').value = project?.title || '';
    $('#projectField').value = project?.field || '';
    $('#projectDesign').value = project?.design || 'Sequential Mixed-Methods';
    $('#projectSample').value = project?.sample || '';
    $('#projectJournal').value = project?.journal || '';
    $('#projectStatus').value = project?.status || 'Drafting';
    $('#projectPurpose').value = project?.purpose || '';
  }

  function renderProjectCards() {
    $('#projectCards').innerHTML = state.projects.map((project) => {
      const scores = getScores(project);
      return `<div class="project-card">
        <h4>${safe(project.title || 'Untitled Project')}</h4>
        <p><b>Design:</b> ${safe(project.design || '-')}</p>
        <p><b>Field:</b> ${safe(project.field || '-')}</p>
        <p><b>Status:</b> ${safe(project.status || '-')}</p>
        <p><b>Readiness:</b> ${scores.publication}%</p>
        <div class="card-actions">
          <button class="mini-btn soft" data-open-project="${project.id}">Open</button>
          <button class="mini-btn ghost" data-duplicate-project="${project.id}">Duplicate</button>
          <button class="mini-btn ghost danger" data-delete-project="${project.id}">Delete</button>
        </div>
      </div>`;
    }).join('');
  }

  function renderInstrument() {
    const project = currentProject();
    const instrument = project?.instrument || {};
    $('#instrumentName').value = instrument.name || '';
    $('#instrumentType').value = instrument.type || 'Questionnaire';
    $('#instrumentConstruct').value = instrument.construct || '';
    $('#scalePoints').value = instrument.scalePoints || '4';
    $('#instrumentDescription').value = instrument.description || '';
  }

  function renderItemsTable() {
    const project = currentProject();
    const items = project?.items || [];
    if (!items.length) {
      $('#itemsTable').innerHTML = `<thead><tr><th>Items</th></tr></thead><tbody><tr><td>No items yet. Add items manually or use sample items.</td></tr></tbody>`;
      return;
    }
    $('#itemsTable').innerHTML = `
      <thead><tr><th>Code</th><th>Construct</th><th>Item / Descriptor</th><th>Action</th></tr></thead>
      <tbody>${items.map((item) => `<tr>
        <td><input value="${safe(item.code)}" data-item-edit="${item.id}" data-field="code" /></td>
        <td><input value="${safe(item.construct)}" data-item-edit="${item.id}" data-field="construct" /></td>
        <td><textarea rows="2" data-item-edit="${item.id}" data-field="text">${safe(item.text)}</textarea></td>
        <td><button class="mini-btn ghost danger" data-delete-item="${item.id}">Delete</button></td>
      </tr>`).join('')}</tbody>`;
  }

  function renderExpertList() {
    const project = currentProject();
    const experts = project?.experts || [];
    $('#expertList').innerHTML = experts.map((expert) => `
      <div class="expert-chip">
        <input value="${safe(expert.name)}" data-expert-edit="${expert.id}" data-field="name" />
        <input value="${safe(expert.role || '')}" data-expert-edit="${expert.id}" data-field="role" />
        <button class="ghost mini-btn" data-delete-expert="${expert.id}">×</button>
      </div>`).join('');
  }

  function renderValidationMatrix() {
    const project = currentProject();
    const items = project?.items || [];
    const experts = project?.experts || [];
    if (!items.length || !experts.length) {
      $('#validationMatrix').innerHTML = `<thead><tr><th>Validation Matrix</th></tr></thead><tbody><tr><td>Add instrument items and at least one expert validator.</td></tr></tbody>`;
    } else {
      const headers = experts.map((expert) => `<th colspan="2">${safe(expert.name)}<br><small>Relevance / Clarity</small></th>`).join('');
      const rows = items.map((item) => `
        <tr>
          <td><b>${safe(item.code)}</b><br>${safe(item.text)}</td>
          ${experts.map((expert) => `
            <td>
              <select data-rating="${item.id}" data-expert="${expert.id}" data-dimension="relevance">${ratingOptions(getRating(project, item.id, expert.id, 'relevance'))}</select>
            </td>
            <td>
              <select data-rating="${item.id}" data-expert="${expert.id}" data-dimension="clarity">${ratingOptions(getRating(project, item.id, expert.id, 'clarity'))}</select>
            </td>`).join('')}
        </tr>`).join('');
      $('#validationMatrix').innerHTML = `<thead><tr><th>Item</th>${headers}</tr></thead><tbody>${rows}</tbody>`;
    }
    const stats = calculateValidation(project);
    $('#aikenResult').textContent = stats.aiken.toFixed(2);
    $('#cviResult').textContent = stats.cvi.toFixed(2);
    $('#agreementResult').textContent = `${Math.round(stats.agreement * 100)}%`;
    $('#instrumentDecision').textContent = decisionInstrument(stats);
  }

  function ratingOptions(selected) {
    return [0, 1, 2, 3, 4].map((value) => `<option value="${value}" ${Number(selected) === value ? 'selected' : ''}>${value === 0 ? '-' : value}</option>`).join('');
  }

  function decisionInstrument(stats) {
    if (stats.aiken >= .80 && stats.cvi >= .80) return 'Valid';
    if (stats.aiken >= .70 && stats.cvi >= .70) return 'Minor Revision';
    if (stats.aiken > 0 || stats.cvi > 0) return 'Major Revision';
    return 'Not Ready';
  }

  function renderRevisionBoard() {
    const project = currentProject();
    const items = project?.items || [];
    const stats = calculateValidation(project);
    if (!items.length) {
      $('#revisionBoard').innerHTML = '<div class="note-box">No instrument items available. Add items first.</div>';
      return;
    }
    $('#revisionBoard').innerHTML = items.map((item) => {
      const itemStat = stats.itemStats.find((stat) => stat.itemId === item.id) || { aiken: 0, cvi: 0 };
      const quality = itemStat.aiken >= .8 && itemStat.cvi >= .8 ? 'good' : itemStat.aiken >= .7 && itemStat.cvi >= .7 ? 'warn' : 'bad';
      const label = quality === 'good' ? 'Strong' : quality === 'warn' ? 'Revise Minor' : 'Revise Major';
      return `<div class="revision-card ${quality}">
        <div>
          <span class="badge ${quality}">${label} • V=${itemStat.aiken.toFixed(2)} • CVI=${itemStat.cvi.toFixed(2)}</span>
          <h4>${safe(item.code)} — ${safe(item.construct)}</h4>
          <p>${safe(item.text)}</p>
          <textarea rows="3" data-revision-note="${item.id}" placeholder="Write expert feedback, revision action, and improved item wording.">${safe(project.revisionNotes[item.id] || '')}</textarea>
        </div>
        <label><input type="checkbox" data-revised="${item.id}" ${project.revisedItems[item.id] ? 'checked' : ''} /> Mark revised</label>
      </div>`;
    }).join('');
  }

  function renderPilot() {
    const project = currentProject();
    $('#pilotN').value = project?.pilot?.n || '';
    $('#pilotCsv').value = project?.pilot?.csv || '';
    $('#alphaResult').textContent = Number(project?.pilot?.alpha || 0).toFixed(2);
    $('#pilotItemsResult').textContent = project?.pilot?.items || 0;
    $('#pilotCasesResult').textContent = project?.pilot?.cases || 0;
    $('#reliabilityDecision').textContent = reliabilityDecision(Number(project?.pilot?.alpha || 0));
  }

  function reliabilityDecision(alpha) {
    if (alpha >= .9) return 'Excellent';
    if (alpha >= .8) return 'Good';
    if (alpha >= .7) return 'Acceptable';
    if (alpha >= .6) return 'Questionable';
    if (alpha > 0) return 'Revise Instrument';
    return 'No Data';
  }

  function parseCsvMatrix(csv) {
    return String(csv || '')
      .trim()
      .split(/\n+/)
      .map((row) => row.split(/[;,\t,]+/).map((value) => Number(value.trim())).filter((value) => Number.isFinite(value)))
      .filter((row) => row.length > 0);
  }

  function variance(values) {
    if (values.length <= 1) return 0;
    const mean = average(values);
    return values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (values.length - 1);
  }

  function cronbachAlpha(matrix) {
    if (!matrix.length) return { alpha: 0, items: 0, cases: 0 };
    const itemCount = Math.min(...matrix.map((row) => row.length));
    const clean = matrix.filter((row) => row.length >= itemCount).map((row) => row.slice(0, itemCount));
    const cases = clean.length;
    if (itemCount < 2 || cases < 2) return { alpha: 0, items: itemCount, cases };
    const itemVars = [];
    for (let col = 0; col < itemCount; col++) {
      itemVars.push(variance(clean.map((row) => row[col])));
    }
    const totalScores = clean.map((row) => row.reduce((sum, value) => sum + value, 0));
    const totalVar = variance(totalScores);
    const alpha = totalVar === 0 ? 0 : (itemCount / (itemCount - 1)) * (1 - (itemVars.reduce((sum, value) => sum + value, 0) / totalVar));
    return { alpha: Math.max(0, Math.min(1, alpha)), items: itemCount, cases };
  }

  function renderChecklist(type) {
    const project = currentProject();
    const map = {
      ethics: { data: ethicsItems, values: project?.ethics || [], element: '#ethicsChecklist' },
      methodology: { data: methodologyItems, values: project?.methodology || [], element: '#methodologyChecklist' },
      manuscript: { data: manuscriptItems, values: project?.manuscript || [], element: '#manuscriptChecklist' }
    };
    const cfg = map[type];
    const score = percentage(cfg.values.filter(Boolean).length, cfg.data.length);
    $(cfg.element).innerHTML = cfg.data.map(([title, description], index) => `
      <div class="check-card">
        <label><input type="checkbox" data-checklist="${type}" data-index="${index}" ${cfg.values[index] ? 'checked' : ''} /> <span>${safe(title)}</span></label>
        <p>${safe(description)}</p>
      </div>`).join('') + `<div class="check-score full-span">${type[0].toUpperCase() + type.slice(1)} Score: ${score}%</div>`;
  }

  function renderReport() {
    const project = currentProject();
    const scores = getScores(project);
    const stats = calculateValidation(project);
    const status = publicationDecision(scores.publication);
    const reportId = project ? `RVP-${project.id.slice(-6).toUpperCase()}` : 'RVP-0000';
    $('#passportId').textContent = reportId;
    $('#passportSummary').textContent = project ? `${project.title || 'Untitled Project'} • ${status} • ${scores.publication}% publication readiness.` : 'No active project.';
    renderQr(reportId + (project?.title || ''));
    $('#reportPreview').innerHTML = `
      <h2>JS Research Validator Pro</h2>
      <h3>Publication Readiness Report & Research Validity Passport</h3>
      <p><b>Passport ID:</b> ${safe(reportId)}<br>
      <b>Generated:</b> ${new Date().toLocaleString()}<br>
      <b>Project:</b> ${safe(project?.title || 'Untitled Project')}</p>
      <table>
        <tr><th>Research Field</th><td>${safe(project?.field || '-')}</td></tr>
        <tr><th>Research Design</th><td>${safe(project?.design || '-')}</td></tr>
        <tr><th>Participants / Sample</th><td>${safe(project?.sample || '-')}</td></tr>
        <tr><th>Target Journal / Output</th><td>${safe(project?.journal || '-')}</td></tr>
        <tr><th>Current Status</th><td>${safe(project?.status || '-')}</td></tr>
      </table>
      <h3>Validation Scores</h3>
      <table>
        <tr><th>Area</th><th>Score</th><th>Interpretation</th></tr>
        <tr><td>Instrument Validity</td><td>${scores.instrument}%</td><td>Aiken’s V ${stats.aiken.toFixed(2)}; I-CVI ${stats.cvi.toFixed(2)}; ${decisionInstrument(stats)}</td></tr>
        <tr><td>Reliability</td><td>${scores.reliability}%</td><td>Cronbach’s alpha ${Number(project?.pilot?.alpha || 0).toFixed(2)}; ${reliabilityDecision(Number(project?.pilot?.alpha || 0))}</td></tr>
        <tr><td>Ethics Readiness</td><td>${scores.ethics}%</td><td>${scores.ethics >= 80 ? 'Ethics package is mostly ready.' : 'Ethics documentation needs completion.'}</td></tr>
        <tr><td>Methodology Alignment</td><td>${scores.methodology}%</td><td>${scores.methodology >= 80 ? 'Design, data, and analysis are aligned.' : 'Methodological alignment needs strengthening.'}</td></tr>
        <tr><td>Manuscript Readiness</td><td>${scores.manuscript}%</td><td>${scores.manuscript >= 80 ? 'Core reporting sections are ready.' : 'Manuscript sections need revision.'}</td></tr>
        <tr><th>Overall Publication Readiness</th><th>${scores.publication}%</th><th>${status}</th></tr>
      </table>
      <h3>Instrument Summary</h3>
      <p><b>Name:</b> ${safe(project?.instrument?.name || '-')}<br>
      <b>Type:</b> ${safe(project?.instrument?.type || '-')}<br>
      <b>Construct:</b> ${safe(project?.instrument?.construct || '-')}<br>
      <b>Total Items:</b> ${(project?.items || []).length}</p>
      <h3>Recommended Actions</h3>
      <ol>${recommendations(project, scores).map((item) => `<li>${safe(item)}</li>`).join('')}</ol>
      <h3>Workflow Completion</h3>
      <table><tr><th>Step</th><th>Status</th></tr>${(project?.workflow || []).map((step) => `<tr><td>${safe(step.name)}</td><td>${step.done ? 'Done' : 'Pending'}</td></tr>`).join('')}</table>
      <p><b>Declaration:</b> This report is generated by JS Research Validator Pro as a structured quality-control aid. Final academic, statistical, ethical, and editorial decisions remain the responsibility of researchers, supervisors, institutions, and journal editors.</p>
    `;
  }

  function publicationDecision(score) {
    if (score >= 85) return 'Ready with Minor Revision';
    if (score >= 70) return 'Promising but Needs Revision';
    if (score >= 50) return 'Major Revision Required';
    return 'Not Ready';
  }

  function recommendations(project, scores) {
    const list = [];
    if (!project?.title) list.push('Complete the project metadata and research purpose.');
    if (!project?.instrument) list.push('Upload or register the research instrument before expert validation.');
    if ((project?.items || []).length < 3) list.push('Add more instrument items or rubric descriptors to enable meaningful validation.');
    if (scores.instrument < 80) list.push('Improve low-rated items based on expert relevance and clarity feedback.');
    if (scores.reliability < 70) list.push('Conduct pilot testing and calculate reliability using a numeric response matrix.');
    if (scores.ethics < 80) list.push('Complete ethics documentation, consent, confidentiality, risk, and AI-use declaration.');
    if (scores.methodology < 80) list.push('Strengthen alignment among research questions, design, sampling, instruments, analysis, and claims.');
    if (scores.manuscript < 80) list.push('Revise manuscript sections, reporting guideline compliance, and publication declarations.');
    if (!list.length) list.push('The project is highly ready. Conduct final proofreading and target-journal formatting before submission.');
    return list;
  }

  function renderQr(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    const cells = [];
    for (let i = 0; i < 81; i++) {
      const finder = (i < 21 && (i % 9 < 3 || i % 9 > 5)) || (i > 53 && i % 9 < 3) || (i < 27 && i % 9 > 5);
      const on = finder || Math.abs(Math.sin(hash + i * 13.37)) > .52;
      cells.push(`<i class="${on ? '' : 'off'}"></i>`);
    }
    $('#passportQr').innerHTML = cells.join('');
  }

  function download(filename, content, type = 'text/plain') {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function projectFilename(project, suffix, ext) {
    const name = (project?.title || 'research-validation-project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'research-validation-project';
    return `${name}-${suffix}.${ext}`;
  }

  function getReportText(project) {
    const scores = getScores(project);
    const stats = calculateValidation(project);
    const lines = [];
    lines.push('JS RESEARCH VALIDATOR PRO');
    lines.push('Publication Readiness Report & Research Validity Passport');
    lines.push('');
    lines.push(`Passport ID: RVP-${project.id.slice(-6).toUpperCase()}`);
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Project: ${project.title || 'Untitled Project'}`);
    lines.push(`Field: ${project.field || '-'}`);
    lines.push(`Design: ${project.design || '-'}`);
    lines.push(`Participants / Sample: ${project.sample || '-'}`);
    lines.push(`Target Journal / Output: ${project.journal || '-'}`);
    lines.push(`Status: ${project.status || '-'}`);
    lines.push('');
    lines.push('VALIDATION SCORES');
    lines.push(`Instrument Validity: ${scores.instrument}% | Aiken's V ${stats.aiken.toFixed(2)} | I-CVI ${stats.cvi.toFixed(2)} | ${decisionInstrument(stats)}`);
    lines.push(`Reliability: ${scores.reliability}% | Cronbach's alpha ${Number(project.pilot?.alpha || 0).toFixed(2)} | ${reliabilityDecision(Number(project.pilot?.alpha || 0))}`);
    lines.push(`Ethics Readiness: ${scores.ethics}%`);
    lines.push(`Methodology Alignment: ${scores.methodology}%`);
    lines.push(`Manuscript Readiness: ${scores.manuscript}%`);
    lines.push(`Overall Publication Readiness: ${scores.publication}% | ${publicationDecision(scores.publication)}`);
    lines.push('');
    lines.push('INSTRUMENT SUMMARY');
    lines.push(`Name: ${project.instrument?.name || '-'}`);
    lines.push(`Type: ${project.instrument?.type || '-'}`);
    lines.push(`Construct: ${project.instrument?.construct || '-'}`);
    lines.push(`Total Items: ${(project.items || []).length}`);
    lines.push('');
    lines.push('RECOMMENDED ACTIONS');
    recommendations(project, scores).forEach((item, index) => lines.push(`${index + 1}. ${item}`));
    lines.push('');
    lines.push('WORKFLOW COMPLETION');
    project.workflow.forEach((step, index) => lines.push(`${index + 1}. ${step.name}: ${step.done ? 'Done' : 'Pending'}`));
    lines.push('');
    lines.push('Declaration: This report is generated by JS Research Validator Pro as a structured quality-control aid. Final academic, statistical, ethical, and editorial decisions remain the responsibility of researchers, supervisors, institutions, and journal editors.');
    return lines.join('\n');
  }

  function makeSimplePdf(text, title = 'JS Research Validator Pro') {
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 54;
    const fontSize = 11;
    const lineHeight = 15;
    const maxChars = 82;

    const wrapped = [];
    text.split('\n').forEach((line) => {
      if (line.trim() === '') {
        wrapped.push('');
        return;
      }
      let current = line;
      while (current.length > maxChars) {
        let cut = current.lastIndexOf(' ', maxChars);
        if (cut < 20) cut = maxChars;
        wrapped.push(current.slice(0, cut));
        current = current.slice(cut).trim();
      }
      wrapped.push(current);
    });

    const linesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);
    const pages = [];
    for (let i = 0; i < wrapped.length; i += linesPerPage) pages.push(wrapped.slice(i, i + linesPerPage));

    const objects = [];
    const addObject = (body) => {
      objects.push(body);
      return objects.length;
    };
    const catalogId = addObject('');
    const pagesId = addObject('');
    const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const pageIds = [];
    const contentIds = [];

    pages.forEach((pageLines, pageIndex) => {
      const commands = ['BT', `/F1 ${fontSize} Tf`, `${margin} ${pageHeight - margin} Td`];
      if (pageIndex === 0) {
        commands.push(`/F1 16 Tf (${pdfEscape(title)}) Tj`);
        commands.push(`0 -${lineHeight * 1.8} Td`);
        commands.push(`/F1 ${fontSize} Tf`);
      }
      pageLines.forEach((line, index) => {
        if (index > 0 || pageIndex === 0) commands.push(`0 -${lineHeight} Td`);
        commands.push(`(${pdfEscape(line)}) Tj`);
      });
      commands.push('ET');
      const stream = commands.join('\n');
      const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
      contentIds.push(contentId);
      const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
      pageIds.push(pageId);
    });

    objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
    objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((body, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i++) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return new Blob([pdf], { type: 'application/pdf' });
  }

  function pdfEscape(text) {
    return String(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[–—]/g, '-').replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
  }

  function updateTitle() {
    const active = $('.nav-btn.active');
    $('#pageTitle').textContent = active ? active.textContent : 'Dashboard';
  }

  function showView(id) {
    $$('.nav-btn').forEach((button) => button.classList.toggle('active', button.dataset.view === id));
    $$('.view').forEach((view) => view.classList.toggle('active', view.id === id));
    updateTitle();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function attachEvents() {
    $('#pinForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const pin = $('#pinInput').value.trim();
      if (hashPin(pin) === getStoredPinHash()) {
        $('#pinGate').style.display = 'none';
        $('#appShell').classList.remove('locked');
        $('#pinInput').value = '';
        renderAll();
      } else {
        $('#pinMessage').textContent = 'Incorrect PIN. Please try again.';
      }
    });

    $('#lockBtn').addEventListener('click', () => {
      $('#pinGate').style.display = 'grid';
      $('#appShell').classList.add('locked');
      $('#pinMessage').textContent = '';
      $('#pinInput').focus();
    });

    $('#mainNav').addEventListener('click', (event) => {
      const button = event.target.closest('.nav-btn');
      if (!button) return;
      showView(button.dataset.view);
    });

    document.body.addEventListener('click', (event) => {
      const jump = event.target.closest('[data-jump]');
      if (jump) showView(jump.dataset.jump);
    });

    $('#activeProject').addEventListener('change', (event) => {
      activeProjectId = event.target.value;
      saveState();
      renderAll();
      toast('Active project changed.');
    });

    $('#projectForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const id = $('#projectId').value || uid('project');
      let project = state.projects.find((item) => item.id === id);
      if (!project) {
        project = newProjectDefaults({ id });
        state.projects.push(project);
      }
      Object.assign(project, {
        title: $('#projectTitle').value.trim(),
        field: $('#projectField').value.trim(),
        design: $('#projectDesign').value,
        sample: $('#projectSample').value.trim(),
        journal: $('#projectJournal').value.trim(),
        status: $('#projectStatus').value,
        purpose: $('#projectPurpose').value.trim(),
        updatedAt: new Date().toISOString()
      });
      setStep(project, 'Create Project', Boolean(project.title));
      activeProjectId = project.id;
      saveState();
      renderAll();
      toast('Project saved successfully.');
    });

    $('#clearProjectForm').addEventListener('click', () => {
      $('#projectId').value = '';
      $('#projectForm').reset();
    });

    $('#projectCards').addEventListener('click', (event) => {
      const open = event.target.closest('[data-open-project]');
      const duplicate = event.target.closest('[data-duplicate-project]');
      const del = event.target.closest('[data-delete-project]');
      if (open) {
        activeProjectId = open.dataset.openProject;
        saveState();
        renderAll();
        showView('projects');
      }
      if (duplicate) {
        const original = state.projects.find((project) => project.id === duplicate.dataset.duplicateProject);
        if (!original) return;
        const copy = JSON.parse(JSON.stringify(original));
        copy.id = uid('project');
        copy.title = `${copy.title || 'Untitled Project'} Copy`;
        copy.createdAt = new Date().toISOString();
        copy.updatedAt = new Date().toISOString();
        state.projects.push(copy);
        activeProjectId = copy.id;
        saveState();
        renderAll();
        toast('Project duplicated.');
      }
      if (del) {
        const id = del.dataset.deleteProject;
        if (state.projects.length <= 1) {
          toast('At least one project must remain.');
          return;
        }
        if (confirm('Delete this project from browser storage?')) {
          state.projects = state.projects.filter((project) => project.id !== id);
          if (activeProjectId === id) activeProjectId = state.projects[0]?.id || null;
          saveState();
          renderAll();
          toast('Project deleted.');
        }
      }
    });

    $('#instrumentForm').addEventListener('submit', async (event) => {
      event.preventDefault();
      const project = currentProject();
      if (!project) return;
      const file = $('#instrumentFile').files[0];
      let fileText = '';
      if (file && /text|csv|json|plain/.test(file.type + file.name)) {
        fileText = await file.text();
      }
      project.instrument = {
        name: $('#instrumentName').value.trim(),
        type: $('#instrumentType').value,
        construct: $('#instrumentConstruct').value.trim(),
        scalePoints: $('#scalePoints').value,
        description: $('#instrumentDescription').value.trim(),
        fileName: file?.name || project.instrument?.fileName || '',
        filePreview: fileText.slice(0, 5000),
        updatedAt: new Date().toISOString()
      };
      setStep(project, 'Upload Instrument', Boolean(project.instrument.name));
      saveState();
      renderAll();
      toast('Instrument saved.');
    });

    $('#itemForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const project = currentProject();
      if (!project) return;
      const code = $('#itemCode').value.trim() || `I${project.items.length + 1}`;
      const construct = $('#itemConstruct').value.trim() || project.instrument?.construct || 'Construct';
      const text = $('#itemText').value.trim();
      if (!text) {
        toast('Please write the item text first.');
        return;
      }
      project.items.push({ id: uid('item'), code, construct, text });
      $('#itemForm').reset();
      saveState();
      renderAll();
      toast('Item added.');
    });

    $('#seedItems').addEventListener('click', () => {
      const project = currentProject();
      if (!project) return;
      const samples = [
        ['I1', 'Construct Alignment', 'The item clearly reflects the intended construct and does not measure unrelated aspects.'],
        ['I2', 'Clarity', 'The wording is understandable for the target participants and avoids ambiguous phrasing.'],
        ['I3', 'Cultural Appropriateness', 'The item is culturally appropriate for the research context and does not contain bias.'],
        ['I4', 'Scoring Feasibility', 'The item can be scored consistently using the proposed rubric or response scale.'],
        ['I5', 'Ethical Sensitivity', 'The item does not expose participants to unnecessary discomfort or identifiable risk.']
      ];
      samples.forEach(([code, construct, text]) => project.items.push({ id: uid('item'), code, construct, text }));
      saveState();
      renderAll();
      toast('Sample validation items added.');
    });

    $('#itemsTable').addEventListener('input', (event) => {
      const input = event.target.closest('[data-item-edit]');
      if (!input) return;
      const project = currentProject();
      const item = project?.items.find((entry) => entry.id === input.dataset.itemEdit);
      if (!item) return;
      item[input.dataset.field] = input.value;
      saveState();
    });

    $('#itemsTable').addEventListener('click', (event) => {
      const button = event.target.closest('[data-delete-item]');
      if (!button) return;
      const project = currentProject();
      project.items = project.items.filter((item) => item.id !== button.dataset.deleteItem);
      Object.keys(project.ratings).forEach((key) => { if (key.startsWith(`${button.dataset.deleteItem}::`)) delete project.ratings[key]; });
      saveState();
      renderAll();
      toast('Item deleted.');
    });

    $('#addExpert').addEventListener('click', () => {
      const project = currentProject();
      if (!project) return;
      project.experts.push({ id: uid('expert'), name: `Expert ${project.experts.length + 1}`, role: 'Validator' });
      saveState();
      renderAll();
      toast('Expert added.');
    });

    $('#expertList').addEventListener('input', (event) => {
      const input = event.target.closest('[data-expert-edit]');
      if (!input) return;
      const project = currentProject();
      const expert = project.experts.find((entry) => entry.id === input.dataset.expertEdit);
      if (!expert) return;
      expert[input.dataset.field] = input.value;
      saveState();
      renderProjectCards();
      renderReport();
    });

    $('#expertList').addEventListener('click', (event) => {
      const button = event.target.closest('[data-delete-expert]');
      if (!button) return;
      const project = currentProject();
      if (project.experts.length <= 1) {
        toast('At least one expert is required.');
        return;
      }
      project.experts = project.experts.filter((expert) => expert.id !== button.dataset.deleteExpert);
      Object.keys(project.ratings).forEach((key) => { if (key.includes(`::${button.dataset.deleteExpert}::`)) delete project.ratings[key]; });
      saveState();
      renderAll();
      toast('Expert removed.');
    });

    $('#validationMatrix').addEventListener('change', (event) => {
      const select = event.target.closest('[data-rating]');
      if (!select) return;
      const project = currentProject();
      const key = ratingKey(select.dataset.rating, select.dataset.expert, select.dataset.dimension);
      project.ratings[key] = Number(select.value);
      const stats = calculateValidation(project);
      setStep(project, 'Expert Validation', stats.aiken > 0 && stats.cvi > 0);
      saveState();
      renderAll();
    });

    $('#revisionBoard').addEventListener('input', (event) => {
      const note = event.target.closest('[data-revision-note]');
      if (!note) return;
      const project = currentProject();
      project.revisionNotes[note.dataset.revisionNote] = note.value;
      saveState();
    });

    $('#revisionBoard').addEventListener('change', (event) => {
      const check = event.target.closest('[data-revised]');
      if (!check) return;
      const project = currentProject();
      project.revisedItems[check.dataset.revised] = check.checked;
      const revisedCount = Object.values(project.revisedItems).filter(Boolean).length;
      setStep(project, 'Revise Items', revisedCount >= (project.items || []).length && revisedCount > 0);
      saveState();
      renderAll();
    });

    $('#markAllRevised').addEventListener('click', () => {
      const project = currentProject();
      if (!project) return;
      project.items.forEach((item) => project.revisedItems[item.id] = true);
      setStep(project, 'Revise Items', project.items.length > 0);
      saveState();
      renderAll();
      toast('All items marked as revised.');
    });

    $('#pilotForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const project = currentProject();
      const matrix = parseCsvMatrix($('#pilotCsv').value);
      const result = cronbachAlpha(matrix);
      project.pilot = { n: $('#pilotN').value, csv: $('#pilotCsv').value, alpha: result.alpha, items: result.items, cases: result.cases };
      setStep(project, 'Pilot Testing', result.cases > 0);
      setStep(project, 'Reliability/Validity Calculation', result.alpha > 0);
      saveState();
      renderAll();
      toast('Reliability calculated.');
    });

    $('#loadPilotExample').addEventListener('click', () => {
      $('#pilotN').value = 8;
      $('#pilotCsv').value = '4,3,4,4,3\n3,3,4,3,3\n4,4,4,4,4\n3,4,3,4,3\n4,3,4,3,4\n3,3,3,4,3\n4,4,4,3,4\n3,4,3,3,3';
    });

    document.body.addEventListener('change', (event) => {
      const check = event.target.closest('[data-checklist]');
      if (!check) return;
      const project = currentProject();
      const type = check.dataset.checklist;
      project[type][Number(check.dataset.index)] = check.checked;
      if (type === 'ethics') setStep(project, 'Ethics Check', percentage(project.ethics.filter(Boolean).length, ethicsItems.length) >= 80);
      if (type === 'methodology') setStep(project, 'Methodology Check', percentage(project.methodology.filter(Boolean).length, methodologyItems.length) >= 80);
      if (type === 'manuscript') setStep(project, 'Manuscript Check', percentage(project.manuscript.filter(Boolean).length, manuscriptItems.length) >= 80);
      const scores = getScores(project);
      setStep(project, 'Publication Readiness Report', scores.publication >= 50);
      saveState();
      renderAll();
    });

    $('#ethicsComplete').addEventListener('click', () => markChecklist('ethics', true));
    $('#methodologyComplete').addEventListener('click', () => markChecklist('methodology', true));
    $('#manuscriptComplete').addEventListener('click', () => markChecklist('manuscript', true));

    $('#markNextStep').addEventListener('click', () => {
      const project = currentProject();
      const next = project.workflow.find((step) => !step.done);
      if (next) {
        next.done = true;
        saveState();
        renderAll();
        toast(`${next.name} marked as done.`);
      } else {
        toast('All workflow steps are already complete.');
      }
    });

    $('#refreshReport').addEventListener('click', () => {
      renderReport();
      toast('Report refreshed.');
    });

    $('#downloadPdf').addEventListener('click', () => {
      const project = currentProject();
      if (!project) return;
      const blob = makeSimplePdf(getReportText(project), 'JS Research Validator Pro');
      setStep(project, 'Download Research Validity Passport', true);
      saveState();
      renderAll();
      download(projectFilename(project, 'publication-readiness-report', 'pdf'), blob);
    });

    $('#downloadPassport').addEventListener('click', () => {
      const project = currentProject();
      if (!project) return;
      const scores = getScores(project);
      const passport = {
        passportId: `RVP-${project.id.slice(-6).toUpperCase()}`,
        generatedAt: new Date().toISOString(),
        projectTitle: project.title,
        researchDesign: project.design,
        field: project.field,
        participants: project.sample,
        targetOutput: project.journal,
        instrument: project.instrument,
        scores,
        status: publicationDecision(scores.publication),
        workflow: project.workflow
      };
      setStep(project, 'Download Research Validity Passport', true);
      saveState();
      renderAll();
      download(projectFilename(project, 'research-validity-passport', 'json'), JSON.stringify(passport, null, 2), 'application/json');
    });

    $('#downloadJson').addEventListener('click', () => {
      const project = currentProject();
      if (!project) return;
      download(projectFilename(project, 'project-data', 'json'), JSON.stringify(project, null, 2), 'application/json');
    });

    $('#printReport').addEventListener('click', () => window.print());

    $('#pinChangeForm').addEventListener('submit', (event) => {
      event.preventDefault();
      const current = $('#currentPin').value.trim();
      const next = $('#newPin').value.trim();
      const confirmNext = $('#confirmPin').value.trim();
      if (hashPin(current) !== getStoredPinHash()) {
        $('#pinChangeMessage').textContent = 'Current PIN is incorrect.';
        return;
      }
      if (next.length < 4) {
        $('#pinChangeMessage').textContent = 'New PIN must contain at least 4 characters.';
        return;
      }
      if (next !== confirmNext) {
        $('#pinChangeMessage').textContent = 'New PIN and confirmation do not match.';
        return;
      }
      localStorage.setItem(PIN_KEY, hashPin(next));
      $('#pinChangeForm').reset();
      $('#pinChangeMessage').textContent = 'PIN changed successfully.';
      toast('PIN changed successfully.');
    });

    $('#exportAll').addEventListener('click', () => {
      download('js-research-validator-pro-all-data.json', JSON.stringify(state, null, 2), 'application/json');
    });

    $('#importAll').addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        const imported = JSON.parse(await file.text());
        if (!Array.isArray(imported.projects)) throw new Error('Invalid data format.');
        state = imported;
        activeProjectId = state.activeProjectId || state.projects[0]?.id || null;
        saveState();
        renderAll();
        toast('Data imported successfully.');
      } catch (error) {
        toast('Import failed. Please use a valid exported JSON file.');
      }
    });

    $('#resetDemo').addEventListener('click', () => {
      if (!confirm('Reset all browser data for this app?')) return;
      localStorage.removeItem(STORAGE_KEY);
      state = loadState();
      activeProjectId = null;
      ensureActiveProject();
      renderAll();
      toast('Browser data reset.');
    });
  }

  function markChecklist(type, value) {
    const project = currentProject();
    if (!project) return;
    project[type] = project[type].map(() => value);
    if (type === 'ethics') setStep(project, 'Ethics Check', value);
    if (type === 'methodology') setStep(project, 'Methodology Check', value);
    if (type === 'manuscript') setStep(project, 'Manuscript Check', value);
    const scores = getScores(project);
    setStep(project, 'Publication Readiness Report', scores.publication >= 50);
    saveState();
    renderAll();
    toast(`${type[0].toUpperCase() + type.slice(1)} checklist updated.`);
  }

  function init() {
    getStoredPinHash();
    ensureActiveProject();
    attachEvents();
    $('#pinInput').focus();
  }

  init();
})();
