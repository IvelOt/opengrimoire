// ===== MULTIPLAYER NETWORK LAYER (WebRTC via PeerJS) =====
// O Mestre (Host) cria a sala usando um Peer com id "OG-XXXXXX" e os
// Jogadores conectam-se a esse Peer. O transporte é WebRTC (via PeerJS Cloud).
//
// Fonte da verdade: o Mestre mantém o estado de combate (HP de cada jogador)
// em Multiplayer.combatState e o distribui via mensagens "state" para todos.
// Os Jogadores enviam sua ficha ("sheet") ao entrar e apenas recebem o estado
// atualizado do Mestre — os campos de HP ficam readonly no painel do Jogador.

const Multiplayer = {
  role: null,                       // 'host' | 'player' | null
  peer: null,                       // Instância PeerJS
  roomCode: null,                   // Código da sala atual
  hostId: null,                     // 'OG-' + roomCode
  connections: new Map(),           // Host: connectionId -> DataConnection
  connection: null,                 // Jogador: DataConnection única para o Mestre
  playerNames: new Map(),           // Host: connectionId -> nome do jogador
  playerName: 'Jogador',
  combatState: new Map(),           // Host: connectionId -> { name, charName, hpMax, hpCurrent, hpTouched }
  latestState: null,                // Jogador: último estado recebido do Mestre

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

  _validateName() {
    const nameEl = document.getElementById('mp-name-input');
    const name = (nameEl && nameEl.value.trim()) || '';
    if (!name) {
      showAlert(this._t('mp_msg_name_required'));
      return false;
    }
    this.playerName = name;
    return true;
  },

  createRoom(roomCode) {
    if (!this._validateName()) return null;
    if (this.peer) {
      this.setStatus(this._t('mp_msg_active_session'), 'error');
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
    const name = conn.metadata?.name || 'Jogador';
    this.playerNames.set(conn.connectionId, name);
    this.combatState.set(conn.connectionId, {
      name,
      charName: '',
      hpMax: 0,
      hpCurrent: 0,
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
    if (!this._validateName()) return false;
    if (this.peer) {
      this.setStatus(this._t('mp_msg_active_session'), 'error');
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
    this.latestState = null;

    const peer = new Peer();
    this.peer = peer;
    this._syncUI();

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
      this.setHpLocked(true);
      this.setStatus(this._t('mp_msg_hp_locked'), 'info');
      this.sendSheet();
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
        this.playerNames.set(conn.connectionId, parsed.payload?.name || 'Jogador');
        this._sendPeerList();
        this._syncUI();
        break;
      case 'sheet':
        if (this.role === 'host') this._handlePlayerSheet(conn, parsed.payload);
        break;
      case 'state':
        if (this.role === 'player') this._applyState(parsed.payload);
        break;
      case 'peer-list':
        this._renderPeerList(parsed.payload || []);
        break;
      case 'broadcast':
      case 'message':
      default:
        if (this.onData) this.onData(parsed.payload !== undefined ? parsed.payload : parsed, conn);
    }
  },

  // ===== Jogador -> Mestre: ficha =====

  sendSheet() {
    if (this.role !== 'player') return;
    if (!this.connection || !this.connection.open) {
      this.setStatus(this._t('mp_msg_no_conn'), 'error');
      return;
    }
    const char = this._getCurrentCharacter();
    const payload = {
      name: this.playerName,
      charName: char ? (char.charName || '') : '',
      hpMax: char ? (parseInt(char.hpMax, 10) || 0) : 0,
      hpCurrent: char ? (parseInt(char.hpCurrent, 10) || 0) : 0
    };
    this.connection.send({ v: 1, kind: 'sheet', from: this.peer.id, payload });
    this.setStatus(this._t('mp_msg_sheet_sent'), 'info');
  },

  _getCurrentCharacter() {
    if (typeof currentId === 'undefined' || !currentId) return null;
    if (typeof characters === 'undefined') return null;
    return characters.find(c => c.id === currentId) || null;
  },

  // ===== Mestre: fonte da verdade =====

  _handlePlayerSheet(conn, payload) {
    const p = payload || {};
    const existing = this.combatState.get(conn.connectionId);
    const entry = existing || { name: '', charName: '', hpMax: 0, hpCurrent: 0, hpTouched: false, delta: 1 };
    entry.name = p.name || conn.metadata?.name || entry.name || 'Jogador';
    if (p.charName !== undefined) {
      if (p.charName !== entry.charName) entry.hpTouched = false;
      entry.charName = p.charName;
    }
    // Só aceita HP novo se o Mestre ainda não mexeu no estado do jogador.
    if (!entry.hpTouched) {
      if (p.hpMax !== undefined) entry.hpMax = parseInt(p.hpMax, 10) || 0;
      if (p.hpCurrent !== undefined) entry.hpCurrent = parseInt(p.hpCurrent, 10) || 0;
    }
    this.combatState.set(conn.connectionId, entry);
    this.playerNames.set(conn.connectionId, entry.name);
    this.setStatus(this._t('mp_msg_sheet_received', { name: entry.charName || entry.name }), 'success');
    this._syncUI();
    this.broadcastState();
  },

  updatePlayerHp(connId, { hpCurrent, hpMax }) {
    if (this.role !== 'host') return;
    const entry = this.combatState.get(connId);
    if (!entry) return;
    if (hpMax !== undefined) entry.hpMax = parseInt(hpMax, 10) || 0;
    if (hpCurrent !== undefined) {
      entry.hpCurrent = entry.hpMax > 0 ? Math.min(parseInt(hpCurrent, 10) || 0, entry.hpMax) : (parseInt(hpCurrent, 10) || 0);
    }
    entry.hpTouched = true;
    this.setStatus(this._t('mp_msg_hp_updated', { name: entry.charName || entry.name, hp: entry.hpCurrent }), 'success');
    this._syncUI();
    this.broadcastState();
  },

  damagePlayer(connId, amount) {
    if (this.role !== 'host') return;
    const entry = this.combatState.get(connId);
    if (!entry) return;
    entry.hpCurrent = Math.max(0, (entry.hpCurrent || 0) - (Math.abs(amount) || 0));
    entry.hpTouched = true;
    this.setStatus(this._t('mp_msg_hp_updated', { name: entry.charName || entry.name, hp: entry.hpCurrent }), 'success');
    this._syncUI();
    this.broadcastState();
  },

  healPlayer(connId, amount) {
    if (this.role !== 'host') return;
    const entry = this.combatState.get(connId);
    if (!entry) return;
    const healed = (entry.hpCurrent || 0) + (Math.abs(amount) || 0);
    entry.hpCurrent = entry.hpMax > 0 ? Math.min(healed, entry.hpMax) : healed;
    entry.hpTouched = true;
    this.setStatus(this._t('mp_msg_hp_updated', { name: entry.charName || entry.name, hp: entry.hpCurrent }), 'success');
    this._syncUI();
    this.broadcastState();
  },

  broadcastState() {
    if (this.role !== 'host') return;
    const players = Array.from(this.combatState.entries()).map(([connId, p]) => ({
      id: connId,
      name: p.name,
      charName: p.charName,
      hpMax: p.hpMax,
      hpCurrent: p.hpCurrent
    }));
    const envelope = { v: 1, kind: 'state', from: this.peer.id, payload: { players } };
    this.connections.forEach((conn) => {
      if (conn.open) conn.send(envelope);
    });
    this._renderCombatPanel();
  },

  // ===== Jogador: aplica estado recebido do Mestre =====

  _applyState(payload) {
    const players = (payload && payload.players) || [];
    this.latestState = players;
    const me = this._findMyEntry(players);
    if (me) this._applyHp(me);
    this.setStatus(this._t('mp_msg_state_received'), 'info');
  },

  _findMyEntry(players) {
    if (!Array.isArray(players)) return null;
    const myId = this.connection && this.connection.connectionId;
    return players.find(p => p.id === myId) ||
           players.find(p => p.name === this.playerName) ||
           null;
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
    if (typeof saveCharacter === 'function') saveCharacter();
  },

  afterCharacterLoad() {
    if (this.role !== 'player') return;
    this.setHpLocked(true);
    this.sendSheet();
    const me = this._findMyEntry(this.latestState);
    if (me) this._applyHp(me);
  },

  setHpLocked(locked) {
    ['hpMax', 'hpCurrent'].forEach(name => {
      const el = document.querySelector(`input[name="${name}"]`);
      if (el) el.readOnly = locked;
    });
  },

  // ===== Rede genérica =====

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
      return;
    }
    if (!this.connection || !this.connection.open) {
      this.setStatus(this._t('mp_msg_no_conn'), 'error');
      return;
    }
    const envelope = { v: 1, kind: 'message', from: this.peer.id, payload };
    this.connection.send(envelope);
    this.setStatus(this._t('mp_msg_sent_to_host'), 'info');
  },

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
    this.latestState = null;
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

  _updateInfo() {
    const codeEl = document.getElementById('mp-code-text');
    if (codeEl) codeEl.textContent = this.roomCode || '-';
    const playersEl = document.getElementById('mp-players-text');
    if (playersEl) playersEl.textContent = this.role === 'host' ? this.connections.size : (this.connection ? 1 : 0);
  },

  _updateButtons() {
    const hostBtn = document.getElementById('mp-btn-host');
    const joinBtn = document.getElementById('mp-btn-join');
    const active = !!this.peer;
    if (hostBtn) hostBtn.disabled = active;
    if (joinBtn) joinBtn.disabled = active;
  },

  _syncUI() {
    this._updateInfo();
    this._updateButtons();
    this._renderCombatPanel();
  },

  _renderCombatPanel() {
    const panel = document.getElementById('mp-combat-panel');
    if (!panel) return;
    const isHost = this.role === 'host';
    panel.classList.toggle('hidden', !isHost);
    if (!isHost) return;

    const body = document.getElementById('mp-combat-body');
    const empty = document.getElementById('mp-combat-empty');
    if (!body) return;

    body.innerHTML = '';
    const entries = Array.from(this.combatState.entries());
    if (empty) empty.classList.toggle('hidden', entries.length > 0);

    entries.forEach(([connId, p]) => {
      const tr = document.createElement('tr');
      tr.dataset.conn = connId;

      const tdName = document.createElement('td');
      tdName.textContent = p.charName || p.name;
      tr.appendChild(tdName);

      const tdHp = document.createElement('td');
      const hpInput = document.createElement('input');
      hpInput.type = 'number';
      hpInput.className = 'mp-hp-edit mp-hp-current';
      hpInput.value = p.hpCurrent;
      hpInput.min = '0';
      const hpSep = document.createElement('span');
      hpSep.textContent = ' / ';
      const maxInput = document.createElement('input');
      maxInput.type = 'number';
      maxInput.className = 'mp-hp-edit mp-hp-max';
      maxInput.value = p.hpMax;
      maxInput.min = '0';
      tdHp.appendChild(hpInput);
      tdHp.appendChild(hpSep);
      tdHp.appendChild(maxInput);
      tr.appendChild(tdHp);

      const tdActions = document.createElement('td');
      tdActions.className = 'mp-combat-actions';
      const delta = document.createElement('input');
      delta.type = 'number';
      delta.className = 'mp-combat-delta';
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

      body.appendChild(tr);
    });
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
  const body = document.getElementById('mp-combat-body');

  body && body.addEventListener('click', (e) => {
    const btn = e.target.closest('.mp-btn-dmg, .mp-btn-heal');
    if (!btn) return;
    const tr = btn.closest('tr');
    const connId = tr && tr.dataset.conn;
    if (!connId) return;
    const deltaEl = tr.querySelector('.mp-combat-delta');
    const delta = parseInt(deltaEl && deltaEl.value, 10) || 1;
    if (btn.classList.contains('mp-btn-dmg')) Multiplayer.damagePlayer(connId, delta);
    else Multiplayer.healPlayer(connId, delta);
  });

  body && body.addEventListener('change', (e) => {
    if (e.target.classList.contains('mp-combat-delta')) {
      const tr = e.target.closest('tr');
      const connId = tr && tr.dataset.conn;
      if (connId) {
        const entry = Multiplayer.combatState.get(connId);
        if (entry) entry.delta = parseInt(e.target.value, 10) || 1;
      }
      return;
    }
    if (!e.target.classList.contains('mp-hp-edit')) return;
    const tr = e.target.closest('tr');
    const connId = tr && tr.dataset.conn;
    if (!connId) return;
    Multiplayer.updatePlayerHp(connId, {
      hpCurrent: tr.querySelector('.mp-hp-current').value,
      hpMax: tr.querySelector('.mp-hp-max').value
    });
  });

  Multiplayer.onData = (payload) => {
    Multiplayer.setStatus(Multiplayer._t('mp_msg_received', { data: JSON.stringify(payload) }), 'success');
  };
});
