/* ================================================================
   GPA & CGPA CALCULATER — SCRIPT.JS
   ================================================================
   Flow:
     Program Selection (BS / MS)
       BS -> Scheme Selection (Old / New) -> Mode (GPA / CGPA)
       MS -> Mode (GPA / CGPA) [scheme selection skipped]

   Modular functions (as required):
     convertToGPA(program, scheme, marks)  -> { gpa, grade, desc, status }
     calculateGPA()                         -> reads #gpaRows, writes result
     calculateCGPA()                        -> reads #cgpaRows, writes result
   ================================================================ */

/* ----------------------------------------------------------------
   0. APPLICATION STATE
   ---------------------------------------------------------------- */
const state = {
  program: null, // 'BS' | 'MS'
  scheme: null,  // 'old' | 'new' | null (MS never uses this)
  mode: null,    // 'gpa' | 'cgpa'
};

/* ----------------------------------------------------------------
   1. GRADING SYSTEMS — convertToGPA()
   ---------------------------------------------------------------- */

/**
 * Convert marks into a GPA (and, for MS, a letter grade) based on
 * the active program and scheme. This is the ONLY place grading
 * rules live, so BS and MS logic is never mixed.
 *
 * @param {string} program 'BS' or 'MS'
 * @param {string|null} scheme 'old' or 'new' (ignored for MS)
 * @param {number} marks 0-100
 * @returns {{gpa:number, grade:string|null, desc:string|null, status:'pass'|'fail'}}
 */
function convertToGPA(program, scheme, marks) {
  if (program === 'BS' && scheme === 'old') {
    return convertBSOldScheme(marks);
  }
  if (program === 'BS' && scheme === 'new') {
    return convertBSNewScheme(marks);
  }
  if (program === 'MS') {
    return convertMSScheme(marks);
  }
  // Should never happen if navigation state is set correctly
  return { gpa: 0, grade: null, desc: null, status: 'fail' };
}

// (A) BS - OLD SCHEME (range-based, plain if-else, no formula)
function convertBSOldScheme(marks) {
  let gpa;
  if (marks >= 80) gpa = 4.00;
  else if (marks >= 76) gpa = 3.80;
  else if (marks >= 72) gpa = 3.50;
  else if (marks >= 68) gpa = 3.00;
  else if (marks >= 64) gpa = 2.80;
  else if (marks >= 60) gpa = 2.50;
  else if (marks >= 55) gpa = 2.00;
  else if (marks >= 50) gpa = 1.00;
  else gpa = 0.00;

  return {
    gpa,
    grade: null,
    desc: null,
    status: marks < 50 ? 'fail' : 'pass',
  };
}

// (B) BS - NEW SCHEME (linear formula)
function convertBSNewScheme(marks) {
  let gpa;
  if (marks < 50) gpa = 0;
  else if (marks >= 80) gpa = 4;
  else gpa = 1 + (marks - 50) * 0.1;

  return {
    gpa,
    grade: null,
    desc: null,
    status: marks < 50 ? 'fail' : 'pass',
  };
}

// (C) MS PROGRAM (grade-based system, linear WITHIN each grade's range)
function convertMSScheme(marks) {
  let gpa, grade, desc;

  if (marks < 50) {
    gpa = 0;
    grade = 'F';
    desc = 'Fail';
  } else if (marks >= 79.5) {
    gpa = 4.0;
    grade = 'A';
    desc = 'Excellent';
  } else if (marks >= 64.5) {
    gpa = 3.0 + ((marks - 64.5) / (79.0 - 64.5)) * 0.9;
    grade = 'B';
    desc = 'Very Good';
  } else { // 50.0 - 64.4999...
    gpa = 2.0 + ((marks - 50.0) / (64.0 - 50.0)) * 0.9;
    grade = 'C';
    desc = 'Good';
  }

  // Safety clamp in case of rounding at the exact range edges
  gpa = Math.max(0, Math.min(4, gpa));

  return {
    gpa,
    grade,
    desc,
    status: grade === 'F' ? 'fail' : 'pass',
  };
}

