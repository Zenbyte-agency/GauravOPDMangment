/* ================================================
   APP.JS – Main Application Logic
   ================================================ */

// ---- Auth guard ----
if (!sessionStorage.getItem('opd_logged_in')) { window.location.href = 'index.html'; }

// ---- Globals ----
let currentPage = 'dashboard';
let selectedBillPatient = null;
let selectedRxPatient = null;
let selectedApptPatient = null;
let viewingRxId = null;

// ---- Clock ----
function updateClock() {
  const now = new Date();
  const opts = { day:'2-digit', month:'long', year:'numeric' };
  document.getElementById('topbarDate').textContent = now.toLocaleDateString('en-IN', opts);
  document.getElementById('topbarTime').textContent = now.toLocaleTimeString('en-IN', { hour12: true });
  document.getElementById('statusTime').textContent = now.toLocaleTimeString('en-IN');
}
setInterval(updateClock, 1000);
updateClock();

// ---- Financial Year display ----
function updateFYDisplay() {
  const s = DB.getSettings();
  const fy = `${s.financialYearStart || '01/04/2025'} - ${s.financialYearEnd || '31/03/2026'}`;
  document.getElementById('topbarFY').textContent = fy;
  document.getElementById('statusFY').textContent = `FY: ${fy}`;
}
updateFYDisplay();

// ---- Navigation ----
function showPage(page) {
  currentPage = page;
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const link = document.querySelector(`.nav-link[data-page="${page}"]`);
  if (link) link.classList.add('active');
  const names = { dashboard:'Dashboard', opdHead:'OPD Head', complaints:'Complaint Master', diagnoses:'Diagnosis Master', medicines:'Medicine Master', medDuration:'Medicine Duration', medFreq:'Medicine Frequency', mastRS:'RS/CVS/ABD', fyear:'Financial Year', patients:'Patient Registration', opdBill:'OPD Bill', prescription:'Prescription', opdDisplay:'OPD Display', reports:'Reports', medCertificates:'Medical Certificates', modRx:'Mod. Prescription', appointments:'Appointments', backupData:'Backup Data' };
  document.getElementById('breadcrumbPage').textContent = names[page] || page;
  // Render page data
  const renderers = { dashboard:renderDashboard, opdHead:renderOpdHead, complaints:renderComplaints, diagnoses:renderDiagnoses, medicines:renderMedicines, medDuration:renderDurations, medFreq:renderMedFreq, mastRS:renderRS, fyear:loadFYear, patients:renderPatients, opdBill:renderBillPage, prescription:initRxPage, opdDisplay:renderOpdDisplay, reports:()=>{}, medCertificates:initCertPage, modRx:renderModRxList, appointments:renderAppointments, backupData:()=>{} };
  if (renderers[page]) renderers[page]();
  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('mobile-open');
}

function toggleSubmenu(el) {
  el.classList.toggle('open');
  const sub = el.nextElementSibling;
  if (sub) sub.classList.toggle('open');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
  document.getElementById('mainContent').classList.toggle('expanded');
}

document.getElementById('sidebarToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('mobile-open');
});

function doLogout() {
  sessionStorage.removeItem('opd_logged_in');
  window.location.href = 'index.html';
}

// ---- Modals ----
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ---- Toast ----
function toast(msg, type='success') {
  const c = document.getElementById('toastContainer');
  const icons = { success:'fa-check-circle', error:'fa-exclamation-circle', warning:'fa-exclamation-triangle' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<i class="fas ${icons[type]||icons.success}"></i><span class="toast-msg">${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.style.animation = 'toastOut 0.3s forwards'; setTimeout(() => t.remove(), 300); }, 3000);
}

// ---- Tab switching ----
function switchTab(btn, panelId) {
  btn.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  btn.closest('.card-body').querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(panelId).classList.add('active');
}

// ===========================
//  DASHBOARD
// ===========================
function renderDashboard() {
  const pats = DB.getPatients(), bills = DB.getBills(), rxs = DB.getPrescriptions(), appts = DB.getAppointments();
  const today = new Date().toISOString().split('T')[0];
  const todayAppts = appts.filter(a => a.date === today && a.status === 'Scheduled').length;
  const todayBills = bills.filter(b => b.date === today);
  const todayRev = todayBills.reduce((s,b) => s + (b.total||0), 0);

  document.getElementById('dashStats').innerHTML = `
    <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-users"></i></div><div class="stat-info"><h2>${pats.length}</h2><p>Total Patients</p></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="fas fa-prescription"></i></div><div class="stat-info"><h2>${rxs.length}</h2><p>Prescriptions</p></div></div>
    <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-receipt"></i></div><div class="stat-info"><h2>${bills.length}</h2><p>Total Bills</p></div></div>
    <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-calendar-check"></i></div><div class="stat-info"><h2>${todayAppts}</h2><p>Today's Appts</p></div></div>
    <div class="stat-card"><div class="stat-icon teal"><i class="fas fa-rupee-sign"></i></div><div class="stat-info"><h2>₹${todayRev.toLocaleString()}</h2><p>Today's Revenue</p></div></div>
    <div class="stat-card"><div class="stat-icon red"><i class="fas fa-pills"></i></div><div class="stat-info"><h2>${DB.getMedicines().length}</h2><p>Medicines</p></div></div>`;

  const tbody = document.querySelector('#dashRecentTable tbody');
  tbody.innerHTML = pats.slice(0,8).map(p => `<tr><td>${p.id}</td><td>${p.name}</td><td>${p.age} / ${p.gender}</td><td>${p.phone||'-'}</td><td>${p.regDate}</td></tr>`).join('') || '<tr><td colspan="5" class="empty-state"><i class="fas fa-inbox"></i><p>No patients yet</p></td></tr>';
  document.getElementById('statusPatCount').textContent = pats.length;
}

