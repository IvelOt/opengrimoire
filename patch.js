const fs = require('fs');

const pt = {
  // Armor Descriptions
  'armor_unarmored_con': 'Sem Armadura (10 + DES + CON)',
  'armor_unarmored_wis': 'Sem Armadura (10 + DES + SAB)',
  'armor_leather': 'Couro (11 + DES)',
  'armor_chain_shirt': 'Camisão de Malha + Escudo (16)',
  'armor_chain_mail': 'Cota de Malha (16)',
  'armor_chain_mail_shield': 'Cota de Malha + Escudo (18)',
  'armor_none': 'Nenhuma (10 + DES)',

  // Weapons
  'wpn_greataxe': 'Machado Grande',
  'wpn_rapier': 'Rapieira',
  'wpn_warhammer': 'Martelo de Guerra',
  'wpn_scimitar': 'Cimitarra',
  'wpn_longsword': 'Espada Longa',
  'wpn_quarterstaff': 'Bordão',
  'wpn_longbow': 'Arco Longo',
  'wpn_dagger': 'Adaga',

  // Equipment
  'eq_barbarian': 'Machado Grande • 4 machadinhas • Pacote de Aventureiro',
  'eq_bard': 'Rapieira • Armadura de couro • Adaga • Pacote de Artista • Instrumento',
  'eq_cleric': 'Martelo de Guerra • Camisão de malha • Escudo • Símbolo Sagrado • Pacote de Sacerdote',
  'eq_druid': 'Escudo de madeira • Cimitarra • Armadura de couro • Pacote de Aventureiro',
  'eq_fighter': 'Espada Longa • Escudo • Cota de malha • Besta leve • Pacote de Explorador',
  'eq_monk': 'Espada curta • Bordão • Pacote de Explorador',
  'eq_paladin': 'Espada Longa • Escudo • Cota de malha • Símbolo Sagrado • Pacote de Sacerdote',
  'eq_ranger': 'Arco Longo • 20 flechas • Armadura de couro • Espada curta • Pacote de Aventureiro',
  'eq_rogue': 'Rapieira • Arco curto • 20 flechas • Armadura de couro • Ferramentas de Ladrão • Pacote de Arrombador',
  'eq_sorcerer': 'Besta leve • 20 virotes • Adaga • Bolsa de componentes • Pacote de Explorador',
  'eq_warlock': 'Besta leve • 20 virotes • Armadura de couro • Adaga • Foco arcano • Pacote de Estudioso',
  'eq_wizard': 'Bordão • Adaga • Bolsa de componentes • Pacote de Estudioso • Livro de Magias',

  // Proficiencies
  'prof_barbarian': 'Armaduras Leves e Médias, Escudos, Armas Simples e Marciais',
  'prof_bard': 'Armaduras Leves, Armas Simples, Bestas de mão, Espadas longas, Rapieiras, Instrumentos',
  'prof_cleric': 'Armaduras Leves e Médias, Escudos, Armas Simples',
  'prof_druid': 'Armaduras Leves e Médias, Escudos, Armas Simples, Kit de Herbalismo',
  'prof_fighter': 'Todas as armaduras, Escudos, Armas Simples e Marciais',
  'prof_monk': 'Armas Simples, Espadas curtas, Escolha 1 ferramenta de artesão',
  'prof_paladin': 'Todas as armaduras, Escudos, Armas Simples e Marciais',
  'prof_ranger': 'Armaduras Leves e Médias, Escudos, Armas Simples e Marciais',
  'prof_rogue': 'Armaduras Leves, Armas Simples, Bestas de mão, Espadas longas, Rapieiras, Ferramentas de Ladrão',
  'prof_sorcerer': 'Adagas, Dardos, Fundas, Bordões, Bestas leves',
  'prof_warlock': 'Armaduras Leves, Armas Simples',
  'prof_wizard': 'Adagas, Dardos, Fundas, Bordões, Bestas leves',

  // Features
  'feat_barbarian': 'Fúria (2/dia), Defesa sem Armadura, Sentido de Perigo',
  'feat_bard': 'Inspiração de Bardo (d6), Conjuração, Conjuração de Ritual',
  'feat_cleric': 'Conjuração, Domínio Divino (Vida), Canalizar Divindade (1/descanso)',
  'feat_druid': 'Druídico, Conjuração, Forma Selvagem (2/descanso)',
  'feat_fighter': 'Estilo de Luta (Defesa), Retomar o Fôlego, Surto de Ação',
  'feat_monk': 'Defesa sem Armadura, Artes Marciais (1d4), Ki (2 pontos), Rajada de Golpes',
  'feat_paladin': 'Sentido Divino, Cura pelas Mãos (5 PV), Estilo de Luta, Destruição Divina',
  'feat_ranger': 'Inimigo Favorito, Explorador Natural, Estilo de Luta (Arquearia)',
  'feat_rogue': 'Especialização, Ataque Furtivo (1d6), Gíria de Ladrão, Ação Astuta',
  'feat_sorcerer': 'Conjuração, Origem Feiticeira (Linhagem Dracônica), Fonte de Magia (2 pontos)',
  'feat_warlock': 'Patrono Extra-Terreno (O Corruptor), Magia de Pacto (1 espaço), Invocação Mística',
  'feat_wizard': 'Conjuração, Recuperação Arcana, Livro de Magias',

  // Spells (Cantrips and Level 1)
  'spell_vicious_mockery': 'Zombaria Viciosa',
  'spell_prestidigitation': 'Prestidigitação',
  'spell_healing_word': 'Palavra Curativa',
  'spell_thunderwave': 'Onda de Trovejante',
  'spell_charm_person': 'Enfeitiçar Pessoa',
  'spell_light': 'Luz',
  'spell_sacred_flame': 'Chama Sagrada',
  'spell_guidance': 'Orientação',
  'spell_cure_wounds': 'Curar Ferimentos',
  'spell_bless': 'Bênção',
  'spell_guiding_bolt': 'Raio Guiador',
  'spell_druidcraft': 'Druidismo',
  'spell_produce_flame': 'Produzir Chama',
  'spell_shillelagh': 'Bordão Mágico',
  'spell_entangle': 'Constrição',
  'spell_faerie_fire': 'Fogo das Fadas',
  'spell_lay_on_hands': 'Cura pelas Mãos',
  'spell_thunderous_smite': 'Destruição Trovejante',
  'spell_hunters_mark': 'Marca do Caçador',
  'spell_speak_with_animals': 'Falar com Animais',
  'spell_fire_bolt': 'Raio de Fogo',
  'spell_minor_illusion': 'Ilusão Menor',
  'spell_ray_of_frost': 'Raio de Gelo',
  'spell_magic_missile': 'Mísseis Mágicos',
  'spell_shield': 'Escudo Arcano',
  'spell_sleep': 'Sono',
  'spell_eldritch_blast': 'Rajada Mística',
  'spell_mage_hand': 'Mãos Mágicas',
  'spell_chill_touch': 'Toque Arrepiante',
  'spell_hex': 'Desgraça',
  'spell_witch_bolt': 'Raio Bruxo',
  'spell_arms_of_hadar': 'Braços de Hadar',
  'spell_mage_armor': 'Armadura Arcana',
  'spell_burning_hands': 'Mãos Flamejantes',

  // Background Descriptions
  'bg_desc_acolyte': 'Chamado sagrado e rituais sagrados.',
  'bg_desc_criminal': 'Contatos criminosos e ferramentas de ladrão.',
  'bg_desc_folk_hero': 'Herói do povo de uma vila.',
  'bg_desc_hermit': 'Vida de isolamento e descoberta.',
  'bg_desc_noble': 'De linhagem nobre.',
  'bg_desc_outlander': 'Criado nos ermos.',
  'bg_desc_sage': 'Pesquisador e acadêmico.',
  'bg_desc_sailor': 'Marinheiro e navegador.',
  'bg_desc_soldier': 'Veterano de um exército.',
  'bg_desc_urchin': 'Sobrevivente das ruas.',
  
  // Extra strings
  'gen_skills_tools': 'perícias e ferramentas',
  'gen_backstory_template': 'Um {race} {class} com origem de {background}.'
};