/* ----------------------------------------------------------------
   2. SHARED HELPERS
   ---------------------------------------------------------------- */
function round2(num) { return Math.round(num * 100) / 100; }
function round1(num) { return Math.round(num * 10) / 10; }

function isValidMarks(marks) {
  return !isNaN(marks) && marks >= 0 && marks <= 100;
}

/* ----------------------------------------------------------------
   3. NAVIGATION — program / scheme / mode / calculator screens
   ---------------------------------------------------------------- */
const screens = {
  programScreen: document.getElementById('programScreen'),
  schemeScreen: document.getElementById('schemeScreen'),
  modeScreen: document.getElementById('modeScreen'),
  gpaScreen: document.getElementById('gpaScreen'),
  cgpaScreen: document.getElementById('cgpaScreen'),
};

const pageTitle = document.getElementById('pageTitle');
const pageSub = document.getElementById('pageSub');
const pathBar = document.getElementById('pathBar');
const gpaNote = document.getElementById('gpaNote');

const HEADER_TEXT = {
  programScreen: { title: 'GPA &amp; CGPA Calculater', sub: 'Select your program to get started.' },
  schemeScreen: { title: 'Select Grading Scheme', sub: 'Choose how BS marks should be converted into GPA.' },
  modeScreen: { title: 'What do you want to calculate?', sub: 'Choose GPA for one semester, or CGPA across semesters.' },
  gpaScreen: { title: 'GPA Calculater', sub: 'Enter marks and credit hours for each subject.' },
  cgpaScreen: { title: 'CGPA Calculater', sub: "Enter each semester's GPA and credit hours." },
};

// Build the breadcrumb text, e.g. "BS → Old Scheme → GPA"
function buildPath() {
  const parts = [];
  if (state.program) parts.push(state.program);
  if (state.program === 'BS' && state.scheme) {
    parts.push(state.scheme === 'old' ? 'Old Scheme' : 'New Scheme');
  }
  if (state.mode) parts.push(state.mode === 'gpa' ? 'GPA' : 'CGPA');
  return parts.join(' &rarr; ');
}

function updatePathBar() {
  const path = buildPath();
  if (path) {
    pathBar.innerHTML = path;
    pathBar.classList.remove('hidden');
  } else {
    pathBar.classList.add('hidden');
  }
}

// Update the footer note on the GPA screen to describe the active system
function updateGpaNote() {
  if (state.program === 'BS' && state.scheme === 'old') {
    gpaNote.innerHTML = '<b>Old Scheme:</b> fixed GPA bands (80+ &rarr; 4.00 down to below 50 &rarr; 0.00). Final GPA = (&Sigma; GPA &times; Credit Hours) &divide; (&Sigma; Credit Hours).';
  } else if (state.program === 'BS' && state.scheme === 'new') {
    gpaNote.innerHTML = '<b>New Scheme:</b> GPA = 1 + (marks &minus; 50) &times; 0.1, capped at 4.00 from 80 marks, 0 below 50. Final GPA = (&Sigma; GPA &times; Credit Hours) &divide; (&Sigma; Credit Hours).';
  } else if (state.program === 'MS') {
    gpaNote.innerHTML = '<b>MS grade system:</b> A (&ge;79.5) = 4.0 &middot; B (64.5&ndash;79.0) = 3.0&ndash;3.9 &middot; C (50&ndash;64) = 2.0&ndash;2.9 &middot; F (&lt;50) = 0. Final GPA = (&Sigma; GPA &times; Credit Hours) &divide; (&Sigma; Credit Hours).';
  } else {
    gpaNote.innerHTML = '';
  }
}

function showScreen(screenId) {
  Object.values(screens).forEach((el) => el.classList.remove('active'));
  screens[screenId].classList.add('active');

  const header = HEADER_TEXT[screenId];
  pageTitle.innerHTML = header.title;
  pageSub.textContent = header.sub;
  updatePathBar();

  if (screenId === 'gpaScreen') updateGpaNote();
}

