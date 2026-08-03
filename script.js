let characters = JSON.parse(safeStorage.getItem('dnd_neon_chars')) || [];
let currentId = null;
let globalTheme = safeStorage.getItem('dnd_global_theme') || 'light';
let isDirty = false;

const dashboard = document.getElementById('dashboard');
const sheetEditor = document.getElementById('sheet-editor');
const charList = document.getElementById('character-list');
const charForm = document.getElementById('char-form');

// ===== MODAL SYSTEM =====

let modalResolve = null;

function showAlert(message, { title, icon, iconClass } = {}) {
  return new Promise(resolve => {
    modalResolve = resolve;
    document.getElementById('modal-title').textContent = title || getTranslation('modal_title_info');
    document.getElementById('modal-message').textContent = message;
    document.getElementById('modal-cancel').classList.add('hidden');
    document.getElementById('modal-ok').textContent = 'OK';
    const iconEl = document.getElementById('modal-icon');
    iconEl.textContent = icon || 'auto_stories';
    iconEl.className = 'material-icons-round modal-icon ' + (iconClass || '');
    document.getElementById('modal-overlay').classList.remove('hidden');
  });
}

function showConfirm(message, title) {
  return new Promise(resolve => {
    modalResolve = resolve;
    document.getElementById('modal-title').textContent = title || getTranslation('modal_title_confirm');
    document.getElementById('modal-message').textContent = message;
    const cancelBtn = document.getElementById('modal-cancel');
    cancelBtn.classList.remove('hidden');
    cancelBtn.textContent = getTranslation('modal_cancel');
    document.getElementById('modal-ok').textContent = getTranslation('modal_confirm');
    const iconEl = document.getElementById('modal-icon');
    iconEl.textContent = 'help_outline';
    iconEl.className = 'material-icons-round modal-icon modal-icon-warning';
    document.getElementById('modal-overlay').classList.remove('hidden');
  });
}

function resolveModal(value) {
  document.getElementById('modal-overlay').classList.add('hidden');
  if (modalResolve) {
    const fn = modalResolve;
    modalResolve = null;
    fn(value);
  }
}

// ===== THEME =====

function initGlobalTheme() {
  if (globalTheme === 'dark') {
    document.documentElement.classList.add('dark');
    updateThemeIcons('light_mode');
  } else {
    document.documentElement.classList.remove('dark');
    updateThemeIcons('dark_mode');
  }
}

function toggleGlobalTheme() {
  if (document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.remove('dark');
    globalTheme = 'light';
    updateThemeIcons('dark_mode');
  } else {
    document.documentElement.classList.add('dark');
    globalTheme = 'dark';
    updateThemeIcons('light_mode');
  }
  safeStorage.setItem('dnd_global_theme', globalTheme);
}

function updateThemeIcons(iconName) {
  const iconHome = document.getElementById('theme-icon-home');
  const iconSheet = document.getElementById('theme-icon-sheet');
  if (iconHome) iconHome.textContent = iconName;
  if (iconSheet) iconSheet.textContent = iconName;
}

function setCharColor(color) {
  document.documentElement.style.setProperty('--accent-primary', color);
  document.documentElement.style.setProperty('--accent-hover', adjustColorBrightness(color, -20));

  const colorInput = document.getElementById('charColorInput');
  if (colorInput) colorInput.value = color;

  document.querySelectorAll('.dot').forEach(dot => {
    dot.style.border = '2px solid transparent';
    dot.style.transform = 'scale(1)';
  });

  const activeDot = document.querySelector(`.dot[data-color="${color}"]`);
  if (activeDot) {
    activeDot.style.border = '2px solid var(--text-primary)';
    activeDot.style.transform = 'scale(1.2)';
  }
}

