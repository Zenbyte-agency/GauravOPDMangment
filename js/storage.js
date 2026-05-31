/* ================================================
   STORAGE.JS – LocalStorage Data Layer
   ================================================ */

const DB = {
  // Keys
  KEYS: {
    OPD_HEAD: 'opd_opdHead',
    COMPLAINTS: 'opd_complaints',
    DIAGNOSES: 'opd_diagnoses',
    MEDICINES: 'opd_medicines',
    MED_DUR: 'opd_medDuration',
    MED_FREQ: 'opd_medFrequency',
    MAST_RS: 'opd_mastRS',
    PATIENTS: 'opd_patients',
    BILLS: 'opd_bills',
    RX: 'opd_prescriptions',
    APPOINTMENTS: 'opd_appointments',
    SETTINGS: 'opd_settings',
    COUNTER: 'opd_counters',
    MED_CERTS: 'opd_medCertificates',
  },

  get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  },

  getObj(key, def = {}) {
    try { return JSON.parse(localStorage.getItem(key)) || def; }
    catch { return def; }
  },

  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },

  nextId(entity) {
    const counters = this.getObj(this.KEYS.COUNTER, {});
    counters[entity] = (counters[entity] || 1000) + 1;
    this.set(this.KEYS.COUNTER, counters);
    return counters[entity];
  },

  // ---- OPD Head ----
  getOpdHead() { return this.get(this.KEYS.OPD_HEAD); },
  saveOpdHead(arr) { this.set(this.KEYS.OPD_HEAD, arr); },

  // ---- Complaints ----
  getComplaints() { return this.get(this.KEYS.COMPLAINTS); },
  saveComplaints(arr) { this.set(this.KEYS.COMPLAINTS, arr); },

  // ---- Diagnoses ----
  getDiagnoses() { return this.get(this.KEYS.DIAGNOSES); },
  saveDiagnoses(arr) { this.set(this.KEYS.DIAGNOSES, arr); },

  // ---- Medicines ----
  getMedicines() { return this.get(this.KEYS.MEDICINES); },
  saveMedicines(arr) { this.set(this.KEYS.MEDICINES, arr); },

  // ---- Med Duration ----
  getMedDuration() { return this.get(this.KEYS.MED_DUR); },
  saveMedDuration(arr) { this.set(this.KEYS.MED_DUR, arr); },

  // ---- Med Frequency ----
  getMedFreq() { return this.get(this.KEYS.MED_FREQ); },
  saveMedFreq(arr) { this.set(this.KEYS.MED_FREQ, arr); },

  // ---- Mast RS ----
  getMastRS() { return this.get(this.KEYS.MAST_RS); },
  saveMastRS(arr) { this.set(this.KEYS.MAST_RS, arr); },

  // ---- Patients ----
  getPatients() { return this.get(this.KEYS.PATIENTS); },
  savePatients(arr) { this.set(this.KEYS.PATIENTS, arr); },
  addPatient(p) {
    p.id = this.nextId('patient');
    p.regDate = p.regDate || new Date().toISOString().split('T')[0];
    const arr = this.getPatients();
    arr.unshift(p);
    this.savePatients(arr);
    return p;
  },
  updatePatient(p) {
    const arr = this.getPatients().map(x => x.id === p.id ? p : x);
    this.savePatients(arr);
  },
  deletePatient(id) {
    this.savePatients(this.getPatients().filter(x => x.id !== id));
  },

  // ---- Bills ----
  getBills() { return this.get(this.KEYS.BILLS); },
  saveBills(arr) { this.set(this.KEYS.BILLS, arr); },
  addBill(b) {
    b.id = this.nextId('bill');
    b.date = b.date || new Date().toISOString().split('T')[0];
    b.billNo = 'B' + String(b.id).padStart(5, '0');
    const arr = this.getBills();
    arr.unshift(b);
    this.saveBills(arr);
    return b;
  },

  // ---- Prescriptions ----
  getPrescriptions() { return this.get(this.KEYS.RX); },
  savePrescriptions(arr) { this.set(this.KEYS.RX, arr); },
  addPrescription(rx) {
    rx.id = this.nextId('rx');
    rx.date = rx.date || new Date().toISOString().split('T')[0];
    rx.rxNo = 'RX' + String(rx.id).padStart(5, '0');
    const arr = this.getPrescriptions();
    arr.unshift(rx);
    this.savePrescriptions(arr);
    return rx;
  },
  updatePrescription(rx) {
    const arr = this.getPrescriptions().map(x => x.id === rx.id ? rx : x);
    this.savePrescriptions(arr);
  },

  // ---- Appointments ----
  getAppointments() { return this.get(this.KEYS.APPOINTMENTS); },
  saveAppointments(arr) { this.set(this.KEYS.APPOINTMENTS, arr); },
  addAppointment(a) {
    a.id = this.nextId('appt');
    const arr = this.getAppointments();
    arr.unshift(a);
    this.saveAppointments(arr);
    return a;
  },
  updateAppointment(a) {
    const arr = this.getAppointments().map(x => x.id === a.id ? a : x);
    this.saveAppointments(arr);
  },
  deleteAppointment(id) {
    this.saveAppointments(this.getAppointments().filter(x => x.id !== id));
  },

  // ---- Settings ----
  getSettings() {
    return this.getObj(this.KEYS.SETTINGS, {
      doctorName: 'Dr. Kanojiya',
      qualification: 'MBBS, Consultant Physician',
      regNo: 'MCI Reg. No.: 0042/2015',
      speciality: 'General Physician & Internal Medicine',
      clinicName: 'Sumanprem Clinic ',
      address: 'New Tapdiya Nagar, Behind Gajanan Temple, Akola',
      phone: '+91 99604 65681',
      timings: 'Mon–Sat: 10 AM – 2 PM, 6 PM – 10 PM <br> Sun: Evening Closed',
      email: 'kanojiyaraj@yahhoo.com',
      financialYearStart: '01/04/2025',
      financialYearEnd: '31/03/2026',
    });
  },
  saveSettings(s) { this.set(this.KEYS.SETTINGS, s); },

  // ---- Medical Certificates ----
  getCertificates() { return this.get(this.KEYS.MED_CERTS); },
  saveCertificates(arr) { this.set(this.KEYS.MED_CERTS, arr); },
  addCertificate(cert) {
    cert.id = this.nextId('cert');
    cert.issuedAt = cert.issuedAt || new Date().toISOString();
    const arr = this.getCertificates();
    arr.unshift(cert);
    this.saveCertificates(arr);
    return cert;
  },
  deleteCertificate(id) {
    this.saveCertificates(this.getCertificates().filter(c => c.id !== id));
  },
};