const en = {
  // Armor Descriptions
  'armor_unarmored_con': 'Unarmored (10 + DEX + CON)',
  'armor_unarmored_wis': 'Unarmored (10 + DEX + WIS)',
  'armor_leather': 'Leather (11 + DEX)',
  'armor_chain_shirt': 'Chain Shirt + Shield (16)',
  'armor_chain_mail': 'Chain mail (16)',
  'armor_chain_mail_shield': 'Chain mail + Shield (18)',
  'armor_none': 'None (10 + DEX)',

  // Weapons
  'wpn_greataxe': 'Greataxe',
  'wpn_rapier': 'Rapier',
  'wpn_warhammer': 'Warhammer',
  'wpn_scimitar': 'Scimitar',
  'wpn_longsword': 'Longsword',
  'wpn_quarterstaff': 'Quarterstaff',
  'wpn_longbow': 'Longbow',
  'wpn_dagger': 'Dagger',

  // Equipment
  'eq_barbarian': 'Greataxe • 4 handaxes • Explorer Pack',
  'eq_bard': 'Rapier • Leather armor • Dagger • Entertainer Pack • Instrument',
  'eq_cleric': 'Warhammer • Chain Shirt • Shield • Holy Symbol • Priest Pack',
  'eq_druid': 'Wooden shield • Scimitar • Leather armor • Explorer Pack',
  'eq_fighter': 'Longsword • Shield • Chain mail • Light crossbow • Dungeoneer Pack',
  'eq_monk': 'Shortsword • Quarterstaff • Dungeoneer Pack',
  'eq_paladin': 'Longsword • Shield • Chain mail • Holy Symbol • Priest Pack',
  'eq_ranger': 'Longbow • 20 arrows • Leather armor • Shortsword • Explorer Pack',
  'eq_rogue': 'Rapier • Shortbow • 20 arrows • Leather armor • Thieves\' Tools • Burglar Pack',
  'eq_sorcerer': 'Light crossbow • 20 bolts • Dagger • Component pouch • Dungeoneer Pack',
  'eq_warlock': 'Light crossbow • 20 bolts • Leather armor • Dagger • Arcane focus • Scholar Pack',
  'eq_wizard': 'Quarterstaff • Dagger • Component pouch • Scholar Pack • Spellbook',

  // Proficiencies
  'prof_barbarian': 'Light & Medium armor, Shields, Simple & Martial weapons',
  'prof_bard': 'Light armor, Simple weapons, Hand crossbows, Longswords, Rapiers, Instruments',
  'prof_cleric': 'Light & Medium armor, Shields, Simple weapons',
  'prof_druid': 'Light & Medium armor, Shields, Simple weapons, Herbalism kit',
  'prof_fighter': 'All armor, Shields, Simple & Martial weapons',
  'prof_monk': 'Simple weapons, Shortswords, Choose 1 artisan tool',
  'prof_paladin': 'All armor, Shields, Simple & Martial weapons',
  'prof_ranger': 'Light & Medium armor, Shields, Simple & Martial weapons',
  'prof_rogue': 'Light armor, Simple weapons, Hand crossbows, Longswords, Rapiers, Thieves\' tools',
  'prof_sorcerer': 'Daggers, Darts, Slings, Quarterstaffs, Light crossbows',
  'prof_warlock': 'Light armor, Simple weapons',
  'prof_wizard': 'Daggers, Darts, Slings, Quarterstaffs, Light crossbows',

  // Features
  'feat_barbarian': 'Rage (2/day), Unarmored Defense, Danger Sense',
  'feat_bard': 'Bardic Inspiration (d6), Spellcasting, Ritual Casting',
  'feat_cleric': 'Spellcasting, Divine Domain (Life), Channel Divinity (1/rest)',
  'feat_druid': 'Druidic, Spellcasting, Wild Shape (2/rest)',
  'feat_fighter': 'Fighting Style (Defense), Second Wind, Action Surge',
  'feat_monk': 'Unarmored Defense, Martial Arts (1d4), Ki (2 points), Flurry of Blows',
  'feat_paladin': 'Divine Sense, Lay on Hands (5 HP), Fighting Style, Divine Smite',
  'feat_ranger': 'Favored Enemy, Natural Explorer, Fighting Style (Archery)',
  'feat_rogue': 'Expertise, Sneak Attack (1d6), Thieves\' Cant, Cunning Action',
  'feat_sorcerer': 'Spellcasting, Sorcerous Origin (Draconic Bloodline), Font of Magic (2 points)',
  'feat_warlock': 'Otherworldly Patron (The Fiend), Pact Magic (1 slot), Eldritch Invocation',
  'feat_wizard': 'Spellcasting, Arcane Recovery, Spellbook',

  // Spells (Cantrips and Level 1)
  'spell_vicious_mockery': 'Vicious Mockery',
  'spell_prestidigitation': 'Prestidigitation',
  'spell_healing_word': 'Healing Word',
  'spell_thunderwave': 'Thunderwave',
  'spell_charm_person': 'Charm Person',
  'spell_light': 'Light',
  'spell_sacred_flame': 'Sacred Flame',
  'spell_guidance': 'Guidance',
  'spell_cure_wounds': 'Cure Wounds',
  'spell_bless': 'Bless',
  'spell_guiding_bolt': 'Guiding Bolt',
  'spell_druidcraft': 'Druidcraft',
  'spell_produce_flame': 'Produce Flame',
  'spell_shillelagh': 'Shillelagh',
  'spell_entangle': 'Entangle',
  'spell_faerie_fire': 'Faerie Fire',
  'spell_lay_on_hands': 'Lay on Hands',
  'spell_thunderous_smite': 'Thunderous Smite',
  'spell_hunters_mark': 'Hunter\'s Mark',
  'spell_speak_with_animals': 'Speak with Animals',
  'spell_fire_bolt': 'Fire Bolt',
  'spell_minor_illusion': 'Minor Illusion',
  'spell_ray_of_frost': 'Ray of Frost',
  'spell_magic_missile': 'Magic Missile',
  'spell_shield': 'Shield',
  'spell_sleep': 'Sleep',
  'spell_eldritch_blast': 'Eldritch Blast',
  'spell_mage_hand': 'Mage Hand',
  'spell_chill_touch': 'Chill Touch',
  'spell_hex': 'Hex',
  'spell_witch_bolt': 'Witch Bolt',
  'spell_arms_of_hadar': 'Arms of Hadar',
  'spell_mage_armor': 'Mage Armor',
  'spell_burning_hands': 'Burning Hands',

  // Background Descriptions
  'bg_desc_acolyte': 'Sacred call & holy rituals.',
  'bg_desc_criminal': 'Criminal contacts & thief tools.',
  'bg_desc_folk_hero': 'Folk hero of a village.',
  'bg_desc_hermit': 'Life of seclusion & discovery.',
  'bg_desc_noble': 'Of noble lineage.',
  'bg_desc_outlander': 'Raised in the wild.',
  'bg_desc_sage': 'Researcher & scholar.',
  'bg_desc_sailor': 'Seafarer & navigator.',
  'bg_desc_soldier': 'Veteran of a military.',
  'bg_desc_urchin': 'Street survivor.',

  // Extra strings
  'gen_skills_tools': 'skills & tools',
  'gen_backstory_template': 'A {race} {class} with {background} background.'
};

