const safeStorage = {
  data: {},
  getItem(key) {
    try { return localStorage.getItem(key); } catch (e) { return this.data[key] || null; }
  },
  setItem(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { this.data[key] = value; }
  },
  removeItem(key) {
    try { localStorage.removeItem(key); } catch (e) { delete this.data[key]; }
  }
};

const translations = {
  'pt-BR': {
    subtitle: "Gerencie seus heróis e suas histórias",
    btn_create: "Criar Novo Personagem",
    btn_back: "Voltar",
    btn_export_pdf: "PDF",
    btn_export_json: "JSON",
    btn_import: "Importar",
    btn_save: "Salvar",

    ph_char_name: "Nome do Personagem",
    ph_class: "Classe",
    ph_subclass: "Subclasse",
    ph_race: "Raça",
    ph_bg: "Antecedente",
    ph_align: "Alinhamento",
    ph_level: "Nível",

    lbl_class: "Classe",
    lbl_level: "Nível",
    lbl_race: "Raça",
    lbl_bg: "Antecedente",
    lbl_subclass: "Subclasse",
    lbl_align: "Alinhamento",

    attr_str: "FOR", attr_dex: "DES", attr_con: "CON",
    attr_int: "INT", attr_wis: "SAB", attr_cha: "CAR",

    lbl_inspiration: "Inspiração",
    lbl_prof_bonus: "Bônus Prof.",
    lbl_passive_perc: "Percepção Passiva",
    lbl_ac: "CA",
    lbl_init: "Iniciativa",
    lbl_speed: "Deslocamento",

    lbl_hp_title: "Pontos de Vida",
    lbl_hp_max: "Máximo",
    lbl_hp_curr: "Atual",
    lbl_hp_temp: "Temp",
    lbl_hit_dice: "Dados de Vida",
    lbl_death_saves: "Testes contra Morte",
    lbl_success: "Sucesso",
    lbl_fail: "Falha",

    lbl_saves_title: "Resistências",
    save_str: "Força", save_dex: "Destreza", save_con: "Constituição",
    save_int: "Inteligência", save_wis: "Sabedoria", save_cha: "Carisma",

    lbl_skills_title: "Perícias",
    skill_acro: "Acrobacia", skill_anim: "Adestrar Animais", skill_arca: "Arcanismo",
    skill_athl: "Atletismo", skill_perf: "Atuação", skill_decp: "Enganação",
    skill_stea: "Furtividade", skill_hist: "História", skill_inti: "Intimidação",
    skill_insg: "Intuição", skill_invs: "Investigação", skill_medi: "Medicina",
    skill_natu: "Natureza", skill_perc: "Percepção", skill_pers: "Persuasão",
    skill_slei: "Prestidigitação", skill_reli: "Religião", skill_surv: "Sobrevivência",

    tab_attacks: "Ataques",
    tab_equip: "Equipamento",
    tab_traits: "Traços",

    lbl_attacks_desc: "Ataques e Conjuração",
    hlp_attacks: "Nome | Bônus | Dano/Tipo",
    ph_attacks: "Ex: Espada Longa | +5 | 1d8+3 cortante",
    lbl_equip: "Equipamento",
    ph_equip: "Liste seus itens...",
    lbl_prof_lang: "Proficiências e Idiomas",
    ph_prof_lang: "Armaduras, armas, ferramentas, idiomas...",
    lbl_feat_traits: "Características e Talentos",
    ph_feat_traits: "Descreva suas habilidades especiais...",

    sec_spells: "Magias",
    lbl_spell_ability: "Hab.",
    lbl_spell_dc: "CD",
    lbl_spell_atk: "Atq.",
    lbl_cantrips: "Truques",
    lbl_level_x: "Nível",
    ph_spells_list: "Um por linha",

    sec_backstory: "História do Personagem",
    ph_backstory: "Conte a história do seu personagem...",

    footer_text: "Copyright © 2025 criado por levirenato.",

    msg_saved: "Salvo!",
    msg_confirm_delete: "ATENÇÃO: Deseja apagar esta ficha?",
    msg_confirm_overwrite: "Deseja substituir os dados do personagem atual?",
    msg_imported: "Personagem importado!",
    msg_updated: "Personagem atualizado!",
    msg_char_not_found: "Nenhum herói encontrado.",

    modal_title_info: "Aviso",
    modal_title_confirm: "Confirmação",
    modal_title_success: "Sucesso",
    modal_title_error: "Erro",
    modal_confirm: "Confirmar",
    modal_cancel: "Cancelar",

    msg_no_char_loaded: "Nenhum personagem carregado!",
    msg_char_data_error: "Erro ao encontrar dados do personagem.",
    msg_pdf_success: "PDF exportado com sucesso!",
    msg_pdf_generating: "Gerando...",
    msg_json_error: "Erro ao processar o arquivo JSON.",
    msg_unsaved_changes: "Você tem alterações não salvas. Deseja sair sem salvar?",
    msg_player: "Jogador",

    coin_cp: "PC",
    coin_sp: "PP",
    coin_ep: "PE",
    coin_gp: "PO",
    coin_pp: "PL",

    lbl_unknown: "Desconhecido",
    lbl_default_race: "Raça",
    lbl_default_class: "Classe",

    mp_title: "Multiplayer (Teste)",
    mp_btn_host: "Criar Sala",
    mp_btn_join: "Entrar",
    mp_btn_ping_all: "Broadcast",
    mp_btn_ping_host: "Ping Mestre",
    mp_btn_leave: "Sair",
    mp_name_ph: "Seu Nome",
    mp_room_ph: "Código da Sala",
    mp_status: "Status",
    mp_code: "Código",
    mp_players: "Jogadores",

    mp_msg_active_session: "Já existe uma sessão ativa. Saia antes de continuar.",
    mp_msg_room_created: "Sala criada! Código: {code}",
    mp_msg_invalid_code: "Código inválido. Use 6 letras/números.",
    mp_msg_joined_room: "Conectado à sala {code}",
    mp_msg_player_joined: "Jogador conectado! ({count} online)",
    mp_msg_player_left: "Jogador desconectado. ({count} online)",
    mp_msg_conn_closed: "Conexão com o Mestre encerrada.",
    mp_msg_conn_error: "Erro de conexão: {msg}",
    mp_msg_peer_error: "Erro: {msg}",
    mp_msg_broadcast_sent: "Broadcast enviado para {count} jogador(es).",
    mp_msg_sent_to_host: "Mensagem enviada ao Mestre.",
    mp_msg_broadcast_host_only: "Só o Mestre pode fazer broadcast.",
    mp_msg_send_player_only: "Só o Jogador pode usar send().",
    mp_msg_no_conn: "Sem conexão com o Mestre.",
    mp_msg_session_closed: "Sessão encerrada.",
    mp_msg_received: "Recebido: {data}",

    gen_title: "Gerador Rápido",
    gen_tagline: "Crie um herói pronto para a aventura em segundos.",
    gen_btn_open: "Gerador Rápido",
    gen_name_label: "Nome",
    gen_random_name: "Nome aleatório",
    gen_race_label: "Raça",
    gen_race_random: "Aleatória",
    gen_level_label: "Nível",
    gen_method_label: "Método de atributos",
    gen_method_standard: "Array padrão (15, 14, 13, 12, 10, 8)",
    gen_method_roll: "Rolar 4d6 (descarta o menor)",
    gen_mode_label: "Modo de geração",
    gen_mode_archetype: "Arquétipo pronto",
    gen_mode_random: "Tudo aleatório",
    gen_roll_btn: "Rolar atributos",
    gen_roll_again: "Rolar novamente",
    gen_create_btn: "Criar ficha",
    gen_cancel_btn: "Cancelar",
    gen_class_pick: "Escolha seu arquétipo",
    gen_generated: "Ficha criada!",
    gen_rolling: "Rolando dados...",
    gen_preview_title: "Prévia",
    gen_random_hint: "Classe, raça, nome e atributos serão sorteados para você.",
    gen_archetype_hint: "Escolha uma classe pronta; os atributos serão distribuídos conforme o papel dela.",
    gen_alignment_label: "Alinhamento",
    gen_theme_label: "Cor do tema",
    gen_background_label: "Antecedente",
    gen_missing_name: "Digite um nome ou sorteie um.",
    gen_attr_total: "Total",

    cls_barbarian: "Bárbaro", cls_bard: "Bardo", cls_cleric: "Clérigo",
    cls_druid: "Druida", cls_fighter: "Guerreiro", cls_monk: "Monge",
    cls_paladin: "Paladino", cls_ranger: "Patrulheiro", cls_rogue: "Ladino",
    cls_sorcerer: "Feiticeiro", cls_warlock: "Bruxo", cls_wizard: "Mago",

    race_human: "Humano", race_dwarf: "Anão", race_elf: "Elfo",
    race_halfling: "Halfling", race_gnome: "Gnomo", race_half_orc: "Meio-Orc",
    race_dragonborn: "Dragônat", race_tiefling: "Tiefling",
    race_half_elf: "Meio-Elfo", race_aasimar: "Aasimar",

    bg_acolyte: "Acólito", bg_criminal: "Criminoso", bg_folk_hero: "Herói do Povo",
    bg_hermit: "Eremita", bg_noble: "Nobre", bg_outlander: "Forasteiro",
    bg_sage: "Sábio", bg_sailor: "Marinheiro", bg_soldier: "Soldado",
    bg_urchin: "Pequeno Marginal",

    align_lg: "Leal e Bom", align_ng: "Neutro e Bom", align_cg: "Caótico e Bom",
    align_ln: "Leal e Neutro", align_n: "Neutro", align_cn: "Caótico e Neutro",
    align_le: "Leal e Mau", align_ne: "Neutro e Mau", align_ce: "Caótico e Mau"
  },
  'en-US': {
    subtitle: "Manage your heroes and their stories",
    btn_create: "Create New Character",
    btn_back: "Back",
    btn_export_pdf: "PDF",
    btn_export_json: "JSON",
    btn_import: "Import",
    btn_save: "Save",

    ph_char_name: "Character Name",
    ph_class: "Class",
    ph_subclass: "Subclass",
    ph_race: "Race",
    ph_bg: "Background",
    ph_align: "Alignment",
    ph_level: "Level",

    lbl_class: "Class",
    lbl_level: "Level",
    lbl_race: "Race",
    lbl_bg: "Background",
    lbl_subclass: "Subclass",
    lbl_align: "Alignment",

    attr_str: "STR", attr_dex: "DEX", attr_con: "CON",
    attr_int: "INT", attr_wis: "WIS", attr_cha: "CHA",

    lbl_inspiration: "Inspiration",
    lbl_prof_bonus: "Prof. Bonus",
    lbl_passive_perc: "Passive Perception",
    lbl_ac: "AC",
    lbl_init: "Initiative",
    lbl_speed: "Speed",

    lbl_hp_title: "Hit Points",
    lbl_hp_max: "Max",
    lbl_hp_curr: "Current",
    lbl_hp_temp: "Temp",
    lbl_hit_dice: "Hit Dice",
    lbl_death_saves: "Death Saves",
    lbl_success: "Success",
    lbl_fail: "Failure",

    lbl_saves_title: "Saving Throws",
    save_str: "Strength", save_dex: "Dexterity", save_con: "Constitution",
    save_int: "Intelligence", save_wis: "Wisdom", save_cha: "Charisma",

    lbl_skills_title: "Skills",
    skill_acro: "Acrobatics", skill_anim: "Animal Handling", skill_arca: "Arcana",
    skill_athl: "Athletics", skill_perf: "Performance", skill_decp: "Deception",
    skill_stea: "Stealth", skill_hist: "History", skill_inti: "Intimidation",
    skill_insg: "Insight", skill_invs: "Investigation", skill_medi: "Medicine",
    skill_natu: "Nature", skill_perc: "Perception", skill_pers: "Persuasion",
    skill_slei: "Sleight of Hand", skill_reli: "Religion", skill_surv: "Survival",

    tab_attacks: "Attacks",
    tab_equip: "Equipment",
    tab_traits: "Traits",

    lbl_attacks_desc: "Attacks & Spellcasting",
    hlp_attacks: "Name | Bonus | Damage/Type",
    ph_attacks: "Ex: Longsword | +5 | 1d8+3 slashing",
    lbl_equip: "Equipment",
    ph_equip: "List your items...",
    lbl_prof_lang: "Proficiencies & Languages",
    ph_prof_lang: "Armor, weapons, tools, languages...",
    lbl_feat_traits: "Features & Traits",
    ph_feat_traits: "Describe your special abilities...",

    sec_spells: "Spells",
    lbl_spell_ability: "Abil.",
    lbl_spell_dc: "DC",
    lbl_spell_atk: "Atk.",
    lbl_cantrips: "Cantrips",
    lbl_level_x: "Level",
    ph_spells_list: "One per line",

    sec_backstory: "Character Backstory",
    ph_backstory: "Tell your character's story...",

    footer_text: "Copyright © 2025 created by levirenato.",

    msg_saved: "Saved!",
    msg_confirm_delete: "WARNING: Do you want to delete this sheet?",
    msg_confirm_overwrite: "Do you want to overwrite current character data?",
    msg_imported: "Character imported!",
    msg_updated: "Character updated!",
    msg_char_not_found: "No heroes found.",

    modal_title_info: "Notice",
    modal_title_confirm: "Confirmation",
    modal_title_success: "Success",
    modal_title_error: "Error",
    modal_confirm: "Confirm",
    modal_cancel: "Cancel",

    msg_no_char_loaded: "No character loaded!",
    msg_char_data_error: "Error finding character data.",
    msg_pdf_success: "PDF exported successfully!",
    msg_pdf_generating: "Generating...",
    msg_json_error: "Error processing JSON file.",
    msg_unsaved_changes: "You have unsaved changes. Leave without saving?",
    msg_player: "Player",

    coin_cp: "CP",
    coin_sp: "SP",
    coin_ep: "EP",
    coin_gp: "GP",
    coin_pp: "PP",

    lbl_unknown: "Unknown",
    lbl_default_race: "Race",
    lbl_default_class: "Class",

    mp_title: "Multiplayer (Test)",
    mp_btn_host: "Host Room",
    mp_btn_join: "Join",
    mp_btn_ping_all: "Broadcast",
    mp_btn_ping_host: "Ping Host",
    mp_btn_leave: "Leave",
    mp_name_ph: "Your Name",
    mp_room_ph: "Room Code",
    mp_status: "Status",
    mp_code: "Code",
    mp_players: "Players",

    mp_msg_active_session: "An active session already exists. Leave first.",
    mp_msg_room_created: "Room created! Code: {code}",
    mp_msg_invalid_code: "Invalid code. Use 6 letters/numbers.",
    mp_msg_joined_room: "Connected to room {code}",
    mp_msg_player_joined: "Player connected! ({count} online)",
    mp_msg_player_left: "Player disconnected. ({count} online)",
    mp_msg_conn_closed: "Connection to the Master ended.",
    mp_msg_conn_error: "Connection error: {msg}",
    mp_msg_peer_error: "Error: {msg}",
    mp_msg_broadcast_sent: "Broadcast sent to {count} player(s).",
    mp_msg_sent_to_host: "Message sent to the Master.",
    mp_msg_broadcast_host_only: "Only the Master can broadcast.",
    mp_msg_send_player_only: "Only the Player can use send().",
    mp_msg_no_conn: "No connection to the Master.",
    mp_msg_session_closed: "Session closed.",
    mp_msg_received: "Received: {data}",

    gen_title: "Quick Generator",
    gen_tagline: "Create an adventure-ready hero in seconds.",
    gen_btn_open: "Quick Generator",
    gen_name_label: "Name",
    gen_random_name: "Random name",
    gen_race_label: "Race",
    gen_race_random: "Random",
    gen_level_label: "Level",
    gen_method_label: "Ability method",
    gen_method_standard: "Standard array (15, 14, 13, 12, 10, 8)",
    gen_method_roll: "Roll 4d6 (drop lowest)",
    gen_mode_label: "Generation mode",
    gen_mode_archetype: "Ready-made archetype",
    gen_mode_random: "Fully random",
    gen_roll_btn: "Roll abilities",
    gen_roll_again: "Roll again",
    gen_create_btn: "Create sheet",
    gen_cancel_btn: "Cancel",
    gen_class_pick: "Choose your archetype",
    gen_generated: "Sheet created!",
    gen_rolling: "Rolling dice...",
    gen_preview_title: "Preview",
    gen_random_hint: "Class, race, name and abilities will be drawn for you.",
    gen_archetype_hint: "Pick a ready-made class; abilities are distributed to fit its role.",
    gen_alignment_label: "Alignment",
    gen_theme_label: "Theme color",
    gen_background_label: "Background",
    gen_missing_name: "Type a name or roll one.",
    gen_attr_total: "Total",

    cls_barbarian: "Barbarian", cls_bard: "Bard", cls_cleric: "Cleric",
    cls_druid: "Druid", cls_fighter: "Fighter", cls_monk: "Monk",
    cls_paladin: "Paladin", cls_ranger: "Ranger", cls_rogue: "Rogue",
    cls_sorcerer: "Sorcerer", cls_warlock: "Warlock", cls_wizard: "Wizard",

    race_human: "Human", race_dwarf: "Dwarf", race_elf: "Elf",
    race_halfling: "Halfling", race_gnome: "Gnome", race_half_orc: "Half-Orc",
    race_dragonborn: "Dragonborn", race_tiefling: "Tiefling",
    race_half_elf: "Half-Elf", race_aasimar: "Aasimar",

    bg_acolyte: "Acolyte", bg_criminal: "Criminal", bg_folk_hero: "Folk Hero",
    bg_hermit: "Hermit", bg_noble: "Noble", bg_outlander: "Outlander",
    bg_sage: "Sage", bg_sailor: "Sailor", bg_soldier: "Soldier",
    bg_urchin: "Urchin",

    align_lg: "Lawful Good", align_ng: "Neutral Good", align_cg: "Chaotic Good",
    align_ln: "Lawful Neutral", align_n: "Neutral", align_cn: "Chaotic Neutral",
    align_le: "Lawful Evil", align_ne: "Neutral Evil", align_ce: "Chaotic Evil"
  }
};

let currentLang = safeStorage.getItem('dnd_lang') || 'pt-BR';

function initLanguage() {
  document.querySelectorAll('.lang-select').forEach(sel => sel.value = currentLang);
  applyLanguage(currentLang);
}

function changeLanguage(lang) {
  currentLang = lang;
  safeStorage.setItem('dnd_lang', lang);
  document.querySelectorAll('.lang-select').forEach(sel => sel.value = lang);
  applyLanguage(lang);

  if (typeof currentId !== 'undefined' && currentId && typeof characters !== 'undefined') {
    const char = characters.find(c => c.id === currentId);
    if (char && typeof renderSpellSlots === 'function') {
      renderSpellSlots(char);
    }
  }

  if (typeof renderList === 'function' && (!currentId)) {
    renderList();
  }
}

function getTranslation(key) {
  return translations[currentLang][key] || key;
}

function applyLanguage(lang) {
  const t = translations[lang];
  if (!t) return;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) el.placeholder = t[key];
  });
}
