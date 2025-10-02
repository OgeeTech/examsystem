/* LONG INTERACTIVE SCRIPT
   - Avatar upload (file chooser + drag & drop)
   - Edit profile (in-place inputs -> save)
   - Reset profile to defaults
   - Local persistence via localStorage
   - Menu routing (visual only)
   - Simulated save with fake latency + error chance
   - Download fallback (JSON export)
   - Toast notifications
   - Keyboard shortcut: press "E" to toggle edit
   - Exposes window.FULAFIA for debug
*/

(function(){
  // Utility helpers
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
  const toastWrap = document.querySelector('.toast-wrap');

  function toast(msg, time=3500){
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    toastWrap.appendChild(el);
    // simple fade/slide out
    setTimeout(()=>{ el.style.opacity = 0; el.style.transform = 'translateY(8px)'; }, time - 300);
    setTimeout(()=>el.remove(), time);
  }

  // Persistent state using localStorage
  const STORAGE_KEY = 'fulafia_dashboard_v1';
  const defaultState = {
    fullname: 'ATOABOU Robert Ocran',
    studentid: 'FULUG2602509',
    phone: '08104428694',
    mode: 'FULL_TIME',
    year: '2025/2026',
    ptype: 'Full Time',
    faculty: 'FACULTY OF MANAGEMENT SCIENCES',
    dept: 'ACCOUNTING',
    prog: 'B.Sc. Accounting',
    avatarData: null,
    lastSaved: null
  };

  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return {...defaultState};
      const parsed = JSON.parse(raw);
      return {...defaultState, ...parsed};
    } catch(e){
      console.error('loadState', e);
      return {...defaultState};
    }
  }

  function saveState(state){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  let state = loadState();

  // Reflect state into DOM
  function reflectState(){
    const setText = (id, value) => { const el = document.getElementById(id); if(el) el.textContent = value; };
    setText('fullname', state.fullname);
    setText('studentid', state.studentid);
    setText('phone', state.phone);
    setText('mode', state.mode);
    setText('year', state.year);
    setText('ptype', state.ptype);
    setText('faculty', state.faculty);
    setText('dept', state.dept);
    setText('prog', state.prog);
    const sid = document.getElementById('sid'); if(sid) sid.textContent = state.studentid;

    const avWrap = $('#avatarPreview');
    if(avWrap){
      if(state.avatarData){
        avWrap.innerHTML = '';
        const img = new Image();
        img.src = state.avatarData;
        img.style.width = '96px';
        img.style.height = '96px';
        img.style.borderRadius = '50%';
        img.style.objectFit = 'cover';
        avWrap.appendChild(img);
        const cam = document.createElement('div');
        cam.className = 'camera';
        cam.id = 'cameraBtn';
        cam.title = 'Upload photo';
        cam.textContent = '📷';
        avWrap.appendChild(cam);
      } else {
        // leave the placeholder SVG if no avatar
      }
    }
  }

  reflectState();

  // Menu routing (visual only)
  $$('.menu button').forEach(btn => btn.addEventListener('click', () => {
    $$('.menu button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    toast('Switched to: ' + btn.textContent.trim());
  }));

  // Sign out (mock)
  const signoutBtn = document.getElementById('signout');
  if(signoutBtn){
    signoutBtn.addEventListener('click', ()=>{
      toast('Signed out (mock)');
      setTimeout(()=>{ window.location.href = '#loggedout'; }, 400);
    });
  }

  // Edit profile flow: toggle between static divs and inputs
  let editing = false;
  const editBtn = document.getElementById('editProfile');
  if(editBtn){
    editBtn.addEventListener('click', ()=>{
      editing = !editing;
      if(editing){
        // convert static display fields into inputs
        ['fullname','studentid','phone'].forEach(id => {
          const el = document.getElementById(id);
          if(!el) return;
          const val = el.textContent;
          const input = document.createElement('input');
          input.type = 'text';
          input.value = val;
          input.className = 'input';
          input.dataset.bind = id;
          el.replaceWith(input);
        });
        editBtn.textContent = 'Save';
        toast('Editing enabled — save when done (or press E again)');
      } else {
        // validate inputs
        const fullnameInput = document.querySelector('input[data-bind="fullname"]');
        const sidInput = document.querySelector('input[data-bind="studentid"]');
        const phoneInput = document.querySelector('input[data-bind="phone"]');
        if(!fullnameInput || !sidInput || !phoneInput){
          toast('Unexpected error: inputs not found');
          editing = false;
          return;
        }

        // basic validations
        if(!fullnameInput.value.trim()){ toast('Full name cannot be empty'); editing = true; return; }
        if(!/^FULUG[0-9]{3,}/i.test(sidInput.value.trim())){ toast('Student ID format suspicious'); editing = true; return; }
        if(!/^[0-9]{7,15}$/.test(phoneInput.value.replace(/[^0-9]/g,''))){ toast('Phone number invalid'); editing = true; return; }

        // update state
        state.fullname = fullnameInput.value.trim();
        state.studentid = sidInput.value.trim();
        state.phone = phoneInput.value.trim();
        state.lastSaved = new Date().toISOString();
        saveState(state);

        // revert inputs to static divs
        ['fullname','studentid','phone'].forEach(id => {
          const input = document.querySelector('input[data-bind="'+id+'"]');
          const div = document.createElement('div');
          div.className = 'input';
          div.id = id;
          div.textContent = input.value;
          input.replaceWith(div);
        });

        editBtn.textContent = 'Edit';
        toast('Profile saved locally');
        reflectState();
      }
    });
  }

  // Reset profile to default
  const resetBtn = document.getElementById('resetProfile');
  if(resetBtn){
    resetBtn.addEventListener('click', ()=> {
      if(!confirm('Reset profile values to defaults?')) return;
      state = {...defaultState};
      saveState(state);
      reflectState();
      toast('Profile reset to defaults');
    });
  }

  // Avatar upload: fileChooser + drag/drop handlers
  const fileInput = document.getElementById('fileInput');
  function openFileChooser(){ if(fileInput) fileInput.click(); }

  document.addEventListener('click', (e) => {
    if(e.target && (e.target.id === 'cameraBtn' || (e.target.closest && e.target.closest('.camera')))){
      openFileChooser();
    }
  });

  if(fileInput){
    fileInput.addEventListener('change', (ev) => {
      const f = ev.target.files && ev.target.files[0];
      if(!f) return;
      if(!f.type.startsWith('image/')){ toast('Please choose an image file'); return; }
      const reader = new FileReader();
      reader.onload = function(){
        state.avatarData = reader.result;
        saveState(state);
        reflectState();
        toast('Avatar updated (local)');
        fileInput.value = '';
      };
      reader.readAsDataURL(f);
    });
  }

  const avatarPreview = document.getElementById('avatarPreview');
  if(avatarPreview){
    ['dragenter','dragover'].forEach(ev => avatarPreview.addEventListener(ev, e => { e.preventDefault(); avatarPreview.style.opacity = .85; }));
    ['dragleave','drop'].forEach(ev => avatarPreview.addEventListener(ev, e => { e.preventDefault(); avatarPreview.style.opacity = 1; }));
    avatarPreview.addEventListener('drop', (e) => {
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if(!f) return;
      if(!f.type.startsWith('image/')){ toast('Drop a valid image'); return; }
      const r = new FileReader();
      r.onload = () => { state.avatarData = r.result; saveState(state); reflectState(); toast('Avatar updated (drop)'); };
      r.readAsDataURL(f);
    });
  }

  // Save details (simulated server call)
  const saveDetailsBtn = document.getElementById('saveDetails');
  if(saveDetailsBtn){
    saveDetailsBtn.addEventListener('click', async () => {
      // gather payload (static in this UI)
      const payload = {
        fullname: state.fullname,
        studentid: state.studentid,
        phone: state.phone,
        mode: state.mode,
        year: state.year,
        ptype: state.ptype,
        faculty: state.faculty,
        dept: state.dept,
        prog: state.prog,
      };

      toast('Saving details — connecting...');
      try{
        await new Promise(res => setTimeout(res, 900)); // fake latency
        if(Math.random() < 0.06) throw new Error('Network error');
        state.lastSaved = new Date().toISOString();
        saveState(state);
        toast('Details saved (simulated)');
      }catch(err){
        toast('Failed to save: ' + (err.message || 'unknown'));
      }
    });
  }

  // Download/export — fallback to JSON (fast)
  const downloadBtn = document.getElementById('downloadPdf');
  if(downloadBtn){
    downloadBtn.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = state.studentid + '_profile.json';
      a.click();
      toast('Profile exported as JSON');
    });
  }

  // Keyboard: press 'E' to toggle edit when page body is focused
  document.addEventListener('keydown', (e) => {
    if(e.key.toLowerCase() === 'e' && (document.activeElement === document.body || document.activeElement.tagName === 'BODY')){
      e.preventDefault();
      const btn = document.getElementById('editProfile');
      if(btn) btn.click();
    }
  });

  // show last-saved in sidebar if present
  if(state.lastSaved){
    const el = document.createElement('div');
    el.style.fontSize = '12px';
    el.style.color = '#9aa6b2';
    el.style.marginTop = '12px';
    el.textContent = 'Last saved: ' + new Date(state.lastSaved).toLocaleString();
    const sidebar = document.querySelector('.sidebar');
    if(sidebar) sidebar.appendChild(el);
  }

  // small animation
  setTimeout(()=>{ const h = document.querySelector('.hero'); if(h) h.style.transform = 'translateY(0)'; }, 300);

  // expose for debug
  window.FULAFIA = { state, saveState, loadState };

})();
