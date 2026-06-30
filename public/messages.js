// messages.js — Direct messaging frontend
const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

let currentUserId = null;
let activeChatUserId = null;
let conversations = [];
let pollInterval = null;

// Init
(async function init() {
  try {
    const res = await fetch('/api/users/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const user = await res.json();
      currentUserId = user.id;
    } else {
      window.location.href = 'login.html';
      return;
    }
  } catch (e) {
    console.error('Auth error:', e);
    window.location.href = 'login.html';
    return;
  }

  loadConversations();
  loadInvites();

  // Poll for new messages every 4 seconds
  pollInterval = setInterval(() => {
    loadConversations();
    if (activeChatUserId) loadMessages(activeChatUserId, true);
    loadInvites();
  }, 4000);
})();

// Tab switching
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

  document.getElementById('conversationsList').style.display = tab === 'conversations' ? 'block' : 'none';
  document.getElementById('invitesList').style.display = tab === 'invites' ? 'block' : 'none';
}

// Load conversations
async function loadConversations() {
  try {
    const res = await fetch('/api/messages/conversations', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    conversations = await res.json();
    renderConversations();
  } catch (e) {
    console.error('Error loading conversations:', e);
  }
}

function renderConversations() {
  const list = document.getElementById('conversationsList');
  if (conversations.length === 0) {
    list.innerHTML = `
      <div class="empty-state" style="padding: 3rem 1.5rem;">
        <span class="emoji">📭</span>
        <p style="font-size: 0.85rem;">No conversations yet. Send a chat invite to a community member!</p>
      </div>`;
    return;
  }

  list.innerHTML = conversations.map(c => {
    const initial = (c.name || '?').charAt(0).toUpperCase();
    const avatarHtml = c.profile_picture_base64
      ? `<img src="data:image/jpeg;base64,${c.profile_picture_base64}" alt="${c.name}">`
      : initial;
    const time = c.last_message_time ? formatTime(c.last_message_time) : '';
    const isActive = activeChatUserId === c.user_id;

    return `
      <div class="conversation-item ${isActive ? 'active' : ''}" onclick="openChat(${c.user_id})">
        <div class="conv-avatar">${avatarHtml}</div>
        <div class="conv-info">
          <div class="conv-name">${escapeHtml(c.name)}</div>
          <div class="conv-preview">${c.last_message ? escapeHtml(c.last_message) : '<i>No messages yet</i>'}</div>
        </div>
        <div class="conv-meta">
          <div class="conv-time">${time}</div>
          ${c.unread_count > 0 ? `<div class="conv-unread">${c.unread_count}</div>` : ''}
        </div>
      </div>`;
  }).join('');
}

// Load invites
async function loadInvites() {
  try {
    const res = await fetch('/api/messages/invites', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    const invites = await res.json();
    renderInvites(invites);
  } catch (e) {
    console.error('Error loading invites:', e);
  }
}

function renderInvites(invites) {
  const list = document.getElementById('invitesList');
  const badge = document.getElementById('inviteBadge');

  const receivedPending = invites.filter(i => i.receiver_id === currentUserId && i.status === 'pending');
  badge.textContent = receivedPending.length;
  badge.style.display = receivedPending.length > 0 ? 'inline-block' : 'none';

  if (invites.length === 0) {
    list.innerHTML = `
      <div class="empty-state" style="padding: 3rem 1.5rem;">
        <span class="emoji">📨</span>
        <p style="font-size: 0.85rem;">No pending invites.</p>
      </div>`;
    return;
  }

  list.innerHTML = invites.map(inv => {
    const isSender = inv.sender_id === currentUserId;
    const otherName = isSender ? inv.receiver_name : inv.sender_name;
    const initial = (otherName || '?').charAt(0).toUpperCase();

    let actionsHtml = '';
    if (!isSender && inv.status === 'pending') {
      actionsHtml = `
        <div class="invite-actions">
          <button class="btn primary small" onclick="respondInvite(${inv.id}, 'accept')">Accept</button>
          <button class="btn outline small" onclick="respondInvite(${inv.id}, 'reject')">Decline</button>
        </div>`;
    } else if (isSender && inv.status === 'pending') {
      actionsHtml = `<span class="invite-direction">⏳ Waiting</span>`;
    } else {
      actionsHtml = `<span class="invite-direction">${inv.status}</span>`;
    }

    return `
      <div class="invite-item">
        <div class="conv-avatar">${initial}</div>
        <div class="conv-info">
          <div class="conv-name">${escapeHtml(otherName)}</div>
          <div class="invite-direction">${isSender ? 'Sent by you' : 'Received'}</div>
        </div>
        ${actionsHtml}
      </div>`;
  }).join('');
}

async function respondInvite(inviteId, action) {
  try {
    const res = await fetch(`/api/messages/invites/${inviteId}/${action}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.ok) {
      window.showAlert(data.message || `Invite ${action}ed`);
      loadInvites();
      loadConversations();
    } else {
      window.showAlert(data.error || 'Failed', 'error');
    }
  } catch (e) {
    window.showAlert('Error responding to invite', 'error');
  }
}

// Open a chat
async function openChat(userId) {
  activeChatUserId = userId;

  // Show chat panel (mobile)
  const chatPanel = document.getElementById('chatPanel');
  const convPanel = document.getElementById('conversationsPanel');
  chatPanel.classList.add('active');
  convPanel.classList.add('hidden-mobile');

  // Show active view, hide empty state
  document.getElementById('chatEmptyState').style.display = 'none';
  const activeView = document.getElementById('chatActiveView');
  activeView.style.display = 'flex';

  // Update header from conversation data
  const conv = conversations.find(c => c.user_id === userId);
  if (conv) {
    document.getElementById('chatUserName').textContent = conv.name;
    document.getElementById('chatUserHandle').textContent = `@${conv.username || 'user'}`;
    const avatarEl = document.getElementById('chatAvatar');
    if (conv.profile_picture_base64) {
      avatarEl.innerHTML = `<img src="data:image/jpeg;base64,${conv.profile_picture_base64}" alt="${conv.name}">`;
    } else {
      avatarEl.textContent = (conv.name || '?').charAt(0).toUpperCase();
    }
  }

  // Highlight active conversation
  renderConversations();

  loadMessages(userId);

  // Focus input
  document.getElementById('msgInput').focus();
}

function closeChatMobile() {
  activeChatUserId = null;
  const chatPanel = document.getElementById('chatPanel');
  const convPanel = document.getElementById('conversationsPanel');
  chatPanel.classList.remove('active');
  convPanel.classList.remove('hidden-mobile');
  document.getElementById('chatEmptyState').style.display = 'flex';
  document.getElementById('chatActiveView').style.display = 'none';
}

// Load messages
async function loadMessages(userId, silent = false) {
  try {
    const res = await fetch(`/api/messages/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      if (!silent) window.showAlert('Could not load messages', 'error');
      return;
    }
    const messages = await res.json();
    renderMessages(messages);
  } catch (e) {
    if (!silent) console.error('Error loading messages:', e);
  }
}

function renderMessages(messages) {
  const container = document.getElementById('chatMessages');
  if (messages.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="height: 100%;">
        <span class="emoji">👋</span>
        <p>Say hello! Start the conversation.</p>
      </div>`;
    return;
  }

  let html = '';
  let lastDate = '';

  messages.forEach(msg => {
    const date = new Date(msg.created_at);
    const dateStr = date.toLocaleDateString();
    if (dateStr !== lastDate) {
      html += `<div class="date-separator"><span>${formatDate(date)}</span></div>`;
      lastDate = dateStr;
    }

    const isMine = msg.sender_id === currentUserId;
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    html += `
      <div class="msg-bubble ${isMine ? 'mine' : 'theirs'}">
        ${escapeHtml(msg.message)}
        <div class="msg-time">${timeStr}</div>
      </div>`;
  });

  const wasAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80;
  container.innerHTML = html;
  if (wasAtBottom) container.scrollTop = container.scrollHeight;
}

// Send message
async function sendMessage() {
  const input = document.getElementById('msgInput');
  const text = input.value.trim();
  if (!text || !activeChatUserId) return;

  input.value = '';

  try {
    const res = await fetch(`/api/messages/${activeChatUserId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: text })
    });

    if (res.ok) {
      loadMessages(activeChatUserId);
      loadConversations();
    } else {
      const data = await res.json();
      window.showAlert(data.error || 'Failed to send', 'error');
      input.value = text; // Restore unsent message
    }
  } catch (e) {
    window.showAlert('Error sending message', 'error');
    input.value = text;
  }
}

// Enter key to send
document.getElementById('msgInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Utility functions
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatTime(timestamp) {
  const d = new Date(timestamp);
  const now = new Date();
  const diff = now - d;

  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDate(d) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today - msgDay;

  if (diff === 0) return 'Today';
  if (diff === 86400000) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
}