// Briefly highlight a chosen card, then navigate — gives visible feedback
function selectAndGo(cardEl, action) {
  cardEl.classList.add('selected');
  setTimeout(() => {
    cardEl.classList.remove('selected');
    action();
  }, 220);
}

/* ---- Program selection ---- */
document.getElementById('chooseBS').addEventListener('click', (e) => {
  selectAndGo(e.currentTarget, () => {
    state.program = 'BS';
    state.scheme = null;
    showScreen('schemeScreen');
  });
});

document.getElementById('chooseMS').addEventListener('click', (e) => {
  selectAndGo(e.currentTarget, () => {
    state.program = 'MS';
    state.scheme = null; // MS never uses a scheme
    showScreen('modeScreen');
  });
});

/* ---- Scheme selection (BS only) ---- */
document.getElementById('chooseOld').addEventListener('click', (e) => {
  selectAndGo(e.currentTarget, () => {
    state.scheme = 'old';
    showScreen('modeScreen');
  });
});

document.getElementById('chooseNew').addEventListener('click', (e) => {
  selectAndGo(e.currentTarget, () => {
    state.scheme = 'new';
    showScreen('modeScreen');
  });
});

/* ---- Mode selection (GPA / CGPA) ---- */
document.getElementById('chooseGPA').addEventListener('click', (e) => {
  selectAndGo(e.currentTarget, () => {
    state.mode = 'gpa';
    showScreen('gpaScreen');
  });
});

document.getElementById('chooseCGPA').addEventListener('click', (e) => {
  selectAndGo(e.currentTarget, () => {
    state.mode = 'cgpa';
    showScreen('cgpaScreen');
  });
});

/* ---- Back buttons ---- */
document.querySelectorAll('.back-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const from = btn.dataset.back;
    if (from === 'scheme') {
      // Scheme screen -> Program screen
      showScreen('programScreen');
    } else if (from === 'mode') {
      // Mode screen -> Scheme screen (BS) or Program screen (MS)
      showScreen(state.program === 'BS' ? 'schemeScreen' : 'programScreen');
    } else if (from === 'gpa' || from === 'cgpa') {
      // GPA/CGPA screen -> Mode screen
      showScreen('modeScreen');
    }
  });
});

/* ----------------------------------------------------------------
   4. GPA CALCULATOR (marks + credit hours -> subject GPA -> final GPA)
   ---------------------------------------------------------------- */
const gpaRowsEl = document.getElementById('gpaRows');
let gpaSubjectCount = 0;

function addGpaRow(prefillName = '') {
  gpaSubjectCount++;
  const row = document.createElement('div');
  row.className = 'row gpa-grid';
  row.dataset.id = gpaSubjectCount;

  row.innerHTML = `
    <span class="num">${gpaSubjectCount}</span>
    <input type="text" class="subject-name" placeholder="Subject name" value="${prefillName}">
    <input type="number" class="subject-marks" placeholder="0-100" min="0" max="100" step="1">
    <input type="number" class="subject-credits" placeholder="e.g. 3" min="0" step="0.5">
    <button type="button" class="remove-btn" title="Remove subject">&times;</button>
  `;

  gpaRowsEl.appendChild(row);

  const marksInput = row.querySelector('.subject-marks');
  marksInput.addEventListener('input', () => {
    const val = marksInput.value.trim();
    const marks = Number(val);
    marksInput.classList.toggle('invalid', val !== '' && !isValidMarks(marks));
  });

  row.querySelector('.remove-btn').addEventListener('click', () => {
    if (gpaRowsEl.children.length <= 1) return; // keep at least one row
    row.classList.add('removing');
    row.addEventListener('animationend', () => {
      row.remove();
      renumberRows(gpaRowsEl);
      gpaSubjectCount = gpaRowsEl.children.length;
    }, { once: true });
  });
}

function renumberRows(container) {
  [...container.children].forEach((row, i) => {
    row.querySelector('.num').textContent = i + 1;
  });
}