// ---- Seed default data if DB empty ----
(function seedDefaults() {
  if (!DB.getOpdHead().length) {
    DB.saveOpdHead([
      { id: 1, particular: 'FIRST - CONSULTATION', amount: 300 },
      { id: 2, particular: 'REVIEW - CONSULTATION', amount: 150 },
      { id: 3, particular: 'ECG', amount: 300 },
      { id: 4, particular: 'BLOOD SUGAR', amount: 100 },
      { id: 5, particular: 'NEBULIZER', amount: 200 },
      { id: 6, particular: 'DRESSING', amount: 150 },
      { id: 7, particular: 'INJ TT', amount: 100 },
      { id: 8, particular: 'SUTURE CHARGES', amount: 1000 },
      { id: 9, particular: 'DRIP CHARGES', amount: 500 },
      { id: 10, particular: 'INJ NEUROKIND PLUS 5 INJ', amount: 500 },
    ]);
  }

  if (!DB.getComplaints().length) {
    DB.saveComplaints([
      { id: 1, name: 'Cold cough fever throat pain *' },
      { id: 2, name: 'Pain in abdomen nausea vomiting tenderness' },
      { id: 3, name: 'Burning with frequent urge for urination' },
      { id: 4, name: 'Vomiting nausea' },
      { id: 5, name: 'Giddiness' },
      { id: 6, name: 'Left side Chest pain' },
      { id: 7, name: 'Gabrahat (palpitation)' },
      { id: 8, name: 'Boil over' },
      { id: 9, name: 'Generalised itching' },
      { id: 10, name: 'Generalised bodyache' },
      { id: 11, name: 'Fever chill' },
      { id: 12, name: 'Headache' },
      { id: 13, name: 'Breathlessness' },
      { id: 14, name: 'Back pain' },
      { id: 15, name: 'Joint pain' },
    ]);
  }

  if (!DB.getDiagnoses().length) {
    DB.saveDiagnoses([
      { id: 1, name: 'CKD/HTN/DM2/HYPOTHYROIDISM' },
      { id: 2, name: 'CCP/IHD/HTN' },
      { id: 3, name: 'DM2/HTN' },
      { id: 4, name: 'HTN' },
      { id: 5, name: 'CLD' },
      { id: 6, name: 'VIRAL FEVER ?' },
      { id: 7, name: 'GESTATIONAL HTN' },
      { id: 8, name: 'HBS Ag POSITIVE' },
      { id: 9, name: 'CELLULITIS' },
      { id: 10, name: 'HTN/DM2/HYPOTHYROIDISM' },
      { id: 11, name: 'ENTERIC FEVER' },
      { id: 12, name: 'URTI' },
      { id: 13, name: 'ANEMIA' },
      { id: 14, name: 'DIABETES MELLITUS TYPE 2' },
      { id: 15, name: 'PEPTIC ULCER DISEASE' },
    ]);
  }

  if (!DB.getMedicines().length) {
    DB.saveMedicines([
      { id: 1, name: 'TAB AUGMENTIN 625', type: 'Tablet', category: 'Antibiotic' },
      { id: 2, name: 'TAB AZITHROMYCIN 500', type: 'Tablet', category: 'Antibiotic' },
      { id: 3, name: 'TAB PARACETAMOL 500', type: 'Tablet', category: 'Analgesic' },
      { id: 4, name: 'TAB PANTOPRAZOLE 40', type: 'Tablet', category: 'PPI' },
      { id: 5, name: 'TAB METFORMIN 500', type: 'Tablet', category: 'Antidiabetic' },
      { id: 6, name: 'TAB AMLODIPINE 5', type: 'Tablet', category: 'Antihypertensive' },
      { id: 7, name: 'SYP BENADRYL', type: 'Syrup', category: 'Antitussive' },
      { id: 8, name: 'TAB CETRIZINE 10', type: 'Tablet', category: 'Antihistamine' },
      { id: 9, name: 'TAB MONTELUKAST 10', type: 'Tablet', category: 'Anti-allergic' },
      { id: 10, name: 'INJ ONDANSETRON', type: 'Injection', category: 'Antiemetic' },
      { id: 11, name: 'TAB IBUPROFEN 400', type: 'Tablet', category: 'NSAID' },
      { id: 12, name: 'TAB DOMPERIDONE 10', type: 'Tablet', category: 'Prokinetic' },
      { id: 13, name: 'CAP AMOXICILLIN 500', type: 'Capsule', category: 'Antibiotic' },
      { id: 14, name: 'TAB TELMISARTAN 40', type: 'Tablet', category: 'Antihypertensive' },
      { id: 15, name: 'TAB LEVOTHYROXINE 50', type: 'Tablet', category: 'Thyroid' },
      { id: 16, name: 'TAB ATORVASTATIN 10', type: 'Tablet', category: 'Statin' },
      { id: 17, name: 'TAB ASPIRIN 75', type: 'Tablet', category: 'Antiplatelet' },
      { id: 18, name: 'SYP AMOXICILLIN 125', type: 'Syrup', category: 'Antibiotic' },
      { id: 19, name: 'CREAM FUSIDIC ACID', type: 'Cream', category: 'Topical Antibiotic' },
      { id: 20, name: 'TAB METRONIDAZOLE 400', type: 'Tablet', category: 'Antiparasitic' },
    ]);
  }

  if (!DB.getMedDuration().length) {
    DB.saveMedDuration([
      { id: 1, days: 1, label: '1 Day' },
      { id: 2, days: 3, label: '3 Days' },
      { id: 3, days: 5, label: '5 Days' },
      { id: 4, days: 7, label: '7 Days' },
      { id: 5, days: 10, label: '10 Days' },
      { id: 6, days: 14, label: '14 Days' },
      { id: 7, days: 30, label: '1 Month' },
      { id: 8, days: 60, label: '2 Months' },
      { id: 9, days: 90, label: '3 Months' },
    ]);
  }

  if (!DB.getMastRS().length) {
    DB.saveMastRS([
      { id: 1, system: 'RS', finding: 'Chest clear' },
      { id: 2, system: 'RS', finding: 'BL crepts present' },
      { id: 3, system: 'RS', finding: 'BASAL CREPT+' },
      { id: 4, system: 'RS', finding: 'RHONCI BL+' },
      { id: 5, system: 'RS', finding: 'BL WHEEZE+' },
      { id: 6, system: 'RS', finding: 'AB B/L equal' },
      { id: 7, system: 'RS', finding: 'FINE CREPTATION+' },
      { id: 8, system: 'CVS', finding: 'S1 S2 N' },
      { id: 9, system: 'CVS', finding: 'Murmur present' },
      { id: 10, system: 'CVS', finding: 'Tachycardia' },
      { id: 11, system: 'CVS', finding: 'Bradycardia' },
      { id: 12, system: 'CVS', finding: 'ARRHYTHMIA+' },
      { id: 13, system: 'CVS', finding: 'WNL' },
      { id: 14, system: 'CNS', finding: 'conscious oriented' },
      { id: 15, system: 'CNS', finding: 'WNL' },
      { id: 16, system: 'ABD', finding: 'SOFT Tenderness+' },
      { id: 17, system: 'ABD', finding: 'DISTENDED NT' },
      { id: 18, system: 'ABD', finding: 'Fluid THRILL+ SWIFTING' },
      { id: 19, system: 'ABD', finding: 'HEPATOMEGALY' },
      { id: 20, system: 'ABD', finding: 'SPLENOMEGALY' },
      { id: 21, system: 'ABD', finding: 'SOFT NT' },
      { id: 22, system: 'ABD', finding: 'HEPATOSPLENOMEGALY' },
      { id: 23, system: 'ABD', finding: 'WNL' },
    ]);
  }

  if (!DB.getMedFreq().length) {
    DB.saveMedFreq([
      { id: 1, medName: 'DROP OCCUPOL EAR/EYE', freq: 'BD', fType: '2drop--2drop', days: 5, intAbt: '', adv: 'sabero sir Saama kao ok' },
      { id: 2, medName: 'CRM OCCUPOL EYE OINTM', freq: 'BD', fType: '1-------1', days: 5, intAbt: '', adv: 'sabero, dopher, Saama' },
      { id: 3, medName: 'FTB-NIMZU-P', freq: 'BD', fType: '1-------1', days: 3, intAbt: '', adv: 'sabero Saama Kanas Kanas ko ko' },
      { id: 4, medName: 'MCP CALDIKIND PLUS', freq: 'OD', fType: '1-------0', days: 30, intAbt: '', adv: 'sabero Kanas Kanas ko head' },
      { id: 5, medName: 'LIQUID CITAL', freq: 'TDS', fType: '10ml/glass pani mai', days: 7, intAbt: '', adv: 'sabero sir dopher kao ok Saama a' },
      { id: 6, medName: 'MCF EVION 40 MG', freq: 'BD', fType: '1-------1', days: 30, intAbt: '', adv: 'sabero Saama Kanas Kanas ko ko' },
      { id: 7, medName: 'PCP ECOSPRIN AV 150/20', freq: 'HS', fType: '0---10 PM', days: 60, intAbt: '', adv: 'asanao aao pehlay' },
      { id: 8, medName: 'LIQUID CRAIN UTI', freq: 'TDS', fType: '1--1--1(glass pani mai 10m)', days: 7, intAbt: '', adv: 'sabero dopher Saama Kanas Knas' },
      { id: 9, medName: 'PCP ZIVAST ASP', freq: 'HS', fType: '0---10 PM', days: 60, intAbt: '', adv: 'asanao aao pehlay' },
      { id: 10, medName: 'LIQUID LAXEE', freq: 'HS', fType: '0---15 ML', days: 5, intAbt: '', adv: 'asanao aao pahlay' },
    ]);
  }

  // Default advice template
  const s = DB.getSettings();
  if (!s.adviceTemplate) {
    s.adviceTemplate = '# ADVICE // NOTE #\n\n## FOLLOW UP: AFTER __ DAYS /WEEKS/MONTHS\n#DO NOT STOP ANY MEDICINE WITHOUT DOCTOR ADVICE.\n#IF DRUG REACTION OCCUR REVIEW TO DOCTOR IMMEDIATELY.';
    DB.saveSettings(s);
  }
})();
