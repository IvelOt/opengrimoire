// ===== QUICK CHARACTER GENERATOR (Gerador Rápido) =====
// Gera fichas de D&D 5e prontas para uso a partir de arquétipos de classe
// ou geração totalmente aleatória, com atributos (4d6 ou array padrão)
// distribuídos de forma inteligente conforme o papel da classe.

const Generator = {
  // --- Configurações da UI ---
  state: {
    mode: 'archetype',          // 'archetype' | 'random'
    method: 'roll',             // 'roll' | 'standard'
    selectedClass: 'fighter',
    selectedRace: 'random',
    level: 1,
    alignment: 'random',
    background: 'random',
    theme: '#b8860b',
    rolledScores: null,
    lastBuild: null
  },

  // --- Atributos e metadados das classes (arquétipos) ---
  classes: {
    barbarian: {
      nameKey: 'cls_barbarian', hitDie: 12, primary: 'str', secondary: 'con',
      priority: ['str', 'con', 'dex', 'wis', 'cha', 'int'],
      saves: ['str', 'con'], skills: ['athl', 'surv', 'perc', 'inti'],
      armor: { type: 'unarmored', base: 10, dex: true, con: true, descKey: 'armor_unarmored_con' },
      weapon: { nameKey: 'wpn_greataxe', dice: '1d12', ability: 'str' },
      coins: { gp: 15, sp: 0 }, speed: '9m', theme: '#E7623E',
      spells: { ability: null, cantrips: [], level1: [] },
      equip: 'Greataxe • 4 handaxes • Explorer Pack',
      profs: 'Light & Medium armor, Shields, Simple & Martial weapons',
      features: 'Rage (2/day), Unarmored Defense, Danger Sense'
    },
    bard: {
      nameKey: 'cls_bard', hitDie: 8, primary: 'cha', secondary: 'dex',
      priority: ['cha', 'dex', 'con', 'int', 'wis', 'str'],
      saves: ['dex', 'cha'], skills: ['pers', 'perf', 'insg', 'decp'],
      armor: { type: 'leather', base: 11, dex: true, descKey: 'armor_leather' },
      weapon: { nameKey: 'wpn_rapier', dice: '1d8', ability: 'dex' },
      coins: { gp: 25, sp: 0 }, speed: '9m', theme: '#AB6DAC',
      spells: { ability: 'cha', cantrips: ['spell_vicious_mockery', 'spell_prestidigitation'], level1: ['spell_healing_word', 'spell_thunderwave', 'spell_charm_person'] },
      equip: 'Rapier • Leather armor • Dagger • Entertainer Pack • Instrument',
      profs: 'Light armor, Simple weapons, Hand crossbows, Longswords, Rapiers, Instruments',
      features: 'Bardic Inspiration (d6), Spellcasting, Ritual Casting'
    },
    cleric: {
      nameKey: 'cls_cleric', hitDie: 8, primary: 'wis', secondary: 'str',
      priority: ['wis', 'str', 'con', 'cha', 'dex', 'int'],
      saves: ['wis', 'cha'], skills: ['insg', 'medi', 'hist', 'reli'],
      armor: { type: 'chain', base: 16, dex: false, descKey: 'armor_chain_shirt' },
      weapon: { nameKey: 'wpn_warhammer', dice: '1d8', ability: 'str' },
      coins: { gp: 15, sp: 0 }, speed: '9m', theme: '#91A1B2',
      spells: { ability: 'wis', cantrips: ['spell_light', 'spell_sacred_flame', 'spell_guidance'], level1: ['spell_cure_wounds', 'spell_bless', 'spell_guiding_bolt'] },
      equip: 'Warhammer • Chain Shirt • Shield • Holy Symbol • Priest Pack',
      profs: 'Light & Medium armor, Shields, Simple weapons',
      features: 'Spellcasting, Divine Domain (Life), Channel Divinity (1/rest)'
    },
    druid: {
      nameKey: 'cls_druid', hitDie: 8, primary: 'wis', secondary: 'con',
      priority: ['wis', 'con', 'dex', 'cha', 'int', 'str'],
      saves: ['int', 'wis'], skills: ['natu', 'surv', 'anim', 'insg'],
      armor: { type: 'leather', base: 11, dex: true, descKey: 'armor_leather' },
      weapon: { nameKey: 'wpn_scimitar', dice: '1d6', ability: 'dex' },
      coins: { gp: 15, sp: 0 }, speed: '9m', theme: '#7A853B',
      spells: { ability: 'wis', cantrips: ['spell_druidcraft', 'spell_produce_flame', 'spell_shillelagh'], level1: ['spell_entangle', 'spell_cure_wounds', 'spell_faerie_fire'] },
      equip: 'Wooden shield • Scimitar • Leather armor • Explorer Pack',
      profs: 'Light & Medium armor, Shields, Simple weapons, Herbalism kit',
      features: 'Druidic, Spellcasting, Wild Shape (2/rest)'
    },
    fighter: {
      nameKey: 'cls_fighter', hitDie: 10, primary: 'str', secondary: 'con',
      priority: ['str', 'con', 'dex', 'wis', 'cha', 'int'],
      saves: ['str', 'con'], skills: ['athl', 'hist', 'inti', 'perc'],
      armor: { type: 'chain', base: 16, dex: false, descKey: 'armor_chain_mail' },
      weapon: { nameKey: 'wpn_longsword', dice: '1d8', ability: 'str' },
      coins: { gp: 20, sp: 0 }, speed: '9m', theme: '#7F513E',
      spells: { ability: null, cantrips: [], level1: [] },
      equip: 'Longsword • Shield • Chain mail • Light crossbow • Dungeoneer Pack',
      profs: 'All armor, Shields, Simple & Martial weapons',
      features: 'Fighting Style (Defense), Second Wind, Action Surge'
    },
    monk: {
      nameKey: 'cls_monk', hitDie: 8, primary: 'dex', secondary: 'wis',
      priority: ['dex', 'wis', 'con', 'str', 'cha', 'int'],
      saves: ['str', 'dex'], skills: ['acro', 'stea', 'insg', 'reli'],
      armor: { type: 'unarmored', base: 10, dex: true, wis: true, descKey: 'armor_unarmored_wis' },
      weapon: { nameKey: 'wpn_quarterstaff', dice: '1d6', ability: 'dex' },
      coins: { gp: 15, sp: 0 }, speed: '9m', theme: '#51A5C5',
      spells: { ability: null, cantrips: [], level1: [] },
      equip: 'Shortsword • Quarterstaff • Dungeoneer Pack',
      profs: 'Simple weapons, Shortswords, Choose 1 artisan tool',
      features: 'Unarmored Defense, Martial Arts (1d4), Ki (2 points), Flurry of Blows'
    },
    paladin: {
      nameKey: 'cls_paladin', hitDie: 10, primary: 'str', secondary: 'cha',
      priority: ['str', 'cha', 'con', 'wis', 'dex', 'int'],
      saves: ['wis', 'cha'], skills: ['insg', 'reli', 'inti', 'medi'],
      armor: { type: 'chain', base: 18, dex: false, descKey: 'armor_chain_mail_shield' },
      weapon: { nameKey: 'wpn_longsword', dice: '1d8', ability: 'str' },
      coins: { gp: 25, sp: 0 }, speed: '9m', theme: '#B59E54',
      spells: { ability: 'cha', cantrips: [], level1: ['spell_lay_on_hands', 'spell_bless', 'spell_thunderous_smite'] },
      equip: 'Longsword • Shield • Chain mail • Holy Symbol • Priest Pack',
      profs: 'All armor, Shields, Simple & Martial weapons',
      features: 'Divine Sense, Lay on Hands (5 HP), Fighting Style, Divine Smite'
    },
    ranger: {
      nameKey: 'cls_ranger', hitDie: 10, primary: 'dex', secondary: 'wis',
      priority: ['dex', 'wis', 'con', 'str', 'cha', 'int'],
      saves: ['str', 'dex'], skills: ['stea', 'surv', 'natu', 'perc'],
      armor: { type: 'leather', base: 11, dex: true, descKey: 'armor_leather' },
      weapon: { nameKey: 'wpn_longbow', dice: '1d8', ability: 'dex' },
      coins: { gp: 20, sp: 0 }, speed: '9m', theme: '#7A853B',
      spells: { ability: 'wis', cantrips: [], level1: ['Hunter\'s Mark', 'spell_speak_with_animals'] },
      equip: 'Longbow • 20 arrows • Leather armor • Shortsword • Explorer Pack',
      profs: 'Light & Medium armor, Shields, Simple & Martial weapons',
      features: 'Favored Enemy, Natural Explorer, Fighting Style (Archery)'
    },
    rogue: {
      nameKey: 'cls_rogue', hitDie: 8, primary: 'dex', secondary: 'con',
      priority: ['dex', 'con', 'int', 'wis', 'cha', 'str'],
      saves: ['dex', 'int'], skills: ['stea', 'slei', 'decp', 'perc'],
      armor: { type: 'leather', base: 11, dex: true, descKey: 'armor_leather' },
      weapon: { nameKey: 'wpn_rapier', dice: '1d8', ability: 'dex' },
      coins: { gp: 25, sp: 0 }, speed: '9m', theme: '#4A4A4A',
      spells: { ability: null, cantrips: [], level1: [] },
      equip: 'Rapier • Shortbow • 20 arrows • Leather armor • Thieves\' Tools • Burglar Pack',
      profs: 'Light armor, Simple weapons, Hand crossbows, Longswords, Rapiers, Thieves\' tools',
      features: 'Expertise, Sneak Attack (1d6), Thieves\' Cant, Cunning Action'
    },
    sorcerer: {
      nameKey: 'cls_sorcerer', hitDie: 6, primary: 'cha', secondary: 'con',
      priority: ['cha', 'con', 'dex', 'int', 'wis', 'str'],
      saves: ['con', 'cha'], skills: ['decp', 'inti', 'pers', 'slei'],
      armor: { type: 'none', base: 10, dex: true, descKey: 'armor_none' },
      weapon: { nameKey: 'wpn_dagger', dice: '1d4', ability: 'dex' },
      coins: { gp: 25, sp: 0 }, speed: '9m', theme: '#E7623E',
      spells: { ability: 'cha', cantrips: ['spell_fire_bolt', 'spell_minor_illusion', 'spell_ray_of_frost'], level1: ['spell_magic_missile', 'spell_shield', 'spell_sleep'] },
      equip: 'Light crossbow • 20 bolts • Dagger • Component pouch • Dungeoneer Pack',
      profs: 'Daggers, Darts, Slings, Quarterstaffs, Light crossbows',
      features: 'Spellcasting, Sorcerous Origin (Draconic Bloodline), Font of Magic (2 points)'
    },
    warlock: {
      nameKey: 'cls_warlock', hitDie: 8, primary: 'cha', secondary: 'con',
      priority: ['cha', 'con', 'dex', 'int', 'wis', 'str'],
      saves: ['wis', 'cha'], skills: ['arca', 'decp', 'hist', 'inti'],
      armor: { type: 'leather', base: 11, dex: true, descKey: 'armor_leather' },
      weapon: { nameKey: 'wpn_dagger', dice: '1d4', ability: 'dex' },
      coins: { gp: 25, sp: 0 }, speed: '9m', theme: '#7F513E',
      spells: { ability: 'cha', cantrips: ['spell_eldritch_blast', 'spell_mage_hand', 'spell_chill_touch'], level1: ['spell_hex', 'spell_witch_bolt', 'spell_arms_of_hadar'] },
      equip: 'Light crossbow • 20 bolts • Leather armor • Dagger • Arcane focus • Scholar Pack',
      profs: 'Light armor, Simple weapons',
      features: 'Otherworldly Patron (The Fiend), Pact Magic (1 slot), Eldritch Invocation'
    },
    wizard: {
      nameKey: 'cls_wizard', hitDie: 6, primary: 'int', secondary: 'dex',
      priority: ['int', 'dex', 'con', 'wis', 'cha', 'str'],
      saves: ['int', 'wis'], skills: ['arca', 'hist', 'invs', 'medi'],
      armor: { type: 'none', base: 10, dex: true, descKey: 'armor_none' },
      weapon: { nameKey: 'wpn_quarterstaff', dice: '1d6', ability: 'str' },
      coins: { gp: 25, sp: 0 }, speed: '9m', theme: '#51A5C5',
      spells: { ability: 'int', cantrips: ['spell_fire_bolt', 'spell_mage_hand', 'spell_minor_illusion', 'spell_ray_of_frost'], level1: ['spell_magic_missile', 'spell_shield', 'spell_mage_armor', 'spell_burning_hands'] },
      equip: 'Quarterstaff • Dagger • Component pouch • Scholar Pack • Spellbook',
      profs: 'Daggers, Darts, Slings, Quarterstaffs, Light crossbows',
      features: 'Spellcasting, Arcane Recovery, Spellbook'
    }
  },

  // --- Raças ---
  races: {
    human:    { nameKey: 'race_human',    bonus: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 }, speed: '9m', theme: '#B59E54' },
    dwarf:    { nameKey: 'race_dwarf',    bonus: { str: 0, dex: 0, con: 2, int: 0, wis: 0, cha: 0 }, speed: '7,5m', theme: '#7F513E' },
    elf:      { nameKey: 'race_elf',      bonus: { str: 0, dex: 2, con: 0, int: 1, wis: 0, cha: 0 }, speed: '9m', theme: '#7A853B' },
    halfling: { nameKey: 'race_halfling', bonus: { str: 0, dex: 2, con: 0, int: 0, wis: 0, cha: 1 }, speed: '7,5m', theme: '#B59E54' },
    gnome:    { nameKey: 'race_gnome',    bonus: { str: 0, dex: 0, con: 1, int: 2, wis: 0, cha: 0 }, speed: '7,5m', theme: '#51A5C5' },
    half_orc: { nameKey: 'race_half_orc', bonus: { str: 2, dex: 0, con: 1, int: 0, wis: 0, cha: 0 }, speed: '9m', theme: '#E7623E' },
    dragonborn:{ nameKey: 'race_dragonborn', bonus: { str: 2, dex: 0, con: 0, int: 0, wis: 0, cha: 1 }, speed: '9m', theme: '#AB6DAC' },
    tiefling: { nameKey: 'race_tiefling', bonus: { str: 0, dex: 0, con: 0, int: 1, wis: 0, cha: 2 }, speed: '9m', theme: '#AB6DAC' },
    half_elf: { nameKey: 'race_half_elf', bonus: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 2 }, speed: '9m', theme: '#91A1B2' },
    aasimar:  { nameKey: 'race_aasimar',  bonus: { str: 0, dex: 0, con: 0, int: 0, wis: 1, cha: 2 }, speed: '9m', theme: '#B59E54' }
  },

  // --- Antecedentes (proficiências + equipamento inicial) ---
  backgrounds: {
    acolyte:    { nameKey: 'bg_acolyte',    skills: ['insg', 'reli'], coins: { gp: 15, sp: 0 }, desc: 'Sacred call & holy rituals.' },
    criminal:   { nameKey: 'bg_criminal',   skills: ['decp', 'stea'], coins: { gp: 15, sp: 0 }, desc: 'Criminal contacts & thief tools.' },
    folk_hero:  { nameKey: 'bg_folk_hero',  skills: ['anim', 'surv'], coins: { gp: 10, sp: 0 }, desc: 'Folk hero of a village.' },
    hermit:     { nameKey: 'bg_hermit',     skills: ['medi', 'reli'], coins: { gp: 5, sp: 0 }, desc: 'Life of seclusion & discovery.' },
    noble:      { nameKey: 'bg_noble',      skills: ['hist', 'pers'], coins: { gp: 25, sp: 0 }, desc: 'Of noble lineage.' },
    outlander:  { nameKey: 'bg_outlander',  skills: ['athl', 'surv'], coins: { gp: 10, sp: 0 }, desc: 'Raised in the wild.' },
    sage:       { nameKey: 'bg_sage',       skills: ['arca', 'hist'], coins: { gp: 10, sp: 0 }, desc: 'Researcher & scholar.' },
    sailor:     { nameKey: 'bg_sailor',     skills: ['athl', 'perc'], coins: { gp: 10, sp: 0 }, desc: 'Seafarer & navigator.' },
    soldier:    { nameKey: 'bg_soldier',    skills: ['athl', 'inti'], coins: { gp: 10, sp: 0 }, desc: 'Veteran of a military.' },
    urchin:     { nameKey: 'bg_urchin',     skills: ['slei', 'stea'], coins: { gp: 10, sp: 0 }, desc: 'Street survivor.' }
  },

  alignments: ['lg', 'ng', 'cg', 'ln', 'n', 'cn', 'le', 'ne', 'ce'],

  // --- Nomes fantasia por raça ---
  namePools: {
    human:    { first: ['Aldric', 'Branwen', 'Cedric', 'Elara', 'Fenn', 'Gareth', 'Isolde', 'Maren', 'Roland', 'Sable', 'Thorne', 'Vivienne'], last: ['Ashford', 'Blackwood', 'Draven', 'Falken', 'Grey', 'Haven', 'Morrow', 'Sterling', 'Vale', 'Winters'] },
    dwarf:    { first: ['Borin', 'Dagna', 'Grimm', 'Helja', 'Kazad', 'Morga', 'Thrain', 'Ulfgar', 'Varik', 'Ylva'], last: ['Ironfoot', 'Stonehelm', 'Bronzebeard', 'Deepwell', 'Fireforge', 'Oakenshield'] },
    elf:      { first: ['Aelar', 'Elowen', 'Faelind', 'Lios', 'Mira', 'Oran', 'Seril', 'Thalion', 'Virel', 'Yven'], last: ['Starweaver', 'Moonwhisper', 'Goldenleaf', 'Swiftarrow', 'Dawnmere'] },
    halfling: { first: ['Bilbo', 'Cora', 'Dandel', 'Finch', 'Milo', 'Poppy', 'Rosie', 'Tadd', 'Willa'], last: ['Goodbarrel', 'Lightfoot', 'Brandybuck', 'Tumblehome', 'Underhill'] },
    gnome:    { first: ['Bixby', 'Fizzwick', 'Glim', 'Jubal', 'Nackle', 'Pip', 'Tobble', 'Zilly'], last: ['Sprocket', 'Gadget', 'Whistlewig', 'Cogsworth', 'Bramblewick'] },
    half_orc: { first: ['Bruk', 'Dazgar', 'Grumsh', 'Hagra', 'Karg', 'Mog', 'Rolk', 'Sulka', 'Ugga'], last: ['Bloodfang', 'Bonecrusher', 'Ironjaw', 'Skullsplitter', 'Thundertusk'] },
    dragonborn:{ first: ['Arjhan', 'Donaar', 'Heskan', 'Kavir', 'Medrash', 'Naeryx', 'Perr', 'Tarhun', 'Vhagar'], last: ['Auranos', 'Kazimir', 'Minlas', 'Sharamak', 'Tajik'] },
    tiefling: { first: ['Azazel', 'Bellatrix', 'Caelia', 'Damaris', 'Eryx', 'Lilith', 'Malach', 'Nox', 'Seraph', 'Vex'], last: ['Ashvale', 'Darkmoon', 'Hellthorn', 'Nightfall', 'Shadowmend'] },
    half_elf: { first: ['Ayla', 'Cael', 'Darian', 'Elora', 'Fenris', 'Ilena', 'Kael', 'Liora', 'Nadia', 'Sorin'], last: ['Duskweaver', 'Frostborne', 'Nightbrook', 'Silvermoon', 'Stormcaller'] },
    aasimar:  { first: ['Aurelia', 'Celestine', 'Elias', 'Israfel', 'Lucan', 'Nazira', 'Orianna', 'Seraphim', 'Uriel'], last: ['Brightwing', 'Dawnbringer', 'Goldmoon', 'Lightweaver', 'Radiant'] }
  },

  // ===== UTILITÁRIOS =====
  _t(key) {
    return getTranslation(key);
  },

  _pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  rollDice(sides, count = 1) {
    let total = 0;
    for (let i = 0; i < count; i++) total += Math.floor(Math.random() * sides) + 1;
    return total;
  },

  // Rola 4d6 e descarta o menor.
  roll4d6() {
    const rolls = [this.rollDice(6), this.rollDice(6), this.rollDice(6), this.rollDice(6)].sort((a, b) => a - b);
    return rolls[1] + rolls[2] + rolls[3];
  },

  // Gera 6 valores de atributo (4d6 descartando menor).
  rollScores() {
    return [this.roll4d6(), this.roll4d6(), this.roll4d6(), this.roll4d6(), this.roll4d6(), this.roll4d6()];
  },

  _randomName(race) {
    const pool = this.namePools[race] || this.namePools.human;
    const first = this._pick(pool.first);
    const last = this._pick(pool.last);
    return Math.random() < 0.5 ? first : `${first} ${last}`;
  },

  _randomRace() {
    return this._pick(Object.keys(this.races));
  },

  _randomClass() {
    return this._pick(Object.keys(this.classes));
  },

  _randomAlignment() {
    return this._pick(this.alignments);
  },

  _randomBackground() {
    return this._pick(Object.keys(this.backgrounds));
  },

  _randomTheme() {
    const themes = ['#b8860b', '#E7623E', '#AB6DAC', '#91A1B2', '#7A853B', '#7F513E', '#51A5C5', '#B59E54'];
    return this._pick(themes);
  },

  mod(score) {
    return Math.floor((score - 10) / 2);
  },

  // ===== GERAÇÃO INTELIGENTE =====
  // Distribui os valores rolados conforme a prioridade de atributos da classe.
  assignScores(scores, priority) {
    const sorted = scores.slice().sort((a, b) => b - a);
    const result = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
    const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

    priority.forEach((ab, i) => {
      if (sorted[i] !== undefined) result[ab] = sorted[i];
    });

    const leftover = abilities.filter(ab => priority.indexOf(ab) === -1);
    leftover.forEach((ab, i) => {
      result[ab] = sorted[priority.length + i] !== undefined ? sorted[priority.length + i] : 10;
    });

    return result;
  },

  _profBonus(level) {
    return 2 + Math.floor((parseInt(level) - 1) / 4);
  },

  // ===== MONTAGEM DA FICHA =====
  build(config) {
    const cls = this.classes[config.charClass] || this.classes.fighter;
    const race = this.races[config.species] || this.races.human;
    const bg = this.backgrounds[config.background] || this.backgrounds.soldier;
    const level = parseInt(config.level) || 1;

    // 1) Atributos base (4d6 ou array padrão)
    let baseScores;
    if (config.method === 'standard') {
      const std = [15, 14, 13, 12, 10, 8];
      baseScores = this.assignScores(std, cls.priority);
    } else {
      baseScores = this.assignScores(config.rolledScores || this.rollScores(), cls.priority);
    }

    // 2) Bônus raciais
    const scores = {};
    Object.keys(baseScores).forEach(ab => {
      scores[ab] = baseScores[ab] + (race.bonus[ab] || 0);
    });

    // 3) Valores derivados
    const prof = this._profBonus(level);
    const conMod = this.mod(scores.con);
    const dexMod = this.mod(scores.dex);

    const maxHp = cls.hitDie + conMod + (level - 1) * (Math.ceil(cls.hitDie / 2) + 1 + conMod);

    // CA conforme tipo de armadura da classe
    let ac = cls.armor.base;
    if (cls.armor.dex) ac += dexMod;
    if (cls.armor.con) ac += conMod;
    if (cls.armor.wis) ac += this.mod(scores.wis);

    // Dados de vida
    const hitDiceTotal = `${level}d${cls.hitDie}`;

    // Ataque principal (bônus = mod da habilidade + proficiência)
    const atkAbility = cls.weapon.ability || 'str';
    const atkBonus = this.mod(scores[atkAbility]) + prof;
    const atkSign = atkBonus >= 0 ? '+' : '';
    const dmgBonus = this.mod(scores[atkAbility]);
    const dmgSign = dmgBonus >= 0 ? '+' : '';
    const attacks = `${this._t(cls.weapon.nameKey)} | ${atkSign}${atkBonus} | ${cls.weapon.dice}${dmgSign}${dmgBonus}`;

    // Proficiências (classe + antecedente + raça)
    const profSkills = [...cls.skills, ...bg.skills];
    const uniqueSkills = [...new Set(profSkills)];

    // Saves: classe proficiente = mod + prof
    const saves = {};
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(ab => {
      const proficient = cls.saves.includes(ab);
      const val = this.mod(scores[ab]) + (proficient ? prof : 0);
      saves[ab] = { proficient, mod: (val >= 0 ? '+' : '') + val };
    });

    // Perícias
    const skills = {};
    const skillAbility = {
      acro: 'dex', anim: 'wis', arca: 'int', athl: 'str', perf: 'cha',
      decp: 'cha', stea: 'dex', hist: 'int', inti: 'cha', insg: 'wis',
      invs: 'int', medi: 'wis', natu: 'int', perc: 'wis', pers: 'cha',
      slei: 'dex', reli: 'int', surv: 'wis'
    };
    Object.keys(skillAbility).forEach(code => {
      const ab = skillAbility[code];
      const proficient = uniqueSkills.includes(code);
      const val = this.mod(scores[ab]) + (proficient ? prof : 0);
      skills[code] = { proficient, mod: (val >= 0 ? '+' : '') + val };
    });

    // Magias
    const spells = cls.spells;
    const spellAbilityMod = spells.ability ? this.mod(scores[spells.ability]) : 0;
    const spellSaveDC = spells.ability ? 8 + prof + spellAbilityMod : '';
    const spellAttackBonus = spells.ability ? (spellAbilityMod + prof >= 0 ? '+' : '') + (spellAbilityMod + prof) : '';

    // Coins iniciais (classe + antecedente)
    const gp = (cls.coins?.gp || 0) + (bg.coins?.gp || 0);
    const coins = { cp: 0, sp: (cls.coins?.sp || 0), ep: 0, gp, pp: 0 };

    const charName = config.name && config.name.trim() ? config.name.trim() : this._randomName(config.species);

    return {
      id: Date.now().toString(),
      theme_color: config.theme,
      charName,
      level,
      charClass: this._t(cls.nameKey),
      subclass: '',
      species: this._t(race.nameKey),
      background: this._t(bg.nameKey),
      alignment: config.alignment ? this._t('align_' + config.alignment) : this._t('align_' + this._randomAlignment()),

      str_score: scores.str, dex_score: scores.dex, con_score: scores.con,
      int_score: scores.int, wis_score: scores.wis, cha_score: scores.cha,

      inspiration: false,
      profBonus: (prof >= 0 ? '+' : '') + prof,
      passivePerception: 10 + this.mod(scores.wis),

      save_str_prof: saves.str.proficient, save_str_mod: saves.str.mod,
      save_dex_prof: saves.dex.proficient, save_dex_mod: saves.dex.mod,
      save_con_prof: saves.con.proficient, save_con_mod: saves.con.mod,
      save_int_prof: saves.int.proficient, save_int_mod: saves.int.mod,
      save_wis_prof: saves.wis.proficient, save_wis_mod: saves.wis.mod,
      save_cha_prof: saves.cha.proficient, save_cha_mod: saves.cha.mod,

      skill_acro_prof: skills.acro.proficient, skill_acro_mod: skills.acro.mod,
      skill_anim_prof: skills.anim.proficient, skill_anim_mod: skills.anim.mod,
      skill_arca_prof: skills.arca.proficient, skill_arca_mod: skills.arca.mod,
      skill_athl_prof: skills.athl.proficient, skill_athl_mod: skills.athl.mod,
      skill_perf_prof: skills.perf.proficient, skill_perf_mod: skills.perf.mod,
      skill_decp_prof: skills.decp.proficient, skill_decp_mod: skills.decp.mod,
      skill_stea_prof: skills.stea.proficient, skill_stea_mod: skills.stea.mod,
      skill_hist_prof: skills.hist.proficient, skill_hist_mod: skills.hist.mod,
      skill_inti_prof: skills.inti.proficient, skill_inti_mod: skills.inti.mod,
      skill_insg_prof: skills.insg.proficient, skill_insg_mod: skills.insg.mod,
      skill_invs_prof: skills.invs.proficient, skill_invs_mod: skills.invs.mod,
      skill_medi_prof: skills.medi.proficient, skill_medi_mod: skills.medi.mod,
      skill_natu_prof: skills.natu.proficient, skill_natu_mod: skills.natu.mod,
      skill_perc_prof: skills.perc.proficient, skill_perc_mod: skills.perc.mod,
      skill_pers_prof: skills.pers.proficient, skill_pers_mod: skills.pers.mod,
      skill_slei_prof: skills.slei.proficient, skill_slei_mod: skills.slei.mod,
      skill_reli_prof: skills.reli.proficient, skill_reli_mod: skills.reli.mod,
      skill_surv_prof: skills.surv.proficient, skill_surv_mod: skills.surv.mod,

      ac,
      initiative: (dexMod >= 0 ? '+' : '') + dexMod,
      speed: race.speed || cls.speed || '9m',
      hpMax: maxHp,
      hpCurrent: maxHp,
      hpTemp: 0,
      hitDiceTotal,

      death_save_success_1: false, death_save_success_2: false, death_save_success_3: false,
      death_save_fail_1: false, death_save_fail_2: false, death_save_fail_3: false,

      attacks,
      equipment: this._t(cls.equipKey) + `\n• ${this._t(bg.descKey)}`,
      cp: coins.cp, sp: coins.sp, ep: coins.ep, gp: coins.gp, pp: coins.pp,

      proficiencies: `${this._t(cls.profsKey)}\n• ${this._t(bg.nameKey)} ${this._t('gen_skills_tools')}`,
      featuresTraits: this._t(cls.featuresKey),
      spellcastingAbility: spells.ability ? spells.ability.toUpperCase() : '',
      spellSaveDC,
      spellAttackBonus,

      spells_cantrips: spells.cantrips.map(s => this._t(s)).join('\n'),
      spells_lvl1: spells.level1.map(s => this._t(s)).join('\n'),
      slots_lvl1_total: spells.level1.length ? 2 : '',
      slots_lvl1_used: '',

      backstory: this._t('gen_backstory_template').replace('{race}', this._t('race_' + config.species).toLowerCase()).replace('{class}', this._t(cls.nameKey).toLowerCase()).replace('{background}', this._t(bg.nameKey).toLowerCase())
    };
  },

  // Cria a ficha gerada e abre o editor.
  createFromBuild(build) {
    characters.push(build);
    saveToStorage();
    loadCharacter(build.id);
  },

  // ===== LÓGICA DA UI =====

  currentClass() {
    return this.classes[this.state.selectedClass];
  },

  openModal() {
    const overlay = document.getElementById('generator-overlay');
    overlay.classList.remove('hidden');
    this.render();
  },

  closeModal() {
    const overlay = document.getElementById('generator-overlay');
    overlay.classList.add('hidden');
  },

  setMode(mode) {
    this.state.mode = mode;
    document.querySelectorAll('.gen-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    document.getElementById('gen-classes-section').classList.toggle('hidden', mode === 'random');
    if (mode === 'random') {
      this.state.selectedClass = this._randomClass();
      this.state.selectedRace = this._randomRace();
    }
    this.render();
  },

  setMethod(method) {
    this.state.method = method;
    document.querySelectorAll('.gen-method-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.method === method);
    });
    this.rollPreview();
  },

  selectClass(classId) {
    this.state.selectedClass = classId;
    const cls = this.classes[classId];
    if (cls) this.state.theme = cls.theme || this.state.theme;
    document.querySelectorAll('.gen-class-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.class === classId);
    });
    this.rollPreview();
  },

  selectRace(raceId) {
    this.state.selectedRace = raceId;
    const race = this.races[raceId];
    if (race) this.state.theme = race.theme || this.state.theme;
    this.render();
  },

  setLevel(level) {
    this.state.level = parseInt(level) || 1;
    this.rollPreview();
  },

  randomName() {
    const race = this.state.selectedRace === 'random' ? this._randomRace() : this.state.selectedRace;
    document.getElementById('gen-name-input').value = this._randomName(race);
  },

  rollPreview() {
    let scores;
    if (this.state.method === 'standard') {
      scores = [15, 14, 13, 12, 10, 8];
    } else {
      scores = this.rollScores();
    }
    this.state.rolledScores = scores;
    const container = document.getElementById('gen-preview-scores');
    if (!container) return;

    container.innerHTML = '';
    const abilityNames = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    abilityNames.forEach((ab, i) => {
      const cell = document.createElement('div');
      cell.className = 'gen-score-cell';
      cell.innerHTML = `<span class="gen-score-ab">${this._t('attr_' + ab)}</span><strong>${scores[i]}</strong>`;
      container.appendChild(cell);
    });

    const total = scores.reduce((a, b) => a + b, 0);
    const totalEl = document.getElementById('gen-preview-total');
    if (totalEl) totalEl.textContent = this._t('gen_attr_total') + ': ' + total;
  },

  // Gera a ficha conforme o estado atual da UI.
  generate() {
    const nameInput = document.getElementById('gen-name-input');
    let name = nameInput ? nameInput.value : '';

    let species = this.state.selectedRace;
    if (species === 'random') species = this._randomRace();

    let charClass = this.state.selectedClass;
    let bg = this.state.background;
    let align = this.state.alignment;

    if (this.state.mode === 'random') {
      charClass = this._randomClass();
      if (bg === 'random') bg = this._randomBackground();
      if (align === 'random') align = this._randomAlignment();
      if (!name.trim()) name = this._randomName(species);
    }

    if (bg === 'random') bg = this._randomBackground();
    if (align === 'random') align = this._randomAlignment();

    const config = {
      name: name || this._randomName(species),
      charClass: charClass,
      species: species,
      level: this.state.level,
      method: this.state.method,
      background: bg,
      alignment: align,
      theme: this.classes[charClass] ? this.classes[charClass].theme : this.state.theme,
      rolledScores: this.state.method === 'roll' && this.state.rolledScores ? this.state.rolledScores : null
    };

    const build = this.build(config);
    this.closeModal();
    this.createFromBuild(build);
    showAlert(this._t('gen_generated'), {
      title: this._t('modal_title_success'),
      icon: 'military_tech',
      iconClass: 'modal-icon-success'
    });
  },

  // ===== RENDER =====
  render() {
    const raceSelect = document.getElementById('gen-race-select');
    if (raceSelect) {
      raceSelect.innerHTML = '';
      const optRandom = document.createElement('option');
      optRandom.value = 'random';
      optRandom.textContent = this._t('gen_race_random') + ' 🎲';
      raceSelect.appendChild(optRandom);
      Object.keys(this.races).forEach(raceId => {
        const opt = document.createElement('option');
        opt.value = raceId;
        opt.textContent = this._t(this.races[raceId].nameKey);
        raceSelect.appendChild(opt);
      });
      raceSelect.value = this.state.selectedRace;
    }

    const levelSelect = document.getElementById('gen-level-select');
    if (levelSelect) {
      levelSelect.value = String(this.state.level);
    }

    this.renderClassCards();
    this.rollPreview();
  },

  renderClassCards() {
    const grid = document.getElementById('gen-class-grid');
    if (!grid) return;
    grid.innerHTML = '';

    Object.keys(this.classes).forEach(classId => {
      const cls = this.classes[classId];
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'gen-class-card' + (classId === this.state.selectedClass ? ' selected' : '');
      card.dataset.class = classId;
      card.style.setProperty('--gen-color', cls.theme || '#b8860b');
      card.innerHTML = `
        <span class="gen-class-name">${this._t(cls.nameKey)}</span>
        <span class="gen-class-die">d${cls.hitDie}</span>
      `;
      card.onclick = () => this.selectClass(classId);
      grid.appendChild(card);
    });
  },

  init() {
    // Wire up static elements
    const methodButtons = document.querySelectorAll('.gen-method-btn');
    methodButtons.forEach(btn => {
      btn.onclick = () => this.setMethod(btn.dataset.method);
    });

    const modeButtons = document.querySelectorAll('.gen-mode-btn');
    modeButtons.forEach(btn => {
      btn.onclick = () => this.setMode(btn.dataset.mode);
    });

    const raceSelect = document.getElementById('gen-race-select');
    if (raceSelect) raceSelect.onchange = (e) => this.selectRace(e.target.value);

    const levelSelect = document.getElementById('gen-level-select');
    if (levelSelect) levelSelect.onchange = (e) => this.setLevel(e.target.value);

    const randomNameBtn = document.getElementById('gen-random-name-btn');
    if (randomNameBtn) randomNameBtn.onclick = () => this.randomName();

    const generateBtn = document.getElementById('gen-generate-btn');
    if (generateBtn) generateBtn.onclick = () => this.generate();

    const cancelBtn = document.getElementById('gen-cancel-btn');
    if (cancelBtn) cancelBtn.onclick = () => this.closeModal();
  }
};

Generator.init();