function adjustColorBrightness(hex, percent) {
  let num = parseInt(hex.replace("#", ""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = (num >> 8 & 0x00FF) + amt,
    B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// ===== DASHBOARD =====

function renderList() {
  charList.innerHTML = '';
  setCharColor('#b8860b');

  if (characters.length === 0) {
    const msg = getTranslation('msg_char_not_found');
    charList.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center; margin-top: 20px;"></p>`;
    charList.querySelector('p').textContent = msg;
    return;
  }

  characters.forEach(char => {
    const div = document.createElement('div');
    div.className = 'char-item surface-elevated';

    const itemColor = char.theme_color || '#b8860b';
    div.style.borderLeft = `4px solid ${itemColor}`;

    const name = char.charName || getTranslation('lbl_unknown');
    const race = char.species || getTranslation('lbl_default_race');
    const cls = char.charClass || getTranslation('lbl_default_class');
    const details = `${race} - ${cls} ${char.level || '1'}`;

    const portraitDiv = document.createElement('div');
    portraitDiv.className = 'char-item-portrait';

    if (char.portrait) {
      const img = document.createElement('img');
      img.src = char.portrait;
      img.alt = name;
      portraitDiv.appendChild(img);
    } else {
      portraitDiv.style.cssText = 'background-color: var(--surface-subtle); display:flex; align-items:center; justify-content:center;';
      const icon = document.createElement('span');
      icon.className = 'material-icons-round';
      icon.style.cssText = 'font-size:36px; color:var(--text-disabled);';
      icon.textContent = 'person';
      portraitDiv.appendChild(icon);
    }

    const infoDiv = document.createElement('div');
    infoDiv.className = 'char-item-info';
    const strong = document.createElement('strong');
    strong.style.color = itemColor;
    strong.textContent = name;
    const span = document.createElement('span');
    span.textContent = details;
    infoDiv.appendChild(strong);
    infoDiv.appendChild(span);

    div.appendChild(portraitDiv);
    div.appendChild(infoDiv);

    div.onclick = () => loadCharacter(char.id);
    charList.appendChild(div);
  });
}

// ===== CHARACTER CRUD =====

function handleLevelChange() {
  if (!currentId) return;

  const charIndex = characters.findIndex(c => c.id === currentId);
  if (charIndex === -1) return;

  const levelInput = charForm.querySelector('input[name="level"]');
  const newLevel = levelInput ? levelInput.value : '1';
  characters[charIndex].level = newLevel;

  renderSpellSlots(characters[charIndex]);
}

function createNewCharacter() {
  const newId = Date.now().toString();
  const newChar = { id: newId, theme_color: '#b8860b' };
  characters.push(newChar);
  saveToStorage();
  loadCharacter(newId);
}

function loadCharacter(id) {
  currentId = id;
  const char = characters.find(c => c.id === id);

  charForm.reset();

  const charTheme = char.theme_color || '#b8860b';
  setCharColor(charTheme);

  renderSpellSlots(char);

  Array.from(charForm.elements).forEach(el => {
    if (el.name && char[el.name] !== undefined) {
      if (el.type === 'checkbox') {
        el.checked = char[el.name];
      } else {
        el.value = char[el.name];
      }
    }
  });

  const portrait = document.getElementById('char-portrait');
  const placeholder = document.getElementById('portrait-placeholder');

  if (char.portrait) {
    portrait.src = char.portrait;
    portrait.classList.remove('hidden');
    placeholder.classList.add('hidden');
  } else {
    portrait.classList.add('hidden');
    placeholder.classList.remove('hidden');
  }

  updateModifiers();

  const firstTab = document.querySelector('.tab-button');
  if (firstTab) firstTab.click();

  dashboard.classList.add('hidden');
  sheetEditor.classList.remove('hidden');
  window.scrollTo(0, 0);

  isDirty = false;
  charForm.addEventListener('input', markDirty);
  charForm.addEventListener('change', markDirty);

  if (typeof Multiplayer !== 'undefined' && typeof Multiplayer.afterCharacterLoad === 'function') {
    Multiplayer.afterCharacterLoad();
  }
}

function markDirty() {
  isDirty = true;
}

function collectFormData() {
  const formData = new FormData(charForm);
  const data = { id: currentId };

  formData.forEach((value, key) => data[key] = value);

  Array.from(charForm.querySelectorAll('input[type="checkbox"]')).forEach(checkbox => {
    if (checkbox.name) data[checkbox.name] = checkbox.checked;
  });

  const currentChar = characters.find(c => c.id === currentId);
  if (currentChar && currentChar.portrait) {
    data.portrait = currentChar.portrait;
  }

  const colorInput = document.getElementById('charColorInput');
  data.theme_color = colorInput.value || '#b8860b';

  // Preserve spell data for levels not currently rendered
  if (currentChar) {
    for (let i = 1; i <= 9; i++) {
      const spellKey = `spells_lvl${i}`;
      const totalKey = `slots_lvl${i}_total`;
      const usedKey = `slots_lvl${i}_used`;
      if (data[spellKey] === undefined && currentChar[spellKey]) {
        data[spellKey] = currentChar[spellKey];
      }
      if (data[totalKey] === undefined && currentChar[totalKey]) {
        data[totalKey] = currentChar[totalKey];
      }
      if (data[usedKey] === undefined && currentChar[usedKey]) {
        data[usedKey] = currentChar[usedKey];
      }
    }
  }

  return data;
}

function saveCharacter() {
  if (!currentId) return;

  const updatedData = collectFormData();

  const index = characters.findIndex(c => c.id === currentId);
  characters[index] = updatedData;

  saveToStorage();
  isDirty = false;

  const saveBtn = document.querySelector('.btn-primary');
  saveBtn.innerHTML = `<span class="material-icons-round">check</span> ${getTranslation('msg_saved')}`;
  setTimeout(() => { saveBtn.innerHTML = `<span class="material-icons-round">save</span> ${getTranslation('btn_save')}`; }, 1500);
}

async function deleteCharacter() {
  const confirmed = await showConfirm(getTranslation('msg_confirm_delete'));
  if (!confirmed) return;
  characters = characters.filter(c => c.id !== currentId);
  saveToStorage();
  isDirty = false;
  closeCharacter();
}

async function closeCharacter() {
  if (isDirty) {
    const confirmed = await showConfirm(getTranslation('msg_unsaved_changes'));
    if (!confirmed) return;
  }
  currentId = null;
  isDirty = false;
  charForm.removeEventListener('input', markDirty);
  charForm.removeEventListener('change', markDirty);
  sheetEditor.classList.add('hidden');
  dashboard.classList.remove('hidden');
  renderList();
}

function saveToStorage() {
  safeStorage.setItem('dnd_neon_chars', JSON.stringify(characters));
}

// ===== SPELLS =====

function renderSpellSlots(char) {
  const container = document.getElementById('spell-list-container');
  if (!container) return;

  container.innerHTML = '';

  const txtCantrips = getTranslation('lbl_cantrips');
  const txtLevel = getTranslation('lbl_level_x');
  const phList = getTranslation('ph_spells_list');

  const cantripsBlock = document.createElement('div');
  cantripsBlock.className = 'spell-level-block';
  const cantripsTitle = document.createElement('h4');
  cantripsTitle.textContent = `${txtCantrips} (0)`;
  const cantripsTextarea = document.createElement('textarea');
  cantripsTextarea.name = 'spells_cantrips';
  cantripsTextarea.rows = 3;
  cantripsTextarea.className = 'lines-bg';
  cantripsTextarea.placeholder = phList;
  cantripsTextarea.value = char.spells_cantrips || '';
  cantripsBlock.appendChild(cantripsTitle);
  cantripsBlock.appendChild(cantripsTextarea);
  container.appendChild(cantripsBlock);

  const charLevel = parseInt(char.level) || 1;
  let maxSpellLevel = Math.ceil(charLevel / 2);

  if (maxSpellLevel < 1) maxSpellLevel = 1;
  if (maxSpellLevel > 9) maxSpellLevel = 9;

  for (let i = 1; i <= maxSpellLevel; i++) {
    const total = char[`slots_lvl${i}_total`] || '';
    const used = char[`slots_lvl${i}_used`] || '';
    const spells = char[`spells_lvl${i}`] || '';

    const block = document.createElement('div');
    block.className = 'spell-level-block';

    const header = document.createElement('div');
    header.className = 'spell-level-header';

    const title = document.createElement('h4');
    title.textContent = `${txtLevel} ${i}`;

    const slotsDiv = document.createElement('div');
    slotsDiv.className = 'slots';

    const totalInput = document.createElement('input');
    totalInput.type = 'number';
    totalInput.name = `slots_lvl${i}_total`;
    totalInput.value = total;
    totalInput.className = 'slot-input';
    totalInput.placeholder = '0';

    const separator = document.createElement('span');
    separator.textContent = '/';

    const usedInput = document.createElement('input');
    usedInput.type = 'number';
    usedInput.name = `slots_lvl${i}_used`;
    usedInput.value = used;
    usedInput.className = 'slot-input';
    usedInput.placeholder = '0';

    slotsDiv.appendChild(totalInput);
    slotsDiv.appendChild(separator);
    slotsDiv.appendChild(usedInput);

    header.appendChild(title);
    header.appendChild(slotsDiv);

    const textarea = document.createElement('textarea');
    textarea.name = `spells_lvl${i}`;
    textarea.rows = 3;
    textarea.className = 'lines-bg';
    textarea.placeholder = phList;
    textarea.value = spells;

    block.appendChild(header);
    block.appendChild(textarea);
    container.appendChild(block);
  }
}

// ===== MODIFIERS =====

function updateModifiers() {
  const attributes = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  attributes.forEach(attr => {
    const scoreInput = document.querySelector(`input[name="${attr}_score"]`);
    const modInput = document.querySelector(`input[name="${attr}_mod"]`);

    if (scoreInput && modInput) {
      const score = parseInt(scoreInput.value);
      if (!isNaN(score)) {
        const mod = Math.floor((score - 10) / 2);
        modInput.value = (mod >= 0 ? '+' : '') + mod;
      } else {
        modInput.value = "+0";
      }
    }
  });
}

// ===== PORTRAIT =====

function handlePortraitUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const portrait = document.getElementById('char-portrait');
    const placeholder = document.getElementById('portrait-placeholder');

    portrait.src = e.target.result;
    portrait.classList.remove('hidden');
    placeholder.classList.add('hidden');

    const currentChar = characters.find(c => c.id === currentId);
    if (currentChar) {
      currentChar.portrait = e.target.result;
    }
    isDirty = true;
  };
  reader.readAsDataURL(file);
}

// ===== TABS =====

function switchTab(event, tabId) {
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
  event.currentTarget.classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

// ===== EXPORT JSON =====

function exportCharacter() {
  if (!currentId) return;

  // Save current form state before exporting
  saveCharacter();

  const char = characters.find(c => c.id === currentId);
  if (!char) return;

  const spellsExport = {
    cantrips: char.spells_cantrips ? char.spells_cantrips.split('\n').filter(s => s.trim()) : []
  };
  for (let i = 1; i <= 9; i++) {
    const spells = char[`spells_lvl${i}`];
    if (spells) {
      spellsExport[`level_${i}`] = spells.split('\n').filter(s => s.trim());
    }
  }

  const spellSlots = {};
  for (let i = 1; i <= 9; i++) {
    const total = char[`slots_lvl${i}_total`];
    const used = char[`slots_lvl${i}_used`];
    if (total || used) {
      spellSlots[`level_${i}`] = { total: total || '', used: used || '' };
    }
  }

  const exportData = {
    personal_data: {
      name: char.charName || "",
      level: parseInt(char.level) || 1,
      species: char.species || "",
      class: char.charClass || "",
      subclass: char.subclass || "",
      background: char.background || "",
      alignment: char.alignment || "",
      max_hp: parseInt(char.hpMax) || 0,
      current_hp: parseInt(char.hpCurrent) || 0,
      temp_hp: parseInt(char.hpTemp) || 0,
      armor_class: parseInt(char.ac) || 10,
      speed: char.speed || "",
      initiative: char.initiative || "+0",
      proficiency_bonus: char.profBonus || "+2",
      hit_dice: char.hitDiceTotal || "",
      passive_perception: parseInt(char.passivePerception) || 10,
      inspiration: !!char.inspiration
    },
    theme_color: char.theme_color || "#b8860b",
    attributes: {
      strength: parseInt(char.str_score) || 10,
      dexterity: parseInt(char.dex_score) || 10,
      constitution: parseInt(char.con_score) || 10,
      intelligence: parseInt(char.int_score) || 10,
      wisdom: parseInt(char.wis_score) || 10,
      charisma: parseInt(char.cha_score) || 10
    },
    saving_throws: {
      str: { proficient: !!char.save_str_prof, mod: char.save_str_mod || '' },
      dex: { proficient: !!char.save_dex_prof, mod: char.save_dex_mod || '' },
      con: { proficient: !!char.save_con_prof, mod: char.save_con_mod || '' },
      int: { proficient: !!char.save_int_prof, mod: char.save_int_mod || '' },
      wis: { proficient: !!char.save_wis_prof, mod: char.save_wis_mod || '' },
      cha: { proficient: !!char.save_cha_prof, mod: char.save_cha_mod || '' }
    },
    skills: {
      acrobatics:       { proficient: !!char.skill_acro_prof, mod: char.skill_acro_mod || '' },
      animal_handling:  { proficient: !!char.skill_anim_prof, mod: char.skill_anim_mod || '' },
      arcana:           { proficient: !!char.skill_arca_prof, mod: char.skill_arca_mod || '' },
      athletics:        { proficient: !!char.skill_athl_prof, mod: char.skill_athl_mod || '' },
      performance:      { proficient: !!char.skill_perf_prof, mod: char.skill_perf_mod || '' },
      deception:        { proficient: !!char.skill_decp_prof, mod: char.skill_decp_mod || '' },
      stealth:          { proficient: !!char.skill_stea_prof, mod: char.skill_stea_mod || '' },
      history:          { proficient: !!char.skill_hist_prof, mod: char.skill_hist_mod || '' },
      intimidation:     { proficient: !!char.skill_inti_prof, mod: char.skill_inti_mod || '' },
      insight:          { proficient: !!char.skill_insg_prof, mod: char.skill_insg_mod || '' },
      investigation:    { proficient: !!char.skill_invs_prof, mod: char.skill_invs_mod || '' },
      medicine:         { proficient: !!char.skill_medi_prof, mod: char.skill_medi_mod || '' },
      nature:           { proficient: !!char.skill_natu_prof, mod: char.skill_natu_mod || '' },
      perception:       { proficient: !!char.skill_perc_prof, mod: char.skill_perc_mod || '' },
      persuasion:       { proficient: !!char.skill_pers_prof, mod: char.skill_pers_mod || '' },
      sleight_of_hand:  { proficient: !!char.skill_slei_prof, mod: char.skill_slei_mod || '' },
      religion:         { proficient: !!char.skill_reli_prof, mod: char.skill_reli_mod || '' },
      survival:         { proficient: !!char.skill_surv_prof, mod: char.skill_surv_mod || '' }
    },
    death_saves: {
      successes: [!!char.death_save_success_1, !!char.death_save_success_2, !!char.death_save_success_3],
      failures: [!!char.death_save_fail_1, !!char.death_save_fail_2, !!char.death_save_fail_3]
    },
    coins: {
      cp: parseInt(char.cp) || 0,
      sp: parseInt(char.sp) || 0,
      ep: parseInt(char.ep) || 0,
      gp: parseInt(char.gp) || 0,
      pp: parseInt(char.pp) || 0
    },
    spellcasting: {
      ability: char.spellcastingAbility || "",
      save_dc: char.spellSaveDC || "",
      attack_bonus: char.spellAttackBonus || ""
    },
    spell_slots: spellSlots,
    spells: spellsExport,
    text_areas: {
      equipment: char.equipment || "",
      featuresTraits: char.featuresTraits || "",
      proficiencies: char.proficiencies || "",
      backstory: char.backstory || "",
      attacks: char.attacks || ""
    },
    portrait: char.portrait || null
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${char.charName || 'character'}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

// ===== IMPORT JSON =====

function importCharacter(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (e) {
    try {
      const json = JSON.parse(e.target.result);
      let charId;
      let isOverwrite = false;

      if (currentId) {
        const confirmed = await showConfirm(getTranslation('msg_confirm_overwrite'));
        if (!confirmed) {
          input.value = '';
          return;
        }
        charId = currentId;
        isOverwrite = true;
      } else {
        charId = Date.now().toString();
        isOverwrite = false;
      }

      const newChar = {
        id: charId,
        charName: json.personal_data?.name || "",
        level: json.personal_data?.level || 1,
        species: json.personal_data?.species || "",
        charClass: json.personal_data?.class || "",
        subclass: json.personal_data?.subclass || "",
        background: json.personal_data?.background || "",
        alignment: json.personal_data?.alignment || "",
        hpMax: json.personal_data?.max_hp || 0,
        hpCurrent: json.personal_data?.current_hp || 0,
        hpTemp: json.personal_data?.temp_hp || 0,
        ac: json.personal_data?.armor_class || 10,
        speed: json.personal_data?.speed || "",
        profBonus: json.personal_data?.proficiency_bonus || "+2",
        initiative: json.personal_data?.initiative || "+0",
        hitDiceTotal: json.personal_data?.hit_dice || "",
        passivePerception: json.personal_data?.passive_perception || 10,
        inspiration: !!json.personal_data?.inspiration,
        theme_color: json.theme_color || "#b8860b",
        str_score: json.attributes?.strength || 10,
        dex_score: json.attributes?.dexterity || 10,
        con_score: json.attributes?.constitution || 10,
        int_score: json.attributes?.intelligence || 10,
        wis_score: json.attributes?.wisdom || 10,
        cha_score: json.attributes?.charisma || 10,
        portrait: json.portrait || null
      };

      // Saving throws (new format)
      if (json.saving_throws) {
        const attrMap = { str: 'str', dex: 'dex', con: 'con', int: 'int', wis: 'wis', cha: 'cha' };
        for (const [key, val] of Object.entries(json.saving_throws)) {
          if (attrMap[key]) {
            newChar[`save_${key}_prof`] = !!val.proficient;
            newChar[`save_${key}_mod`] = val.mod || '';
          }
        }
      }
      // Legacy format (array of names)
      else if (json.proficiencies?.saving_throws) {
        const saveMap = { 'Força': 'save_str_prof', 'Destreza': 'save_dex_prof', 'Constituição': 'save_con_prof', 'Inteligência': 'save_int_prof', 'Sabedoria': 'save_wis_prof', 'Carisma': 'save_cha_prof' };
        json.proficiencies.saving_throws.forEach(s => { if (saveMap[s]) newChar[saveMap[s]] = true; });
      }

      // Skills (new format)
      if (json.skills) {
        const skillKeyMap = {
          acrobatics: 'acro', animal_handling: 'anim', arcana: 'arca', athletics: 'athl',
          performance: 'perf', deception: 'decp', stealth: 'stea', history: 'hist',
          intimidation: 'inti', insight: 'insg', investigation: 'invs', medicine: 'medi',
          nature: 'natu', perception: 'perc', persuasion: 'pers', sleight_of_hand: 'slei',
          religion: 'reli', survival: 'surv'
        };
        for (const [key, val] of Object.entries(json.skills)) {
          const short = skillKeyMap[key];
          if (short) {
            newChar[`skill_${short}_prof`] = !!val.proficient;
            newChar[`skill_${short}_mod`] = val.mod || '';
          }
        }
      }
      // Legacy format (array of names)
      else if (json.proficiencies?.skills) {
        const skillMap = { 'Acrobacia': 'skill_acro_prof', 'Adestrar Animais': 'skill_anim_prof', 'Arcanismo': 'skill_arca_prof', 'Atletismo': 'skill_athl_prof', 'Enganação': 'skill_decp_prof', 'História': 'skill_hist_prof', 'Intuição': 'skill_insg_prof', 'Intimidação': 'skill_inti_prof', 'Investigação': 'skill_invs_prof', 'Medicina': 'skill_medi_prof', 'Natureza': 'skill_natu_prof', 'Percepção': 'skill_perc_prof', 'Atuação': 'skill_perf_prof', 'Persuasão': 'skill_pers_prof', 'Religião': 'skill_reli_prof', 'Prestidigitação': 'skill_slei_prof', 'Furtividade': 'skill_stea_prof', 'Sobrevivência': 'skill_surv_prof' };
        json.proficiencies.skills.forEach(skill => {
          const cleanSkill = skill.split('(')[0].trim();
          if (skillMap[cleanSkill]) newChar[skillMap[cleanSkill]] = true;
        });
      }

      // Death saves
      if (json.death_saves) {
        if (Array.isArray(json.death_saves.successes)) {
          json.death_saves.successes.forEach((v, i) => { newChar[`death_save_success_${i + 1}`] = !!v; });
        }
        if (Array.isArray(json.death_saves.failures)) {
          json.death_saves.failures.forEach((v, i) => { newChar[`death_save_fail_${i + 1}`] = !!v; });
        }
      }

      // Coins
      if (json.coins) {
        newChar.cp = json.coins.cp || 0;
        newChar.sp = json.coins.sp || 0;
        newChar.ep = json.coins.ep || 0;
        newChar.gp = json.coins.gp || 0;
        newChar.pp = json.coins.pp || 0;
      }

      // Spellcasting stats
      if (json.spellcasting) {
        newChar.spellcastingAbility = json.spellcasting.ability || "";
        newChar.spellSaveDC = json.spellcasting.save_dc || "";
        newChar.spellAttackBonus = json.spellcasting.attack_bonus || "";
      }

      // Spells
      if (json.spells) {
        newChar.spells_cantrips = Array.isArray(json.spells.cantrips) ? json.spells.cantrips.join('\n') : "";
        for (let i = 1; i <= 9; i++) {
          const spellList = json.spells[`level_${i}`];
          if (Array.isArray(spellList)) {
            newChar[`spells_lvl${i}`] = spellList.join('\n');
          }
        }
      }

      // Spell slots
      if (json.spell_slots) {
        for (let i = 1; i <= 9; i++) {
          const slot = json.spell_slots[`level_${i}`];
          if (slot) {
            newChar[`slots_lvl${i}_total`] = slot.total || '';
            newChar[`slots_lvl${i}_used`] = slot.used || '';
          }
        }
      }

      if (json.text_areas?.equipment) newChar.equipment = json.text_areas.equipment;
      else if (Array.isArray(json.equipment)) newChar.equipment = json.equipment.join('\n');

      newChar.backstory = json.text_areas?.backstory || json.character_history || "";

      if (json.text_areas?.attacks) newChar.attacks = json.text_areas.attacks;

      if (json.text_areas?.featuresTraits) newChar.featuresTraits = json.text_areas.featuresTraits;
      else if (json.habilidades_e_talentos) newChar.featuresTraits = formatComplexTraits(json.habilidades_e_talentos);

      if (json.text_areas?.proficiencies) newChar.proficiencies = json.text_areas.proficiencies;
      else if (json.proficiencies && !json.saving_throws) newChar.proficiencies = formatLegacyProficiencies(json.proficiencies);

      if (isOverwrite) {
        const index = characters.findIndex(c => c.id === charId);
        if (index !== -1) characters[index] = newChar; else characters.push(newChar);
      } else {
        characters.push(newChar);
      }

      saveToStorage();
      loadCharacter(charId);
      await showAlert(
        isOverwrite ? getTranslation('msg_updated') : getTranslation('msg_imported'),
        { title: getTranslation('modal_title_success'), icon: 'military_tech', iconClass: 'modal-icon-success' }
      );

    } catch (error) {
      console.error(error);
      await showAlert(getTranslation('msg_json_error'), { title: getTranslation('modal_title_error'), icon: 'error', iconClass: 'modal-icon-error' });
    }
    input.value = '';
  };
  reader.readAsText(file);
}

// ===== LEGACY FORMAT HELPERS =====

function formatComplexTraits(data) {
  if (!data) return "";
  let text = "";
  if (Array.isArray(data)) return data.map(i => typeof i === 'string' ? i : `${i.nome}: ${i.descricao}`).join('\n\n');
  for (const key in data) {
    if (Array.isArray(data[key])) {
      text += `--- ${key.toUpperCase().replace('_', ' ')} ---\n`;
      data[key].forEach(item => { if (item.nome) text += `• ${item.nome}: ${item.descricao}\n`; });
      text += "\n";
    }
  }
  return text;
}

function formatLegacyProficiencies(prof) {
  let t = "";
  if (prof.armaduras) t += "Armaduras: " + prof.armaduras.join(', ') + "\n";
  if (prof.armas) t += "Armas: " + prof.armas.join(', ') + "\n";
  if (prof.ferramentas) t += "Ferramentas: " + prof.ferramentas.join(', ') + "\n";
  if (prof.idiomas) t += "Idiomas: " + prof.idiomas.join(', ') + "\n";
  return t;
}

// ===== INIT =====

initGlobalTheme();
initLanguage();
renderList();
