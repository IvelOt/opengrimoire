// ===== MULTIPLAYER NETWORK LAYER (WebRTC via PeerJS) =====
// Camada base de rede: o Mestre (Host) cria a sala usando um Peer com id "OG-XXXXXX"
// e os Jogadores conectam-se a esse Peer. O transporte é WebRTC (via PeerJS Cloud).

const Multiplayer = {
  role: null,                       // 'host' | 'player' | null
  peer: null,                       // Instância PeerJS
  roomCode: null,                   // Código da sala atual
  hostId: null,                     // 'OG-' + roomCode
  connections: new Map(),           // Host: connectionId -> DataConnection
  connection: null,                 // Jogador: DataConnection única para o Mestre
  playerNames: new Map(),           // Host: connectionId -> nome do jogador
  playerName: 'Jogador',

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

    const peer = new Peer(this.hostId);
    this.peer = peer;
    this._updateInfo();

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
    this.playerNames.set(conn.connectionId, conn.metadata?.name || 'Jogador');

    conn.on('data', (data) => this._handleIncoming(data, conn));
    conn.on('close', () => {
      this.connections.delete(conn.connectionId);
      this.playerNames.delete(conn.connectionId);
      this.setStatus(this._t('mp_msg_player_left', { count: this.connections.size }), 'info');
      if (this.onDisconnect) this.onDisconnect(conn);
      this._updateInfo();
    });
    conn.on('error', (err) => {
      this.setStatus(this._t('mp_msg_conn_error', { msg: err.message || err.type || err }), 'error');
    });

    this.setStatus(this._t('mp_msg_player_joined', { count: this.connections.size }), 'success');
    if (this.onConnection) this.onConnection(conn);
    this._updateInfo();
  },

  joinRoom(roomCode) {
    if (this.peer) {
      this.setStatus(this._t('mp_msg_active_session'), 'error');
      return false;
    }

    const nameEl = document.getElementById('mp-name-input');
    this.playerName = (nameEl && nameEl.value.trim()) || 'Jogador';

    const code = String(roomCode || this._roomInputValue() || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) {
      this.setStatus(this._t('mp_msg_invalid_code'), 'error');
      return false;
    }

    this.role = 'player';
    this.roomCode = code;
    this.hostId = 'OG-' + code;
    this._updateInfo();

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
    });
    conn.on('data', (data) => this._handleIncoming(data, conn));
    conn.on('close', () => {
      this.setStatus(this._t('mp_msg_conn_closed'), 'info');
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
        this._updateInfo();
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
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.connection = null;
    this.connections = new Map();
    this.playerNames = new Map();
    this.role = null;
    this.roomCode = null;
    this.hostId = null;
    this.setStatus(this._t('mp_msg_session_closed'), 'info');
    this._updateInfo();
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
    return str.replace(/\{(\w+)\}/g, (match, k) => (vars[k] !== undefined ? vars[k] : match));
  }
};

// ===== DEBUG WIRING =====

document.addEventListener('DOMContentLoaded', () => {
  Multiplayer.onData = (payload) => {
    Multiplayer.setStatus(Multiplayer._t('mp_msg_received', { data: JSON.stringify(payload) }), 'success');
  };
});