let content = fs.readFileSync('language.js', 'utf8');

let ptStr = Object.keys(pt).map(k => `    '${k}': '${pt[k]}',`).join('\n');
let enStr = Object.keys(en).map(k => `    '${k}': '${en[k].replace(/'/g, "\\'")}',`).join('\n');

content = content.replace(
  "'pt-BR': {",
  "'pt-BR': {\n" + ptStr
);
content = content.replace(
  "'en-US': {",
  "'en-US': {\n" + enStr
);

fs.writeFileSync('language.js', content, 'utf8');

// Now patch generator.js

let gen = fs.readFileSync('generator.js', 'utf8');

// Classes patch
gen = gen.replace(/armor: \{ type: 'unarmored', base: 10, dex: true, con: true, desc: '.*?' \}/g, "armor: { type: 'unarmored', base: 10, dex: true, con: true, descKey: 'armor_unarmored_con' }");
gen = gen.replace(/armor: \{ type: 'leather', base: 11, dex: true, desc: '.*?' \}/g, "armor: { type: 'leather', base: 11, dex: true, descKey: 'armor_leather' }");
gen = gen.replace(/armor: \{ type: 'chain', base: 16, dex: false, desc: 'Chain Shirt.*?' \}/g, "armor: { type: 'chain', base: 16, dex: false, descKey: 'armor_chain_shirt' }");
gen = gen.replace(/armor: \{ type: 'chain', base: 16, dex: false, desc: 'Chain mail \(16\)' \}/g, "armor: { type: 'chain', base: 16, dex: false, descKey: 'armor_chain_mail' }");
gen = gen.replace(/armor: \{ type: 'unarmored', base: 10, dex: true, wis: true, desc: '.*?' \}/g, "armor: { type: 'unarmored', base: 10, dex: true, wis: true, descKey: 'armor_unarmored_wis' }");
gen = gen.replace(/armor: \{ type: 'chain', base: 18, dex: false, desc: '.*?' \}/g, "armor: { type: 'chain', base: 18, dex: false, descKey: 'armor_chain_mail_shield' }");
gen = gen.replace(/armor: \{ type: 'none', base: 10, dex: true, desc: '.*?' \}/g, "armor: { type: 'none', base: 10, dex: true, descKey: 'armor_none' }");

