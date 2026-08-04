// ===== MULTIPLAYER NETWORK LAYER (WebRTC via PeerJS) =====
// Camada base de rede: o Mestre (Host) cria a sala usando um Peer com id "OG-XXXXXX"
// e os Jogadores conectam-se a esse Peer. O transporte é WebRTC (via PeerJS Cloud).
//
// Fonte da verdade: o Mestre mantém o estado de combate (HP de cada jogador) em
// Multiplayer.combatState e distribui atualizações via broadcast { type: 'sync_hp' }.
// Os Jogadores enviam sua ficha ("sheet") ao entrar e apenas recebem as atualizações
// do Mestre — os campos de HP e Testes de Morte ficam travados no painel do Jogador.

const Multiplayer = {
  role: null,                       // 'host' | 'player' | null
  peer: null,                       // Instância PeerJS
  roomCode: null,                   // Código da sala atual
  hostId: null,                     // 'OG-' + roomCode
  connections: new Map(),           // Host: connectionId -> DataConnection
  connection: null,                 // Jogador: DataConnection única para o Mestre
  playerNames: new Map(),           // Host: connectionId -> nome do jogador
  playerName: null,
  combatState: new Map(),           // Host: connectionId -> { name, charName, hpMax, hpCurrent, hpTemp, ac, hpTouched, delta }
  hpLocked: false,                  // Jogador: campos de HP travados pelo Mestre

  // Callbacks que a UI pode injetar
  onStatus: null,                   // (message, type) => void
  onPeerOpen: null,                 // (peerId) => void
  onData: null,                     // (payload, conn) => void
  onConnection: null,               // (conn) => void
  onDisconnect: null,               // (conn) => void
  onPeerList: null,                 // ([names]) => void

  generateRoomCode() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  },

  createRoom(roomCode) {
    if (this.peer) {
      this.setStatus(this._t('mp_msg_active_session'), 'error');
      return null;
    }
    const nameEl = document.getElementById('mp-name-input');
    this.playerName = (nameEl && nameEl.value.trim());
    if (!this.playerName) {
      if (typeof showAlert !== 'undefined') showAlert("Digite seu nome antes de criar a sala.");
      else this.setStatus("Digite seu nome antes de criar a sala.", 'error');
      return null;
    }
    const code = roomCode ? String(roomCode).toUpperCase() : this.generateRoomCode();
    this._openHostPeer(code, 0);
    return code;
  },

  _openHostPeer(code, attempt) {
    this.role = 'host';
    this.roomCode = code;
    this.hostId = 'OG-' + code;
    this.connections = new Map();
    this.playerNames = new Map();
    this.combatState = new Map();

    const peer = new Peer(this.hostId);
    this.peer = peer;
    this._syncUI();

    peer.on('open', (id) => {
      this.setStatus(this._t('mp_msg_room_created', { code }), 'success');
      if (this.onPeerOpen) this.onPeerOpen(id);
    });

    peer.on('connection', (conn) => this._handleHostConnection(conn));

    peer.on('error', (err) => {
      if (err.type === 'unavailable-id' && attempt < 4) {
        const stale = this.peer;
        this.peer = null;
        if (stale && !stale.destroyed) stale.destroy();
        this._openHostPeer(this.generateRoomCode(), attempt + 1);
      } else {
        this.closeRoom();
        this.setStatus(this._t('mp_msg_peer_error', { msg: err.message || err.type || err }), 'error');
      }
    });
  },

  _handleHostConnection(conn) {
    this.connections.set(conn.connectionId, conn);
    const name = conn.metadata?.name || this._t('msg_player');
    this.playerNames.set(conn.connectionId, name);
    this.combatState.set(conn.connectionId, {
      name,
      charName: '',
      hpMax: 0,
      hpCurrent: 0,
      hpTemp: 0,
      ac: 0,
      hpTouched: false,
      delta: 1
    });

    conn.on('data', (data) => this._handleIncoming(data, conn));
    conn.on('close', () => {
      this.connections.delete(conn.connectionId);
      this.playerNames.delete(conn.connectionId);
      this.combatState.delete(conn.connectionId);
      this._sendPeerList();
      this.setStatus(this._t('mp_msg_player_left', { count: this.connections.size }), 'info');
      if (this.onDisconnect) this.onDisconnect(conn);
      this._syncUI();
    });
    conn.on('error', (err) => {
      this.setStatus(this._t('mp_msg_conn_error', { msg: err.message || err.type || err }), 'error');
    });

    this.setStatus(this._t('mp_msg_player_joined', { count: this.connections.size }), 'success');
    if (this.onConnection) this.onConnection(conn);
    this._syncUI();
  },

  joinRoom(roomCode) {
    if (this.peer) {
      this.setStatus(this._t('mp_msg_active_session'), 'error');
      return false;
    }

    const nameEl = document.getElementById('mp-name-input');
    this.playerName = (nameEl && nameEl.value.trim());
    if (!this.playerName) {
      if (typeof showAlert !== 'undefined') showAlert("Digite seu nome antes de entrar.");
      else this.setStatus("Digite seu nome antes de entrar.", 'error');
      return false;
    }

    const code = String(roomCode || this._roomInputValue() || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      this.setStatus(this._t('mp_msg_invalid_code'), 'error');
      return false;
    }

    this.role = 'player';
    this.roomCode = code;
    this.hostId = 'OG-' + code;
    this._syncUI();

    const peer = new Peer();
    this.peer = peer;

    peer.on('open', () => this._openPlayerConnection());

    peer.on('error', (err) => {
      this.closeRoom();
      this.setStatus(this._t('mp_msg_peer_error', { msg: err.message || err.type || err }), 'error');
    });
    return true;
  },

  _openPlayerConnection() {
    const conn = this.peer.connect(this.hostId, {
      reliable: true,
      metadata: { name: this.playerName }
    });
    this.connection = conn;

    conn.on('open', () => {
      this.setStatus(this._t('mp_msg_joined_room', { code: this.roomCode }), 'success');
      if (this.onConnection) this.onConnection(conn);
      conn.send({ v: 1, kind: 'hello', from: this.peer.id, payload: { name: this.playerName } });
      if (this._getCurrentCharacter()) this.sendSheet();
    });
    conn.on('data', (data) => this._handleIncoming(data, conn));
    conn.on('close', () => {
      this.setStatus(this._t('mp_msg_conn_closed'), 'info');
      this.setHpLocked(false);
      if (this.onDisconnect) this.onDisconnect(conn);
    });
    conn.on('error', (err) => {
      this.setStatus(this._t('mp_msg_conn_error', { msg: err.message || err.type || err }), 'error');
    });
  },

  _handleIncoming(raw, conn) {
    let parsed = raw;
    if (typeof raw === 'string') {
      try { parsed = JSON.parse(raw); } catch (e) { parsed = null; }
    }

    if (!parsed || typeof parsed !== 'object') {
      if (this.onData) this.onData(parsed === null ? raw : parsed, conn);
      return;
    }

    switch (parsed.kind) {
      case 'hello':
        this.playerNames.set(conn.connectionId, parsed.payload?.name || this._t('msg_player'));
        this._sendPeerList();
        this._syncUI();
        break;
      case 'sheet_ack':
        if (this.role === 'player') this._onSheetAccepted();
        break;
      case 'peer-list':
        this._renderPeerList(parsed.payload || []);
        break;
      case 'message':
        this._handlePlayerMessage(parsed.payload, conn);
        break;
      case 'broadcast':
      default:
        if (this.onData) this.onData(parsed.payload !== undefined ? parsed.payload : parsed, conn);
    }
  },

  // ===== MENSAGENS GERAIS =====

  broadcast(payload) {
    if (this.role !== 'host') {
      this.setStatus(this._t('mp_msg_broadcast_host_only'), 'error');
      return;
    }
    const envelope = { v: 1, kind: 'broadcast', from: this.peer.id, payload };
    let sent = 0;
    this.connections.forEach((conn) => {
      if (conn.open) { conn.send(envelope); sent++; }
    });
    this.setStatus(this._t('mp_msg_broadcast_sent', { count: sent }), 'info');
  },

  send(payload) {
    if (this.role !== 'player') {
      this.setStatus(this._t('mp_msg_send_player_only'), 'error');
      return false;
    }
    if (!this.connection || !this.connection.open) {
      this.setStatus(this._t('mp_msg_no_conn'), 'error');
      return false;
    }
    const envelope = { v: 1, kind: 'message', from: this.peer.id, payload };
    this.connection.send(envelope);
    this.setStatus(this._t('mp_msg_sent_to_host'), 'info');
    return true;
  },

  // ===== Jogador -> Mestre: envio da ficha =====

  sendSheet() {
    if (this.role !== 'player') {
      this.setStatus(this._t('mp_msg_send_player_only'), 'error');
      return false;
    }
    if (!this.connection || !this.connection.open) {
      this.setStatus(this._t('mp_msg_no_conn'), 'error');
      return false;
    }
    const char = this._getCurrentCharacter();
    if (!char) {
      this.setStatus(this._t('mp_msg_no_char'), 'error');
      return false;
    }
    const payload = {
      type: 'send_sheet',
      name: this.playerName,
      sheet: {
        charName: char.charName || '',
        hpMax: parseInt(char.hpMax, 10) || 0,
        hpCurrent: parseInt(char.hpCurrent, 10) || 0,
        hpTemp: parseInt(char.hpTemp, 10) || 0,
        ac: parseInt(char.ac, 10) || 0
      }
    };
    if (this.send(payload)) {
      this.setStatus(this._t('mp_msg_sheet_sent'), 'success');
      return true;
    }
    return false;
  },

  _getCurrentCharacter() {
    if (typeof currentId === 'undefined' || !currentId) return null;
    if (typeof characters === 'undefined') return null;
    return characters.find(c => c.id === currentId) || null;
  },

  afterCharacterLoad() {
    if (this.role !== 'player') return;
    this.sendSheet();
  },

  // ===== Mestre: fonte da verdade =====

  _handlePlayerMessage(payload, conn) {
    if (!payload || typeof payload !== 'object') {
      if (this.onData) this.onData(payload, conn);
      return;
    }
    if (payload.type === 'send_sheet' && this.role === 'host') {
      this._handlePlayerSheet(conn, payload.sheet || payload);
      return;
    }
    if (this.onData) this.onData(payload, conn);
  },

  _handlePlayerSheet(conn, payload) {
    const p = payload || {};
    const existing = this.combatState.get(conn.connectionId);
    const entry = existing || { name: '', charName: '', hpMax: 0, hpCurrent: 0, hpTemp: 0, ac: 0, hpTouched: false, delta: 1 };
    entry.name = p.name || conn.metadata?.name || entry.name || this._t('msg_player');
    if (p.charName !== undefined) {
      if (p.charName !== entry.charName) entry.hpTouched = false;
      entry.charName = p.charName;
    }
    // Só aceita HP novo se o Mestre ainda não mexeu no estado do jogador.
    if (!entry.hpTouched) {
      if (p.hpMax !== undefined) entry.hpMax = parseInt(p.hpMax, 10) || 0;
      if (p.hpCurrent !== undefined) entry.hpCurrent = parseInt(p.hpCurrent, 10) || 0;
      if (p.hpTemp !== undefined) entry.hpTemp = Math.max(0, parseInt(p.hpTemp, 10) || 0);
      if (p.ac !== undefined) entry.ac = parseInt(p.ac, 10) || 0;
    }
    entry.hpCurrent = this._clampHp(entry.hpCurrent, entry.hpMax);
    this.combatState.set(conn.connectionId, entry);
    this.playerNames.set(conn.connectionId, entry.name);
    this.setStatus(this._t('mp_msg_sheet_received', { name: entry.charName || entry.name }), 'success');
    this._syncUI();
    // Aceita a ficha e devolve os valores autoritativos ao jogador.
    if (conn.open) {
      conn.send({ v: 1, kind: 'sheet_ack', from: this.peer.id, payload: { playerId: conn.connectionId } });
    }
    this._broadcastSync(conn.connectionId);
  },

  _clampHp(value, max) {
    const v = parseInt(value, 10) || 0;
    if (max > 0) return Math.max(0, Math.min(v, max));
    return Math.max(0, v);
  },

  updatePlayerHp(connId, values) {
    if (this.role !== 'host') return;
    const entry = this.combatState.get(connId);
    if (!entry) return;
    if (values.hpMax !== undefined) entry.hpMax = parseInt(values.hpMax, 10) || 0;
    if (values.hpCurrent !== undefined) entry.hpCurrent = this._clampHp(values.hpCurrent, entry.hpMax);
    if (values.hpTemp !== undefined) entry.hpTemp = Math.max(0, parseInt(values.hpTemp, 10) || 0);
    if (values.ac !== undefined) entry.ac = parseInt(values.ac, 10) || 0;
    entry.hpTouched = true;
    this._broadcastSync(connId);
    this.setStatus(this._t('mp_msg_hp_updated', { name: entry.charName || entry.name, hp: entry.hpCurrent }), 'success');
    this._syncUI();
  },

  damagePlayer(connId, amount) {
    if (this.role !== 'host') return;
    const entry = this.combatState.get(connId);
    if (!entry) return;
    let dmg = Math.max(1, Math.abs(amount) || 1);
    const temp = entry.hpTemp || 0;
    const absorbed = Math.min(temp, dmg);
    entry.hpTemp = temp - absorbed;
    dmg -= absorbed;
    entry.hpCurrent = Math.max(0, (entry.hpCurrent || 0) - dmg);
    entry.hpTouched = true;
    this._broadcastSync(connId);
    this.setStatus(this._t('mp_msg_hp_updated', { name: entry.charName || entry.name, hp: entry.hpCurrent }), 'success');
    this._syncUI();
  },

  healPlayer(connId, amount) {
    if (this.role !== 'host') return;
    const entry = this.combatState.get(connId);
    if (!entry) return;
    const healed = (entry.hpCurrent || 0) + Math.max(1, Math.abs(amount) || 1);
    entry.hpCurrent = entry.hpMax > 0 ? Math.min(healed, entry.hpMax) : healed;
    entry.hpTouched = true;
    this._broadcastSync(connId);
    this.setStatus(this._t('mp_msg_hp_updated', { name: entry.charName || entry.name, hp: entry.hpCurrent }), 'success');
    this._syncUI();
  },

  _broadcastSync(connId) {
    const entry = this.combatState.get(connId);
    if (!entry) return;
    this.broadcast({
      type: 'sync_hp',
      playerId: connId,
      hpMax: entry.hpMax,
      hpCurrent: entry.hpCurrent,
      hpTemp: entry.hpTemp,
      ac: entry.ac
    });
  },

  // ===== Jogador: aplica o estado autoritativo recebido do Mestre =====

  _onSheetAccepted() {
    this.setHpLocked(true);
    this.setStatus(this._t('mp_msg_sheet_accepted'), 'success');
  },

  _applyHp(player) {
    const form = document.getElementById('char-form');
    if (!form) return;
    const set = (name, val) => {
      const el = form.querySelector(`input[name="${name}"]`);
      if (el) el.value = (val === undefined || val === null) ? '' : val;
    };
    set('hpMax', player.hpMax);
    set('hpCurrent', player.hpCurrent);
    set('hpTemp', player.hpTemp);
    set('ac', player.ac);
    if (typeof updateHpBar === 'function') updateHpBar();
    if (typeof saveCharacter === 'function') saveCharacter();
  },

  setHpLocked(locked) {
    this.hpLocked = !!locked;
    const hpSection = document.querySelector('.hp-section-new');
    const deathBox = document.querySelector('.death-saves-box');
    if (hpSection) hpSection.classList.toggle('mp-locked', locked);
    if (deathBox) deathBox.classList.toggle('mp-locked', locked);
    ['hpCurrent', 'hpTemp', 'hpMax'].forEach(name => {
      const el = document.querySelector(`input[name="${name}"]`);
      if (el) el.readOnly = locked;
    });
    ['death_save_success_1', 'death_save_success_2', 'death_save_success_3',
     'death_save_fail_1', 'death_save_fail_2', 'death_save_fail_3'].forEach(name => {
      const el = document.querySelector(`input[name="${name}"]`);
      if (el) el.disabled = locked;
    });
  },

  // ===== UI =====

  _sendPeerList() {
    const names = Array.from(this.playerNames.values());
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send({ v: 1, kind: 'peer-list', from: this.peer.id, payload: names });
      }
    });
    if (this.onPeerList) this.onPeerList(names);
  },

  closeRoom() {
    this.setHpLocked(false);
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.connection = null;
    this.connections = new Map();
    this.playerNames = new Map();
    this.combatState = new Map();
    this.role = null;
    this.roomCode = null;
    this.hostId = null;
    this.setStatus(this._t('mp_msg_session_closed'), 'info');
    this._syncUI();
  },

  setStatus(message, type = 'info') {
    const el = document.getElementById('mp-status-text');
    if (el) {
      el.textContent = message;
      el.className = 'mp-value mp-' + type;
    }
    this._log(message, type);
    if (this.onStatus) this.onStatus(message, type);
  },

  _log(message, type = 'info') {
    const el = document.getElementById('mp-log');
    if (!el) return;
    const line = document.createElement('div');
    line.className = 'mp-log-line mp-log-' + type;
    line.textContent = '[' + new Date().toLocaleTimeString() + '] ' + message;
    el.appendChild(line);
    while (el.childNodes.length > 60) el.removeChild(el.firstChild);
    el.scrollTop = el.scrollHeight;
  },

  _updateUI() {
    const isHost = this.role === 'host';
    const isPlayer = this.role === 'player';
    const isConnected = !!this.peer;

    const btnCreate = document.querySelector('button[onclick="Multiplayer.createRoom()"]');
    const btnJoin = document.querySelector('button[onclick="Multiplayer.joinRoom()"]');
    const btnBroadcast = document.querySelector('button[onclick*="Multiplayer.broadcast"]');
    const btnSend = document.querySelector('button[onclick*="Multiplayer.send"]');
    const btnLeave = document.querySelector('button[onclick="Multiplayer.closeRoom()"]');
    const btnSendSheet = document.getElementById('mp-btn-send-sheet');
    const inputName = document.getElementById('mp-name-input');
    const inputRoom = document.getElementById('mp-room-input');

    if(btnCreate) btnCreate.disabled = isConnected;
    if(btnJoin) btnJoin.disabled = isConnected;
    if(btnBroadcast) btnBroadcast.disabled = !isHost;
    if(btnSend) btnSend.disabled = !isPlayer;
    if(btnSendSheet) btnSendSheet.disabled = !isPlayer;
    if(btnLeave) btnLeave.disabled = !isConnected;
    if(inputName) inputName.disabled = isConnected;
    if(inputRoom) inputRoom.disabled = isConnected;
  },

  _updateInfo() {
    const codeEl = document.getElementById('mp-code-text');
    if (codeEl) codeEl.textContent = this.roomCode || '-';
    const playersEl = document.getElementById('mp-players-text');
    if (playersEl) playersEl.textContent = this.role === 'host' ? this.connections.size : (this.connection ? 1 : 0);
  },

  _syncUI() {
    this._updateInfo();
    this._updateUI();
    this._renderPartyPanel();
  },

  _renderPartyPanel() {
    const panel = document.getElementById('mp-party-panel');
    if (!panel) return;
    const isHost = this.role === 'host';
    panel.classList.toggle('hidden', !isHost);
    if (!isHost) return;

    const body = document.getElementById('mp-party-body');
    const empty = document.getElementById('mp-party-empty');
    if (!body) return;

    body.innerHTML = '';
    const entries = Array.from(this.combatState.entries());
    if (empty) empty.classList.toggle('hidden', entries.length > 0);

    entries.forEach(([connId, p]) => body.appendChild(this._buildPartyRow(connId, p)));
  },

  _buildPartyRow(connId, p) {
    const tr = document.createElement('tr');
    tr.dataset.conn = connId;

    const tdName = document.createElement('td');
    tdName.className = 'mp-party-name';
    tdName.textContent = p.charName || p.name || this._t('msg_player');
    tr.appendChild(tdName);

    const tdAc = document.createElement('td');
    const acInput = document.createElement('input');
    acInput.type = 'number';
    acInput.className = 'mp-party-num mp-ac-input';
    acInput.value = p.ac || 0;
    acInput.min = '0';
    tdAc.appendChild(acInput);
    tr.appendChild(tdAc);

    const tdHp = document.createElement('td');
    tdHp.className = 'mp-party-hp';
    const curInput = document.createElement('input');
    curInput.type = 'number';
    curInput.className = 'mp-party-num mp-hp-current';
    curInput.value = p.hpCurrent || 0;
    curInput.min = '0';
    const sep = document.createElement('span');
    sep.textContent = ' / ';
    const maxInput = document.createElement('input');
    maxInput.type = 'number';
    maxInput.className = 'mp-party-num mp-hp-max';
    maxInput.value = p.hpMax || 0;
    maxInput.min = '0';
    tdHp.appendChild(curInput);
    tdHp.appendChild(sep);
    tdHp.appendChild(maxInput);
    const br = document.createElement('br');
    const tempLabel = document.createElement('span');
    tempLabel.className = 'mp-party-temp-label';
    tempLabel.textContent = this._t('lbl_hp_temp') + ':';
    const tempInput = document.createElement('input');
    tempInput.type = 'number';
    tempInput.className = 'mp-party-num mp-hp-temp';
    tempInput.value = p.hpTemp || 0;
    tempInput.min = '0';
    tdHp.appendChild(br);
    tdHp.appendChild(tempLabel);
    tdHp.appendChild(tempInput);
    tr.appendChild(tdHp);

    const tdActions = document.createElement('td');
    tdActions.className = 'mp-party-actions';
    const delta = document.createElement('input');
    delta.type = 'number';
    delta.className = 'mp-party-num mp-party-delta';
    delta.value = p.delta !== undefined ? p.delta : 1;
    delta.min = '1';
    const dmgBtn = document.createElement('button');
    dmgBtn.type = 'button';
    dmgBtn.className = 'btn-danger mp-btn-dmg';
    dmgBtn.textContent = this._t('mp_btn_damage');
    const healBtn = document.createElement('button');
    healBtn.type = 'button';
    healBtn.className = 'btn-secondary mp-btn-heal';
    healBtn.textContent = this._t('mp_btn_heal');
    tdActions.appendChild(delta);
    tdActions.appendChild(dmgBtn);
    tdActions.appendChild(healBtn);
    tr.appendChild(tdActions);

    return tr;
  },

  _renderPeerList(names) {
    const playersEl = document.getElementById('mp-players-text');
    if (playersEl) playersEl.textContent = names.join(', ') || '-';
  },

  _roomInputValue() {
    const el = document.getElementById('mp-room-input');
    return el ? el.value : '';
  },

  _t(key, vars) {
    let str = getTranslation(key);
    return str.replace(/\{(\w+)\}/g, (match, k) => ((vars && vars[k] !== undefined) ? vars[k] : match));
  }
};