// calculateGPA() — required modular function
function calculateGPA() {
  const rows = [...gpaRowsEl.querySelectorAll('.row')];
  let totalQualityPoints = 0; // Sigma (GPA x Credit Hours)
  let totalCredits = 0;       // Sigma Credit Hours
  let validCount = 0;
  let failCount = 0;

  rows.forEach((row) => {
    const marksInput = row.querySelector('.subject-marks');
    const marksVal = marksInput.value.trim();
    const creditsVal = row.querySelector('.subject-credits').value.trim();

    if (marksVal === '') { marksInput.classList.remove('invalid'); return; } // skip empty rows silently

    const marks = Number(marksVal);
    const credits = creditsVal === '' ? 0 : Number(creditsVal);

    if (!isValidMarks(marks) || isNaN(credits) || credits < 0) {
      marksInput.classList.add('invalid');
      return;
    }
    marksInput.classList.remove('invalid');

    // Step 1: Convert marks -> GPA (per active program/scheme)
    const result = convertToGPA(state.program, state.scheme, marks);

    // Step 2: Quality Points = GPA x Credit Hours
    totalQualityPoints += result.gpa * credits;
    totalCredits += credits;
    validCount++;
    if (result.status === 'fail') failCount++;
  });

  const seal = document.getElementById('gpaSeal');
  const sealValue = document.getElementById('gpaSealValue');
  const heading = document.getElementById('gpaResultHeading');
  const text = document.getElementById('gpaResultText');

  seal.classList.remove('stamped', 'fail-seal');
  void seal.offsetWidth; // restart stamp animation

  if (validCount === 0) {
    sealValue.textContent = '--';
    heading.textContent = 'No marks entered';
    text.textContent = 'Please enter marks (and credit hours) for at least one subject.';
    return;
  }
  if (totalCredits === 0) {
    sealValue.textContent = '--';
    heading.textContent = 'Missing credit hours';
    text.textContent = 'Please enter credit hours (greater than 0) for at least one subject.';
    return;
  }

  // Step 3: GPA = Sigma(Quality Points) / Sigma(Credit Hours)
  const finalGPA = round2(totalQualityPoints / totalCredits);
  sealValue.textContent = finalGPA.toFixed(2);
  seal.classList.add('stamped');

  if (failCount > 0) {
    seal.classList.add('fail-seal');
    heading.textContent = `Final GPA: ${finalGPA.toFixed(2)}`;
    text.textContent = `${failCount} of ${validCount} subject(s) received a failing grade and are included in the weighted average.`;
  } else {
    heading.textContent = `Final GPA: ${finalGPA.toFixed(2)}`;
    text.textContent = `Calculated across ${validCount} subject(s) using credit-hour weighting.`;
  }
}

function resetGPA() {
  gpaRowsEl.innerHTML = '';
  gpaSubjectCount = 0;
  addGpaRow();
  addGpaRow();

  const seal = document.getElementById('gpaSeal');
  seal.classList.remove('stamped', 'fail-seal');
  document.getElementById('gpaSealValue').textContent = '--';
  document.getElementById('gpaResultHeading').textContent = 'Awaiting calculation';
  document.getElementById('gpaResultText').textContent = 'Add subjects with marks and credit hours, then press Calculate GPA.';
}

document.getElementById('addSubjectBtn').addEventListener('click', () => addGpaRow());
document.getElementById('calcGPABtn').addEventListener('click', calculateGPA);
document.getElementById('resetGPABtn').addEventListener('click', resetGPA);

/* ----------------------------------------------------------------
   5. CGPA CALCULATOR (semester GPA + credit hours -> cumulative GPA)
   ---------------------------------------------------------------- */
const cgpaRowsEl = document.getElementById('cgpaRows');
let cgpaSemesterCount = 0;