const wpns = {
  'Greataxe': 'wpn_greataxe',
  'Rapier': 'wpn_rapier',
  'Warhammer': 'wpn_warhammer',
  'Scimitar': 'wpn_scimitar',
  'Longsword': 'wpn_longsword',
  'Quarterstaff': 'wpn_quarterstaff',
  'Longbow': 'wpn_longbow',
  'Dagger': 'wpn_dagger'
};
for (const w in wpns) {
  gen = gen.replace(new RegExp(`weapon: \\{ name: '${w}',`, 'g'), `weapon: { nameKey: '${wpns[w]}',`);
}

const clsMap = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
for (const cls of clsMap) {
  gen = gen.replace(new RegExp(`    ${cls}: \\{[\\s\\S]*?\\},`, 'g'), match => {
    return match
      .replace(/equip: '.*?'/, `equipKey: 'eq_${cls}'`)
      .replace(/profs: '.*?'/, `profsKey: 'prof_${cls}'`)
      .replace(/features: '.*?'/, `featuresKey: 'feat_${cls}'`);
  });
}

// Map spells to keys inside cantrips and level1
const spellKeys = {
  'Vicious Mockery': 'spell_vicious_mockery',
  'Prestidigitation': 'spell_prestidigitation',
  'Healing Word': 'spell_healing_word',
  'Thunderwave': 'spell_thunderwave',
  'Charm Person': 'spell_charm_person',
  'Light': 'spell_light',
  'Sacred Flame': 'spell_sacred_flame',
  'Guidance': 'spell_guidance',
  'Cure Wounds': 'spell_cure_wounds',
  'Bless': 'spell_bless',
  'Guiding Bolt': 'spell_guiding_bolt',
  'Druidcraft': 'spell_druidcraft',
  'Produce Flame': 'spell_produce_flame',
  'Shillelagh': 'spell_shillelagh',
  'Entangle': 'spell_entangle',
  'Faerie Fire': 'spell_faerie_fire',
  'Lay on Hands': 'spell_lay_on_hands',
  'Thunderous Smite': 'spell_thunderous_smite',
  'Hunter\'s Mark': 'spell_hunters_mark',
  'Speak with Animals': 'spell_speak_with_animals',
  'Fire Bolt': 'spell_fire_bolt',
  'Minor Illusion': 'spell_minor_illusion',
  'Ray of Frost': 'spell_ray_of_frost',
  'Magic Missile': 'spell_magic_missile',
  'Shield': 'spell_shield',
  'Sleep': 'spell_sleep',
  'Eldritch Blast': 'spell_eldritch_blast',
  'Mage Hand': 'spell_mage_hand',
  'Chill Touch': 'spell_chill_touch',
  'Hex': 'spell_hex',
  'Witch Bolt': 'spell_witch_bolt',
  'Arms of Hadar': 'spell_arms_of_hadar',
  'Mage Armor': 'spell_mage_armor',
  'Burning Hands': 'spell_burning_hands'
};
for (const s in spellKeys) {
  gen = gen.replace(new RegExp(`'${s.replace(/'/g, "\\'")}'`, 'g'), `'${spellKeys[s]}'`);
}