// ===========================
//  MASTER: OPD HEAD
// ===========================
function renderOpdHead() {
  const data = DB.getOpdHead();
  document.querySelector('#opdHeadTable tbody').innerHTML = data.map((h,i) => `<tr><td>${i+1}</td><td>${h.particular}</td><td>₹${h.amount}</td><td><button class="btn btn-sm btn-primary btn-icon" onclick="editOpdHead(${h.id})"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger btn-icon" onclick="deleteOpdHead(${h.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
}
function openOpdHeadModal(id) {
  document.getElementById('opdHeadEditId').value = '';
  document.getElementById('opdHeadParticular').value = '';
  document.getElementById('opdHeadAmount').value = '';
  document.getElementById('opdHeadModalTitle').textContent = 'Add OPD Head';
  openModal('modalOpdHead');
}
function editOpdHead(id) {
  const item = DB.getOpdHead().find(h => h.id === id);
  if (!item) return;
  document.getElementById('opdHeadEditId').value = id;
  document.getElementById('opdHeadParticular').value = item.particular;
  document.getElementById('opdHeadAmount').value = item.amount;
  document.getElementById('opdHeadModalTitle').textContent = 'Edit OPD Head';
  openModal('modalOpdHead');
}
function saveOpdHead() {
  const p = document.getElementById('opdHeadParticular').value.trim();
  const a = parseFloat(document.getElementById('opdHeadAmount').value);
  if (!p || isNaN(a)) return toast('Fill all fields','error');
  const editId = parseInt(document.getElementById('opdHeadEditId').value);
  let arr = DB.getOpdHead();
  if (editId) { arr = arr.map(h => h.id === editId ? {...h, particular:p, amount:a} : h); }
  else { arr.push({ id: Date.now(), particular:p, amount:a }); }
  DB.saveOpdHead(arr);
  closeModal('modalOpdHead');
  renderOpdHead();
  toast('OPD Head saved!');
}
function deleteOpdHead(id) {
  if (!confirm('Delete this item?')) return;
  DB.saveOpdHead(DB.getOpdHead().filter(h => h.id !== id));
  renderOpdHead();
  toast('Deleted','warning');
}

// ===========================
//  MASTER: COMPLAINTS
// ===========================
function renderComplaints() {
  const data = DB.getComplaints();
  document.querySelector('#complaintTable tbody').innerHTML = data.map((c,i) => `<tr><td>${i+1}</td><td>${c.name}</td><td><button class="btn btn-sm btn-primary btn-icon" onclick="editComplaint(${c.id})"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger btn-icon" onclick="deleteComplaint(${c.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
}
function openComplaintModal() { document.getElementById('complaintEditId').value=''; document.getElementById('complaintName').value=''; document.getElementById('complaintModalTitle').textContent='Add Complaint'; openModal('modalComplaint'); }
function editComplaint(id) { const c=DB.getComplaints().find(x=>x.id===id); if(!c)return; document.getElementById('complaintEditId').value=id; document.getElementById('complaintName').value=c.name; document.getElementById('complaintModalTitle').textContent='Edit Complaint'; openModal('modalComplaint'); }
function saveComplaint() {
  const n=document.getElementById('complaintName').value.trim(); if(!n)return toast('Enter complaint name','error');
  const editId=parseInt(document.getElementById('complaintEditId').value); let arr=DB.getComplaints();
  if(editId){ arr=arr.map(c=>c.id===editId?{...c,name:n}:c); } else { arr.push({id:Date.now(),name:n}); }
  DB.saveComplaints(arr); closeModal('modalComplaint'); renderComplaints(); toast('Complaint saved!');
}
function deleteComplaint(id) { if(!confirm('Delete?'))return; DB.saveComplaints(DB.getComplaints().filter(c=>c.id!==id)); renderComplaints(); toast('Deleted','warning'); }

// ===========================
//  MASTER: DIAGNOSES
// ===========================
function renderDiagnoses() {
  const data = DB.getDiagnoses();
  document.querySelector('#diagnosisTable tbody').innerHTML = data.map((d,i) => `<tr><td>${i+1}</td><td>${d.name}</td><td><button class="btn btn-sm btn-primary btn-icon" onclick="editDiagnosis(${d.id})"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger btn-icon" onclick="deleteDiagnosis(${d.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
}
function openDiagnosisModal() { document.getElementById('diagnosisEditId').value=''; document.getElementById('diagnosisName').value=''; document.getElementById('diagnosisModalTitle').textContent='Add Diagnosis'; openModal('modalDiagnosis'); }
function editDiagnosis(id) { const d=DB.getDiagnoses().find(x=>x.id===id); if(!d)return; document.getElementById('diagnosisEditId').value=id; document.getElementById('diagnosisName').value=d.name; document.getElementById('diagnosisModalTitle').textContent='Edit Diagnosis'; openModal('modalDiagnosis'); }
function saveDiagnosis() {
  const n=document.getElementById('diagnosisName').value.trim(); if(!n)return toast('Enter diagnosis name','error');
  const editId=parseInt(document.getElementById('diagnosisEditId').value); let arr=DB.getDiagnoses();
  if(editId){ arr=arr.map(d=>d.id===editId?{...d,name:n}:d); } else { arr.push({id:Date.now(),name:n}); }
  DB.saveDiagnoses(arr); closeModal('modalDiagnosis'); renderDiagnoses(); toast('Diagnosis saved!');
}
function deleteDiagnosis(id) { if(!confirm('Delete?'))return; DB.saveDiagnoses(DB.getDiagnoses().filter(d=>d.id!==id)); renderDiagnoses(); toast('Deleted','warning'); }

// ===========================
//  MASTER: MEDICINES
// ===========================
function renderMedicines() {
  const q = (document.getElementById('medSearchInput')?.value || '').toLowerCase();
  let data = DB.getMedicines();
  if (q) data = data.filter(m => m.name.toLowerCase().includes(q) || (m.category||'').toLowerCase().includes(q));
  document.querySelector('#medicineTable tbody').innerHTML = data.map((m,i) => `<tr><td>${i+1}</td><td>${m.name}</td><td><span class="badge badge-blue">${m.type||'-'}</span></td><td>${m.category||'-'}</td><td><button class="btn btn-sm btn-primary btn-icon" onclick="editMedicine(${m.id})"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger btn-icon" onclick="deleteMedicine(${m.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
}
function openMedicineModal() { document.getElementById('medicineEditId').value=''; document.getElementById('medicineName').value=''; document.getElementById('medicineType').value='Tablet'; document.getElementById('medicineCategory').value=''; document.getElementById('medicineModalTitle').textContent='Add Medicine'; openModal('modalMedicine'); }
function editMedicine(id) { const m=DB.getMedicines().find(x=>x.id===id); if(!m)return; document.getElementById('medicineEditId').value=id; document.getElementById('medicineName').value=m.name; document.getElementById('medicineType').value=m.type||'Tablet'; document.getElementById('medicineCategory').value=m.category||''; document.getElementById('medicineModalTitle').textContent='Edit Medicine'; openModal('modalMedicine'); }
function saveMedicine() {
  const n=document.getElementById('medicineName').value.trim(); if(!n)return toast('Enter medicine name','error');
  const t=document.getElementById('medicineType').value, cat=document.getElementById('medicineCategory').value.trim();
  const editId=parseInt(document.getElementById('medicineEditId').value); let arr=DB.getMedicines();
  if(editId){ arr=arr.map(m=>m.id===editId?{...m,name:n,type:t,category:cat}:m); } else { arr.push({id:Date.now(),name:n,type:t,category:cat}); }
  DB.saveMedicines(arr); closeModal('modalMedicine'); renderMedicines(); toast('Medicine saved!');
}
function deleteMedicine(id) { if(!confirm('Delete?'))return; DB.saveMedicines(DB.getMedicines().filter(m=>m.id!==id)); renderMedicines(); toast('Deleted','warning'); }

// ---- Excel Import ----
function importMedicinesFromExcel(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const wb = XLSX.read(e.target.result, { type:'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);
      let arr = DB.getMedicines(), count = 0;
      rows.forEach(r => {
        const name = (r['Medicine Name'] || r['Name'] || r['name'] || r['medicine'] || r['MEDICINE'] || Object.values(r)[0] || '').toString().trim();
        if (!name) return;
        const type = (r['Type'] || r['type'] || 'Tablet').toString().trim();
        const cat = (r['Category'] || r['category'] || '').toString().trim();
        if (!arr.some(m => m.name.toLowerCase() === name.toLowerCase())) {
          arr.push({ id: Date.now() + count, name, type, category: cat });
          count++;
        }
      });
      DB.saveMedicines(arr);
      renderMedicines();
      toast(`Imported ${count} medicines from Excel!`);
    } catch(err) { toast('Error reading Excel file: ' + err.message, 'error'); }
    event.target.value = '';
  };
  reader.readAsBinaryString(file);
}

// ---- Excel Export / Download ----
function exportMedicinesToExcel() {
  const meds = DB.getMedicines();
  if (!meds.length) { toast('No medicines to export', 'warning'); return; }
  const data = meds.map((m, i) => ({
    'Sr.No': i + 1,
    'Medicine Name': m.name,
    'Type': m.type || '',
    'Category': m.category || ''
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  // Auto-size columns
  ws['!cols'] = [
    { wch: 8 },   // Sr.No
    { wch: 40 },  // Medicine Name
    { wch: 15 },  // Type
    { wch: 20 }   // Category
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Medicines');
  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Medicine_Master_${today}.xlsx`);
  toast(`Exported ${meds.length} medicines to Excel!`);
}

// ===========================
//  MASTER: DURATION
// ===========================
function renderDurations() {
  const data = DB.getMedDuration();
  document.querySelector('#durTable tbody').innerHTML = data.map((d,i) => `<tr><td>${i+1}</td><td>${d.days}</td><td>${d.label}</td><td><button class="btn btn-sm btn-primary btn-icon" onclick="editDur(${d.id})"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger btn-icon" onclick="deleteDur(${d.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
}
function openDurModal() { document.getElementById('durEditId').value=''; document.getElementById('durDays').value=''; document.getElementById('durLabel').value=''; document.getElementById('durModalTitle').textContent='Add Duration'; openModal('modalDur'); }
function editDur(id) { const d=DB.getMedDuration().find(x=>x.id===id); if(!d)return; document.getElementById('durEditId').value=id; document.getElementById('durDays').value=d.days; document.getElementById('durLabel').value=d.label; document.getElementById('durModalTitle').textContent='Edit Duration'; openModal('modalDur'); }
function saveDur() {
  const days=parseInt(document.getElementById('durDays').value), label=document.getElementById('durLabel').value.trim();
  if(isNaN(days)||!label) return toast('Fill all fields','error');
  const editId=parseInt(document.getElementById('durEditId').value); let arr=DB.getMedDuration();
  if(editId){ arr=arr.map(d=>d.id===editId?{...d,days,label}:d); } else { arr.push({id:Date.now(),days,label}); }
  DB.saveMedDuration(arr); closeModal('modalDur'); renderDurations(); toast('Duration saved!');
}
function deleteDur(id) { if(!confirm('Delete?'))return; DB.saveMedDuration(DB.getMedDuration().filter(d=>d.id!==id)); renderDurations(); toast('Deleted','warning'); }

// ===========================
//  MASTER: RS/CVS/ABD
// ===========================
function renderRS() {
  const data = DB.getMastRS();
  document.querySelector('#rsTable tbody').innerHTML = data.map((r,i) => `<tr><td>${i+1}</td><td><span class="badge badge-primary">${r.system}</span></td><td>${r.finding}</td><td><button class="btn btn-sm btn-primary btn-icon" onclick="editRS(${r.id})"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger btn-icon" onclick="deleteRS(${r.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
}
function openRSModal() { document.getElementById('rsEditId').value=''; document.getElementById('rsSystem').value='RS'; document.getElementById('rsFinding').value=''; document.getElementById('rsModalTitle').textContent='Add Finding'; openModal('modalRS'); }
function editRS(id) { const r=DB.getMastRS().find(x=>x.id===id); if(!r)return; document.getElementById('rsEditId').value=id; document.getElementById('rsSystem').value=r.system; document.getElementById('rsFinding').value=r.finding; document.getElementById('rsModalTitle').textContent='Edit Finding'; openModal('modalRS'); }
function saveRS() {
  const sys=document.getElementById('rsSystem').value, finding=document.getElementById('rsFinding').value.trim();
  if(!finding) return toast('Enter finding','error');
  const editId=parseInt(document.getElementById('rsEditId').value); let arr=DB.getMastRS();
  if(editId){ arr=arr.map(r=>r.id===editId?{...r,system:sys,finding}:r); } else { arr.push({id:Date.now(),system:sys,finding}); }
  DB.saveMastRS(arr); closeModal('modalRS'); renderRS(); toast('Finding saved!');
}
function deleteRS(id) { if(!confirm('Delete?'))return; DB.saveMastRS(DB.getMastRS().filter(r=>r.id!==id)); renderRS(); toast('Deleted','warning'); }

// ===========================
//  FINANCIAL YEAR
// ===========================
function loadFYear() {
  const s = DB.getSettings();
  const parseDate = d => { if(!d)return''; const p=d.split('/'); return p.length===3?`${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`:d; };
  document.getElementById('fyStart').value = parseDate(s.financialYearStart);
  document.getElementById('fyEnd').value = parseDate(s.financialYearEnd);
}
function saveFYear() {
  const s = DB.getSettings();
  const start = document.getElementById('fyStart').value;
  const end = document.getElementById('fyEnd').value;
  if (!start || !end) return toast('Select both dates','error');
  const fmt = d => { const p=d.split('-'); return `${p[2]}/${p[1]}/${p[0]}`; };
  s.financialYearStart = fmt(start);
  s.financialYearEnd = fmt(end);
  DB.saveSettings(s);
  updateFYDisplay();
  toast('Financial Year saved!');
}

// ===========================
//  PATIENTS
// ===========================
function renderPatients() {
  const q = (document.getElementById('patSearchInput')?.value||'').toLowerCase();
  let data = DB.getPatients();
  if (q) data = data.filter(p => p.name.toLowerCase().includes(q) || (p.phone||'').includes(q) || String(p.id).includes(q));
  document.querySelector('#patientTable tbody').innerHTML = data.map(p => `<tr><td>${p.id}</td><td><strong>${p.name}</strong></td><td>${p.age}</td><td>${p.gender}</td><td>${p.phone||'-'}</td><td>${p.address||'-'}</td><td>${p.regDate}</td><td><button class="btn btn-sm btn-primary btn-icon" onclick="editPatient(${p.id})"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger btn-icon" onclick="delPatient(${p.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('') || '<tr><td colspan="8"><div class="empty-state"><i class="fas fa-user-slash"></i><p>No patients found</p></div></td></tr>';
}
function getNextPatientRegNo() {
  const counters = DB.getObj(DB.KEYS.COUNTER, {});
  return (counters['patient'] || 1000) + 1;
}
function openPatientModal() { document.getElementById('patEditId').value=''; document.getElementById('patName').value=''; document.getElementById('patAge').value=''; document.getElementById('patGender').value='Male'; document.getElementById('patPhone').value=''; document.getElementById('patAddress').value=''; document.getElementById('patDrugAllergy').value=''; document.getElementById('patPastHistory').value=''; document.getElementById('patRegDate').value=new Date().toISOString().split('T')[0]; document.getElementById('patientModalTitle').textContent='New Patient'; document.getElementById('patRegNo').value=getNextPatientRegNo(); openModal('modalPatient'); }
function editPatient(id) { const p=DB.getPatients().find(x=>x.id===id); if(!p)return; document.getElementById('patEditId').value=id; document.getElementById('patName').value=p.name; document.getElementById('patAge').value=p.age; document.getElementById('patGender').value=p.gender; document.getElementById('patPhone').value=p.phone||''; document.getElementById('patAddress').value=p.address||''; document.getElementById('patDrugAllergy').value=p.drugAllergy||''; document.getElementById('patPastHistory').value=p.pastHistory||''; document.getElementById('patRegDate').value=p.regDate; document.getElementById('patientModalTitle').textContent='Edit Patient'; document.getElementById('patRegNo').value=p.id; openModal('modalPatient'); }
function savePatient() {
  const name=document.getElementById('patName').value.trim(), age=parseInt(document.getElementById('patAge').value), gender=document.getElementById('patGender').value;
  if(!name||isNaN(age)) return toast('Name and Age are required','error');
  const phone=document.getElementById('patPhone').value.trim(), address=document.getElementById('patAddress').value.trim(), regDate=document.getElementById('patRegDate').value||new Date().toISOString().split('T')[0];
  const drugAllergy=document.getElementById('patDrugAllergy').value.trim();
  const pastHistory=document.getElementById('patPastHistory').value.trim();
  const editId=parseInt(document.getElementById('patEditId').value);
  if(editId) { DB.updatePatient({id:editId,name,age,gender,phone,address,drugAllergy,pastHistory,regDate}); }
  else { DB.addPatient({name,age,gender,phone,address,drugAllergy,pastHistory,regDate}); }
  closeModal('modalPatient'); renderPatients(); toast('Patient saved!');
}
function delPatient(id) { if(!confirm('Delete this patient?'))return; DB.deletePatient(id); renderPatients(); toast('Patient deleted','warning'); }

// ---- Patient Excel Export / Download ----
function exportPatientsToExcel() {
  const pats = DB.getPatients();
  if (!pats.length) { toast('No patients to export', 'warning'); return; }
  const data = pats.map((p, i) => ({
    'Sr.No': i + 1,
    'ID': p.id,
    'Name': p.name,
    'Age': p.age,
    'Gender': p.gender,
    'Phone': p.phone || '',
    'Address': p.address || '',
    'Drug Allergy': p.drugAllergy || '',
    'Past History': p.pastHistory || '',
    'Registration Date': p.regDate || ''
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 8 },   // Sr.No
    { wch: 10 },  // ID
    { wch: 30 },  // Name
    { wch: 6 },   // Age
    { wch: 10 },  // Gender
    { wch: 15 },  // Phone
    { wch: 35 },  // Address
    { wch: 25 },  // Drug Allergy
    { wch: 35 },  // Past History
    { wch: 15 }   // Registration Date
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Patients');
  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `Patient_Data_${today}.xlsx`);
  toast(`Exported ${pats.length} patients to Excel!`);
}

// ---- Patient Excel Import ----
function importPatientsFromExcel(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const wb = XLSX.read(e.target.result, { type:'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);
      let arr = DB.getPatients(), count = 0;
      rows.forEach(r => {
        const name = (r['Name'] || r['name'] || r['Patient Name'] || r['PATIENT NAME'] || Object.values(r)[0] || '').toString().trim();
        if (!name) return;
        const age = parseInt(r['Age'] || r['age'] || 0) || 0;
        const gender = (r['Gender'] || r['gender'] || 'Male').toString().trim();
        const phone = (r['Phone'] || r['phone'] || r['Mobile'] || r['mobile'] || '').toString().trim();
        const address = (r['Address'] || r['address'] || '').toString().trim();
        const drugAllergy = (r['Drug Allergy'] || r['drug allergy'] || r['Allergy'] || '').toString().trim();
        const pastHistory = (r['Past History'] || r['past history'] || r['History'] || '').toString().trim();
        const regDate = (r['Registration Date'] || r['Reg Date'] || r['reg date'] || new Date().toISOString().split('T')[0]).toString().trim();
        // Check for duplicate by name + phone (case-insensitive)
        const isDuplicate = arr.some(p => p.name.toLowerCase() === name.toLowerCase() && (p.phone || '') === phone);
        if (!isDuplicate) {
          DB.addPatient({ name, age, gender, phone, address, drugAllergy, pastHistory, regDate });
          arr = DB.getPatients(); // refresh after add
          count++;
        }
      });
      renderPatients();
      toast(`Imported ${count} patients from Excel!`);
    } catch(err) { toast('Error reading Excel file: ' + err.message, 'error'); }
    event.target.value = '';
  };
  reader.readAsBinaryString(file);
}

// ===========================
//  AUTOCOMPLETE HELPER
// ===========================
function setupAutocomplete(inputId, listId, getItems, onSelect) {
  const inp = document.getElementById(inputId);
  const list = document.getElementById(listId);
  if (!inp || !list) return;
  inp.addEventListener('input', () => {
    const q = inp.value.toLowerCase().trim();
    if (q.length < 1) { list.classList.remove('show'); return; }
    const items = getItems().filter(i => i.label.toLowerCase().includes(q)).slice(0, 12);
    if (!items.length) { list.classList.remove('show'); return; }
    list.innerHTML = items.map(i => `<div class="autocomplete-item" data-value="${i.value}" data-label="${i.label}">${i.label}</div>`).join('');
    list.classList.add('show');
    list.querySelectorAll('.autocomplete-item').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        inp.value = el.dataset.label;
        list.classList.remove('show');
        if (onSelect) onSelect(el.dataset.value, el.dataset.label);
      });
    });
  });
  inp.addEventListener('blur', () => setTimeout(() => list.classList.remove('show'), 150));
}

// Multi-Autocomplete for comma-separated values (Complaints & Diagnosis)
function setupMultiAutocomplete(inputId, listId, getItems) {
  const inp = document.getElementById(inputId);
  const list = document.getElementById(listId);
  if (!inp || !list) return;
  
  inp.addEventListener('input', () => {
    const fullText = inp.value;
    const parts = fullText.split(',').map(p => p.trim());
    const currentPart = parts[parts.length - 1].toLowerCase();
    
    if (currentPart.length < 1) { list.classList.remove('show'); return; }
    
    const items = getItems().filter(i => i.label.toLowerCase().includes(currentPart)).slice(0, 12);
    if (!items.length) { list.classList.remove('show'); return; }
    
    list.innerHTML = items.map(i => `<div class="autocomplete-item" data-label="${i.label}">${i.label}</div>`).join('');
    list.classList.add('show');
    
    list.querySelectorAll('.autocomplete-item').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const parts = inp.value.split(',').map(p => p.trim());
        parts[parts.length - 1] = el.dataset.label;
        inp.value = parts.join(', ');
        list.classList.remove('show');
      });
    });
  });
  
  inp.addEventListener('blur', () => setTimeout(() => list.classList.remove('show'), 150));
}

// ===========================
//  OPD BILL (Enhanced)
// ===========================
function renderBillPage() {
  document.getElementById('billDate').value = new Date().toISOString().split('T')[0];
  const bills = DB.getBills();
  document.getElementById('billSrNo').value = bills.length + 1;
  document.getElementById('billNo').value = bills.length + 1;
  setupAutocomplete('billPatient', 'billPatientList', () => DB.getPatients().map(p => ({value:p.id, label:`${p.name} (ID:${p.id})`})), (val) => {
    selectedBillPatient = parseInt(val);
    const pat = DB.getPatients().find(p => p.id === selectedBillPatient);
    if (pat) {
      document.getElementById('billRegNo').value = pat.id;
      document.getElementById('billPhNo').value = pat.phone || '';
    }
  });
  if (!document.getElementById('billItemsContainer').children.length) addBillItemRow();
  renderBillHistory();
}
function lookupPatientByRegNo() {
  const regNo = document.getElementById('billRegNo').value.trim();
  const pat = DB.getPatients().find(p => String(p.id) === regNo);
  if (pat) {
    document.getElementById('billPatient').value = pat.name;
    document.getElementById('billPhNo').value = pat.phone || '';
    selectedBillPatient = pat.id;
  }
}
function addBillItemRow() {
  const c = document.getElementById('billItemsContainer');
  const heads = DB.getOpdHead();
  const opts = heads.map(h => `<option value="${h.id}" data-amount="${h.amount}">${h.particular}</option>`).join('');
  const row = document.createElement('div');
  row.className = 'bill-item-row';
  row.innerHTML = `<div class="bill-col-name"><select class="form-control bill-item-select" onchange="billItemChanged(this)"><option value="">Select item…</option>${opts}</select></div><div class="bill-col-charges"><input type="number" class="form-control bill-item-charges" placeholder="Charges" oninput="calcBillRow(this)"/></div><div class="bill-col-nt"><input type="number" class="form-control bill-item-nt" placeholder="NT" value="1" min="1" oninput="calcBillRow(this)"/></div><div class="bill-col-amt"><input type="number" class="form-control bill-item-amount" placeholder="Amount" readonly/></div><div class="bill-col-rm"><button class="btn btn-sm btn-danger btn-icon" onclick="this.closest('.bill-item-row').remove();calcBillTotal()"><i class="fas fa-times"></i></button></div>`;
  c.appendChild(row);
}
function billItemChanged(sel) {
  const opt = sel.options[sel.selectedIndex];
  const amt = opt?.dataset?.amount;
  const row = sel.closest('.bill-item-row');
  if (amt) {
    row.querySelector('.bill-item-charges').value = amt;
    row.querySelector('.bill-item-nt').value = 1;
    row.querySelector('.bill-item-amount').value = amt;
  }
  calcBillTotal();
}
function calcBillRow(inp) {
  const row = inp.closest('.bill-item-row');
  const charges = parseFloat(row.querySelector('.bill-item-charges').value) || 0;
  const nt = parseInt(row.querySelector('.bill-item-nt').value) || 1;
  row.querySelector('.bill-item-amount').value = charges * nt;
  calcBillTotal();
}
function calcBillTotal() {
  let total = 0;
  document.querySelectorAll('.bill-item-amount').forEach(inp => { total += parseFloat(inp.value) || 0; });
  document.getElementById('billTotalAmt').value = total;
  calcBillFinal();
}
function calcBillFinal() {
  const total = parseFloat(document.getElementById('billTotalAmt').value) || 0;
  const disc = parseFloat(document.getElementById('billDiscAmt').value) || 0;
  const rec = parseFloat(document.getElementById('billRecAmt').value) || 0;
  const prevBal = parseFloat(document.getElementById('billPrevBal').value) || 0;
  const net = total - disc + prevBal;
  const bal = net - rec;
  document.getElementById('billBalAmt').value = bal;
}
function collectBillData() {
  const patName = document.getElementById('billPatient').value.trim();
  if (!patName) { toast('Select a patient','error'); return null; }
  const items = [];
  document.querySelectorAll('.bill-item-row').forEach(row => {
    const sel = row.querySelector('.bill-item-select');
    const charges = parseFloat(row.querySelector('.bill-item-charges').value) || 0;
    const nt = parseInt(row.querySelector('.bill-item-nt').value) || 1;
    const amt = parseFloat(row.querySelector('.bill-item-amount').value) || 0;
    if (sel.value && amt > 0) items.push({ particular: sel.options[sel.selectedIndex].text, charges, nt, amount: amt });
  });
  if (!items.length) { toast('Add at least one item','error'); return null; }
  const total = parseFloat(document.getElementById('billTotalAmt').value) || 0;
  const disc = parseFloat(document.getElementById('billDiscAmt').value) || 0;
  const rec = parseFloat(document.getElementById('billRecAmt').value) || 0;
  const bal = parseFloat(document.getElementById('billBalAmt').value) || 0;
  const prevBal = parseFloat(document.getElementById('billPrevBal').value) || 0;
  return { patientId: selectedBillPatient, patientName: patName, date: document.getElementById('billDate').value, items, total, disc, rec, bal, prevBal };
}
function saveBill() {
  const data = collectBillData(); if (!data) return;
  DB.addBill(data);
  toast('Bill saved!');
  resetBillForm();
  renderBillHistory();
}
function saveBillAndPrint() {
  const data = collectBillData(); if (!data) return;
  const bill = DB.addBill(data);
  printBill(bill);
  resetBillForm();
  renderBillHistory();
}
function resetBillForm() {
  document.getElementById('billPatient').value = '';
  document.getElementById('billRegNo').value = '';
  document.getElementById('billPhNo').value = '';
  document.getElementById('billPrevBal').value = '0';
  document.getElementById('billDiscAmt').value = '0';
  document.getElementById('billRecAmt').value = '0';
  document.getElementById('billBalAmt').value = '';
  document.getElementById('billTotalAmt').value = '';
  selectedBillPatient = null;
  document.getElementById('billItemsContainer').innerHTML = '';
  addBillItemRow();
  const bills = DB.getBills();
  document.getElementById('billSrNo').value = bills.length + 1;
  document.getElementById('billNo').value = bills.length + 1;
}
function renderBillHistory() {
  const bills = DB.getBills().slice(0, 20);
  document.querySelector('#billHistoryTable tbody').innerHTML = bills.map(b => `<tr><td><span class="badge badge-primary">${b.billNo}</span></td><td>${b.patientName}</td><td>${b.date}</td><td>₹${(b.total||0).toLocaleString()}</td><td>₹${(b.disc||0)}</td><td>₹${(b.rec||0)}</td><td>₹${(b.bal||0)}</td><td><button class="btn btn-sm btn-primary btn-icon" onclick="printBill(DB.getBills().find(x=>x.id===${b.id}))"><i class="fas fa-print"></i></button></td></tr>`).join('');
}
function printBill(bill) {
  if (!bill) return;
  const s = DB.getSettings();
  const html = `<div class="bill-print">
    <div class="bill-print-header-spacer" style="height:6cm;"></div>
    <p><strong>Bill No:</strong> ${bill.billNo} &nbsp;&nbsp; <strong>Date:</strong> ${bill.date} &nbsp;&nbsp; <strong>Patient:</strong> ${bill.patientName}</p>
    <table class="bill-print-table"><thead><tr><th>#</th><th>Particulars</th><th>Charges</th><th>NT</th><th>Amount (₹)</th></tr></thead><tbody>${bill.items.map((it,i) => `<tr><td>${i+1}</td><td>${it.particular}</td><td>${it.charges||it.amount}</td><td>${it.nt||1}</td><td>${it.amount}</td></tr>`).join('')}</tbody></table>
    <div style="text-align:right;margin-top:8px;font-size:13px"><p>Total: ₹${(bill.total||0).toLocaleString()}</p>${bill.disc?`<p>Discount: ₹${bill.disc}</p>`:''}<p>Received: ₹${bill.rec||0}</p><p style="font-size:16px;font-weight:700;color:#1a4fa0">Balance: ₹${bill.bal||0}</p></div>
  </div>`;
  const printArea = document.getElementById('printArea');
  printArea.innerHTML = html;
  printArea.style.display = 'block';
  setTimeout(() => { window.print(); printArea.style.display = 'none'; }, 200);
}

// ===========================
//  PRESCRIPTION (Enhanced)
// ===========================
// Insert advice emoji/phrase at cursor position in rxAdvice textarea
function insertAdviceEmoji(text) {
  const ta = document.getElementById('rxAdvice');
  if (!ta) return;
  const start = ta.selectionStart;
  const end   = ta.selectionEnd;
  const before = ta.value.substring(0, start);
  const after  = ta.value.substring(end);
  // Add a newline before if there's already content and it doesn't end with newline
  const sep = (before.length > 0 && !before.endsWith('\n')) ? '\n' : '';
  ta.value = before + sep + text + '\n' + after;
  // Place cursor after inserted text
  const newPos = start + sep.length + text.length + 1;
  ta.selectionStart = ta.selectionEnd = newPos;
  ta.focus();
}

function showDrugAllergyBanner(drugAllergy) {
  const banner = document.getElementById('rxDrugAllergyBanner');
  const text = document.getElementById('rxDrugAllergyText');
  if (drugAllergy && drugAllergy.trim()) {
    text.textContent = drugAllergy;
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
    text.textContent = '';
  }
}

// Show prescription count + last 3 prescriptions for the selected patient
function renderPatientRxHistory(patientId) {
  const panel = document.getElementById('rxPatientHistory');
  const countBadge = document.getElementById('rxPatRxCount');
  const cardsEl = document.getElementById('rxPatHistoryCards');
  if (!patientId) { panel.style.display = 'none'; return; }
  const all = DB.getPrescriptions().filter(r => r.patientId === patientId);
  const total = all.length;
  countBadge.textContent = total + (total === 1 ? ' Prescription' : ' Prescriptions');
  if (total === 0) {
    cardsEl.innerHTML = '<div class="rx-hist-empty"><i class="fas fa-file-medical"></i> No previous prescriptions found for this patient.</div>';
  } else {
    const last3 = all.slice(0, 3);
    cardsEl.innerHTML = last3.map(rx => {
      const medsHtml = (rx.medicines && rx.medicines.length)
        ? rx.medicines.map(m => `<span class="rx-hist-med-tag">${m.name}</span>`).join('')
        : '<span style="color:#999;font-size:0.8rem">No medicines</span>';
      return `<div class="rx-hist-card">
        <div class="rx-hist-card-top">
          <span class="rx-hist-rxno">${rx.rxNo}</span>
          <span class="rx-hist-date"><i class="fas fa-calendar-alt"></i> ${rx.date}</span>
          ${rx.diagnosis ? `<span class="rx-hist-diag"><i class="fas fa-stethoscope"></i> ${rx.diagnosis}</span>` : ''}
        </div>
        <div class="rx-hist-meds">${medsHtml}</div>
        ${rx.advice ? `<div class="rx-hist-advice"><i class="fas fa-sticky-note"></i> ${rx.advice.substring(0,80)}${rx.advice.length>80?'…':''}</div>` : ''}
      </div>`;
    }).join('');
  }
  panel.style.display = 'block';
}

function initRxPage() {
  document.getElementById('rxDate').value = new Date().toISOString().split('T')[0];
  setupAutocomplete('rxPatient', 'rxPatientList', () => DB.getPatients().map(p => ({value:p.id, label:`${p.name} (ID:${p.id})`})), (val) => {
    selectedRxPatient = parseInt(val);
    const pat = DB.getPatients().find(p => p.id === selectedRxPatient);
    if (pat) {
      document.getElementById('rxPtNo').value = pat.id;
      document.getElementById('rxSex').value = pat.gender;
      document.getElementById('rxAge').value = pat.age;
      showDrugAllergyBanner(pat.drugAllergy);
      renderPatientRxHistory(selectedRxPatient);
      // Auto-load past history from patient registration
      if (pat.pastHistory) {
        document.getElementById('rxPastHistory').value = pat.pastHistory;
      }
    }
  });
  setupMultiAutocomplete('rxComplaint', 'rxComplaintList', () => DB.getComplaints().map(c => ({value:c.id, label:c.name})));
  setupMultiAutocomplete('rxDiagnosis', 'rxDiagnosisList', () => DB.getDiagnoses().map(d => ({value:d.id, label:d.name})));
  const rs = DB.getMastRS();
  ['RS','CVS','ABD','CNS'].forEach(sys => {
    const sel = document.getElementById('rx' + sys);
    const items = rs.filter(r => r.system === sys || (sys==='CNS' && (r.system==='CNS'||r.system==='Sp.Inst')));
    sel.innerHTML = '<option value="">--</option>' + items.map(r => `<option value="${r.finding}">${r.finding}</option>`).join('');
  });
  if (!document.getElementById('rxMedsContainer').children.length) addRxMedRow();
  // Pre-fill advice template with standard text
  const advEl = document.getElementById('rxAdvice');
  if (!advEl.value) {
    advEl.value = '';
  }
}

function addRxMedRow() {
  const c = document.getElementById('rxMedsContainer');
  const row = document.createElement('div');
  row.className = 'medicine-row';
  const doseOptions = [
    '','1-0-1','1-1-1','0-1-0','0-0-1','1-0-0','0-1-1','1-1-0',
    '2-0-2','2-1-2','2-2-2','0-0-2','2-0-0','1-0-2',
    '½-0-½','1-½-1','0-½-0',
    '10ml','15ml','5ml','2drops','1drop','1 puff','2 puffs'
  ].map(o => `<option value="${o}">${o||'-- Dose --'}</option>`).join('');
  const timingOptions = [
    '','Khane ke pahle','Khane ke baad','Subah khali pet',
    'Raat ko sone se pahle','Subah-Shaam','Teen baar',
    'Zaroorat padne par','Khaana khaane ke saath'
  ].map(o => `<option value="${o}">${o||'-- Timing --'}</option>`).join('');
  row.innerHTML = `<div class="medicine-col-name" style="flex:2;min-width:160px"><div class="autocomplete-wrap"><input type="text" class="form-control rx-med-name" placeholder="Medicine name…" autocomplete="off"/><div class="autocomplete-list rx-med-list"></div></div></div><div class="medicine-col-sm" style="flex:1;min-width:80px"><select class="form-control rx-med-freq"><option value="BD">सुबह -- शाम (BD)</option><option value="OD-S">सुबह (OD)</option><option value="OD-D">दोपहर (OD)</option><option value="OD-E">शाम (OD)</option><option value="TDS">दिन में तीन बार (TDS)</option><option value="HS">रात को सोते समय (HS)</option><option value="SOS">ज़रूरत पड़ने पर (SOS)</option><option value="STAT">तुरंत (STAT)</option><option value="QID">दिन में चार बार (QID)</option><option value="OW">हफ्ते में एक बार (OW)</option><option value="BW">हफ्ते में दो बार (BW)</option><option value="TW">हफ्ते में तीन बार (TW)</option><option value="FD">हफ्ते में पाँच दिन (FD)</option></select></div><div class="medicine-col-sm" style="flex:1;min-width:120px;display:flex;flex-direction:column;gap:3px"><select class="form-control rx-med-ftype" style="font-size:0.78rem;padding:3px 4px">${doseOptions}</select><select class="form-control rx-med-ftiming" style="font-size:0.78rem;padding:3px 4px">${timingOptions}</select></div><div class="medicine-col-sm" style="flex:0 0 60px"><input type="number" class="form-control rx-med-nd" placeholder="ND" min="1"/></div><div class="medicine-col-sm" style="flex:1;min-width:100px"><input type="text" class="form-control rx-med-intabt" placeholder="Int.Abt Med"/></div><div class="medicine-col-rm" style="flex:0 0 36px"><button class="btn btn-sm btn-danger btn-icon" onclick="this.closest('.medicine-row').remove()"><i class="fas fa-times"></i></button></div>`;
  c.appendChild(row);
  const medInput = row.querySelector('.rx-med-name');
  const medList = row.querySelector('.rx-med-list');
  medInput.addEventListener('input', () => {
    const q = medInput.value.toLowerCase().trim();
    if (q.length < 1) { medList.classList.remove('show'); return; }
    // Search both medicines and med frequency master
    const meds = DB.getMedicines().filter(m => m.name.toLowerCase().includes(q)).slice(0,6);
    const freqs = DB.getMedFreq().filter(f => f.medName.toLowerCase().includes(q)).slice(0,6);
    const allItems = [];
    freqs.forEach(f => allItems.push({name: f.medName, freq: f.freq, ftype: f.fType||'', ftiming: f.timing||'', nd: f.days, intAbt: f.intAbt, isMF: true}));
    meds.forEach(m => { if (!allItems.some(a => a.name.toLowerCase() === m.name.toLowerCase())) allItems.push({name: m.name}); });
    if (!allItems.length) { medList.classList.remove('show'); return; }
    medList.innerHTML = allItems.slice(0,10).map(a => `<div class="autocomplete-item" data-name="${a.name}" data-freq="${a.freq||''}" data-ftype="${a.ftype||''}" data-ftiming="${a.ftiming||''}" data-nd="${a.nd||''}" data-intabt="${a.intAbt||''}" data-ismf="${a.isMF||false}">${a.name}${a.isMF?' <small style="color:var(--accent)">('+a.freq+')</small>':''}</div>`).join('');
    medList.classList.add('show');
    medList.querySelectorAll('.autocomplete-item').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        medInput.value = el.dataset.name;
        medList.classList.remove('show');
        // Auto-fill frequency data from Med Freq Master
        if (el.dataset.freq) row.querySelector('.rx-med-freq').value = el.dataset.freq;
        if (el.dataset.ftype) row.querySelector('.rx-med-ftype').value = el.dataset.ftype;
        if (el.dataset.ftiming) row.querySelector('.rx-med-ftiming').value = el.dataset.ftiming;
        if (el.dataset.nd) row.querySelector('.rx-med-nd').value = el.dataset.nd;
        if (el.dataset.intabt) row.querySelector('.rx-med-intabt').value = el.dataset.intabt;
      });
    });
  });
  medInput.addEventListener('blur', () => setTimeout(() => medList.classList.remove('show'), 150));
}

function collectRxData() {
  const patName = document.getElementById('rxPatient').value.trim();
  if (!patName) { toast('Select a patient','error'); return null; }
  const meds = [];
  document.querySelectorAll('.medicine-row').forEach(row => {
    const name = row.querySelector('.rx-med-name').value.trim();
    if (!name) return;
    meds.push({ name, dosage: row.querySelector('.rx-med-freq').value, ftype: row.querySelector('.rx-med-ftype').value, ftiming: row.querySelector('.rx-med-ftiming').value, timing: row.querySelector('.rx-med-nd').value, duration: row.querySelector('.rx-med-intabt').value });
  });
  return {
    patientId: selectedRxPatient, patientName: patName,
    date: document.getElementById('rxDate').value,
    spo2: document.getElementById('rxSpO2').value.trim(),
    bp: document.getElementById('rxBP').value.trim(),
    pulse: document.getElementById('rxPulse').value.trim(),
    temp: document.getElementById('rxTemp').value.trim(),
    general: document.getElementById('rxGeneral').value.trim(),
    pastHistory: document.getElementById('rxPastHistory').value.trim(),
    complaint: document.getElementById('rxComplaint').value.trim(),
    investReq: document.getElementById('rxInvestReq').value.trim(),
    diagnosis: document.getElementById('rxDiagnosis').value.trim(),
    treatAdvised: document.getElementById('rxTreatAdvised').value.trim(),
    rs: document.getElementById('rxRS').value,
    cvs: document.getElementById('rxCVS').value,
    abd: document.getElementById('rxABD').value,
    cns: document.getElementById('rxCNS').value,
    medicines: meds,
    advice: document.getElementById('rxAdvice').value.trim()
  };
}

function saveRx() {
  const data = collectRxData(); if (!data) return;
  DB.addPrescription(data);
  toast('Prescription saved!');
  clearRxForm();
}
function saveAndPrintRx() {
  const data = collectRxData(); if (!data) return;
  const rx = DB.addPrescription(data);
  printRx(rx);
  clearRxForm();
}
function clearRxForm() {
  ['rxPatient','rxPtNo','rxSex','rxAge','rxSpO2','rxBP','rxPulse','rxTemp','rxGeneral','rxPastHistory','rxComplaint','rxInvestReq','rxDiagnosis','rxTreatAdvised','rxAdvice'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
  ['rxRS','rxCVS','rxABD','rxCNS'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('rxMedsContainer').innerHTML = '';
  selectedRxPatient = null;
  showDrugAllergyBanner('');
  renderPatientRxHistory(null);
  addRxMedRow();
  document.getElementById('rxAdvice').value = '';
}

// Find Old Prescription
function findOldRx() {
  document.getElementById('findOldRxSearch').value = '';
  renderFindOldRx();
  openModal('modalFindOldRx');
}
function renderFindOldRx() {
  const q = (document.getElementById('findOldRxSearch')?.value||'').toLowerCase();
  let rxs = DB.getPrescriptions();
  if (q) rxs = rxs.filter(r => r.patientName.toLowerCase().includes(q) || r.rxNo.toLowerCase().includes(q));
  document.querySelector('#findOldRxTable tbody').innerHTML = rxs.slice(0,20).map(r => `<tr><td><span class="badge badge-primary">${r.rxNo}</span></td><td>${r.patientName}</td><td>${r.date}</td><td>${r.diagnosis||'-'}</td><td><button class="btn btn-sm btn-primary" onclick="loadOldRxIntoForm(${r.id})"><i class="fas fa-copy"></i> Load</button></td></tr>`).join('');
}
function loadOldRxIntoForm(id) {
  const rx = DB.getPrescriptions().find(r => r.id === id); if (!rx) return;
  closeModal('modalFindOldRx');
  document.getElementById('rxPatient').value = rx.patientName; selectedRxPatient = rx.patientId;
  if (rx.patientId) {
    const pat = DB.getPatients().find(p => p.id === rx.patientId);
    if (pat) { document.getElementById('rxPtNo').value = pat.id; document.getElementById('rxSex').value = pat.gender; document.getElementById('rxAge').value = pat.age; showDrugAllergyBanner(pat.drugAllergy); }
  }
  document.getElementById('rxDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('rxSpO2').value = rx.spo2 || '';
  document.getElementById('rxBP').value = rx.bp || '';
  document.getElementById('rxPulse').value = rx.pulse || '';
  document.getElementById('rxTemp').value = rx.temp || '';
  document.getElementById('rxGeneral').value = rx.general || '';
  document.getElementById('rxPastHistory').value = rx.pastHistory || '';
  document.getElementById('rxComplaint').value = rx.complaint || '';
  document.getElementById('rxInvestReq').value = rx.investReq || '';
  document.getElementById('rxDiagnosis').value = rx.diagnosis || '';
  document.getElementById('rxTreatAdvised').value = rx.treatAdvised || '';
  document.getElementById('rxRS').value = rx.rs || '';
  document.getElementById('rxCVS').value = rx.cvs || '';
  document.getElementById('rxABD').value = rx.abd || '';
  document.getElementById('rxCNS').value = rx.cns || '';
  document.getElementById('rxAdvice').value = rx.advice || '';
  document.getElementById('rxMedsContainer').innerHTML = '';
  (rx.medicines||[]).forEach(m => {
    addRxMedRow();
    const rows = document.querySelectorAll('.medicine-row');
    const row = rows[rows.length-1];
    row.querySelector('.rx-med-name').value = m.name;
    row.querySelector('.rx-med-freq').value = m.dosage || 'BD';
    if (m.ftype) row.querySelector('.rx-med-ftype').value = m.ftype;
    if (m.ftiming) row.querySelector('.rx-med-ftiming').value = m.ftiming;
    row.querySelector('.rx-med-nd').value = m.timing || '';
    row.querySelector('.rx-med-intabt').value = m.duration || '';
  });
  toast('Old prescription loaded. Modify and save as new.','warning');
}

function formatCommaSeparated(text) {
  if (!text) return '';
  return text.split(',').map(item => item.trim()).filter(item => item).join(', ');
}

function printRx(rx) {
  if (!rx) return;
  const s = DB.getSettings();
  const pat = rx.patientId ? DB.getPatients().find(p => p.id === rx.patientId) : null;
  const drugAllergy = pat && pat.drugAllergy ? pat.drugAllergy : '';
  const html = `<div class="rx-print">
    <div class="rx-print-header-spacer"></div>
    <div class="rx-print-content">
      <div class="rx-print-patient"><div>Name: <span>${rx.patientName}</span></div>${pat?`<div>Age: <span>${pat.age}</span></div><div>Sex: <span>${pat.gender}</span></div>`:''}<div>Date: <span>${rx.date}</span></div><div>Rx No: <span>${rx.rxNo}</span></div></div>
      ${drugAllergy?`<div class="rx-print-allergy"><strong>⚠ DRUG ALLERGY:</strong> ${drugAllergy}</div>`:''}
      ${(rx.spo2||rx.bp||rx.pulse||rx.temp)?`<div class="rx-print-vitals">${rx.spo2?`<div><strong>SpO2:</strong> ${rx.spo2}</div>`:''} ${rx.bp?`<div><strong>BP:</strong> ${rx.bp}</div>`:''} ${rx.pulse?`<div><strong>Pulse:</strong> ${rx.pulse}</div>`:''} ${rx.temp?`<div><strong>Temp:</strong> ${rx.temp}°F</div>`:''} ${rx.general?`<div><strong>General:</strong> ${rx.general}</div>`:''}</div>`:''}
      ${(rx.rs||rx.cvs||rx.abd||rx.cns)?`<div class="rx-print-exam-horizontal"><h4>Examination</h4><div class="rx-exam-grid">${rx.rs?`<div class="rx-exam-item"><span class="rx-exam-label">RS:</span> <span class="rx-exam-value">${rx.rs}</span></div>`:''}${rx.cvs?`<div class="rx-exam-item"><span class="rx-exam-label">CVS:</span> <span class="rx-exam-value">${rx.cvs}</span></div>`:''}${rx.abd?`<div class="rx-exam-item"><span class="rx-exam-label">ABD:</span> <span class="rx-exam-value">${rx.abd}</span></div>`:''}${rx.cns?`<div class="rx-exam-item"><span class="rx-exam-label">CNS:</span> <span class="rx-exam-value">${rx.cns}</span></div>`:''}</div></div>`:''}
      ${rx.pastHistory?`<div class="rx-print-inline-section"><strong>Past History:</strong> <span>${rx.pastHistory}</span></div>`:''}
      ${rx.complaint?`<div class="rx-print-inline-section"><strong>Chief Complaint:</strong> <span>${formatCommaSeparated(rx.complaint)}</span></div>`:''}
      ${rx.investReq?`<div class="rx-print-inline-section"><strong>Investigation Required:</strong> <span>${rx.investReq}</span></div>`:''}
      ${rx.diagnosis?`<div class="rx-print-inline-section"><strong>Diagnosis:</strong> <span>${formatCommaSeparated(rx.diagnosis)}</span></div>`:''}
      ${rx.treatAdvised?`<div class="rx-print-inline-section"><strong>Treatment Advised:</strong> <span>${rx.treatAdvised}</span></div>`:''}
      <div class="rx-print-rx-symbol">℞</div>
      ${rx.medicines&&rx.medicines.length?`<div style="border:1.5px solid #1a4fa0;border-radius:6px;overflow:hidden;margin:4px 0"><table class="rx-print-med-table" style="margin:0"><thead><tr><th>#</th><th>Medicine</th><th>Frequency</th><th>F.Type / Timing</th><th>N.Days</th><th>Int.Abt Med</th></tr></thead><tbody>${rx.medicines.map((m,i)=>`<tr><td>${i+1}</td><td>${m.name}</td><td>${getFreqHindi(m.dosage)||'-'}</td><td>${m.ftype||''}${m.ftiming?'<br/><small style="color:#555">'+getTimingHindi(m.ftiming)+'</small>':''}</td><td>${m.timing||'-'}</td><td>${m.duration||'-'}</td></tr>`).join('')}</tbody></table></div>`:''}
      <div class="rx-print-footer">
        <div class="rx-footer-left">
          ${rx.advice?`<div class="rx-advice-compact">${rx.advice.replace(/\n/g,'<br/>')}</div>`:''}
          <div class="rx-footer-label">Follow-up as advised</div>
        </div>
        <div class="rx-footer-right">
          <div class="sign"><div class="doc-name">${s.doctorName}</div><p>${s.qualification}</p><p>${s.regNo}</p></div>
        </div>
      </div>
    </div>
  </div>`;
  const pa = document.getElementById('printArea');
  pa.innerHTML = html; pa.style.display = 'block';
  setTimeout(() => { window.print(); pa.style.display = 'none'; }, 200);
}

// Timing to Hindi mapping for print
function getTimingHindi(timing) {
  const timingMap = {
    'Khane ke pahle': 'खाने के पहले',
    'Khane ke baad': 'खाने के बाद',
    'Subah khali pet': 'सुबह खाली पेट',
    'Raat ko sone se pahle': 'रात को सोने से पहले',
    'Subah-Shaam': 'सुबह-शाम',
    'Teen baar': 'तीन बार',
    'Zaroorat padne par': 'ज़रूरत पड़ने पर',
    'Khaana khaane ke saath': 'खाना खाने के साथ'
  };
  return timingMap[timing] || timing;
}

// Frequency to Hindi mapping for print
function getFreqHindi(freq) {
  const freqMap = {
    'BD':   'सुबह -- शाम (BD)',
    'OD':   'सुबह (OD)',
    'OD-S': 'सुबह',
    'OD-D': 'दोपहर',
    'OD-E': 'शाम',
    'TDS':  'दिन में तीन बार (TDS)',
    'HS':   'रात को सोते समय (HS)',
    'SOS':  'ज़रूरत पड़ने पर (SOS)',
    'STAT': 'तुरंत (STAT)',
    'QID':  'दिन में चार बार (QID)',
    'OW':   'हफ्ते में एक बार (OW)',
    'BW':   'हफ्ते में दो बार (BW)',
    'TW':   'हफ्ते में तीन बार (TW)',
    'FD':   'हफ्ते में पाँच दिन (FD)'
  };
  return freqMap[freq] || freq;
}

// ===========================
//  MEDICINE FREQUENCY MASTER
// ===========================
function renderMedFreq() {
  const q = (document.getElementById('medFreqSearch')?.value||'').toLowerCase();
  let data = DB.getMedFreq();
  if (q) data = data.filter(m => m.medName.toLowerCase().includes(q));
  document.querySelector('#medFreqTable tbody').innerHTML = data.map((m,i) => `<tr><td>${i+1}</td><td>${m.medName}</td><td><span class="badge badge-primary">${m.freq}</span></td><td>${m.fType||'-'}</td><td style="font-size:0.8rem">${m.timing||'-'}</td><td>${m.days||'-'}</td><td>${m.intAbt||'-'}</td><td style="font-size:0.8rem">${m.adv||'-'}</td><td><button class="btn btn-sm btn-primary btn-icon" onclick="editMedFreq(${m.id})"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger btn-icon" onclick="deleteMedFreq(${m.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('');
}
function openMedFreqModal() {
  document.getElementById('medFreqEditId').value='';
  document.getElementById('medFreqName').value='';
  document.getElementById('medFreqFreq').value='BD';
  document.getElementById('medFreqFType').value='';
  document.getElementById('medFreqTiming').value='';
  document.getElementById('medFreqDays').value='';
  document.getElementById('medFreqIntAbt').value='';
  document.getElementById('medFreqAdv').value='';
  document.getElementById('medFreqModalTitle').textContent='Add Medicine Frequency';
  openModal('modalMedFreq');
  setupAutocomplete('medFreqName','medFreqNameList',()=>DB.getMedicines().map(m=>({value:m.id,label:m.name})),null);
}
function editMedFreq(id) {
  const m=DB.getMedFreq().find(x=>x.id===id); if(!m)return;
  document.getElementById('medFreqEditId').value=id;
  document.getElementById('medFreqName').value=m.medName;
  document.getElementById('medFreqFreq').value=m.freq;
  document.getElementById('medFreqFType').value=m.fType||'';
  document.getElementById('medFreqTiming').value=m.timing||'';
  document.getElementById('medFreqDays').value=m.days||'';
  document.getElementById('medFreqIntAbt').value=m.intAbt||'';
  document.getElementById('medFreqAdv').value=m.adv||'';
  document.getElementById('medFreqModalTitle').textContent='Edit Medicine Frequency';
  openModal('modalMedFreq');
}
function saveMedFreq() {
  const medName=document.getElementById('medFreqName').value.trim();
  if(!medName) return toast('Enter medicine name','error');
  const freq=document.getElementById('medFreqFreq').value;
  const fType=document.getElementById('medFreqFType').value;
  const timing=document.getElementById('medFreqTiming').value;
  const days=parseInt(document.getElementById('medFreqDays').value)||0;
  const intAbt=document.getElementById('medFreqIntAbt').value.trim();
  const adv=document.getElementById('medFreqAdv').value.trim();
  const editId=parseInt(document.getElementById('medFreqEditId').value);
  let arr=DB.getMedFreq();
  if(editId){ arr=arr.map(m=>m.id===editId?{...m,medName,freq,fType,timing,days,intAbt,adv}:m); }
  else { arr.push({id:Date.now(),medName,freq,fType,timing,days,intAbt,adv}); }
  DB.saveMedFreq(arr); closeModal('modalMedFreq'); renderMedFreq(); toast('Medicine Frequency saved!');
}
function deleteMedFreq(id) { if(!confirm('Delete?'))return; DB.saveMedFreq(DB.getMedFreq().filter(m=>m.id!==id)); renderMedFreq(); toast('Deleted','warning'); }

// ===========================
//  OPD DISPLAY
// ===========================
function renderOpdDisplay() {
  const q = (document.getElementById('opdDispSearch')?.value||'').toLowerCase();
  const d = document.getElementById('opdDispDate')?.value||'';
  let rxs = DB.getPrescriptions();
  if (q) rxs = rxs.filter(r => r.patientName.toLowerCase().includes(q) || r.rxNo.toLowerCase().includes(q));
  if (d) rxs = rxs.filter(r => r.date === d);
  document.querySelector('#opdDispTable tbody').innerHTML = rxs.slice(0,50).map(r => `<tr><td><span class="badge badge-primary">${r.rxNo}</span></td><td>${r.patientName}</td><td>${r.date}</td><td>${r.complaint||'-'}</td><td>${r.diagnosis||'-'}</td><td><button class="btn btn-sm btn-primary btn-icon" onclick="viewRx(${r.id})"><i class="fas fa-eye"></i></button> <button class="btn btn-sm btn-accent btn-icon" onclick="printRx(DB.getPrescriptions().find(x=>x.id===${r.id}))"><i class="fas fa-print"></i></button></td></tr>`).join('') || '<tr><td colspan="6"><div class="empty-state"><i class="fas fa-inbox"></i><p>No prescriptions found</p></div></td></tr>';
}

function viewRx(id) {
  const rx = DB.getPrescriptions().find(r => r.id === id); if (!rx) return;
  viewingRxId = id;
  const pat = rx.patientId ? DB.getPatients().find(p => p.id === rx.patientId) : null;
  document.getElementById('viewRxContent').innerHTML = `
    <dl class="rx-detail-grid"><dt>Rx No</dt><dd>${rx.rxNo}</dd><dt>Date</dt><dd>${rx.date}</dd><dt>Patient</dt><dd>${rx.patientName}</dd>${pat?`<dt>Age/Gender</dt><dd>${pat.age} / ${pat.gender}</dd>`:''}<dt>BP</dt><dd>${rx.bp||'-'}</dd><dt>Pulse</dt><dd>${rx.pulse||'-'}</dd><dt>Temp</dt><dd>${rx.temp||'-'}</dd><dt>Weight</dt><dd>${rx.weight||'-'}</dd><dt>Complaint</dt><dd>${rx.complaint||'-'}</dd><dt>Diagnosis</dt><dd>${rx.diagnosis||'-'}</dd></dl>
    ${rx.medicines&&rx.medicines.length?`<h4 style="margin:12px 0 6px">Medicines</h4><div class="table-responsive"><table class="data-table"><thead><tr><th>#</th><th>Medicine</th><th>Dosage</th><th>Timing</th><th>Duration</th></tr></thead><tbody>${rx.medicines.map((m,i)=>`<tr><td>${i+1}</td><td>${m.name}</td><td>${m.dosage}</td><td>${m.timing}</td><td>${m.duration||'-'}</td></tr>`).join('')}</tbody></table></div>`:''}
    ${rx.advice?`<p style="margin-top:10px"><strong>Advice:</strong> ${rx.advice}</p>`:''}`;
  openModal('modalViewRx');
}
function printRxFromView() { if (viewingRxId) printRx(DB.getPrescriptions().find(r => r.id === viewingRxId)); }

// ===========================
//  REPORTS
// ===========================
function genPatientReport() {
  const from=document.getElementById('rptPatFrom').value, to=document.getElementById('rptPatTo').value;
  let data=DB.getPatients();
  if(from) data=data.filter(p=>p.regDate>=from);
  if(to) data=data.filter(p=>p.regDate<=to);
  document.querySelector('#rptPatTable tbody').innerHTML=data.map(p=>`<tr><td>${p.id}</td><td>${p.name}</td><td>${p.age}/${p.gender}</td><td>${p.phone||'-'}</td><td>${p.regDate}</td></tr>`).join('');
}
function genBillReport() {
  const from=document.getElementById('rptBillFrom').value, to=document.getElementById('rptBillTo').value;
  let data=DB.getBills();
  if(from) data=data.filter(b=>b.date>=from);
  if(to) data=data.filter(b=>b.date<=to);
  const total=data.reduce((s,b)=>s+(b.total||0),0);
  document.querySelector('#rptBillTable tbody').innerHTML=data.map(b=>`<tr><td>${b.billNo}</td><td>${b.patientName}</td><td>${b.date}</td><td>₹${(b.total||0).toLocaleString()}</td></tr>`).join('');
  document.getElementById('rptBillTotal').textContent=`Grand Total: ₹${total.toLocaleString()}`;
}
function genRxReport() {
  const from=document.getElementById('rptRxFrom').value, to=document.getElementById('rptRxTo').value;
  let data=DB.getPrescriptions();
  if(from) data=data.filter(r=>r.date>=from);
  if(to) data=data.filter(r=>r.date<=to);
  document.querySelector('#rptRxTable tbody').innerHTML=data.map(r=>`<tr><td>${r.rxNo}</td><td>${r.patientName}</td><td>${r.date}</td><td>${r.diagnosis||'-'}</td></tr>`).join('');
}

// ===========================
//  MOD PRESCRIPTION
// ===========================
function renderModRxList() {
  const q=(document.getElementById('modRxSearch')?.value||'').toLowerCase();
  let rxs=DB.getPrescriptions();
  if(q) rxs=rxs.filter(r=>r.rxNo.toLowerCase().includes(q)||r.patientName.toLowerCase().includes(q));
  document.querySelector('#modRxTable tbody').innerHTML=rxs.slice(0,30).map(r=>`<tr><td><span class="badge badge-primary">${r.rxNo}</span></td><td>${r.patientName}</td><td>${r.date}</td><td>${r.diagnosis||'-'}</td><td><button class="btn btn-sm btn-primary" onclick="loadRxForEdit(${r.id})"><i class="fas fa-edit"></i> Edit</button> <button class="btn btn-sm btn-accent btn-icon" onclick="printRx(DB.getPrescriptions().find(x=>x.id===${r.id}))"><i class="fas fa-print"></i></button></td></tr>`).join('');
}
function loadRxForEdit(id) {
  const rx=DB.getPrescriptions().find(r=>r.id===id); if(!rx)return;
  showPage('prescription');
  setTimeout(()=>{
    document.getElementById('rxPatient').value=rx.patientName; selectedRxPatient=rx.patientId;
    if (rx.patientId) {
      const pat = DB.getPatients().find(p => p.id === rx.patientId);
      if (pat) { document.getElementById('rxPtNo').value=pat.id; document.getElementById('rxSex').value=pat.gender; document.getElementById('rxAge').value=pat.age; showDrugAllergyBanner(pat.drugAllergy); }
    }
    document.getElementById('rxDate').value=rx.date;
    document.getElementById('rxSpO2').value=rx.spo2||'';
    document.getElementById('rxBP').value=rx.bp||'';
    document.getElementById('rxPulse').value=rx.pulse||'';
    document.getElementById('rxTemp').value=rx.temp||'';
    document.getElementById('rxGeneral').value=rx.general||'';
    document.getElementById('rxPastHistory').value=rx.pastHistory||'';
    document.getElementById('rxComplaint').value=rx.complaint||'';
    document.getElementById('rxInvestReq').value=rx.investReq||'';
    document.getElementById('rxDiagnosis').value=rx.diagnosis||'';
    document.getElementById('rxTreatAdvised').value=rx.treatAdvised||'';
    document.getElementById('rxRS').value=rx.rs||'';
    document.getElementById('rxCVS').value=rx.cvs||'';
    document.getElementById('rxABD').value=rx.abd||'';
    document.getElementById('rxCNS').value=rx.cns||'';
    document.getElementById('rxAdvice').value=rx.advice||'';
    document.getElementById('rxMedsContainer').innerHTML='';
    (rx.medicines||[]).forEach(m=>{
      addRxMedRow();
      const rows=document.querySelectorAll('.medicine-row');
      const row=rows[rows.length-1];
      row.querySelector('.rx-med-name').value=m.name;
      row.querySelector('.rx-med-freq').value=m.dosage||'BD';
      if (m.ftype) row.querySelector('.rx-med-ftype').value=m.ftype;
      if (m.ftiming) row.querySelector('.rx-med-ftiming').value=m.ftiming;
      row.querySelector('.rx-med-nd').value=m.timing||'';
      row.querySelector('.rx-med-intabt').value=m.duration||'';
    });
    // Remove old and update
    DB.savePrescriptions(DB.getPrescriptions().filter(r=>r.id!==id));
    toast('Prescription loaded for editing. Save to update.','warning');
  },100);
}

// ===========================
//  APPOINTMENTS
// ===========================
function renderAppointments() {
  const filterDate=document.getElementById('apptFilterDate')?.value||'';
  const filterStatus=document.getElementById('apptFilterStatus')?.value||'';
  let data=DB.getAppointments();
  if(filterDate) data=data.filter(a=>a.date===filterDate);
  if(filterStatus) data=data.filter(a=>a.status===filterStatus);
  const statusBadge = s => s==='Completed'?'badge-success':s==='Cancelled'?'badge-danger':'badge-warning';
  document.querySelector('#apptTable tbody').innerHTML=data.map(a=>`<tr><td>${a.id}</td><td>${a.patientName||'-'}</td><td>${a.date}</td><td>${a.time||'-'}</td><td>${a.purpose||'-'}</td><td><span class="badge ${statusBadge(a.status)}">${a.status}</span></td><td><button class="btn btn-sm btn-primary btn-icon" onclick="editAppt(${a.id})"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-success btn-icon" title="Complete" onclick="completeAppt(${a.id})"><i class="fas fa-check"></i></button> <button class="btn btn-sm btn-danger btn-icon" onclick="delAppt(${a.id})"><i class="fas fa-trash"></i></button></td></tr>`).join('') || '<tr><td colspan="7"><div class="empty-state"><i class="fas fa-calendar-times"></i><p>No appointments found</p></div></td></tr>';
  setupAutocomplete('apptPatient','apptPatientList',()=>DB.getPatients().map(p=>({value:p.id,label:`${p.name} (ID:${p.id})`})),(val)=>{selectedApptPatient=parseInt(val);});
}
function openApptModal() { document.getElementById('apptEditId').value=''; document.getElementById('apptPatient').value=''; document.getElementById('apptDate').value=new Date().toISOString().split('T')[0]; document.getElementById('apptTime').value=''; document.getElementById('apptPurpose').value=''; document.getElementById('apptStatus').value='Scheduled'; document.getElementById('apptModalTitle').textContent='New Appointment'; openModal('modalAppt'); }
function editAppt(id) { const a=DB.getAppointments().find(x=>x.id===id); if(!a)return; document.getElementById('apptEditId').value=id; document.getElementById('apptPatient').value=a.patientName||''; document.getElementById('apptDate').value=a.date; document.getElementById('apptTime').value=a.time||''; document.getElementById('apptPurpose').value=a.purpose||''; document.getElementById('apptStatus').value=a.status; document.getElementById('apptModalTitle').textContent='Edit Appointment'; openModal('modalAppt'); }
function saveAppt() {
  const patientName=document.getElementById('apptPatient').value.trim(), date=document.getElementById('apptDate').value, time=document.getElementById('apptTime').value, purpose=document.getElementById('apptPurpose').value.trim(), status=document.getElementById('apptStatus').value;
  if(!patientName||!date) return toast('Patient and Date required','error');
  const editId=parseInt(document.getElementById('apptEditId').value);
  if(editId) { DB.updateAppointment({id:editId,patientId:selectedApptPatient,patientName,date,time,purpose,status}); }
  else { DB.addAppointment({patientId:selectedApptPatient,patientName,date,time,purpose,status}); }
  closeModal('modalAppt'); renderAppointments(); toast('Appointment saved!');
}
function completeAppt(id) { const a=DB.getAppointments().find(x=>x.id===id); if(!a)return; a.status='Completed'; DB.updateAppointment(a); renderAppointments(); toast('Marked as completed'); }
function delAppt(id) { if(!confirm('Delete this appointment?'))return; DB.deleteAppointment(id); renderAppointments(); toast('Deleted','warning'); }

// ===========================
//  MEDICAL CERTIFICATES
// ===========================
let selectedCertPatient = null;
let currentCertType = null;

function initCertPage() {
  selectedCertPatient = null;
  currentCertType = null;
  document.getElementById('certPatientSearch').value = '';
  document.getElementById('certAadhaarNo').value = '';
  document.getElementById('certDateOfIssue').value = new Date().toISOString().split('T')[0];
  document.getElementById('certPatientInfo').style.display = 'none';
  document.getElementById('certExtraFields').style.display = 'none';
  document.getElementById('certRestFields').style.display = 'none';
  document.getElementById('certResumeFields').style.display = 'none';
  document.getElementById('certGeneralFields').style.display = 'none';
  // Reset history panel
  const histPanel = document.getElementById('certHistoryPanel');
  if (histPanel) histPanel.style.display = 'none';
  updateCertCount();
  setupAutocomplete('certPatientSearch', 'certPatientList', () => DB.getPatients().map(p => ({value:p.id, label:`${p.name} (ID:${p.id})`})), (val) => {
    selectedCertPatient = DB.getPatients().find(p => p.id === parseInt(val));
    if (selectedCertPatient) {
      document.getElementById('certPatRegNo').textContent = selectedCertPatient.id;
      document.getElementById('certPatName').textContent = selectedCertPatient.name;
      document.getElementById('certPatAge').textContent = selectedCertPatient.age + ' years';
      document.getElementById('certPatGender').textContent = selectedCertPatient.gender;
      document.getElementById('certPatPhone').textContent = selectedCertPatient.phone || '-';
      document.getElementById('certPatAddress').textContent = selectedCertPatient.address || '-';
      document.getElementById('certPatientInfo').style.display = 'block';
    }
  });
}

function formatDateDMY(dateStr) {
  if (!dateStr) return '____/____/________';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function formatDateLong(dateStr) {
  if (!dateStr) return '_______________';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
}

function generateCertificate(type) {
  if (!selectedCertPatient) { toast('Please select a patient first', 'error'); return; }
  currentCertType = type;

  if (type === 'fitness') {
    document.getElementById('certExtraFields').style.display = 'block';
    document.getElementById('certRestFields').style.display = 'none';
    document.getElementById('certResumeFields').style.display = 'none';
    document.getElementById('certGeneralFields').style.display = 'none';
    document.getElementById('certExtraTitle').textContent = 'Certificate Details';
    document.getElementById('certDateOfIssue').value = new Date().toISOString().split('T')[0];
    printCertificate('fitness');
  } else if (type === 'rest') {
    document.getElementById('certExtraFields').style.display = 'block';
    document.getElementById('certRestFields').style.display = 'flex';
    document.getElementById('certResumeFields').style.display = 'none';
    document.getElementById('certGeneralFields').style.display = 'none';
    document.getElementById('certExtraTitle').textContent = 'Rest Certificate Details';
    document.getElementById('certRestFrom').value = new Date().toISOString().split('T')[0];
    document.getElementById('certRestTo').value = '';
    document.getElementById('certRestDiagnosis').value = '';
    document.getElementById('certDateOfIssue').value = new Date().toISOString().split('T')[0];
  } else if (type === 'resume') {
    document.getElementById('certExtraFields').style.display = 'block';
    document.getElementById('certRestFields').style.display = 'none';
    document.getElementById('certResumeFields').style.display = 'flex';
    document.getElementById('certGeneralFields').style.display = 'none';
    document.getElementById('certExtraTitle').textContent = 'Resume Duty Certificate Details';
    document.getElementById('certResumeFrom').value = '';
    document.getElementById('certResumeUntil').value = '';
    document.getElementById('certResumeDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('certResumeDiagnosis').value = '';
    document.getElementById('certDateOfIssue').value = new Date().toISOString().split('T')[0];
  } else if (type === 'general') {
    document.getElementById('certExtraFields').style.display = 'block';
    document.getElementById('certRestFields').style.display = 'none';
    document.getElementById('certResumeFields').style.display = 'none';
    document.getElementById('certGeneralFields').style.display = 'flex';
    document.getElementById('certExtraTitle').textContent = 'General Certificate Details';
    document.getElementById('certGeneralReason').value = '';
    document.getElementById('certDateOfIssue').value = new Date().toISOString().split('T')[0];
  }
}

function printCurrentCertificate() {
  if (!currentCertType) return;
  printCertificate(currentCertType);
}

function printCertificate(type) {
  if (!selectedCertPatient) { toast('Please select a patient first', 'error'); return; }
  const pat = selectedCertPatient;
  const s = DB.getSettings();
  const aadhaar = document.getElementById('certAadhaarNo').value.trim();
  const certDateStr = document.getElementById('certDateOfIssue').value;
  const today = certDateStr ? new Date(certDateStr) : new Date();
  const todayStr = today.toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
  const genderPronoun = pat.gender === 'Female' ? 'her' : 'his';
  const genderTitle = pat.gender === 'Female' ? 'Ms./Mrs.' : 'Mr.';
  const genderSub = pat.gender === 'Female' ? 'She' : 'He';
  const genderSubLow = pat.gender === 'Female' ? 'she' : 'he';

  let certTitle = '';
  let certBody = '';

  if (type === 'fitness') {
    certTitle = 'FITNESS CERTIFICATE';
    certBody = `
      <p class="cert-body-text">This is to certify that <strong>${genderTitle} ${pat.name}</strong>, Age: <strong>${pat.age} years</strong>, Gender: <strong>${pat.gender}</strong>${pat.address ? ', Resident of <strong>' + pat.address + '</strong>' : ''}${aadhaar ? ', Aadhaar No.: <strong>' + aadhaar + '</strong>' : ''}, has been examined by me on <strong>${todayStr}</strong>.</p>
      <p class="cert-body-text">After thorough medical examination, I find that ${genderSubLow} is <strong>medically fit</strong> to perform ${genderPronoun} duties / job. ${genderSub} is not suffering from any contagious or infectious disease and is in good physical and mental health.</p>
      <p class="cert-body-text">This certificate is issued at the request of the above-named person for the purpose of employment / job.</p>
    `;
  } else if (type === 'rest') {
    const restFrom = document.getElementById('certRestFrom').value;
    const restTo = document.getElementById('certRestTo').value;
    const diagnosis = document.getElementById('certRestDiagnosis').value.trim();
    if (!restFrom || !restTo) { toast('Please fill Rest From and To dates', 'error'); return; }
    certTitle = 'MEDICAL / REST CERTIFICATE';
    certBody = `
      <p class="cert-body-text">This is to certify that <strong>${genderTitle} ${pat.name}</strong>, Age: <strong>${pat.age} years</strong>, Gender: <strong>${pat.gender}</strong>${pat.address ? ', Resident of <strong>' + pat.address + '</strong>' : ''}${aadhaar ? ', Aadhaar No.: <strong>' + aadhaar + '</strong>' : ''}, has been examined by me and found to be suffering from <strong>${diagnosis || '________________________'}</strong>.</p>
      <p class="cert-body-text">${genderSub} is advised <strong>complete rest</strong> from <strong>${formatDateLong(restFrom)}</strong> to <strong>${formatDateLong(restTo)}</strong> (both dates inclusive).</p>
      <p class="cert-body-text">${genderSub} is unfit to attend ${genderPronoun} duties / work during the above-mentioned period.</p>
      <p class="cert-body-text">This certificate is issued at the request of the above-named patient for necessary action.</p>
    `;
  } else if (type === 'resume') {
    const resumeFrom = document.getElementById('certResumeFrom').value;
    const resumeUntil = document.getElementById('certResumeUntil').value;
    const resumeDate = document.getElementById('certResumeDate').value;
    const diagnosis = document.getElementById('certResumeDiagnosis').value.trim();
    if (!resumeDate) { toast('Please fill Resume Duty From date', 'error'); return; }
    certTitle = 'RESUME DUTY / FITNESS CERTIFICATE';
    certBody = `
      <p class="cert-body-text">This is to certify that <strong>${genderTitle} ${pat.name}</strong>, Age: <strong>${pat.age} years</strong>, Gender: <strong>${pat.gender}</strong>${pat.address ? ', Resident of <strong>' + pat.address + '</strong>' : ''}${aadhaar ? ', Aadhaar No.: <strong>' + aadhaar + '</strong>' : ''}, was under my treatment${diagnosis ? ' for <strong>' + diagnosis + '</strong>' : ''}.</p>
      ${resumeFrom && resumeUntil ? `<p class="cert-body-text">${genderSub} was advised rest from <strong>${formatDateLong(resumeFrom)}</strong> to <strong>${formatDateLong(resumeUntil)}</strong>.</p>` : ''}
      <p class="cert-body-text">After thorough examination, I am satisfied that ${genderSubLow} has recovered sufficiently and is now <strong>medically fit</strong> to resume ${genderPronoun} duties / work with effect from <strong>${formatDateLong(resumeDate)}</strong>.</p>
      <p class="cert-body-text">This certificate is issued at the request of the above-named patient for the purpose of resuming duties.</p>
    `;
  } else if (type === 'general') {
    const reason = document.getElementById('certGeneralReason').value.trim();
    if (!reason) { toast('Please enter the Reason of Certificate', 'error'); return; }
    certTitle = 'CERTIFICATE';
    certBody = `
      <p class="cert-body-text">This is to certify that <strong>${genderTitle} ${pat.name}</strong>, Age: <strong>${pat.age} years</strong>, Gender: <strong>${pat.gender}</strong>${pat.address ? ', Resident of <strong>' + pat.address + '</strong>' : ''}${aadhaar ? ', Aadhaar No.: <strong>' + aadhaar + '</strong>' : ''}, has been examined by me on <strong>${todayStr}</strong>.</p>
      <p class="cert-body-text">This certificate is issued for the purpose of <strong>${reason}</strong>.</p>
      <p class="cert-body-text">This certificate is issued at the request of the above-named person.</p>
    `;
  }

  const html = `<div class="cert-print">
    <div class="cert-print-header-spacer" style="height:6cm;"></div>
    <div class="cert-print-title-band">
      <h2>${certTitle}</h2>
      <div class="cert-ref-line">Date: ${todayStr} &nbsp;&nbsp; | &nbsp;&nbsp; Ref. No.: MC-${Date.now().toString().slice(-6)}</div>
    </div>
    <div class="cert-print-body">
      <div class="cert-body-to">To Whom It May Concern,</div>
      ${certBody}
    </div>
    <div class="cert-print-footer">
      <div class="cert-footer-left">
        <p>Place: ________</p>
        <p>Date: ${todayStr}</p>
      </div>
      <div class="cert-footer-right">
        <div class="cert-sign-area">
          <div class="cert-sign-line"></div>
          <p class="cert-doc-name">${s.doctorName}</p>
          <p>${s.qualification}</p>
          <p>${s.regNo}</p>
        </div>
      </div>
    </div>
    <div class="cert-print-seal">
      <p>( Signature & Seal )</p>
    </div>
  </div>`;

  const pa = document.getElementById('printArea');
  pa.innerHTML = html;
  pa.style.display = 'block';

  // Save certificate record to history before printing
  const certTypeLabels = { fitness: 'Fitness for Job', rest: 'Rest Certificate', resume: 'Resume Duty', general: 'General Certificate' };
  let reason = '';
  if (type === 'rest') reason = document.getElementById('certRestDiagnosis').value.trim();
  else if (type === 'resume') reason = document.getElementById('certResumeDiagnosis').value.trim();
  else if (type === 'general') reason = document.getElementById('certGeneralReason').value.trim();
  else if (type === 'fitness') reason = 'Fitness for Job / Employment';

  DB.addCertificate({
    patientId: pat.id,
    patientName: pat.name,
    patientAge: pat.age,
    patientGender: pat.gender,
    patientAddress: pat.address || '',
    certType: type,
    certTypeLabel: certTypeLabels[type] || type,
    reason: reason,
    dateOfIssue: certDateStr,
    htmlSnapshot: html,
  });
  updateCertCount();
  renderCertHistory();

  setTimeout(() => { window.print(); pa.style.display = 'none'; }, 200);
}

function updateCertCount() {
  const count = DB.getCertificates().length;
  const el = document.getElementById('certTotalCount');
  if (el) el.textContent = count;
}

function renderCertHistory() {
  const q = (document.getElementById('certHistorySearch')?.value || '').toLowerCase();
  let certs = DB.getCertificates();
  if (q) certs = certs.filter(c =>
    c.patientName.toLowerCase().includes(q) ||
    (c.certTypeLabel || '').toLowerCase().includes(q) ||
    (c.reason || '').toLowerCase().includes(q)
  );
  const tbody = document.querySelector('#certHistoryTable tbody');
  if (!tbody) return;
  if (!certs.length) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><i class="fas fa-file-medical"></i><p>No certificates issued yet</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = certs.map((c, i) => {
    const dt = new Date(c.issuedAt);
    const dateStr = dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const typeBadgeClass = c.certType === 'fitness' ? 'badge-success' : c.certType === 'rest' ? 'badge-warning' : c.certType === 'resume' ? 'badge-primary' : 'badge-accent';
    return `<tr>
      <td>${i + 1}</td>
      <td><strong>${c.patientName}</strong><br><small style="color:#888">${c.patientAge} yrs · ${c.patientGender}</small></td>
      <td><span class="badge ${typeBadgeClass}">${c.certTypeLabel}</span></td>
      <td style="max-width:200px;word-break:break-word">${c.reason || '-'}</td>
      <td><div>${dateStr}</div><small style="color:#888">${timeStr}</small></td>
      <td>
        <button class="btn btn-sm btn-primary btn-icon" title="Reprint" onclick="reprintCertFromHistory(${c.id})"><i class="fas fa-print"></i></button>
        <button class="btn btn-sm btn-danger btn-icon" title="Delete" onclick="deleteCertRecord(${c.id})" style="margin-left:4px"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');
}

function toggleCertHistory() {
  const panel = document.getElementById('certHistoryPanel');
  if (!panel) return;
  const isHidden = panel.style.display === 'none' || panel.style.display === '';
  if (isHidden) {
    panel.style.display = 'block';
    renderCertHistory();
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    panel.style.display = 'none';
  }
}

function deleteCertRecord(id) {
  if (!confirm('Delete this certificate record from history?')) return;
  DB.deleteCertificate(id);
  updateCertCount();
  renderCertHistory();
  toast('Certificate record deleted', 'warning');
}

function reprintCertFromHistory(id) {
  const cert = DB.getCertificates().find(c => c.id === id);
  if (!cert || !cert.htmlSnapshot) { toast('Certificate data not available', 'error'); return; }
  const pa = document.getElementById('printArea');
  pa.innerHTML = cert.htmlSnapshot;
  pa.style.display = 'block';
  setTimeout(() => { window.print(); pa.style.display = 'none'; }, 200);
}

// ===========================
//  BACKUP DATA FUNCTIONS
// ===========================
function exportBackupData() {
  const fromDate = document.getElementById('backupFromDate').value;
  const toDate = document.getElementById('backupToDate').value;
  const backupPatients = document.getElementById('backupPatients').checked;
  const backupBills = document.getElementById('backupBills').checked;
  const backupRx = document.getElementById('backupRx').checked;
  const backupAppointments = document.getElementById('backupAppointments').checked;

  if (!fromDate || !toDate) {
    toast('Please select both From Date and To Date', 'error');
    return;
  }

  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (from > to) {
    toast('From Date must be before To Date', 'error');
    return;
  }

  const sheets = {};

  if (backupPatients) {
    const patients = DB.getPatients();
    const patientData = patients.map(p => ({
      'ID': p.id,
      'Name': p.name,
      'Age': p.age,
      'Gender': p.gender,
      'Phone': p.phone,
      'Address': p.address,
      'Blood Group': p.bloodGroup,
      'Drug Allergy': p.drugAllergy,
      'Registration Date': p.regDate
    }));
    sheets['Patients'] = patientData;
  }

  if (backupBills) {
    const bills = DB.getBills();
    const billsInRange = bills.filter(b => {
      const billDate = new Date(b.billDate || b.date);
      return billDate >= from && billDate <= to;
    });
    const billData = billsInRange.map(b => ({
      'Bill No': b.billNo,
      'Patient': b.patientName,
      'Particulars': b.particulars,
      'Amount': b.amount,
      'NT': b.nt || '',
      'Total': b.total,
      'Date': b.billDate || b.date
    }));
    sheets['Bills'] = billData;
  }

  if (backupRx) {
    const rxList = DB.getPrescriptions();
    const rxInRange = rxList.filter(r => {
      const rxDate = new Date(r.date);
      return rxDate >= from && rxDate <= to;
    });
    const rxData = rxInRange.map(r => ({
      'Rx No': r.rxNo,
      'Patient': r.patientName,
      'Date': r.date,
      'Complaint': r.complaint,
      'Diagnosis': r.diagnosis,
      'Medicines': r.medicines ? r.medicines.map(m => m.name).join(', ') : '',
      'Advice': r.advice
    }));
    sheets['Prescriptions'] = rxData;
  }

  if (backupAppointments) {
    const appointments = DB.getAppointments();
    const apptsInRange = appointments.filter(a => {
      const apptDate = new Date(a.date);
      return apptDate >= from && apptDate <= to;
    });
    const apptData = apptsInRange.map(a => ({
      'ID': a.id,
      'Patient': a.patientName,
      'Date': a.date,
      'Time': a.time,
      'Purpose': a.purpose,
      'Status': a.status
    }));
    sheets['Appointments'] = apptData;
  }

  if (Object.keys(sheets).length === 0) {
    toast('Please select at least one data type to export', 'warning');
    return;
  }

  const wb = XLSX.utils.book_new();
  Object.keys(sheets).forEach(sheetName => {
    const ws = XLSX.utils.json_to_sheet(sheets[sheetName]);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  const fileName = `Backup_${fromDate}_to_${toDate}.xlsx`;
  XLSX.writeFile(wb, fileName);
  toast('Data exported successfully!', 'success');
}

function exportAllBackupData() {
  const s = DB.getSettings();
  const fromDate = s.financialYearStart || '2025-04-01';
  const toDate = new Date().toISOString().split('T')[0];
  
  document.getElementById('backupFromDate').value = fromDate.split('-').reverse().join('-');
  document.getElementById('backupToDate').value = toDate;
  document.getElementById('backupPatients').checked = true;
  document.getElementById('backupBills').checked = true;
  document.getElementById('backupRx').checked = true;
  document.getElementById('backupAppointments').checked = true;
  
  exportBackupData();
}

// ===========================
//  INIT
// ===========================
showPage('dashboard');
