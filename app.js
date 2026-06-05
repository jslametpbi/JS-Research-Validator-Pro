(() => {
  'use strict';

  const STORAGE_KEY = 'jsrvp_state_v2';
  const SESSION_KEY = 'jsrvp_session_v2';
  const ADMIN_PIN_KEY = 'jsrvp_admin_pin_hash_v2';
  const DEFAULT_ADMIN_PIN = 'JS2026';
  const APP_VERSION = '2.0-role-metadata-passport';

  const views = {
    dashboard: 'Dashboard',
    metadata: 'Project Metadata',
    instrument: 'Instrument Studio',
    validators: 'Validator Assignment',
    expert: 'Expert Validation',
    revision: 'Revise Items',
    pilot: 'Pilot Testing & Reliability',
    ethics: 'Ethics Checklist',
    methodology: 'Methodology Checker',
    manuscript: 'Manuscript Validator',
    reports: 'Reports & Validity Passport',
    validatorProfile: 'Validator Profile',
    admin: 'Admin Verification'
  };

  const permissions = {
    admin: ['dashboard', 'metadata', 'instrument', 'validators', 'expert', 'revision', 'pilot', 'ethics', 'methodology', 'manuscript', 'reports', 'validatorProfile', 'admin'],
    applicant: ['dashboard', 'metadata', 'instrument', 'validators', 'revision', 'pilot', 'ethics', 'methodology', 'manuscript', 'reports'],
    validator: ['dashboard', 'validatorProfile', 'expert', 'reports']
  };

  const checklistBanks = {
    ethics: [
      ['Ethical clearance pathway identified', 'Institutional ethics, school permission, or departmental review process has been identified before data collection.'],
      ['Participant information sheet prepared', 'The study explains purpose, procedures, voluntary participation, risks, benefits, and contact persons.'],
      ['Consent or assent procedure prepared', 'Adult consent, parental consent, child assent, or institutional permission is appropriate for the participant group.'],
      ['Confidentiality and anonymity protected', 'Names, student IDs, school names, and interview excerpts are protected or anonymised.'],
      ['Data storage and retention plan defined', 'Storage location, access control, retention duration, and deletion plan are clear.'],
      ['Risk level justified', 'Physical, psychological, social, academic, reputational, and digital risks are described and minimised.'],
      ['Power relation considered', 'Teacher-student, supervisor-student, employer-employee, or researcher-participant power issues are managed.'],
      ['AI/tool use declared', 'AI tools, recording apps, transcription tools, analytics platforms, or automated scoring tools are transparently declared.'],
      ['Vulnerable participants protected', 'Children, students, patients, employees, or dependent participants receive additional safeguards.'],
      ['Conflict of interest declared', 'Financial, professional, authorship, or institutional conflicts are disclosed.'],
      ['Withdrawal procedure available', 'Participants can withdraw without penalty, and the withdrawal deadline is explained.'],
      ['Data sharing plan appropriate', 'Open data, restricted data, or no-sharing decision is justified according to privacy and consent.']
    ],
    methodology: [
      ['Research problem is explicit', 'The project moves from problem to gap to purpose.'],
      ['Research questions match design', 'Each research question is answerable with the selected design and data.'],
      ['Theoretical framework is named', 'Constructs, models, or theories are clearly stated.'],
      ['Sampling strategy is justified', 'Population, sampling technique, sample size, inclusion criteria, and exclusion criteria are transparent.'],
      ['Instrument matches construct', 'Questionnaire, rubric, interview protocol, test, or observation sheet represents the construct.'],
      ['Data collection sequence is logical', 'The sequence fits quantitative, qualitative, mixed-methods, R&D, or experimental logic.'],
      ['Analysis plan fits data', 'Statistical, qualitative, mixed-methods, or design-evaluation analyses match the research questions.'],
      ['Validity/reliability evidence is planned', 'Content validity, construct validity, reliability, trustworthiness, inter-rater agreement, or pilot evidence is planned.'],
      ['Integration is clear for mixed methods', 'Quantitative and qualitative strands are connected through design, sampling, analysis, and interpretation.'],
      ['Claims are bounded by evidence', 'Expected claims do not exceed sample, design, context, or measurement quality.'],
      ['Limitations are anticipated', 'Sampling, measurement, context, analysis, and researcher bias limitations are acknowledged.'],
      ['Contribution is field-specific', 'The study states theoretical, pedagogical, methodological, practical, or policy contribution.']
    ],
    manuscript: [
      ['Title is precise', 'The title signals core construct, context, method, and contribution.'],
      ['Abstract is complete', 'Purpose, method, data/participants, findings, and implications are included.'],
      ['Introduction is argumentative', 'The introduction establishes significance, gap, novelty, and research questions.'],
      ['Literature review is critical', 'It synthesizes debates, concepts, and contradictions rather than listing studies.'],
      ['Method is reproducible', 'Design, participants, instruments, procedures, analysis, ethics, and validity are detailed.'],
      ['Results are transparent', 'Tables, figures, statistics, themes, excerpts, or design outputs are clearly reported.'],
      ['Discussion is interpretive', 'Findings are explained, compared with literature, and connected to the contribution.'],
      ['Conclusion is not repetitive', 'The conclusion synthesizes contribution, implications, limitations, and future research.'],
      ['References fit target style', 'Reference style, DOI format, capitalization, and citation consistency are checked.'],
      ['Publication declarations prepared', 'Funding, conflict of interest, ethics, data availability, AI use, and author contribution are ready.'],
      ['Reporting guideline selected', 'CONSORT, PRISMA, STROBE, COREQ, SRQR, COSMIN, or another relevant guideline is considered.'],
      ['Journal scope is aligned', 'The topic, method, article type, length, and contribution fit the target outlet.']
    ]
  };

  const ratingDimensions = [
    ['relevance', 'Relevance'],
    ['clarity', 'Clarity'],
    ['construct', 'Construct Alignment'],
    ['language', 'Language Quality'],
    ['culture', 'Cultural Fit'],
    ['ethics', 'Ethical Sensitivity']
  ];

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const safe = (value) => String(value ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  const nl2br = (value) => safe(value).replace(/\n/g, '<br>');
  const nowIso = () => new Date().toISOString();
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleString() : '-';

  let state = loadState();
  let session = loadSession();
  let activeView = 'dashboard';
  let signaturePad = null;
  let appShellBound = false;

  function uid(prefix = 'id') {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function makeProjectNo() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const stamp = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    let no;
    do {
      no = `JSRV-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    } while (state.projects.some(p => p.projectNo === no));
    return no;
  }

  function hashPin(pin) {
    return btoa(unescape(encodeURIComponent(`jsrvp:${pin}:DrJokoSlamet`)));
  }

  function verifyPin(pin, hash) {
    return hashPin(pin) === hash;
  }

  function getAdminHash() {
    const stored = localStorage.getItem(ADMIN_PIN_KEY);
    if (stored) return stored;
    const h = hashPin(DEFAULT_ADMIN_PIN);
    localStorage.setItem(ADMIN_PIN_KEY, h);
    return h;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { version: APP_VERSION, users: [], projects: [], activeProjectId: null, createdAt: nowIso() };
      const parsed = JSON.parse(raw);
      return {
        version: parsed.version || APP_VERSION,
        users: Array.isArray(parsed.users) ? parsed.users : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        activeProjectId: parsed.activeProjectId || null,
        createdAt: parsed.createdAt || nowIso()
      };
    } catch (error) {
      console.warn('State reset due to invalid JSON', error);
      return { version: APP_VERSION, users: [], projects: [], activeProjectId: null, createdAt: nowIso() };
    }
  }

  function saveState() {
    state.version = APP_VERSION;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function loadSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveSession(next) {
    session = next;
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else localStorage.removeItem(SESSION_KEY);
  }

  function toast(message) {
    const box = $('#toast');
    box.textContent = message;
    box.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => box.classList.remove('show'), 2600);
  }

  function currentUser() {
    if (!session) return null;
    if (session.role === 'admin') return { id: 'admin', role: 'admin', name: 'Administrator', email: '', status: 'verified' };
    return state.users.find(u => u.id === session.userId) || null;
  }

  function userDisplay(user) {
    return user?.profile?.fullName || user?.name || user?.email || 'User';
  }

  function isAdmin() { return session?.role === 'admin'; }
  function isApplicant() { return session?.role === 'applicant'; }
  function isValidator() { return session?.role === 'validator'; }

  function userProjects() {
    if (isAdmin()) return state.projects;
    if (isApplicant()) return state.projects.filter(p => p.applicantUserId === session.userId);
    if (isValidator()) return state.projects.filter(p => (p.assignments || []).includes(session.userId));
    return [];
  }

  function currentProject() {
    const available = userProjects();
    if (!state.activeProjectId || !available.some(p => p.id === state.activeProjectId)) {
      state.activeProjectId = available[0]?.id || null;
      saveState();
    }
    return available.find(p => p.id === state.activeProjectId) || null;
  }

  function isMetadataComplete(project) {
    if (!project) return false;
    const m = project.metadata || {};
    const required = ['title', 'principalInvestigator', 'institution', 'researchDesign', 'purpose', 'researchQuestions', 'participants', 'targetOutput'];
    return required.every(key => String(m[key] || '').trim().length > 2);
  }

  function makeBlankProject(ownerId) {
    const no = makeProjectNo();
    return {
      id: uid('project'),
      projectNo: no,
      applicantUserId: ownerId,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      status: 'Metadata Draft',
      verification: {
        metadata: 'pending', instrument: 'pending', pilot: 'pending', ethics: 'pending', methodology: 'pending', manuscript: 'pending', report: 'pending'
      },
      metadata: { projectNo: no },
      instrument: null,
      items: [],
      assignments: [],
      ratings: {},
      validatorReviews: {},
      revisionNotes: {},
      revisedItems: {},
      pilot: defaultPilot(),
      ethics: Array(checklistBanks.ethics.length).fill(false),
      methodology: Array(checklistBanks.methodology.length).fill(false),
      manuscript: Array(checklistBanks.manuscript.length).fill(false),
      reportNotes: ''
    };
  }

  function defaultPilot() {
    return {
      researchType: 'Quantitative Survey / Scale Validation',
      pilotPurpose: '',
      pilotSample: '',
      population: '',
      inclusion: '',
      exclusion: '',
      setting: '',
      dataSource: '',
      reliabilityFocus: [],
      cronbachCsv: '', cronbachAlpha: null, cronbachItems: 0, cronbachCases: 0,
      kr20Csv: '', kr20: null, kr20Items: 0, kr20Cases: 0,
      kappaCsv: '', kappa: null, kappaAgreement: null, kappaCases: 0,
      testRetestCsv: '', testRetestR: null, testRetestCases: 0,
      splitHalfCsv: '', splitHalfR: null, spearmanBrown: null,
      qualitativeTrust: { coders: '', transcripts: '', triangulation: false, memberChecking: false, auditTrail: false, reflexivity: false, saturation: false, notes: '' },
      rdUsability: { users: '', practicalityScore: '', usabilityFindings: '', revisionDecision: '' },
      interpretation: '',
      limitations: '',
      nextAction: ''
    };
  }

  function stageLockedHtml() {
    return `<article class="panel glass locked-stage"><h3>Complete project metadata first</h3><p>All validation stages are integrated with the first project metadata record. Save the detailed metadata before continuing to instrument, validator, pilot, ethics, methodology, manuscript, and report stages.</p><button class="primary" data-jump="metadata">Open Project Metadata</button></article>`;
  }

  function init() {
    if (location.hash.startsWith('#public=')) {
      renderPublicFromHash();
      return;
    }
    bindAuth();
    if (session && currentUser()) showApp();
    else showAccess();
  }

  function showAccess() {
    $('#publicReportShell').classList.add('hidden');
    $('#appShell').classList.add('hidden');
    $('#accessShell').classList.remove('hidden');
  }

  function showApp() {
    $('#publicReportShell').classList.add('hidden');
    $('#accessShell').classList.add('hidden');
    $('#appShell').classList.remove('hidden');
    const allowed = permissions[session.role] || [];
    if (!allowed.includes(activeView)) activeView = allowed[0] || 'dashboard';
    buildNav();
    bindAppShell();
    renderAll();
    showView(activeView);
  }

  function bindAuth() {
    $$('.auth-tab').forEach(btn => {
      btn.onclick = () => {
        $$('.auth-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.authTab;
        $$('.auth-panel').forEach(panel => panel.classList.toggle('active', panel.dataset.panel === tab));
      };
    });

    $('#loginRole').onchange = () => {
      $('#loginEmailWrap').style.display = $('#loginRole').value === 'admin' ? 'none' : 'grid';
      $('#loginPin').placeholder = $('#loginRole').value === 'admin' ? 'Enter Admin PIN' : 'Enter access PIN';
    };
    $('#loginRole').dispatchEvent(new Event('change'));

    $('#loginForm').onsubmit = (event) => {
      event.preventDefault();
      const role = $('#loginRole').value;
      const pin = $('#loginPin').value;
      $('#loginMessage').textContent = '';
      if (role === 'admin') {
        if (!verifyPin(pin, getAdminHash())) {
          $('#loginMessage').textContent = 'Incorrect admin PIN.';
          return;
        }
        saveSession({ role: 'admin', userId: 'admin', loginAt: nowIso() });
        $('#loginPin').value = '';
        showApp();
        return;
      }
      const email = $('#loginEmail').value.trim().toLowerCase();
      const user = state.users.find(u => u.role === role && u.email.toLowerCase() === email);
      if (!user || !verifyPin(pin, user.pinHash)) {
        $('#loginMessage').textContent = 'Invalid email or PIN.';
        return;
      }
      saveSession({ role: user.role, userId: user.id, loginAt: nowIso() });
      $('#loginPin').value = '';
      showApp();
    };

    $('#applicantRegisterForm').onsubmit = async (event) => {
      event.preventDefault();
      const email = $('#regApplicantEmail').value.trim().toLowerCase();
      if (state.users.some(u => u.email.toLowerCase() === email && u.role === 'applicant')) {
        $('#applicantMessage').textContent = 'This applicant email is already registered.';
        return;
      }
      const user = {
        id: uid('user'), role: 'applicant', email,
        pinHash: hashPin($('#regApplicantPin').value), status: 'active', createdAt: nowIso(), updatedAt: nowIso(),
        profile: {
          fullName: $('#regApplicantName').value.trim(), institution: $('#regApplicantInstitution').value.trim(),
          department: $('#regApplicantDepartment').value.trim(), country: $('#regApplicantCountry').value.trim(),
          phone: $('#regApplicantPhone').value.trim(), orcid: $('#regApplicantOrcid').value.trim(),
          purpose: $('#regApplicantPurpose').value.trim()
        }
      };
      state.users.push(user);
      saveState();
      saveSession({ role: 'applicant', userId: user.id, loginAt: nowIso() });
      $('#applicantMessage').textContent = 'Applicant account created.';
      showApp();
    };

    $('#validatorRegisterForm').onsubmit = async (event) => {
      event.preventDefault();
      const email = $('#regValidatorEmail').value.trim().toLowerCase();
      if (state.users.some(u => u.email.toLowerCase() === email && u.role === 'validator')) {
        $('#validatorMessage').textContent = 'This validator email is already registered.';
        return;
      }
      const sig = await readFileAsDataUrl($('#regValidatorSignature').files[0]);
      const user = {
        id: uid('user'), role: 'validator', email,
        pinHash: hashPin($('#regValidatorPin').value), status: 'pending', createdAt: nowIso(), updatedAt: nowIso(),
        profile: {
          fullName: $('#regValidatorName').value.trim(), degree: $('#regValidatorDegree').value.trim(),
          affiliation: $('#regValidatorAffiliation').value.trim(), department: $('#regValidatorDepartment').value.trim(),
          country: $('#regValidatorCountry').value.trim(), years: $('#regValidatorYears').value.trim(),
          fields: $('#regValidatorFields').value.trim(), methods: $('#regValidatorMethods').value.trim(),
          conflict: $('#regValidatorConflict').value.trim(), signatureData: sig || '', signatureText: $('#regValidatorName').value.trim()
        }
      };
      state.users.push(user);
      saveState();
      saveSession({ role: 'validator', userId: user.id, loginAt: nowIso() });
      $('#validatorMessage').textContent = 'Validator profile submitted. Admin verification is required before validation scoring.';
      showApp();
    };
  }

  function bindAppShell() {
    if (appShellBound) return;
    appShellBound = true;
    $('#lockBtn').onclick = () => { saveSession(null); showAccess(); };
    $('#activeProject').onchange = (event) => { state.activeProjectId = event.target.value || null; saveState(); renderAll(); };
    $('#newProjectQuick').onclick = () => {
      if (!isApplicant() && !isAdmin()) { toast('Only applicants or admin can create projects.'); return; }
      createNewProject();
    };
    document.body.addEventListener('click', globalClick, { passive: false });
  }

  function buildNav() {
    const nav = $('#mainNav');
    const allowed = permissions[session.role] || [];
    nav.innerHTML = allowed.map(id => `<button class="nav-btn ${id === activeView ? 'active' : ''}" data-view="${id}">${views[id]}</button>`).join('');
    nav.querySelectorAll('[data-view]').forEach(btn => btn.onclick = () => showView(btn.dataset.view));
  }

  function showView(id) {
    const allowed = permissions[session.role] || [];
    if (!allowed.includes(id)) id = allowed[0] || 'dashboard';
    activeView = id;
    $$('.view').forEach(v => v.classList.toggle('active', v.id === id));
    $$('.nav-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.view === id));
    $('#pageTitle').textContent = views[id] || 'Dashboard';
    renderView(id);
  }

  function renderAll() {
    renderIdentity();
    renderProjectSelect();
    buildNav();
    renderView(activeView);
  }

  function renderView(id) {
    const renderers = {
      dashboard: renderDashboard,
      metadata: renderMetadata,
      instrument: renderInstrument,
      validators: renderValidators,
      expert: renderExpert,
      revision: renderRevision,
      pilot: renderPilot,
      ethics: () => renderChecklistView('ethics'),
      methodology: () => renderChecklistView('methodology'),
      manuscript: () => renderChecklistView('manuscript'),
      reports: renderReports,
      validatorProfile: renderValidatorProfile,
      admin: renderAdmin
    };
    if (renderers[id]) renderers[id]();
  }

  function renderIdentity() {
    const user = currentUser();
    $('#roleBadge').textContent = `${String(session?.role || '').toUpperCase()}${user?.status ? ' • ' + user.status.toUpperCase() : ''}`;
    const p = currentProject();
    const applicant = p ? state.users.find(u => u.id === p.applicantUserId) : null;
    $('#contextLine').textContent = user ? `${userDisplay(user)} • ${String(session.role).toUpperCase()}` : 'Integrated Research Validation System';
    $('#identityStrip').innerHTML = `
      <div class="identity-item"><span>User</span><strong>${safe(userDisplay(user))}</strong></div>
      <div class="identity-item"><span>Active Project No.</span><strong>${safe(p?.projectNo || 'No project selected')}</strong></div>
      <div class="identity-item"><span>Applicant</span><strong>${safe(applicant ? userDisplay(applicant) : '-')}</strong></div>
      <div class="identity-item"><span>Status</span><strong>${safe(p?.status || user?.status || '-')}</strong></div>`;
  }

  function renderProjectSelect() {
    const projects = userProjects();
    const select = $('#activeProject');
    select.innerHTML = projects.length ? projects.map(p => `<option value="${p.id}" ${p.id === state.activeProjectId ? 'selected' : ''}>${safe(p.projectNo)} — ${safe(p.metadata?.title || 'Untitled')}</option>`).join('') : '<option value="">No project</option>';
    $('#projectSwitcherWrap').style.display = projects.length ? 'grid' : 'none';
    $('#newProjectQuick').style.display = (isApplicant() || isAdmin()) ? 'inline-flex' : 'none';
  }

  function renderDashboard() {
    const el = $('#dashboard');
    const projects = userProjects();
    const p = currentProject();
    const scores = getScores(p);
    const pendingValidators = state.users.filter(u => u.role === 'validator' && u.status !== 'verified').length;
    let roleNotice = '';
    if (isValidator()) {
      const u = currentUser();
      if (u.status !== 'verified') roleNotice = `<article class="notice">Your validator account is ${safe(u.status)}. You can complete your validator profile, but scoring is locked until admin verification.</article>`;
    }
    if (!projects.length && (isApplicant() || isAdmin())) {
      roleNotice += `<article class="notice">No project exists for this account. Start by creating the detailed project metadata. The unique project number will be generated automatically.</article>`;
    }
    el.innerHTML = `
      ${roleNotice}
      <div class="metrics-grid">
        <article class="metric-card glass"><span>Accessible Projects</span><strong>${projects.length}</strong></article>
        <article class="metric-card glass"><span>Verified Validators</span><strong>${state.users.filter(u => u.role === 'validator' && u.status === 'verified').length}</strong></article>
        <article class="metric-card glass"><span>Pending Verification</span><strong>${pendingValidators}</strong></article>
        <article class="metric-card glass"><span>Publication Readiness</span><strong>${scores.publication}%</strong></article>
      </div>
      <div class="two-col wide-left">
        <article class="panel glass">
          <div class="panel-head"><h3>Active Project Readiness</h3><button class="soft" data-jump="reports">Open Report</button></div>
          ${p ? readinessBarsHtml(scores) : `<p>No active project selected.</p><button class="primary" data-jump="metadata">Create Project Metadata</button>`}
        </article>
        <article class="panel glass">
          <h3>Role-Based Access</h3>
          ${roleAccessHtml()}
        </article>
      </div>
      <article class="panel glass">
        <div class="panel-head"><h3>Accessible Projects</h3><button class="primary" data-jump="metadata">Create / Edit Metadata</button></div>
        ${projectCardsHtml(projects)}
      </article>`;
  }

  function roleAccessHtml() {
    if (isAdmin()) return `<p>Admin can inspect all projects, verify validator accounts, assign or remove validators, validate each stage status, export/import data, and change admin PIN.</p>`;
    if (isApplicant()) return `<p>Applicant can create project metadata, register instruments, invite verified validators, manage pilot testing, complete ethics/methodology/manuscript checklists, and export reports.</p>`;
    return `<p>Validator can complete a professional profile, upload or draw a digital signature, review assigned projects, score instruments, add comments, and sign the validation report.</p>`;
  }

  function readinessBarsHtml(scores) {
    const rows = [
      ['Metadata', scores.metadata], ['Instrument Validity', scores.instrument], ['Pilot/Reliability', scores.reliability],
      ['Ethics', scores.ethics], ['Methodology', scores.methodology], ['Manuscript', scores.manuscript], ['Publication', scores.publication]
    ];
    return rows.map(([name, value]) => `<div class="score-row"><strong>${name}</strong><meter min="0" max="100" value="${value}"></meter><span>${value}%</span></div>`).join('') +
      `<p class="muted">Status recommendation: <strong>${safe(readinessLabel(scores.publication))}</strong></p>`;
  }

  function projectCardsHtml(projects) {
    if (!projects.length) return '<p>No projects found.</p>';
    return `<div class="card-grid">${projects.map(p => {
      const s = getScores(p);
      const complete = isMetadataComplete(p);
      return `<article class="info-card">
        <h4>${safe(p.metadata?.title || 'Untitled Project')}</h4>
        <p><strong>${safe(p.projectNo)}</strong></p>
        <p class="muted">${safe(p.metadata?.researchDesign || 'No design')} • ${safe(p.status || '')}</p>
        <span class="badge ${complete ? 'good' : 'warn'}">${complete ? 'Metadata complete' : 'Metadata incomplete'}</span>
        <span class="badge ${s.publication >= 80 ? 'good' : s.publication >= 55 ? 'warn' : 'bad'}">${s.publication}% readiness</span>
        <div class="actions"><button class="soft" data-select-project="${p.id}">Open</button><button class="ghost" data-report-project="${p.id}">Report</button></div>
      </article>`;
    }).join('')}</div>`;
  }

  function renderMetadata() {
    const el = $('#metadata');
    let p = currentProject();
    if (!p && (isApplicant() || isAdmin())) {
      el.innerHTML = `<article class="panel glass"><h3>Create First Project Metadata</h3><p>The project number is generated automatically when you click the button below.</p><button id="createBlankProject" class="primary">Create New Validation Project</button></article>`;
      $('#createBlankProject').onclick = createNewProject;
      return;
    }
    if (!p) { el.innerHTML = '<article class="panel glass"><p>No assigned project is available.</p></article>'; return; }
    const m = p.metadata || {};
    const canEdit = isAdmin() || (isApplicant() && p.applicantUserId === session.userId);
    el.innerHTML = `
      <article class="panel glass">
        <div class="panel-head"><div><h3>Integrated Project Metadata</h3><p>All later validation stages will use this first metadata record. Project number is automatic and unique.</p></div><span class="badge good">${safe(p.projectNo)}</span></div>
        <form id="metadataForm" class="form-grid">
          ${input('Project Number', 'mProjectNo', p.projectNo, true)}
          ${input('Project Title', 'mTitle', m.title)}
          ${input('Principal Investigator', 'mPI', m.principalInvestigator)}
          ${input('PI Email', 'mPiEmail', m.piEmail, false, 'email')}
          ${input('Institution', 'mInstitution', m.institution)}
          ${input('Department / Faculty', 'mDepartment', m.department)}
          ${input('Country / Region', 'mCountry', m.country)}
          ${input('Research Field', 'mField', m.field)}
          <label>Research Design<select id="mDesign" ${canEdit ? '' : 'disabled'}>${optionList(['Quantitative Survey / Scale Validation','Qualitative Case Study','Sequential Mixed-Methods','Concurrent Mixed-Methods','Quasi-Experimental','Experimental','Research and Development','Design-Based Research','Classroom Action Research','Corpus / Document Analysis'], m.researchDesign)}</select></label>
          ${input('Target Output / Journal', 'mTargetOutput', m.targetOutput)}
          ${input('Target Participants / Sample', 'mParticipants', m.participants)}
          ${input('Sampling Technique', 'mSampling', m.sampling)}
          ${input('Study Site / Context', 'mSite', m.site)}
          ${input('Planned Data Collection Date', 'mDate', m.dataDate)}
          ${input('Keywords', 'mKeywords', m.keywords)}
          <label class="full-span">Research Purpose / Contribution<textarea id="mPurpose" rows="4" ${canEdit ? '' : 'disabled'}>${safe(m.purpose || '')}</textarea></label>
          <label class="full-span">Research Questions<textarea id="mQuestions" rows="4" ${canEdit ? '' : 'disabled'}>${safe(m.researchQuestions || '')}</textarea></label>
          <label class="full-span">Constructs / Variables / Phenomena<textarea id="mConstructs" rows="3" ${canEdit ? '' : 'disabled'}>${safe(m.constructs || '')}</textarea></label>
          <label class="full-span">Planned Instruments / Data Sources<textarea id="mDataSources" rows="3" ${canEdit ? '' : 'disabled'}>${safe(m.dataSources || '')}</textarea></label>
          <label class="full-span">Data Analysis Plan<textarea id="mAnalysis" rows="4" ${canEdit ? '' : 'disabled'}>${safe(m.analysisPlan || '')}</textarea></label>
          <label class="full-span">Ethics / Data Protection Notes<textarea id="mEthicsNotes" rows="3" ${canEdit ? '' : 'disabled'}>${safe(m.ethicsNotes || '')}</textarea></label>
          <div class="form-actions full-span">
            ${canEdit ? '<button type="submit" class="primary">Save Integrated Metadata</button>' : ''}
            <button type="button" class="soft" data-jump="instrument">Next: Instrument Studio</button>
          </div>
        </form>
      </article>`;
    const form = $('#metadataForm');
    if (canEdit) form.onsubmit = saveMetadata;
  }

  function input(labelText, id, value = '', disabled = false, type = 'text') {
    return `<label>${labelText}<input id="${id}" type="${type}" value="${safe(value || '')}" ${disabled ? 'disabled' : ''} /></label>`;
  }

  function optionList(options, selected) {
    return options.map(o => `<option ${o === selected ? 'selected' : ''}>${safe(o)}</option>`).join('');
  }

  function createNewProject() {
    const ownerId = isApplicant() ? session.userId : (state.users.find(u => u.role === 'applicant')?.id || 'admin');
    const p = makeBlankProject(ownerId);
    const applicant = state.users.find(u => u.id === ownerId);
    if (applicant?.profile) {
      p.metadata.principalInvestigator = applicant.profile.fullName || '';
      p.metadata.piEmail = applicant.email || '';
      p.metadata.institution = applicant.profile.institution || '';
      p.metadata.department = applicant.profile.department || '';
      p.metadata.country = applicant.profile.country || '';
    }
    state.projects.unshift(p);
    state.activeProjectId = p.id;
    saveState();
    renderAll();
    showView('metadata');
    toast(`Created ${p.projectNo}`);
  }

  function saveMetadata(event) {
    event.preventDefault();
    const p = currentProject();
    if (!p) return;
    p.metadata = {
      ...p.metadata,
      projectNo: p.projectNo,
      title: $('#mTitle').value.trim(),
      principalInvestigator: $('#mPI').value.trim(),
      piEmail: $('#mPiEmail').value.trim(),
      institution: $('#mInstitution').value.trim(),
      department: $('#mDepartment').value.trim(),
      country: $('#mCountry').value.trim(),
      field: $('#mField').value.trim(),
      researchDesign: $('#mDesign').value,
      targetOutput: $('#mTargetOutput').value.trim(),
      participants: $('#mParticipants').value.trim(),
      sampling: $('#mSampling').value.trim(),
      site: $('#mSite').value.trim(),
      dataDate: $('#mDate').value.trim(),
      keywords: $('#mKeywords').value.trim(),
      purpose: $('#mPurpose').value.trim(),
      researchQuestions: $('#mQuestions').value.trim(),
      constructs: $('#mConstructs').value.trim(),
      dataSources: $('#mDataSources').value.trim(),
      analysisPlan: $('#mAnalysis').value.trim(),
      ethicsNotes: $('#mEthicsNotes').value.trim()
    };
    p.status = isMetadataComplete(p) ? 'Metadata Complete' : 'Metadata Draft';
    p.updatedAt = nowIso();
    saveState();
    renderAll();
    toast('Project metadata saved and integrated into all stages.');
  }

  function renderInstrument() {
    const el = $('#instrument');
    const p = currentProject();
    if (!isMetadataComplete(p)) { el.innerHTML = stageLockedHtml(); return; }
    const canEdit = isAdmin() || isApplicant();
    const ins = p.instrument || {};
    el.innerHTML = `
      <div class="two-col wide-left">
        <article class="panel glass">
          <h3>Instrument Registration</h3>
          <form id="instrumentForm" class="form-grid">
            ${input('Instrument Name', 'iName', ins.name, !canEdit)}
            <label>Instrument Type<select id="iType" ${canEdit ? '' : 'disabled'}>${optionList(['Questionnaire / Scale','Interview Protocol','Observation Sheet','Test','Rubric','Checklist','Corpus Coding Scheme','Lesson/Product Evaluation Form','Mixed Instrument Package'], ins.type)}</select></label>
            ${input('Construct / Dimension', 'iConstruct', ins.construct, !canEdit)}
            ${input('Intended Respondents', 'iRespondents', ins.respondents, !canEdit)}
            ${input('Number of Items', 'iItemCount', ins.itemCount, !canEdit, 'number')}
            <label>Scale Points<select id="iScale" ${canEdit ? '' : 'disabled'}>${optionList(['2','3','4','5','6','7','10','Open-ended / Qualitative'], ins.scalePoints)}</select></label>
            ${input('Scoring / Coding System', 'iScoring', ins.scoring, !canEdit)}
            ${input('Language', 'iLanguage', ins.language, !canEdit)}
            <label class="full-span">Instrument File<input id="iFile" type="file" accept=".txt,.csv,.doc,.docx,.pdf,.xlsx,.xls,.png,.jpg,.jpeg" ${canEdit ? '' : 'disabled'} /></label>
            <label class="full-span">Description<textarea id="iDesc" rows="4" ${canEdit ? '' : 'disabled'}>${safe(ins.description || '')}</textarea></label>
            <div class="form-actions full-span">${canEdit ? '<button class="primary" type="submit">Save Instrument Metadata</button>' : ''}</div>
          </form>
          ${ins.fileName ? `<p class="muted">Registered file: ${safe(ins.fileName)} (${safe(ins.fileType || 'file')})</p>` : ''}
        </article>
        <article class="panel glass">
          <div class="panel-head"><h3>Instrument Items</h3>${canEdit ? '<button id="addSuggestedItems" class="soft">Add Professional Item Set</button>' : ''}</div>
          ${canEdit ? `<form id="itemForm" class="compact-form"><input id="itemCode" placeholder="Code" /><input id="itemConstruct" placeholder="Construct" /><input id="itemText" placeholder="Item statement / descriptor" /><button class="primary" type="submit">Add Item</button></form>` : ''}
          <div class="table-wrap"><table>${itemsTableHtml(p, canEdit)}</table></div>
        </article>
      </div>`;
    if (canEdit) {
      $('#instrumentForm').onsubmit = saveInstrument;
      $('#itemForm').onsubmit = addItem;
      $('#addSuggestedItems').onclick = addSuggestedItems;
    }
  }

  async function saveInstrument(event) {
    event.preventDefault();
    const p = currentProject();
    const file = $('#iFile').files[0];
    p.instrument = {
      ...(p.instrument || {}),
      name: $('#iName').value.trim(), type: $('#iType').value, construct: $('#iConstruct').value.trim(),
      respondents: $('#iRespondents').value.trim(), itemCount: $('#iItemCount').value, scalePoints: $('#iScale').value,
      scoring: $('#iScoring').value.trim(), language: $('#iLanguage').value.trim(), description: $('#iDesc').value.trim(),
      fileName: file?.name || p.instrument?.fileName || '', fileType: file?.type || p.instrument?.fileType || '', fileSize: file?.size || p.instrument?.fileSize || ''
    };
    p.updatedAt = nowIso();
    saveState(); renderAll(); toast('Instrument metadata saved.');
  }

  function addItem(event) {
    event.preventDefault();
    const p = currentProject();
    const text = $('#itemText').value.trim();
    if (!text) return;
    p.items.push({ id: uid('item'), code: $('#itemCode').value.trim() || `I${p.items.length+1}`, construct: $('#itemConstruct').value.trim(), text, createdAt: nowIso() });
    p.instrument = p.instrument || {};
    p.instrument.itemCount = p.items.length;
    saveState(); renderInstrument(); toast('Item added.');
  }

  function addSuggestedItems() {
    const p = currentProject();
    const seed = [
      ['RQ1', 'Construct alignment', 'The item directly represents the intended construct and does not measure unrelated abilities.'],
      ['RQ2', 'Clarity', 'The wording is clear, concise, and understandable for the target participants.'],
      ['RQ3', 'Cultural appropriateness', 'The item is culturally appropriate and free from sensitive or biased assumptions.'],
      ['RQ4', 'Scoring validity', 'The score or category generated by the item can support the planned analysis.'],
      ['RQ5', 'Ethical suitability', 'The item does not expose participants to unnecessary risk, stigma, or discomfort.']
    ];
    seed.forEach(([code, construct, text]) => p.items.push({ id: uid('item'), code, construct, text, createdAt: nowIso() }));
    p.instrument = p.instrument || {}; p.instrument.itemCount = p.items.length;
    saveState(); renderInstrument(); toast('Professional item set added.');
  }

  function itemsTableHtml(p, canEdit = false) {
    if (!p.items.length) return '<tr><td>No items registered yet.</td></tr>';
    return `<thead><tr><th>Code</th><th>Construct</th><th>Item</th><th>Status</th>${canEdit ? '<th>Action</th>' : ''}</tr></thead><tbody>${p.items.map(item => {
      const stat = calculateItemStats(p, item.id);
      return `<tr><td>${safe(item.code)}</td><td>${safe(item.construct)}</td><td>${safe(item.text)}</td><td><span class="badge ${stat.aiken >= .8 ? 'good' : stat.aiken >= .6 ? 'warn' : 'bad'}">Aiken ${stat.aiken ? stat.aiken.toFixed(2) : '-'}</span></td>${canEdit ? `<td><button class="danger" data-delete-item="${item.id}">Delete</button></td>` : ''}</tr>`;
    }).join('')}</tbody>`;
  }

  function renderValidators() {
    const el = $('#validators');
    const p = currentProject();
    if (!isMetadataComplete(p)) { el.innerHTML = stageLockedHtml(); return; }
    if (!isAdmin() && !isApplicant()) { el.innerHTML = '<article class="panel glass"><p>This page is available only to project applicants and admin.</p></article>'; return; }
    const validators = state.users.filter(u => u.role === 'validator');
    const verified = validators.filter(u => u.status === 'verified');
    el.innerHTML = `
      <div class="two-col wide-left">
        <article class="panel glass">
          <h3>Assign Verified Validators</h3>
          <p class="muted">Only verified validators can be assigned for formal expert validation and digital signing.</p>
          <div class="table-wrap"><table><thead><tr><th>Assign</th><th>Validator</th><th>Expertise</th><th>Status</th></tr></thead><tbody>
            ${verified.length ? verified.map(v => `<tr><td><input type="checkbox" data-assign-validator="${v.id}" ${(p.assignments || []).includes(v.id) ? 'checked' : ''}></td><td>${safe(userDisplay(v))}<br><span class="muted">${safe(v.email)}</span></td><td>${safe(v.profile?.fields || '-')}</td><td><span class="badge good">Verified</span></td></tr>`).join('') : '<tr><td colspan="4">No verified validators yet. Admin must verify validator registrations first.</td></tr>'}
          </tbody></table></div>
        </article>
        <article class="panel glass">
          <h3>Assigned Validators</h3>
          ${assignedValidatorsHtml(p)}
        </article>
      </div>`;
    $$('[data-assign-validator]').forEach(cb => cb.onchange = (e) => {
      p.assignments = p.assignments || [];
      if (e.target.checked && !p.assignments.includes(e.target.dataset.assignValidator)) p.assignments.push(e.target.dataset.assignValidator);
      if (!e.target.checked) p.assignments = p.assignments.filter(id => id !== e.target.dataset.assignValidator);
      p.updatedAt = nowIso(); saveState(); renderValidators(); toast('Validator assignment updated.');
    });
  }

  function assignedValidatorsHtml(p) {
    const assigned = (p.assignments || []).map(id => state.users.find(u => u.id === id)).filter(Boolean);
    if (!assigned.length) return '<p>No validator assigned yet.</p>';
    return `<div class="card-grid">${assigned.map(v => `<article class="info-card"><h4>${safe(userDisplay(v))}</h4><p>${safe(v.profile?.affiliation || '-')}</p><p class="muted">${safe(v.profile?.methods || '')}</p>${v.profile?.signatureData ? `<img class="signature-preview" src="${v.profile.signatureData}" alt="Digital signature of ${safe(userDisplay(v))}">` : '<span class="badge warn">No signature uploaded</span>'}</article>`).join('')}</div>`;
  }

  function renderExpert() {
    const el = $('#expert');
    const p = currentProject();
    if (!isMetadataComplete(p)) { el.innerHTML = stageLockedHtml(); return; }
    if (isValidator()) {
      const user = currentUser();
      if (user.status !== 'verified') { el.innerHTML = '<article class="notice">Your validator account must be verified by admin before scoring assigned projects.</article>'; return; }
      if (!p || !(p.assignments || []).includes(user.id)) { el.innerHTML = '<article class="panel glass"><p>No assigned project is selected for this validator account.</p></article>'; return; }
    }
    if (!p.items.length) { el.innerHTML = '<article class="notice">Register instrument items before expert validation.</article>'; return; }
    const editableValidatorIds = isValidator() ? [session.userId] : (p.assignments || []);
    const assigned = editableValidatorIds.map(id => state.users.find(u => u.id === id)).filter(Boolean);
    el.innerHTML = `
      <article class="panel glass">
        <div class="panel-head"><div><h3>Expert-Review Scoring</h3><p>Scores: 1 = not valid, 2 = major revision, 3 = minor revision, 4 = highly valid. Aiken’s V and CVI are calculated automatically from validator scores.</p></div><span class="badge">${assigned.length} validator(s)</span></div>
        ${assigned.length ? assigned.map(v => validationFormHtml(p, v)).join('') : '<p>No assigned validators. Assign verified validators first.</p>'}
      </article>
      <article class="panel glass"><h3>Live Validity Summary</h3>${validitySummaryHtml(p)}</article>`;
    assigned.forEach(v => bindValidationForm(p, v));
  }

  function validationFormHtml(p, v) {
    const review = p.validatorReviews?.[v.id] || {};
    return `<div class="info-card" style="margin-bottom:14px">
      <h4>${safe(userDisplay(v))}</h4>
      <p class="muted">${safe(v.profile?.affiliation || '')} • ${safe(v.profile?.fields || '')}</p>
      <div class="table-wrap"><table><thead><tr><th>Item</th>${ratingDimensions.map(d => `<th>${d[1]}</th>`).join('')}<th>Comment</th></tr></thead><tbody>
        ${p.items.map(item => `<tr><td><strong>${safe(item.code)}</strong><br>${safe(item.text)}</td>${ratingDimensions.map(([key]) => `<td><select data-rating="${v.id}|${item.id}|${key}">${[0,1,2,3,4].map(n => `<option value="${n}" ${getRating(p, v.id, item.id, key) === n ? 'selected' : ''}>${n || '-'}</option>`).join('')}</select></td>`).join('')}<td><textarea rows="2" data-item-comment="${v.id}|${item.id}">${safe(p.revisionNotes?.[`${v.id}|${item.id}`] || '')}</textarea></td></tr>`).join('')}
      </tbody></table></div>
      <div class="form-grid" style="margin-top:12px">
        <label>Overall Recommendation<select data-review-rec="${v.id}">${optionList(['Pending','Accepted as valid','Accepted with minor revision','Major revision required','Rejected / not valid'], review.recommendation || 'Pending')}</select></label>
        <label>Digital Signature Status<input disabled value="${v.profile?.signatureData ? 'Signature uploaded' : 'No signature uploaded'}"></label>
        <label class="full-span">Validator Summary<textarea rows="3" data-review-summary="${v.id}">${safe(review.summary || '')}</textarea></label>
      </div>
      <div class="form-actions"><button class="primary" data-save-review="${v.id}">Save ${safe(userDisplay(v))} Review</button></div>
    </div>`;
  }

  function bindValidationForm(p, v) {
    $$(`[data-save-review="${v.id}"]`).forEach(btn => btn.onclick = () => {
      $$(`[data-rating^="${v.id}|"]`).forEach(select => {
        const [, itemId, key] = select.dataset.rating.split('|');
        p.ratings[`${v.id}|${itemId}|${key}`] = Number(select.value);
      });
      $$(`[data-item-comment^="${v.id}|"]`).forEach(area => { p.revisionNotes[area.dataset.itemComment] = area.value.trim(); });
      p.validatorReviews[v.id] = {
        recommendation: $(`[data-review-rec="${v.id}"]`).value,
        summary: $(`[data-review-summary="${v.id}"]`).value.trim(),
        signedAt: nowIso()
      };
      p.updatedAt = nowIso(); saveState(); renderExpert(); toast('Validator review saved.');
    });
  }

  function getRating(p, validatorId, itemId, key) {
    return Number(p?.ratings?.[`${validatorId}|${itemId}|${key}`] || 0);
  }

  function calculateItemStats(p, itemId) {
    const validators = (p.assignments || []).map(id => state.users.find(u => u.id === id && u.status === 'verified')).filter(Boolean);
    const relevance = validators.map(v => getRating(p, v.id, itemId, 'relevance')).filter(n => n > 0);
    const all = [];
    validators.forEach(v => ratingDimensions.forEach(([key]) => { const n = getRating(p, v.id, itemId, key); if (n > 0) all.push(n); }));
    const low = 1, high = 4;
    const aiken = relevance.length ? relevance.reduce((sum, n) => sum + (n - low), 0) / (relevance.length * (high - low)) : 0;
    const cvi = relevance.length ? relevance.filter(n => n >= 3).length / relevance.length : 0;
    const agreement = all.length ? all.filter(n => n >= 3).length / all.length : 0;
    return { aiken, cvi, agreement, n: relevance.length };
  }

  function calculateValidation(p) {
    if (!p || !p.items?.length) return { aiken: 0, cvi: 0, agreement: 0, itemStats: [] };
    const itemStats = p.items.map(item => ({ ...calculateItemStats(p, item.id), itemId: item.id }));
    return { aiken: mean(itemStats.map(s => s.aiken)), cvi: mean(itemStats.map(s => s.cvi)), agreement: mean(itemStats.map(s => s.agreement)), itemStats };
  }

  function validitySummaryHtml(p) {
    const v = calculateValidation(p);
    const rows = p.items.map(item => {
      const s = calculateItemStats(p, item.id);
      return `<tr><td>${safe(item.code)}</td><td>${safe(item.construct)}</td><td>${s.aiken.toFixed(3)}</td><td>${s.cvi.toFixed(3)}</td><td>${s.agreement.toFixed(3)}</td><td>${validityDecision(s.aiken)}</td></tr>`;
    }).join('');
    return `${readinessBarsHtml({ metadata: getScores(p).metadata, instrument: Math.round(((v.aiken*.55)+(v.cvi*.45))*100), reliability: getScores(p).reliability, ethics: getScores(p).ethics, methodology: getScores(p).methodology, manuscript: getScores(p).manuscript, publication: getScores(p).publication })}<div class="table-wrap"><table><thead><tr><th>Item</th><th>Construct</th><th>Aiken V</th><th>I-CVI</th><th>Agreement</th><th>Decision</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  function validityDecision(v) {
    if (!v) return 'Pending';
    if (v >= .80) return 'Strong';
    if (v >= .60) return 'Revise minor/moderate';
    return 'Major revision';
  }

  function renderRevision() {
    const el = $('#revision');
    const p = currentProject();
    if (!isMetadataComplete(p)) { el.innerHTML = stageLockedHtml(); return; }
    if (!p.items.length) { el.innerHTML = '<article class="notice">Add instrument items before revision tracking.</article>'; return; }
    const canEdit = isApplicant() || isAdmin();
    el.innerHTML = `<article class="panel glass"><h3>Item Revision Board</h3><div class="table-wrap"><table><thead><tr><th>Item</th><th>Validator Comments</th><th>Revision Action</th><th>Status</th></tr></thead><tbody>${p.items.map(item => {
      const comments = Object.entries(p.revisionNotes || {}).filter(([key]) => key.includes(`|${item.id}`)).map(([key, val]) => {
        const vid = key.split('|')[0]; const user = state.users.find(u => u.id === vid);
        return `<p><strong>${safe(userDisplay(user))}:</strong> ${safe(val || '-')}</p>`;
      }).join('') || '<span class="muted">No comments yet.</span>';
      const revised = p.revisedItems?.[item.id] || {};
      return `<tr><td><strong>${safe(item.code)}</strong><br>${safe(item.text)}</td><td>${comments}</td><td><textarea rows="3" data-revision-note="${item.id}" ${canEdit ? '' : 'disabled'}>${safe(revised.note || '')}</textarea></td><td><select data-revision-status="${item.id}" ${canEdit ? '' : 'disabled'}>${optionList(['Pending','Revised','Retained with justification','Deleted','Needs further validation'], revised.status || 'Pending')}</select></td></tr>`;
    }).join('')}</tbody></table></div>${canEdit ? '<div class="form-actions" style="margin-top:12px"><button id="saveRevisions" class="primary">Save Revision Board</button></div>' : ''}</article>`;
    if (canEdit) $('#saveRevisions').onclick = () => {
      $$('[data-revision-note]').forEach(area => {
        const id = area.dataset.revisionNote;
        p.revisedItems[id] = { ...(p.revisedItems[id] || {}), note: area.value.trim(), status: $(`[data-revision-status="${id}"]`).value };
      });
      p.updatedAt = nowIso(); saveState(); renderRevision(); toast('Revision board saved.');
    };
  }

  function renderPilot() {
    const el = $('#pilot');
    const p = currentProject();
    if (!isMetadataComplete(p)) { el.innerHTML = stageLockedHtml(); return; }
    const canEdit = isApplicant() || isAdmin();
    const pilot = { ...defaultPilot(), ...(p.pilot || {}) };
    const q = pilot.qualitativeTrust || defaultPilot().qualitativeTrust;
    const rd = pilot.rdUsability || defaultPilot().rdUsability;
    el.innerHTML = `
      <article class="panel glass">
        <div class="panel-head"><div><h3>Specific Pilot Testing & Reliability Plan</h3><p>Use the appropriate reliability or trustworthiness evidence for the actual research type. The report will include the details below.</p></div><span class="badge">${safe(p.metadata.researchDesign)}</span></div>
        <form id="pilotForm" class="form-grid">
          <label>Research / Validation Type<select id="pResearchType" ${canEdit ? '' : 'disabled'}>${optionList(['Quantitative Survey / Scale Validation','Achievement Test / Dichotomous Items','Rubric / Performance Assessment','Inter-rater Qualitative Coding','Test-Retest Stability Study','Split-Half Internal Consistency','Qualitative Interview / Case Study','Mixed-Methods Pilot','Research and Development / Product Trial','Corpus / Document Coding'], pilot.researchType)}</select></label>
          ${input('Pilot Sample Size', 'pSample', pilot.pilotSample, !canEdit, 'number')}
          ${input('Population / Context', 'pPopulation', pilot.population, !canEdit)}
          ${input('Pilot Setting', 'pSetting', pilot.setting, !canEdit)}
          ${input('Inclusion Criteria', 'pInclusion', pilot.inclusion, !canEdit)}
          ${input('Exclusion Criteria', 'pExclusion', pilot.exclusion, !canEdit)}
          <label class="full-span">Pilot Purpose<textarea id="pPurpose" rows="3" ${canEdit ? '' : 'disabled'}>${safe(pilot.pilotPurpose || '')}</textarea></label>
          <label class="full-span">Data Sources / Instruments Tested<textarea id="pDataSource" rows="3" ${canEdit ? '' : 'disabled'}>${safe(pilot.dataSource || '')}</textarea></label>
          <label class="full-span">Interpretation of Pilot Findings<textarea id="pInterpretation" rows="3" ${canEdit ? '' : 'disabled'}>${safe(pilot.interpretation || '')}</textarea></label>
          <label class="full-span">Pilot Limitations<textarea id="pLimitations" rows="3" ${canEdit ? '' : 'disabled'}>${safe(pilot.limitations || '')}</textarea></label>
          <label class="full-span">Next Action After Pilot<textarea id="pNextAction" rows="3" ${canEdit ? '' : 'disabled'}>${safe(pilot.nextAction || '')}</textarea></label>
          <div class="form-actions full-span">${canEdit ? '<button class="primary" type="submit">Save Pilot Metadata</button>' : ''}</div>
        </form>
      </article>
      <div class="two-col">
        <article class="panel glass"><h3>Cronbach’s Alpha</h3><p>For Likert-type multi-item scales. Paste rows as participants and columns as items, separated by comma, tab, or semicolon.</p><textarea id="cronbachCsv" rows="8" ${canEdit ? '' : 'disabled'}>${safe(pilot.cronbachCsv || '')}</textarea><div class="form-actions"><button class="soft" id="calcAlpha">Calculate Alpha</button></div><div id="alphaResult">${alphaResultHtml(pilot)}</div></article>
        <article class="panel glass"><h3>KR-20</h3><p>For dichotomous test items scored 0/1.</p><textarea id="kr20Csv" rows="8" ${canEdit ? '' : 'disabled'}>${safe(pilot.kr20Csv || '')}</textarea><div class="form-actions"><button class="soft" id="calcKr20">Calculate KR-20</button></div><div id="kr20Result">${kr20ResultHtml(pilot)}</div></article>
      </div>
      <div class="two-col">
        <article class="panel glass"><h3>Inter-Rater Reliability</h3><p>For two raters/coders. Paste two columns: rater 1, rater 2.</p><textarea id="kappaCsv" rows="7" ${canEdit ? '' : 'disabled'}>${safe(pilot.kappaCsv || '')}</textarea><div class="form-actions"><button class="soft" id="calcKappa">Calculate Agreement + Cohen’s Kappa</button></div><div id="kappaResult">${kappaResultHtml(pilot)}</div></article>
        <article class="panel glass"><h3>Test-Retest Stability</h3><p>Paste two columns: time 1 score, time 2 score.</p><textarea id="testRetestCsv" rows="7" ${canEdit ? '' : 'disabled'}>${safe(pilot.testRetestCsv || '')}</textarea><div class="form-actions"><button class="soft" id="calcTestRetest">Calculate Pearson r</button></div><div id="testRetestResult">${testRetestHtml(pilot)}</div></article>
      </div>
      <div class="two-col">
        <article class="panel glass"><h3>Split-Half Reliability</h3><p>Paste item matrix. Odd/even columns will be split automatically and corrected with Spearman–Brown.</p><textarea id="splitHalfCsv" rows="7" ${canEdit ? '' : 'disabled'}>${safe(pilot.splitHalfCsv || '')}</textarea><div class="form-actions"><button class="soft" id="calcSplitHalf">Calculate Split-Half</button></div><div id="splitHalfResult">${splitHalfHtml(pilot)}</div></article>
        <article class="panel glass"><h3>Qualitative Trustworthiness / R&D Practicality</h3><div class="form-grid"><label>Coders / Interviewers<input id="qCoders" value="${safe(q.coders || '')}" ${canEdit ? '' : 'disabled'}></label><label>Transcript / Document Sample<input id="qTranscripts" value="${safe(q.transcripts || '')}" ${canEdit ? '' : 'disabled'}></label><label><input type="checkbox" id="qTriangulation" ${q.triangulation ? 'checked' : ''} ${canEdit ? '' : 'disabled'}> Triangulation</label><label><input type="checkbox" id="qMember" ${q.memberChecking ? 'checked' : ''} ${canEdit ? '' : 'disabled'}> Member checking</label><label><input type="checkbox" id="qAudit" ${q.auditTrail ? 'checked' : ''} ${canEdit ? '' : 'disabled'}> Audit trail</label><label><input type="checkbox" id="qReflex" ${q.reflexivity ? 'checked' : ''} ${canEdit ? '' : 'disabled'}> Reflexivity</label><label><input type="checkbox" id="qSaturation" ${q.saturation ? 'checked' : ''} ${canEdit ? '' : 'disabled'}> Saturation check</label><label>R&D Users<input id="rdUsers" value="${safe(rd.users || '')}" ${canEdit ? '' : 'disabled'}></label><label>Practicality / Usability Score<input id="rdScore" value="${safe(rd.practicalityScore || '')}" ${canEdit ? '' : 'disabled'}></label><label class="full-span">Trustworthiness / R&D Notes<textarea id="qNotes" rows="3" ${canEdit ? '' : 'disabled'}>${safe(q.notes || '')}</textarea></label><label class="full-span">R&D Usability Findings<textarea id="rdFindings" rows="3" ${canEdit ? '' : 'disabled'}>${safe(rd.usabilityFindings || '')}</textarea></label><label class="full-span">R&D Revision Decision<textarea id="rdDecision" rows="3" ${canEdit ? '' : 'disabled'}>${safe(rd.revisionDecision || '')}</textarea></label></div>${canEdit ? '<button id="saveQualRd" class="primary">Save Trustworthiness / R&D Evidence</button>' : ''}</article>
      </div>`;
    if (canEdit) bindPilotCalculators(p);
  }

  function bindPilotCalculators(p) {
    $('#pilotForm').onsubmit = (e) => { e.preventDefault(); savePilotMeta(p); };
    $('#calcAlpha').onclick = () => { savePilotMeta(p, false); const mat = parseMatrix($('#cronbachCsv').value); const r = cronbachAlpha(mat); Object.assign(p.pilot, { cronbachCsv: $('#cronbachCsv').value, cronbachAlpha: r.alpha, cronbachItems: r.items, cronbachCases: r.cases }); saveState(); renderPilot(); };
    $('#calcKr20').onclick = () => { savePilotMeta(p, false); const mat = parseMatrix($('#kr20Csv').value); const r = kr20(mat); Object.assign(p.pilot, { kr20Csv: $('#kr20Csv').value, kr20: r.value, kr20Items: r.items, kr20Cases: r.cases }); saveState(); renderPilot(); };
    $('#calcKappa').onclick = () => { savePilotMeta(p, false); const pairs = parsePairs($('#kappaCsv').value); const r = cohenKappa(pairs); Object.assign(p.pilot, { kappaCsv: $('#kappaCsv').value, kappa: r.kappa, kappaAgreement: r.agreement, kappaCases: r.cases }); saveState(); renderPilot(); };
    $('#calcTestRetest').onclick = () => { savePilotMeta(p, false); const pairs = parsePairs($('#testRetestCsv').value).map(x => [Number(x[0]), Number(x[1])]).filter(x => Number.isFinite(x[0]) && Number.isFinite(x[1])); const r = pearson(pairs.map(x => x[0]), pairs.map(x => x[1])); Object.assign(p.pilot, { testRetestCsv: $('#testRetestCsv').value, testRetestR: r, testRetestCases: pairs.length }); saveState(); renderPilot(); };
    $('#calcSplitHalf').onclick = () => { savePilotMeta(p, false); const r = splitHalf(parseMatrix($('#splitHalfCsv').value)); Object.assign(p.pilot, { splitHalfCsv: $('#splitHalfCsv').value, splitHalfR: r.r, spearmanBrown: r.sb }); saveState(); renderPilot(); };
    $('#saveQualRd').onclick = () => { savePilotMeta(p); toast('Qualitative/R&D evidence saved.'); };
  }

  function savePilotMeta(p, rerender = true) {
    p.pilot = { ...defaultPilot(), ...(p.pilot || {}) };
    Object.assign(p.pilot, {
      researchType: $('#pResearchType')?.value || p.pilot.researchType,
      pilotSample: $('#pSample')?.value || '', population: $('#pPopulation')?.value || '', setting: $('#pSetting')?.value || '',
      inclusion: $('#pInclusion')?.value || '', exclusion: $('#pExclusion')?.value || '', pilotPurpose: $('#pPurpose')?.value || '',
      dataSource: $('#pDataSource')?.value || '', interpretation: $('#pInterpretation')?.value || '', limitations: $('#pLimitations')?.value || '', nextAction: $('#pNextAction')?.value || '',
      cronbachCsv: $('#cronbachCsv')?.value || p.pilot.cronbachCsv,
      kr20Csv: $('#kr20Csv')?.value || p.pilot.kr20Csv,
      kappaCsv: $('#kappaCsv')?.value || p.pilot.kappaCsv,
      testRetestCsv: $('#testRetestCsv')?.value || p.pilot.testRetestCsv,
      splitHalfCsv: $('#splitHalfCsv')?.value || p.pilot.splitHalfCsv,
      qualitativeTrust: {
        coders: $('#qCoders')?.value || '', transcripts: $('#qTranscripts')?.value || '', triangulation: !!$('#qTriangulation')?.checked,
        memberChecking: !!$('#qMember')?.checked, auditTrail: !!$('#qAudit')?.checked, reflexivity: !!$('#qReflex')?.checked, saturation: !!$('#qSaturation')?.checked, notes: $('#qNotes')?.value || ''
      },
      rdUsability: { users: $('#rdUsers')?.value || '', practicalityScore: $('#rdScore')?.value || '', usabilityFindings: $('#rdFindings')?.value || '', revisionDecision: $('#rdDecision')?.value || '' }
    });
    p.updatedAt = nowIso(); saveState(); if (rerender) { renderPilot(); toast('Pilot metadata saved.'); }
  }

  function alphaResultHtml(pilot) { return `<p><strong>Alpha:</strong> ${formatNum(pilot.cronbachAlpha)} • ${pilot.cronbachCases || 0} cases • ${pilot.cronbachItems || 0} items</p><p class="muted">${reliabilityInterpretation(pilot.cronbachAlpha)}</p>`; }
  function kr20ResultHtml(pilot) { return `<p><strong>KR-20:</strong> ${formatNum(pilot.kr20)} • ${pilot.kr20Cases || 0} cases • ${pilot.kr20Items || 0} items</p><p class="muted">${reliabilityInterpretation(pilot.kr20)}</p>`; }
  function kappaResultHtml(pilot) { return `<p><strong>Kappa:</strong> ${formatNum(pilot.kappa)} • Agreement: ${formatPercent(pilot.kappaAgreement)} • ${pilot.kappaCases || 0} cases</p>`; }
  function testRetestHtml(pilot) { return `<p><strong>Pearson r:</strong> ${formatNum(pilot.testRetestR)} • ${pilot.testRetestCases || 0} cases</p><p class="muted">${reliabilityInterpretation(pilot.testRetestR)}</p>`; }
  function splitHalfHtml(pilot) { return `<p><strong>Odd-even r:</strong> ${formatNum(pilot.splitHalfR)} • Spearman–Brown: ${formatNum(pilot.spearmanBrown)}</p><p class="muted">${reliabilityInterpretation(pilot.spearmanBrown)}</p>`; }

  function renderChecklistView(type) {
    const el = $(`#${type}`);
    const p = currentProject();
    if (!isMetadataComplete(p)) { el.innerHTML = stageLockedHtml(); return; }
    const canEdit = isAdmin() || isApplicant();
    const list = checklistBanks[type];
    const arr = p[type] || Array(list.length).fill(false);
    const pct = percentage(arr.filter(Boolean).length, list.length);
    el.innerHTML = `<article class="panel glass"><div class="panel-head"><div><h3>${views[type]}</h3><p>Completion: ${pct}%</p><div class="progress-line"><i style="width:${pct}%"></i></div></div><span class="badge ${pct >= 80 ? 'good' : pct >= 50 ? 'warn' : 'bad'}">${pct}%</span></div><div class="checklist">${list.map(([title, desc], i) => `<label class="check-item"><input type="checkbox" data-check-${type}="${i}" ${arr[i] ? 'checked' : ''} ${canEdit ? '' : 'disabled'}><div><strong>${safe(title)}</strong><span>${safe(desc)}</span></div><span>${arr[i] ? 'Done' : 'Pending'}</span></label>`).join('')}</div></article>`;
    if (canEdit) $$(`[data-check-${type}]`).forEach(cb => cb.onchange = () => { p[type][Number(cb.dataset[`check${cap(type)}`])] = cb.checked; p.updatedAt = nowIso(); saveState(); renderChecklistView(type); });
  }

  function renderReports() {
    const el = $('#reports');
    const p = currentProject();
    if (!isMetadataComplete(p)) { el.innerHTML = stageLockedHtml(); return; }
    const shareUrl = buildPublicUrl(p);
    const qrUrl = qrImageUrl(shareUrl);
    el.innerHTML = `
      <article class="panel glass report-actions">
        <div class="panel-head"><div><h3>Report Actions</h3><p>QR opens a public, login-free validity passport using embedded project/report data. For full online access, download the standalone HTML report and upload it to your GitHub Pages repository if needed.</p></div><span class="badge good">${safe(p.projectNo)}</span></div>
        <div class="qr-box">
          <img src="${qrUrl}" alt="Project QR code">
          <div style="flex:1; min-width:260px"><strong>Public QR Report URL</strong><div class="copy-field"><input id="publicUrl" value="${safe(shareUrl)}" readonly><button class="soft" id="copyPublicUrl">Copy</button></div><p class="muted">The QR contains project ID details and a public report summary.</p></div>
        </div>
        <div class="form-actions" style="margin-top:14px">
          <button id="printPdf" class="primary">Download / Print PDF Report</button>
          <button id="downloadPublicHtml" class="soft">Download Standalone Public HTML Report</button>
          <button id="downloadJson" class="ghost">Export Project JSON</button>
        </div>
      </article>
      ${buildReportHtml(p, { includeQr: true, qrUrl, shareUrl })}`;
    $('#printPdf').onclick = () => window.print();
    $('#copyPublicUrl').onclick = async () => { await navigator.clipboard.writeText($('#publicUrl').value); toast('Public URL copied.'); };
    $('#downloadPublicHtml').onclick = () => downloadFile(`${p.projectNo}-public-report.html`, standaloneHtml(p), 'text/html');
    $('#downloadJson').onclick = () => downloadFile(`${p.projectNo}-project-data.json`, JSON.stringify(p, null, 2), 'application/json');
  }

  function renderValidatorProfile() {
    const el = $('#validatorProfile');
    if (!isValidator() && !isAdmin()) { el.innerHTML = '<article class="panel glass"><p>Validator profile is available to validators and admin.</p></article>'; return; }
    let user = isValidator() ? currentUser() : state.users.find(u => u.role === 'validator') || null;
    if (!user) { el.innerHTML = '<article class="panel glass"><p>No validator profile available.</p></article>'; return; }
    const p = user.profile || {};
    el.innerHTML = `<article class="panel glass"><div class="panel-head"><div><h3>Detailed Validator Profile</h3><p>Admin verification is required before the validator can sign formal validation decisions. Digital signature is used in reports.</p></div><span class="badge ${user.status === 'verified' ? 'good' : 'warn'}">${safe(user.status)}</span></div><form id="validatorProfileForm" class="form-grid">
      ${input('Full Name with Academic Title', 'vpName', p.fullName)}${input('Email', 'vpEmail', user.email, true, 'email')}${input('Highest Degree', 'vpDegree', p.degree)}${input('Affiliation', 'vpAffiliation', p.affiliation)}${input('Department / Unit', 'vpDepartment', p.department)}${input('Country', 'vpCountry', p.country)}${input('Years of Expertise', 'vpYears', p.years, false, 'number')}${input('ORCID / Scopus / Scholar ID', 'vpOrcid', p.orcid)}<label class="full-span">Field Expertise<textarea id="vpFields" rows="3">${safe(p.fields || '')}</textarea></label><label class="full-span">Instrument / Methodological Expertise<textarea id="vpMethods" rows="3">${safe(p.methods || '')}</textarea></label><label class="full-span">Validation Experience / Publications<textarea id="vpExperience" rows="3">${safe(p.experience || '')}</textarea></label><label class="full-span">Conflict of Interest Declaration<textarea id="vpConflict" rows="2">${safe(p.conflict || '')}</textarea></label><label>Typed Digital Signature<input id="vpSigText" value="${safe(p.signatureText || p.fullName || '')}"></label><label>Upload Signature Image<input id="vpSigFile" type="file" accept="image/*"></label><div class="full-span"><p class="muted">Draw signature below, or upload a signature image.</p><canvas id="signatureCanvas" class="sig-pad"></canvas><div class="form-actions" style="margin-top:8px"><button type="button" id="clearSignature" class="ghost">Clear Drawing</button><button type="button" id="saveSignatureDrawing" class="soft">Use Drawing as Signature</button></div></div><div class="full-span">${p.signatureData ? `<img class="signature-preview" src="${p.signatureData}" alt="Signature preview">` : '<span class="badge warn">No digital signature stored</span>'}</div><div class="form-actions full-span"><button class="primary" type="submit">Save Validator Profile</button></div></form></article>`;
    $('#validatorProfileForm').onsubmit = async (e) => { e.preventDefault(); await saveValidatorProfile(user); };
    setupSignaturePad();
  }

  async function saveValidatorProfile(user) {
    const fileSig = await readFileAsDataUrl($('#vpSigFile').files[0]);
    user.profile = {
      ...(user.profile || {}), fullName: $('#vpName').value.trim(), degree: $('#vpDegree').value.trim(), affiliation: $('#vpAffiliation').value.trim(), department: $('#vpDepartment').value.trim(), country: $('#vpCountry').value.trim(), years: $('#vpYears').value.trim(), orcid: $('#vpOrcid').value.trim(), fields: $('#vpFields').value.trim(), methods: $('#vpMethods').value.trim(), experience: $('#vpExperience').value.trim(), conflict: $('#vpConflict').value.trim(), signatureText: $('#vpSigText').value.trim(), signatureData: fileSig || user.profile?.signatureData || ''
    };
    user.updatedAt = nowIso(); saveState(); renderValidatorProfile(); toast('Validator profile saved.');
  }

  function setupSignaturePad() {
    const canvas = $('#signatureCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = Math.floor(r.width * devicePixelRatio); canvas.height = Math.floor(r.height * devicePixelRatio); ctx.scale(devicePixelRatio, devicePixelRatio); ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.strokeStyle = '#111'; };
    resize();
    let drawing = false;
    const pos = (e) => { const r = canvas.getBoundingClientRect(); const t = e.touches?.[0] || e; return { x: t.clientX - r.left, y: t.clientY - r.top }; };
    const start = (e) => { e.preventDefault(); drawing = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
    const move = (e) => { if (!drawing) return; e.preventDefault(); const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
    const end = () => { drawing = false; };
    canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', move); window.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start); canvas.addEventListener('touchmove', move); canvas.addEventListener('touchend', end);
    $('#clearSignature').onclick = () => ctx.clearRect(0,0,canvas.width,canvas.height);
    $('#saveSignatureDrawing').onclick = () => { const user = currentUser(); if (!user || !isValidator()) return; user.profile = user.profile || {}; user.profile.signatureData = canvas.toDataURL('image/png'); saveState(); renderValidatorProfile(); toast('Signature drawing saved.'); };
  }

  function renderAdmin() {
    const el = $('#admin');
    if (!isAdmin()) { el.innerHTML = '<article class="panel glass"><p>Admin only.</p></article>'; return; }
    el.innerHTML = `
      <div class="two-col wide-left">
        <article class="panel glass"><h3>Validator Verification</h3>${adminValidatorsHtml()}</article>
        <article class="panel glass"><h3>Project Stage Verification</h3>${adminProjectVerificationHtml()}</article>
      </div>
      <div class="two-col">
        <article class="panel glass"><h3>All Users</h3>${adminUsersHtml()}</article>
        <article class="panel glass"><h3>System Backup & Admin PIN</h3><div class="form-grid"><label>New Admin PIN<input id="newAdminPin" type="password" placeholder="Enter new admin PIN"></label><label>Confirm Admin PIN<input id="confirmAdminPin" type="password" placeholder="Confirm new PIN"></label></div><div class="form-actions" style="margin-top:12px"><button id="changeAdminPin" class="primary">Change Admin PIN</button><button id="exportAll" class="soft">Export All Data</button><label class="ghost" style="display:inline-flex;align-items:center;gap:8px">Import JSON<input id="importAll" type="file" accept="application/json" style="display:none"></label></div></article>
      </div>`;
    bindAdmin();
  }

  function adminValidatorsHtml() {
    const validators = state.users.filter(u => u.role === 'validator');
    if (!validators.length) return '<p>No validator registrations yet.</p>';
    return `<div class="table-wrap"><table><thead><tr><th>Name</th><th>Affiliation</th><th>Status</th><th>Action</th></tr></thead><tbody>${validators.map(v => `<tr><td>${safe(userDisplay(v))}<br><span class="muted">${safe(v.email)}</span></td><td>${safe(v.profile?.affiliation || '-')}</td><td><span class="badge ${v.status === 'verified' ? 'good' : 'warn'}">${safe(v.status)}</span></td><td><button class="success" data-verify-validator="${v.id}">Verify</button> <button class="danger" data-pend-validator="${v.id}">Pending</button></td></tr>`).join('')}</tbody></table></div>`;
  }

  function adminProjectVerificationHtml() {
    const p = currentProject();
    if (!p) return '<p>No active project.</p>';
    const stages = Object.keys(p.verification || {});
    return `<p><strong>${safe(p.projectNo)}</strong> — ${safe(p.metadata?.title || 'Untitled')}</p><div class="table-wrap"><table><thead><tr><th>Stage</th><th>Status</th><th>Set</th></tr></thead><tbody>${stages.map(stage => `<tr><td>${safe(cap(stage))}</td><td><span class="badge ${p.verification[stage] === 'verified' ? 'good' : p.verification[stage] === 'rejected' ? 'bad' : 'warn'}">${safe(p.verification[stage])}</span></td><td><select data-stage-verify="${stage}">${optionList(['pending','verified','revision required','rejected'], p.verification[stage])}</select></td></tr>`).join('')}</tbody></table></div><label style="margin-top:10px">Admin Verification Notes<textarea id="adminReportNotes" rows="3">${safe(p.reportNotes || '')}</textarea></label><div class="form-actions" style="margin-top:12px"><button id="saveStageVerification" class="primary">Save Stage Verification</button></div>`;
  }

  function adminUsersHtml() {
    if (!state.users.length) return '<p>No registered users yet.</p>';
    return `<div class="table-wrap"><table><thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Status</th></tr></thead><tbody>${state.users.map(u => `<tr><td>${safe(userDisplay(u))}</td><td>${safe(u.role)}</td><td>${safe(u.email)}</td><td>${safe(u.status)}</td></tr>`).join('')}</tbody></table></div>`;
  }

  function bindAdmin() {
    $$('[data-verify-validator]').forEach(btn => btn.onclick = () => { const u = state.users.find(x => x.id === btn.dataset.verifyValidator); if (u) { u.status = 'verified'; u.updatedAt = nowIso(); saveState(); renderAdmin(); renderIdentity(); toast('Validator verified.'); } });
    $$('[data-pend-validator]').forEach(btn => btn.onclick = () => { const u = state.users.find(x => x.id === btn.dataset.pendValidator); if (u) { u.status = 'pending'; u.updatedAt = nowIso(); saveState(); renderAdmin(); renderIdentity(); toast('Validator moved to pending.'); } });
    $('#saveStageVerification').onclick = () => { const p = currentProject(); $$('[data-stage-verify]').forEach(s => p.verification[s.dataset.stageVerify] = s.value); p.reportNotes = $('#adminReportNotes').value.trim(); p.updatedAt = nowIso(); saveState(); renderAdmin(); renderIdentity(); toast('Project verification saved.'); };
    $('#changeAdminPin').onclick = () => { const a = $('#newAdminPin').value, b = $('#confirmAdminPin').value; if (!a || a !== b) { toast('PIN confirmation does not match.'); return; } localStorage.setItem(ADMIN_PIN_KEY, hashPin(a)); $('#newAdminPin').value = $('#confirmAdminPin').value = ''; toast('Admin PIN changed.'); };
    $('#exportAll').onclick = () => downloadFile('js-research-validator-pro-backup.json', JSON.stringify(state, null, 2), 'application/json');
    $('#importAll').onchange = async (e) => { const file = e.target.files[0]; if (!file) return; const text = await file.text(); try { const imported = JSON.parse(text); if (!Array.isArray(imported.projects) || !Array.isArray(imported.users)) throw new Error('Invalid backup'); state = imported; saveState(); renderAll(); toast('Backup imported.'); } catch { toast('Invalid JSON backup.'); } };
  }

  function getScores(p) {
    if (!p) return { metadata: 0, instrument: 0, reliability: 0, ethics: 0, methodology: 0, manuscript: 0, publication: 0 };
    const val = calculateValidation(p);
    const metadata = isMetadataComplete(p) ? 100 : metadataCompleteness(p);
    const instrument = p.items?.length ? Math.round(((val.aiken * .55) + (val.cvi * .45)) * 100) : 0;
    const reliabilityValues = [p.pilot?.cronbachAlpha, p.pilot?.kr20, p.pilot?.kappa, p.pilot?.testRetestR, p.pilot?.spearmanBrown].filter(v => Number.isFinite(Number(v))).map(Number);
    const reliability = reliabilityValues.length ? Math.round(Math.max(...reliabilityValues) * 100) : qualitativeReliabilityScore(p.pilot);
    const ethics = percentage((p.ethics || []).filter(Boolean).length, checklistBanks.ethics.length);
    const methodology = percentage((p.methodology || []).filter(Boolean).length, checklistBanks.methodology.length);
    const manuscript = percentage((p.manuscript || []).filter(Boolean).length, checklistBanks.manuscript.length);
    const publication = Math.round(metadata*.14 + instrument*.22 + reliability*.16 + ethics*.16 + methodology*.18 + manuscript*.14);
    return { metadata, instrument, reliability: clamp(reliability,0,100), ethics, methodology, manuscript, publication, ...val };
  }

  function metadataCompleteness(p) {
    const m = p?.metadata || {}; const keys = ['title','principalInvestigator','institution','researchDesign','purpose','researchQuestions','participants','targetOutput','constructs','dataSources','analysisPlan'];
    return percentage(keys.filter(k => String(m[k] || '').trim().length > 2).length, keys.length);
  }

  function qualitativeReliabilityScore(pilot) {
    if (!pilot) return 0;
    const q = pilot.qualitativeTrust || {}; const count = ['triangulation','memberChecking','auditTrail','reflexivity','saturation'].filter(k => q[k]).length;
    const rd = pilot.rdUsability || {}; const rdScore = Number(rd.practicalityScore); return Math.max(percentage(count,5), Number.isFinite(rdScore) ? clamp(rdScore,0,100) : 0);
  }

  function readinessLabel(score) {
    if (score >= 85) return 'Ready for submission / validation passport can be issued';
    if (score >= 70) return 'Strong, minor revision required';
    if (score >= 55) return 'Moderate, major revision recommended';
    return 'Not ready, complete validation evidence first';
  }

  function buildReportHtml(p, opts = {}) {
    const s = getScores(p); const m = p.metadata || {}; const validators = (p.assignments || []).map(id => state.users.find(u => u.id === id)).filter(Boolean);
    return `<article class="report-paper">
      <div style="display:flex;justify-content:space-between;gap:18px;align-items:flex-start;flex-wrap:wrap"><div><p class="muted">JS RESEARCH VALIDATOR PRO • RESEARCH VALIDITY PASSPORT</p><h2>${safe(m.title || 'Untitled Project')}</h2><p><strong>Project No:</strong> ${safe(p.projectNo)} • <strong>Issued:</strong> ${fmtDate(nowIso())}</p><p><strong>Readiness:</strong> ${s.publication}% — ${safe(readinessLabel(s.publication))}</p></div>${opts.includeQr ? `<img src="${opts.qrUrl}" alt="QR" style="width:132px;height:132px;background:white;border:1px solid #dbe4ef;border-radius:10px;padding:7px">` : ''}</div>
      <h3>1. Project Metadata</h3><div class="report-grid">${reportItem('Principal Investigator', m.principalInvestigator)}${reportItem('Institution', m.institution)}${reportItem('Department', m.department)}${reportItem('Country', m.country)}${reportItem('Research Field', m.field)}${reportItem('Research Design', m.researchDesign)}${reportItem('Participants / Sample', m.participants)}${reportItem('Sampling', m.sampling)}${reportItem('Target Output / Journal', m.targetOutput)}${reportItem('Study Site', m.site)}${reportItem('Keywords', m.keywords)}${reportItem('Data Collection Date', m.dataDate)}</div>${reportBlock('Research Purpose / Contribution', m.purpose)}${reportBlock('Research Questions', m.researchQuestions)}${reportBlock('Constructs / Variables / Phenomena', m.constructs)}${reportBlock('Planned Data Sources', m.dataSources)}${reportBlock('Analysis Plan', m.analysisPlan)}
      <h3>2. Instrument Metadata and Expert Validity</h3>${instrumentReportHtml(p)}${validityReportTable(p)}
      <h3>3. Validators Involved and Digital Signatures</h3>${validatorsReportHtml(p, validators)}
      <h3>4. Pilot Testing and Reliability Evidence</h3>${pilotReportHtml(p.pilot)}
      <h3>5. Ethics, Methodology, and Manuscript Readiness</h3>${scoreTableHtml(s)}${checklistSummaryHtml(p)}
      <h3>6. Admin Verification</h3>${verificationHtml(p)}
      <h3>7. Final Publication Readiness</h3><p>The project receives an integrated readiness score of <strong>${s.publication}%</strong>. Decision: <strong>${safe(readinessLabel(s.publication))}</strong>.</p><p class="muted">This report is generated from local app records and validator inputs. It should be reviewed by the responsible institution before formal certification.</p>
      ${opts.shareUrl ? `<p class="muted"><strong>Public report URL:</strong> ${safe(opts.shareUrl)}</p>` : ''}
    </article>`;
  }

  function reportItem(label, value) { return `<div class="report-item"><span>${safe(label)}</span><strong>${safe(value || '-')}</strong></div>`; }
  function reportBlock(label, value) { return `<div class="report-item" style="margin-top:10px"><span>${safe(label)}</span><p>${nl2br(value || '-')}</p></div>`; }

  function instrumentReportHtml(p) {
    const i = p.instrument || {};
    return `<div class="report-grid">${reportItem('Instrument Name', i.name)}${reportItem('Type', i.type)}${reportItem('Construct', i.construct)}${reportItem('Respondents', i.respondents)}${reportItem('Items', i.itemCount || p.items.length)}${reportItem('Scale Points', i.scalePoints)}${reportItem('Language', i.language)}${reportItem('Registered File', i.fileName)}</div>${reportBlock('Instrument Description', i.description)}`;
  }

  function validityReportTable(p) {
    if (!p.items?.length) return '<p>No instrument items registered.</p>';
    return `<table><thead><tr><th>Item</th><th>Construct</th><th>Aiken V</th><th>I-CVI</th><th>Agreement</th><th>Decision</th></tr></thead><tbody>${p.items.map(item => { const s = calculateItemStats(p,item.id); return `<tr><td>${safe(item.code)}<br>${safe(item.text)}</td><td>${safe(item.construct)}</td><td>${s.aiken.toFixed(3)}</td><td>${s.cvi.toFixed(3)}</td><td>${s.agreement.toFixed(3)}</td><td>${validityDecision(s.aiken)}</td></tr>`; }).join('')}</tbody></table>`;
  }

  function validatorsReportHtml(p, validators) {
    if (!validators.length) return '<p>No validator assigned.</p>';
    return `<table><thead><tr><th>Name</th><th>Affiliation / Expertise</th><th>Recommendation</th><th>Digital Signature</th></tr></thead><tbody>${validators.map(v => { const r = p.validatorReviews?.[v.id] || {}; return `<tr><td>${safe(userDisplay(v))}<br><span class="muted">${safe(v.email)}</span></td><td>${safe(v.profile?.affiliation || '-')}<br>${safe(v.profile?.fields || '')}</td><td>${safe(r.recommendation || 'Pending')}<br>${safe(r.summary || '')}</td><td>${v.profile?.signatureData ? `<img class="signature-preview" src="${v.profile.signatureData}" alt="Signature">` : safe(v.profile?.signatureText || 'No signature')}</td></tr>`; }).join('')}</tbody></table>`;
  }

  function pilotReportHtml(pilot = defaultPilot()) {
    const q = pilot.qualitativeTrust || {}; const rd = pilot.rdUsability || {};
    return `<div class="report-grid">${reportItem('Research / Validation Type', pilot.researchType)}${reportItem('Pilot Sample', pilot.pilotSample)}${reportItem('Population / Context', pilot.population)}${reportItem('Setting', pilot.setting)}${reportItem('Cronbach Alpha', formatNum(pilot.cronbachAlpha))}${reportItem('KR-20', formatNum(pilot.kr20))}${reportItem('Cohen Kappa', formatNum(pilot.kappa))}${reportItem('Test-Retest r', formatNum(pilot.testRetestR))}${reportItem('Spearman-Brown', formatNum(pilot.spearmanBrown))}${reportItem('Qualitative Trustworthiness Checks', ['triangulation','memberChecking','auditTrail','reflexivity','saturation'].filter(k=>q[k]).length + '/5')}${reportItem('R&D Users', rd.users)}${reportItem('Practicality / Usability Score', rd.practicalityScore)}</div>${reportBlock('Pilot Purpose', pilot.pilotPurpose)}${reportBlock('Data Sources Tested', pilot.dataSource)}${reportBlock('Interpretation', pilot.interpretation)}${reportBlock('Limitations', pilot.limitations)}${reportBlock('Next Action', pilot.nextAction)}${reportBlock('Qualitative/R&D Notes', `${q.notes || ''}\n${rd.usabilityFindings || ''}\n${rd.revisionDecision || ''}`)}`;
  }

  function scoreTableHtml(s) {
    const rows = [['Metadata',s.metadata],['Instrument Validity',s.instrument],['Pilot/Reliability',s.reliability],['Ethics',s.ethics],['Methodology',s.methodology],['Manuscript',s.manuscript],['Publication Readiness',s.publication]];
    return `<table><thead><tr><th>Area</th><th>Score</th><th>Interpretation</th></tr></thead><tbody>${rows.map(([n,v]) => `<tr><td>${n}</td><td>${v}%</td><td>${v>=80?'Strong':v>=60?'Moderate':'Needs development'}</td></tr>`).join('')}</tbody></table>`;
  }

  function checklistSummaryHtml(p) {
    return `<div class="report-grid">${reportItem('Ethics Items Completed', `${(p.ethics||[]).filter(Boolean).length}/${checklistBanks.ethics.length}`)}${reportItem('Methodology Items Completed', `${(p.methodology||[]).filter(Boolean).length}/${checklistBanks.methodology.length}`)}${reportItem('Manuscript Items Completed', `${(p.manuscript||[]).filter(Boolean).length}/${checklistBanks.manuscript.length}`)}${reportItem('Last Updated', fmtDate(p.updatedAt))}</div>`;
  }

  function verificationHtml(p) {
    const v = p.verification || {};
    return `<table><thead><tr><th>Stage</th><th>Status</th></tr></thead><tbody>${Object.entries(v).map(([k,val]) => `<tr><td>${safe(cap(k))}</td><td>${safe(val)}</td></tr>`).join('')}</tbody></table>${reportBlock('Admin Notes', p.reportNotes || '-')}`;
  }

  function standaloneHtml(p) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safe(p.projectNo)} Public Report</title><style>${publicCss()}</style></head><body>${buildReportHtml(p, { includeQr: true, qrUrl: qrImageUrl(buildPublicUrl(p)), shareUrl: buildPublicUrl(p) })}</body></html>`;
  }

  function publicCss() { return `body{margin:0;padding:24px;background:#edf3fb;font-family:Arial,sans-serif;color:#162238}.report-paper{max-width:1120px;margin:auto;background:white;border-radius:16px;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,.12)}.muted{color:#60708b!important}.report-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.report-item{border:1px solid #e1e8f2;border-radius:12px;padding:10px}.report-item span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#60708b!important;font-weight:800}.report-item strong{display:block;margin-top:4px}table{width:100%;border-collapse:collapse;margin:10px 0;border:1px solid #e7edf6}th,td{padding:10px;border-bottom:1px solid #e7edf6;text-align:left;vertical-align:top}th{color:#0c5a78;background:#eef7fb}.signature-preview{max-width:190px;max-height:74px;border:1px solid #d9e4ef;border-radius:8px;padding:5px}`; }

  function buildPublicUrl(p) {
    const publicData = publicSnapshot(p);
    const encoded = base64UrlEncode(JSON.stringify(publicData));
    const base = location.href.split('#')[0];
    return `${base}#public=${encoded}`;
  }

  function publicSnapshot(p) {
    const s = getScores(p); const validators = (p.assignments || []).map(id => state.users.find(u => u.id === id)).filter(Boolean);
    return {
      projectNo: p.projectNo, issuedAt: nowIso(), metadata: p.metadata,
      scores: { metadata: s.metadata, instrument: s.instrument, reliability: s.reliability, ethics: s.ethics, methodology: s.methodology, manuscript: s.manuscript, publication: s.publication },
      instrument: p.instrument,
      itemStats: (p.items || []).map(item => ({ code: item.code, construct: item.construct, text: item.text, ...calculateItemStats(p, item.id) })),
      validators: validators.map(v => ({ name: userDisplay(v), email: v.email, affiliation: v.profile?.affiliation, fields: v.profile?.fields, signatureText: v.profile?.signatureText || userDisplay(v), recommendation: p.validatorReviews?.[v.id]?.recommendation || 'Pending', summary: p.validatorReviews?.[v.id]?.summary || '' })),
      pilot: { researchType: p.pilot?.researchType, pilotSample: p.pilot?.pilotSample, cronbachAlpha: p.pilot?.cronbachAlpha, kr20: p.pilot?.kr20, kappa: p.pilot?.kappa, testRetestR: p.pilot?.testRetestR, spearmanBrown: p.pilot?.spearmanBrown, interpretation: p.pilot?.interpretation, nextAction: p.pilot?.nextAction },
      verification: p.verification, reportNotes: p.reportNotes
    };
  }

  function renderPublicFromHash() {
    try {
      const data = JSON.parse(base64UrlDecode(location.hash.replace('#public=', '')));
      $('#accessShell').classList.add('hidden'); $('#appShell').classList.add('hidden'); $('#publicReportShell').classList.remove('hidden');
      $('#publicReportShell').innerHTML = publicReportFromData(data);
    } catch (e) {
      $('#accessShell').classList.add('hidden'); $('#publicReportShell').classList.remove('hidden');
      $('#publicReportShell').innerHTML = '<article class="report-paper"><h2>Public report could not be opened</h2><p>The QR/report data appears incomplete or corrupted.</p></article>';
    }
  }

  function publicReportFromData(d) {
    const m = d.metadata || {}; const s = d.scores || {};
    return `<article class="report-paper"><p class="muted">PUBLIC RESEARCH VALIDITY PASSPORT</p><h2>${safe(m.title || 'Untitled Project')}</h2><p><strong>Project No:</strong> ${safe(d.projectNo)} • <strong>Issued:</strong> ${fmtDate(d.issuedAt)}</p><p><strong>Readiness:</strong> ${s.publication || 0}% — ${safe(readinessLabel(s.publication || 0))}</p><h3>Project Metadata</h3><div class="report-grid">${reportItem('Principal Investigator', m.principalInvestigator)}${reportItem('Institution', m.institution)}${reportItem('Research Design', m.researchDesign)}${reportItem('Participants', m.participants)}${reportItem('Target Output', m.targetOutput)}${reportItem('Field', m.field)}</div>${reportBlock('Purpose', m.purpose)}${reportBlock('Research Questions', m.researchQuestions)}<h3>Scores</h3>${scoreTableHtml(s)}<h3>Validators</h3><table><thead><tr><th>Name</th><th>Affiliation</th><th>Recommendation</th><th>Signature</th></tr></thead><tbody>${(d.validators || []).map(v => `<tr><td>${safe(v.name)}<br><span class="muted">${safe(v.email || '')}</span></td><td>${safe(v.affiliation || '')}<br>${safe(v.fields || '')}</td><td>${safe(v.recommendation)}<br>${safe(v.summary || '')}</td><td>${safe(v.signatureText || v.name || '-')}</td></tr>`).join('') || '<tr><td colspan="4">No validators recorded.</td></tr>'}</tbody></table><h3>Instrument Item Validity</h3><table><thead><tr><th>Item</th><th>Construct</th><th>Aiken V</th><th>I-CVI</th><th>Decision</th></tr></thead><tbody>${(d.itemStats || []).map(x => `<tr><td>${safe(x.code)}<br>${safe(x.text)}</td><td>${safe(x.construct)}</td><td>${formatNum(x.aiken)}</td><td>${formatNum(x.cvi)}</td><td>${validityDecision(x.aiken)}</td></tr>`).join('') || '<tr><td colspan="5">No item evidence recorded.</td></tr>'}</tbody></table><h3>Pilot Evidence</h3><div class="report-grid">${reportItem('Type', d.pilot?.researchType)}${reportItem('Sample', d.pilot?.pilotSample)}${reportItem('Cronbach Alpha', formatNum(d.pilot?.cronbachAlpha))}${reportItem('KR-20', formatNum(d.pilot?.kr20))}${reportItem('Kappa', formatNum(d.pilot?.kappa))}${reportItem('Spearman-Brown', formatNum(d.pilot?.spearmanBrown))}</div>${reportBlock('Interpretation', d.pilot?.interpretation)}${reportBlock('Next Action', d.pilot?.nextAction)}<h3>Verification</h3><table><tbody>${Object.entries(d.verification || {}).map(([k,v]) => `<tr><th>${safe(cap(k))}</th><td>${safe(v)}</td></tr>`).join('')}</tbody></table>${reportBlock('Admin Notes', d.reportNotes || '-')}</article>`;
  }

  function qrImageUrl(data) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=10&data=${encodeURIComponent(data)}`;
  }

  function globalClick(event) {
    const target = event.target.closest('button, [data-jump], [data-select-project], [data-report-project], [data-delete-item]');
    if (!target) return;
    if (target.dataset.jump) { showView(target.dataset.jump); return; }
    if (target.dataset.selectProject) { state.activeProjectId = target.dataset.selectProject; saveState(); renderAll(); showView('metadata'); return; }
    if (target.dataset.reportProject) { state.activeProjectId = target.dataset.reportProject; saveState(); renderAll(); showView('reports'); return; }
    if (target.dataset.deleteItem) { const p = currentProject(); p.items = p.items.filter(i => i.id !== target.dataset.deleteItem); saveState(); renderInstrument(); toast('Item deleted.'); }
  }

  function parseMatrix(text) {
    return String(text || '').trim().split(/\n+/).map(line => line.trim().split(/[\t,; ]+/).map(Number).filter(Number.isFinite)).filter(row => row.length);
  }
  function parsePairs(text) { return String(text || '').trim().split(/\n+/).map(line => line.trim().split(/[\t,;]+/).map(x => x.trim())).filter(row => row.length >= 2); }
  function sampleVariance(values) { if (values.length < 2) return 0; const m = mean(values); return values.reduce((s,v)=>s+(v-m)**2,0)/(values.length-1); }
  function mean(values) { const vals = values.map(Number).filter(Number.isFinite); return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0; }
  function cronbachAlpha(matrix) { const rows = matrix.filter(r => r.length >= 2); if (rows.length < 2) return { alpha: null, items: 0, cases: rows.length }; const k = Math.min(...rows.map(r => r.length)); const trimmed = rows.map(r => r.slice(0,k)); const colVars = Array.from({length:k},(_,j)=>sampleVariance(trimmed.map(r=>r[j]))); const totals = trimmed.map(r=>r.reduce((a,b)=>a+b,0)); const totalVar = sampleVariance(totals); const alpha = totalVar ? (k/(k-1))*(1 - colVars.reduce((a,b)=>a+b,0)/totalVar) : null; return { alpha: clamp(alpha, -1, 1), items:k, cases: trimmed.length }; }
  function kr20(matrix) { const rows = matrix.filter(r => r.length >= 2); if (rows.length < 2) return { value: null, items:0, cases:rows.length }; const k = Math.min(...rows.map(r=>r.length)); const trimmed = rows.map(r=>r.slice(0,k).map(x=>Number(x)>0?1:0)); const pq = Array.from({length:k},(_,j)=>{ const p=mean(trimmed.map(r=>r[j])); return p*(1-p); }); const totals = trimmed.map(r=>r.reduce((a,b)=>a+b,0)); const v = sampleVariance(totals); const value = v ? (k/(k-1))*(1 - pq.reduce((a,b)=>a+b,0)/v) : null; return { value: clamp(value, -1, 1), items:k, cases:trimmed.length }; }
  function cohenKappa(pairs) { const usable = pairs.filter(p => p[0] !== '' && p[1] !== ''); const n = usable.length; if (!n) return { kappa:null, agreement:null, cases:0 }; const agree = usable.filter(p=>p[0]===p[1]).length/n; const cats = [...new Set(usable.flat())]; const expected = cats.reduce((sum, c) => sum + (usable.filter(p=>p[0]===c).length/n) * (usable.filter(p=>p[1]===c).length/n), 0); const kappa = expected === 1 ? 1 : (agree - expected)/(1 - expected); return { kappa: clamp(kappa,-1,1), agreement: agree, cases:n }; }
  function pearson(a,b) { if (a.length !== b.length || a.length < 2) return null; const ma=mean(a), mb=mean(b); const num=a.reduce((s,x,i)=>s+(x-ma)*(b[i]-mb),0); const den=Math.sqrt(a.reduce((s,x)=>s+(x-ma)**2,0)*b.reduce((s,y)=>s+(y-mb)**2,0)); return den ? clamp(num/den,-1,1) : null; }
  function splitHalf(matrix) { const rows = matrix.filter(r=>r.length>=4); if (rows.length < 2) return {r:null,sb:null}; const k = Math.min(...rows.map(r=>r.length)); const odd = rows.map(r=>r.slice(0,k).filter((_,i)=>i%2===0).reduce((a,b)=>a+b,0)); const even = rows.map(r=>r.slice(0,k).filter((_,i)=>i%2===1).reduce((a,b)=>a+b,0)); const r = pearson(odd, even); const sb = r == null ? null : (2*r)/(1+r); return { r, sb: clamp(sb,-1,1) }; }
  function reliabilityInterpretation(v) { const n = Number(v); if (!Number.isFinite(n)) return 'No reliability coefficient calculated yet.'; if (n >= .90) return 'Excellent reliability for high-stakes interpretation, with item redundancy still worth checking.'; if (n >= .80) return 'Good reliability for research use.'; if (n >= .70) return 'Acceptable reliability for exploratory or classroom-based research.'; if (n >= .60) return 'Marginal reliability; revision and additional pilot testing are recommended.'; return 'Low reliability; substantial revision is needed before main data collection.'; }
  function percentage(a,b){ return b ? Math.round((a/b)*100) : 0; }
  function clamp(v,min,max){ const n = Number(v); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : v; }
  function formatNum(v){ const n = Number(v); return Number.isFinite(n) ? n.toFixed(3) : '-'; }
  function formatPercent(v){ const n = Number(v); return Number.isFinite(n) ? `${Math.round(n*100)}%` : '-'; }
  function cap(s){ return String(s || '').replace(/([A-Z])/g,' $1').replace(/^./, c => c.toUpperCase()); }

  function readFileAsDataUrl(file) { return new Promise(resolve => { if (!file) return resolve(''); const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => resolve(''); reader.readAsDataURL(file); }); }
  function downloadFile(filename, content, type) { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }
  function base64UrlEncode(str) { return btoa(unescape(encodeURIComponent(str))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
  function base64UrlDecode(str) { str = str.replace(/-/g,'+').replace(/_/g,'/'); while (str.length % 4) str += '='; return decodeURIComponent(escape(atob(str))); }

  init();
})();