// ===== UI WIRING =====

document.addEventListener('DOMContentLoaded', () => {
  const body = document.getElementById('mp-party-body');

  body && body.addEventListener('click', (e) => {
    const btn = e.target.closest('.mp-btn-dmg, .mp-btn-heal');
    if (!btn) return;
    const tr = btn.closest('tr');
    const connId = tr && tr.dataset.conn;
    if (!connId) return;
    const deltaEl = tr.querySelector('.mp-party-delta');
    const delta = parseInt(deltaEl && deltaEl.value, 10) || 1;
    if (btn.classList.contains('mp-btn-dmg')) Multiplayer.damagePlayer(connId, delta);
    else Multiplayer.healPlayer(connId, delta);
  });

  body && body.addEventListener('change', (e) => {
    if (e.target.classList.contains('mp-party-delta')) {
      const tr = e.target.closest('tr');
      const connId = tr && tr.dataset.conn;
      if (connId) {
        const entry = Multiplayer.combatState.get(connId);
        if (entry) entry.delta = parseInt(e.target.value, 10) || 1;
      }
      return;
    }
    if (!e.target.classList.contains('mp-hp-current') &&
        !e.target.classList.contains('mp-hp-max') &&
        !e.target.classList.contains('mp-hp-temp') &&
        !e.target.classList.contains('mp-ac-input')) return;
    const tr = e.target.closest('tr');
    const connId = tr && tr.dataset.conn;
    if (!connId) return;
    Multiplayer.updatePlayerHp(connId, {
      hpCurrent: tr.querySelector('.mp-hp-current').value,
      hpMax: tr.querySelector('.mp-hp-max').value,
      hpTemp: tr.querySelector('.mp-hp-temp').value,
      ac: tr.querySelector('.mp-ac-input').value
    });
  });

  Multiplayer.onData = (payload, conn) => {
    if (payload && typeof payload === 'object' && payload.type === 'sync_hp') {
      if (Multiplayer.role === 'player') {
        const myId = Multiplayer.connection && Multiplayer.connection.connectionId;
        if (payload.playerId === myId) {
          Multiplayer._applyHp(payload);
          Multiplayer.setHpLocked(true);
          Multiplayer.setStatus(Multiplayer._t('mp_msg_hp_locked'), 'success');
        }
      }
      return;
    }
    Multiplayer.setStatus(Multiplayer._t('mp_msg_received', { data: JSON.stringify(payload) }), 'success');
  };
});
setTimeout(() => Multiplayer._updateUI(), 500);