function addCgpaRow(prefillLabel = '') {
  cgpaSemesterCount++;
  const row = document.createElement('div');
  row.className = 'row cgpa-grid';
  row.dataset.id = cgpaSemesterCount;

  const defaultLabel = prefillLabel || `Semester ${cgpaSemesterCount}`;

  row.innerHTML = `
    <span class="num">${cgpaSemesterCount}</span>
    <input type="text" class="semester-name" placeholder="Semester name" value="${defaultLabel}">
    <input type="number" class="semester-gpa" placeholder="0-4" min="0" max="4" step="0.01">
    <input type="number" class="semester-credits" placeholder="e.g. 15" min="0" step="0.5">
    <button type="button" class="remove-btn" title="Remove semester">&times;</button>
  `;

  cgpaRowsEl.appendChild(row);

  row.querySelector('.remove-btn').addEventListener('click', () => {
    if (cgpaRowsEl.children.length <= 1) return;
    row.classList.add('removing');
    row.addEventListener('animationend', () => {
      row.remove();
      renumberRows(cgpaRowsEl);
      cgpaSemesterCount = cgpaRowsEl.children.length;
    }, { once: true });
  });
}

// calculateCGPA() — required modular function
function calculateCGPA() {
  const rows = [...cgpaRowsEl.querySelectorAll('.row')];
  let totalQualityPoints = 0; // Sigma (GPA x Credit Hours)
  let totalCredits = 0;       // Sigma Credit Hours
  let validCount = 0;

  rows.forEach((row) => {
    const gpaVal = row.querySelector('.semester-gpa').value.trim();
    const creditsVal = row.querySelector('.semester-credits').value.trim();

    if (gpaVal === '' || creditsVal === '') return; // both required here

    const gpa = Number(gpaVal);
    const credits = Number(creditsVal);

    if (isNaN(gpa) || gpa < 0 || gpa > 4 || isNaN(credits) || credits < 0) return;

    totalQualityPoints += gpa * credits;
    totalCredits += credits;
    validCount++;
  });

  const seal = document.getElementById('cgpaSeal');
  const sealValue = document.getElementById('cgpaSealValue');
  const heading = document.getElementById('cgpaResultHeading');
  const text = document.getElementById('cgpaResultText');

  seal.classList.remove('stamped', 'fail-seal');
  void seal.offsetWidth;

  if (validCount === 0 || totalCredits === 0) {
    sealValue.textContent = '--';
    heading.textContent = 'No valid semesters entered';
    text.textContent = 'Please enter a GPA (0-4) and credit hours for at least one semester.';
    return;
  }

  // CGPA = Sigma(GPA x Credit Hours) / Sigma(Credit Hours), rounded to 2 decimals
  const finalCGPA = round2(totalQualityPoints / totalCredits);
  sealValue.textContent = finalCGPA.toFixed(2);
  seal.classList.add('stamped');

  heading.textContent = `Final CGPA: ${finalCGPA.toFixed(2)}`;
  text.textContent = `Calculated across ${validCount} semester(s), weighted by credit hours.`;
}

function resetCGPA() {
  cgpaRowsEl.innerHTML = '';
  cgpaSemesterCount = 0;
  addCgpaRow();
  addCgpaRow();

  const seal = document.getElementById('cgpaSeal');
  seal.classList.remove('stamped', 'fail-seal');
  document.getElementById('cgpaSealValue').textContent = '--';
  document.getElementById('cgpaResultHeading').textContent = 'Awaiting calculation';
  document.getElementById('cgpaResultText').textContent = "Add each semester's GPA and credit hours, then press Calculate CGPA.";
}

document.getElementById('addSemesterBtn').addEventListener('click', () => addCgpaRow());
document.getElementById('calcCGPABtn').addEventListener('click', calculateCGPA);
document.getElementById('resetCGPABtn').addEventListener('click', resetCGPA);

/* ----------------------------------------------------------------
   6. INITIAL STATE — pre-fill starter rows on load
   ---------------------------------------------------------------- */
addGpaRow('Subject 1');
addGpaRow('Subject 2');

addCgpaRow('Semester 1');
addCgpaRow('Semester 2');