// Backgrounds patch
const bgMap = ['acolyte', 'criminal', 'folk_hero', 'hermit', 'noble', 'outlander', 'sage', 'sailor', 'soldier', 'urchin'];
for (const bg of bgMap) {
  gen = gen.replace(new RegExp(`    ${bg}: \\{[\\s\\S]*?\\},`, 'g'), match => {
    return match.replace(/desc: '.*?'/, `descKey: 'bg_desc_${bg}'`);
  });
}

// Make build logic use keys
gen = gen.replace(/const attacks = \`\$\{cls\.weapon\.name\} /g, "const attacks = `${this._t(cls.weapon.nameKey)} ");
gen = gen.replace(/equipment: cls\.equip \+ \`\\n• \$\{bg\.desc\}\`,/g, "equipment: this._t(cls.equipKey) + `\\n• ${this._t(bg.descKey)}`,");
gen = gen.replace(/proficiencies: \`\$\{cls\.profs\}\\n• \$\{bg\.nameKey\} skills \& tools\`,/g, "proficiencies: `${this._t(cls.profsKey)}\\n• ${this._t(bg.nameKey)} ${this._t('gen_skills_tools')}`,");
gen = gen.replace(/featuresTraits: cls\.features,/g, "featuresTraits: this._t(cls.featuresKey),");
gen = gen.replace(/spells_cantrips: spells\.cantrips\.join\('\\n'\),/g, "spells_cantrips: spells.cantrips.map(s => this._t(s)).join('\\n'),");
gen = gen.replace(/spells_lvl1: spells\.level1\.join\('\\n'\),/g, "spells_lvl1: spells.level1.map(s => this._t(s)).join('\\n'),");
gen = gen.replace(/backstory: \`A \$\{this\._t\(cls\.nameKey\)\.toLowerCase\(\)\} \$\{this\._t\('race_' \+ config\.species\)\.toLowerCase\(\)\} com origem de \$\{this\._t\(bg\.nameKey\)\.toLowerCase\(\)\}\.\`/g, "backstory: this._t('gen_backstory_template').replace('{race}', this._t('race_' + config.species).toLowerCase()).replace('{class}', this._t(cls.nameKey).toLowerCase()).replace('{background}', this._t(bg.nameKey).toLowerCase())");

fs.writeFileSync('generator.js', gen, 'utf8');

