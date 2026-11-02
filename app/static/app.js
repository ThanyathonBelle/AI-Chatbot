/* KubeChat — no frontend framework or CDN needed for application logic. */
(() => {
  'use strict';
  const PATHS = {
    plus: '<path d="M12 5v14M5 12h14"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    settings: '<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="M19.3 15.1a1.8 1.8 0 0 0 .36 2l-1.5 1.5a1.8 1.8 0 0 0-2-.36l-.4.16-.7 2.1h-2.1l-.7-2.1-.4-.16a1.8 1.8 0 0 0-2 .36l-1.5-1.5a1.8 1.8 0 0 0 .36-2l-.16-.4-2.1-.7v-2.1l2.1-.7.16-.4a1.8 1.8 0 0 0-.36-2l1.5-1.5a1.8 1.8 0 0 0 2 .36l.4-.16.7-2.1h2.1l.7 2.1.4.16a1.8 1.8 0 0 0 2-.36l1.5 1.5a1.8 1.8 0 0 0-.36 2l.16.4 2.1.7v2.1l-2.1.7Z" transform="translate(-1 -1) scale(.96)"/>',
    'arrow-up-right': '<path d="M7 17 17 7M8 7h9v9"/>', boxes: '<path d="m12 2 8 5-8 5-8-5 8-5ZM4 12l8 5 8-5M4 17l8 5 8-5"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', download: '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    sliders: '<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="currentColor" stroke="none"/><circle cx="16" cy="17" r="2" fill="currentColor" stroke="none"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5"/>', 'chevron-down': '<path d="m6 9 6 6 6-6"/>',
    sparkles: '<path d="m12 3 1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9L12 3ZM20 18l.6 1.4L22 20l-1.4.6L20 22l-.6-1.4L18 20l1.4-.6L20 18Z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', 'hard-drive': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 12h18M7 16h.01M11 16h.01"/>',
    cloud: '<path d="M20 17a4 4 0 0 0-2.9-7.6 6 6 0 0 0-11.5 1.3A3.5 3.5 0 0 0 7 18h11"/>', zap: '<path d="m13 2-9 11h7l-1 9 10-12h-7l1-8Z"/>',
    code: '<path d="m8 8-4 4 4 4m8-8 4 4-4 4M14 4l-4 16"/>', lightbulb: '<path d="M9 18h6m-5 3h4M9 15c-2-1.2-3-3-3-5a6 6 0 0 1 12 0c0 2-1 3.8-3 5l-.5 2h-5L9 15Z"/>',
    'git-compare': '<path d="M6 3v12m0 0-3-3m3 3 3-3M18 21V9m0 0-3 3m3-3 3 3M6 3h8a4 4 0 0 1 4 4v2"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>', 'arrow-up': '<path d="M12 19V5m-6 6 6-6 6 6"/>', square: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    x: '<path d="M5 5 19 19M19 5 5 19"/>', network: '<rect x="9" y="2" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="16" y="16" width="6" height="6" rx="1"/><path d="M12 8v4M5 16v-4h14v4"/>',
    'shield-check': '<path d="m12 2 8 4v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6l8-4ZM9 12l2 2 4-4"/>', check: '<path d="m5 12 4 4L19 6"/>',
    'message-square': '<path d="M4 4h16v13H8l-4 4V4Z"/>', 'more-horizontal': '<circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/>',
    pencil: '<path d="m3 17 11-11 4 4-11 11H3v-4ZM13 7l3-3 4 4-3 3"/>', trash: '<path d="M4 7h16M10 4h4m-8 3 1 14h10l1-14M10 11v7m4-7v7"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    alert: '<path d="m12 3 10 18H2L12 3ZM12 9v5M12 18h.01"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-6 6-6 12 0 18m0-18c6 6 6 12 0 18"/>',
  };
  const icon = (name) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">${PATHS[name] || PATHS.info}</svg>`;
  const $ = (id) => document.getElementById(id);
  const elements = Object.fromEntries([
    'sidebar','sidebarScrim','historyList','chatCount','searchChats','newChat','menuToggle','sidebarSettings',
    'settingsBtn','settingsBackdrop','closeSettings','saveSettings','settingsProviders','systemPromptInput',
    'temperatureRange','tempValue','maxTokensInput','thinkToggle','providerSelect','modelSelect',
    'customModelWrap','customModelInput','typeBadge','modelInfoBtn','connectionTag','connectionLabel',
    'composerModel','promptInput','sendBtn','stopBtn','chatScroller','messageList','welcome',
    'toast','themeBtn','exportBtn','brandHome'
  ].map(id => [id, $(id)]));

  const defaults = {systemPrompt: "You are a helpful, accurate AI assistant. Respond in the user's language.", temperature: 0.7, maxTokens: 2048, think: false, theme: 'light'};
  function loadPreferences() {
    try { return {...defaults, ...JSON.parse(localStorage.getItem('kubechat:prefs') || '{}')}; }
    catch (_) { return {...defaults}; }
  }
  const state = {providers: [], providerId: '', modelCache: {}, modelsSelected: {}, sessions: [], messages: [], sessionId: null, generating: false, abort: null, prefs: loadPreferences(), renderQueued: false, navId: 0};
  try { state.modelsSelected = JSON.parse(localStorage.getItem('kubechat:models') || '{}'); } catch (_) {}

  function hydrateIcons(root = document) {
    root.querySelectorAll('.icon[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c])); }
  async function api(path, options = {}) {
    const res = await fetch(path, {cache:'no-store', ...options});
    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try {const body = await res.json(); message = typeof body.detail === 'string' ? body.detail : message;} catch (_) {}
      throw new Error(message);
    }
    return await res.json();
  }
  let toastTimer;
  function toast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => elements.toast.classList.remove('show'), 3500);
  }
  function formatTime(iso) {const d = new Date(iso); return Number.isNaN(+d) ? '' : d.toLocaleString(undefined, {month:'short',day:'numeric'});}
  function shortGroup(iso) {
    const d = new Date(iso), now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    const yesterday = new Date(now); yesterday.setDate(now.getDate()-1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return 'Earlier';
  }
  function currentProvider() {return state.providers.find(p => p.id === state.providerId);}
  function currentModel() {
    return elements.modelSelect.value === '__custom__' ? elements.customModelInput.value.trim() : elements.modelSelect.value;
  }
  function setTheme(theme) {
    state.prefs.theme = theme;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    elements.themeBtn.innerHTML = `<span class="icon">${icon(theme === 'dark' ? 'sun' : 'moon')}</span>`;
  }
  function updateComposer() {
    const p = currentProvider(); const model = currentModel();
    elements.composerModel.textContent = p ? `${p.name} · ${model || 'Choose a model'}` : 'Choose a model to start';
    elements.sendBtn.disabled = state.generating || !state.providerId || !model;
    elements.sendBtn.hidden = state.generating;
    elements.stopBtn.hidden = !state.generating;
    elements.connectionLabel.textContent = p?.configured ? `${p.kind === 'local' ? 'Local' : 'Cloud'} provider` : 'Not configured';
    elements.connectionTag.classList.toggle('off', !p?.configured);
  }
  async function loadProviders() {
    const data = await api('/api/providers');
    state.providers = data.providers || [];
    elements.providerSelect.replaceChildren();
    for (const p of state.providers) {
      const option = document.createElement('option');
      option.value = p.id; option.textContent = `${p.name}${p.configured ? '' : ' · Setup required'}`;
      option.disabled = !p.configured;
      elements.providerSelect.append(option);
    }
    const preferred = localStorage.getItem('kubechat:provider');
    const chosen = state.providers.find(p => p.id === preferred && p.configured) || state.providers.find(p => p.configured);
    state.providerId = chosen?.id || '';
    elements.providerSelect.value = state.providerId;
    await loadModels();
    renderSettingsProviders();
  }
  async function loadModels() {
    const p = currentProvider();
    if (!p) return;
    const previousProvider = p.id;
    elements.modelSelect.disabled = true;
    elements.modelSelect.replaceChildren(new Option('Loading models…', ''));
    let available = p.models;
    let warning;
    try {
      const result = await api(`/api/models?provider=${encodeURIComponent(p.id)}`);
      available = result.models || [];
      warning = result.warning;
    } catch (error) {warning = error.message;}
    if (state.providerId !== previousProvider) return;
    if (warning) toast(warning);
    state.modelCache[p.id] = available;
    elements.modelSelect.replaceChildren();
    for (const m of available) elements.modelSelect.add(new Option(m, m));
    elements.modelSelect.add(new Option('Custom model ID…', '__custom__'));
    const desired = state.modelsSelected[p.id];
    if (desired && available.includes(desired)) elements.modelSelect.value = desired;
    else if (desired && !available.includes(desired)) {
      elements.modelSelect.value = '__custom__'; elements.customModelInput.value = desired;
    } else elements.modelSelect.value = available[0] || '__custom__';
    elements.modelSelect.disabled = false;
    elements.customModelWrap.hidden = elements.modelSelect.value !== '__custom__';
    elements.typeBadge.textContent = p.kind.toUpperCase();
    elements.typeBadge.className = `type-badge ${p.kind}`;
    updateComposer();
  }
  function rememberModel() {
    state.modelsSelected[state.providerId] = currentModel();
    localStorage.setItem('kubechat:models', JSON.stringify(state.modelsSelected));
    updateComposer();
  }
  async function loadSessions() {
    try {
      const data = await api('/api/sessions'); state.sessions = data.sessions || [];
      renderHistory();
    } catch (error) { elements.historyList.innerHTML = `<div class="history-empty">${escapeHtml(error.message)}</div>`; }
  }
  function renderHistory() {
    const q = elements.searchChats.value.toLowerCase().trim();
    const filtered = state.sessions.filter(s => s.title.toLowerCase().includes(q));
    elements.chatCount.textContent = state.sessions.length;
    let oldGroup = '';
    const parts = [];
    for (const item of filtered) {
      const group = shortGroup(item.updated_at);
      if (group !== oldGroup) {parts.push(`<div class="history-group">${group}</div>`); oldGroup = group;}
      parts.push(`<div class="history-item ${state.sessionId === item.id ? 'active' : ''}" data-session="${escapeHtml(item.id)}" role="button" tabindex="0" title="${escapeHtml(item.title)}">
        <span class="icon history-icon">${icon('message-square')}</span><span class="history-title">${escapeHtml(item.title)}</span><button class="history-more" data-menu="${escapeHtml(item.id)}" aria-label="Chat options">${icon('more-horizontal')}</button>
      </div>`);
    }
    elements.historyList.innerHTML = parts.join('') || `<div class="history-empty">${q ? 'No matching conversations.' : 'No conversations yet.\nStart something new.'}</div>`;
  }
  function closeMenus() {elements.historyList.querySelectorAll('.history-actions').forEach(el => el.remove());}
  function openHistoryMenu(id, trigger) {
    const already = trigger.parentElement.querySelector('.history-actions');
    closeMenus(); if (already) return;
    const menu = document.createElement('div'); menu.className = 'history-actions';
    menu.innerHTML = `<button data-action="rename" data-id="${escapeHtml(id)}">${icon('pencil')} Rename</button><button class="delete-action" data-action="delete" data-id="${escapeHtml(id)}">${icon('trash')} Delete</button>`;
    trigger.parentElement.append(menu);
  }
  async function performHistoryAction(action, id) {
    const chat = state.sessions.find(s => s.id === id);
    if (!chat) return;
    if (action === 'rename') {
      const title = window.prompt('Rename conversation', chat.title);
      if (!title?.trim()) return;
      try {await api(`/api/sessions/${encodeURIComponent(id)}`, {method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({title:title.trim().slice(0,120)})}); await loadSessions();}
      catch (error) {toast(error.message);}
    }
    if (action === 'delete') {
      if (!window.confirm(`Delete "${chat.title}"? This can't be undone.`)) return;
      try {await api(`/api/sessions/${encodeURIComponent(id)}`, {method:'DELETE'}); if (state.sessionId === id) newChat(); await loadSessions();}
      catch (error) {toast(error.message);}
    }
  }
  function closeSidebar() {elements.sidebar.classList.remove('open'); elements.sidebarScrim.classList.remove('open');}
  function newChat() {
    state.navId++;
    if (state.abort) state.abort.abort();
    state.sessionId = null; state.messages = []; state.generating = false; state.abort = null;
    localStorage.removeItem('kubechat:lastSession');
    renderMessages(); renderHistory(); updateComposer(); closeSidebar();
    elements.promptInput.focus();
  }
  async function openSession(id) {
    if (!id) {newChat(); return;}
    if (state.abort) state.abort.abort();
    const seq = ++state.navId;
    state.generating = false; state.abort = null;
    try {
      const result = await api(`/api/sessions/${encodeURIComponent(id)}`);
      if (seq !== state.navId) return;
      state.sessionId = id; state.messages = result.messages || [];
      localStorage.setItem('kubechat:lastSession', id);
      renderMessages(true); renderHistory(); updateComposer(); closeSidebar();
    } catch (error) {toast(error.message);}
  }
  function inlineMd(raw) {
    let s = escapeHtml(raw);
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, label, url) => {
      let safe = ''; try { const u = new URL(url.replace(/&amp;/g, '&')); if (['http:','https:'].includes(u.protocol)) safe = escapeHtml(u.href); } catch (_) {}
      return safe ? `<a href="${safe}" rel="noopener noreferrer" target="_blank">${label}</a>` : label;
    });
    s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__(.+?)__/g, '<strong>$1</strong>');
    s = s.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
    return s;
  }
  function markdown(raw) {
    const lines = String(raw).replace(/\r\n/g, '\n').split('\n');
    const out = []; let code = false, codeLines = [], language = '', list = '', paragraph = [], quoteLines = [];
    function flushParagraph() {if (paragraph.length) {out.push(`<p>${paragraph.map(inlineMd).join('<br>')}</p>`);paragraph=[];}}
    function flushList() {if (list) {out.push(`</${list}>`); list='';}}
    function flushQuote() {if (quoteLines.length) {out.push(`<blockquote>${quoteLines.map(inlineMd).join('<br>')}</blockquote>`); quoteLines=[];}}
    for (let i=0;i<lines.length;i++) {
      const line = lines[i], t = line.trim();
      if (/^\s*```/.test(line)) {
        flushParagraph();flushList();flushQuote();
        if (!code) {code=true;codeLines=[];language=t.slice(3).slice(0,24);} else {out.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);code=false;}
        continue;
      }
      if (code) {codeLines.push(line);continue;}
      if (!t) {flushParagraph();flushList();flushQuote();continue;}
      const heading = t.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {flushParagraph();flushList();flushQuote();const n=heading[1].length;out.push(`<h${n}>${inlineMd(heading[2])}</h${n}>`);continue;}
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) {flushParagraph();flushList();flushQuote();out.push('<hr>');continue;}
      if (t.startsWith('> ')) {flushParagraph();flushList();quoteLines.push(t.slice(2));continue;}
      flushQuote();
      const bullet = t.match(/^[-*+]\s+(.+)$/), number = t.match(/^\d+[.)]\s+(.+)$/);
      if (bullet || number) {
        flushParagraph();const kind = bullet ? 'ul' : 'ol';
        if (list && list!==kind) flushList();
        if (!list) {out.push(`<${kind}>`);list=kind;}
        out.push(`<li>${inlineMd((bullet || number)[1])}</li>`);continue;
      }
      flushList();
      // Simple GitHub-style Markdown tables; all cells are escaped.
      if (t.includes('|') && i+1 < lines.length && /^\|?[\s|:\-]+\|?$/.test(lines[i+1]) && lines[i+1].includes('-')) {
        flushParagraph();
        const cells = row => row.replace(/^\|/,'').replace(/\|$/,'').split('|').map(c=>c.trim());
        out.push('<div class="table-wrap"><table><thead><tr>'+cells(t).map(c=>`<th>${inlineMd(c)}</th>`).join('')+'</tr></thead><tbody>');
        i+=2;
        while(i<lines.length && lines[i].includes('|') && lines[i].trim()) {
          out.push('<tr>'+cells(lines[i]).map(c=>`<td>${inlineMd(c)}</td>`).join('')+'</tr>');i++;
        }
        out.push('</tbody></table></div>');i--;continue;
      }
      paragraph.push(line);
    }
    flushParagraph();flushList();flushQuote();
    if (code) out.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
    return out.join('');
  }
  function renderMessages(forceScroll = false) {
    const hasMessages = state.messages.length > 0;
    elements.welcome.hidden = hasMessages;
    elements.messageList.hidden = !hasMessages;
    if (!hasMessages) {elements.messageList.innerHTML='';return;}
    const scroll = elements.chatScroller;
    const shouldScroll = forceScroll || (scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight < 150);
    elements.messageList.innerHTML = state.messages.map((m, index) => {
      const user = m.role === 'user'; const content = m.content || '';
      const brand = user ? 'You' : 'KubeChat';
      const model = !user && m.model ? `<span class="message-model">· ${escapeHtml(m.model)}</span>` : '';
      const body = content ? markdown(content) : (m.streaming ? '<span class="typing-indicator"><i></i><i></i><i></i></span>' : '');
      const error = m.error ? `<div class="message-error"><span class="icon">${icon('alert')}</span>${escapeHtml(m.error)}</div>` : '';
      return `<article class="message ${user ? 'user' : 'assistant'}">
        ${!user ? `<div class="message-avatar">${icon('sparkles')}</div>` : ''}
        <div class="message-body">${!user ? `<div class="message-meta">${brand} ${model}</div>` : ''}<div class="message-text">${body}</div>${error}
        ${content && !m.streaming ? `<div class="message-actions"><button class="message-action" data-copy="${index}">${icon('copy')} Copy</button></div>` : ''}</div></article>`;
    }).join('');
    if (shouldScroll) requestAnimationFrame(()=>{scroll.scrollTop=scroll.scrollHeight;});
  }
  function queueRender() { if (state.renderQueued) return; state.renderQueued=true; requestAnimationFrame(()=>{state.renderQueued=false;renderMessages();}); }
  function autoResize() {const el=elements.promptInput;el.style.height='auto';el.style.height=Math.min(el.scrollHeight,160)+'px';}
  function downloadChat() {
    if (!state.messages.length) {toast('Start a conversation before exporting.');return;}
    const title = state.sessions.find(s=>s.id===state.sessionId)?.title || 'Conversation';
    const doc = `# ${title}\n\n` + state.messages.map(m=>`## ${m.role === 'user' ? 'You' : 'Assistant'}${m.model ? ` · ${m.model}`:''}\n\n${m.content}\n`).join('\n---\n\n');
    const blob = new Blob([doc],{type:'text/markdown;charset=utf-8'});
    const url = URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`kubechat-${new Date().toISOString().slice(0,10)}.md`;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
  }
  async function copyText(text) {
    try {await navigator.clipboard.writeText(text);toast('Copied to clipboard');}
    catch (_) {toast('Unable to copy. Check browser clipboard permission.');}
  }
  function handleEvent(name, data, aiMessage) {
    if (name === 'start') {
      state.sessionId = data.session_id;
      localStorage.setItem('kubechat:lastSession', state.sessionId);
    } else if (name === 'delta') {
      aiMessage.content += data.text || '';
      queueRender();
    } else if (name === 'error') {
      aiMessage.error = data.message || 'Provider returned an error';
      aiMessage.streaming = false;
      renderMessages();
    } else if (name === 'done') {
      aiMessage.streaming = false;
      renderMessages();
    }
  }
  async function sendMessage() {
    if (state.generating) return;
    const prompt = elements.promptInput.value.trim();
    const p = currentProvider(), model = currentModel();
    if (!prompt) return;
    if (!p || !p.configured) {toast('Configure a provider in .env first.');return;}
    if (!model) {toast('Select a model or enter a custom model ID.');return;}
    const controller = new AbortController();
    state.abort = controller; state.generating = true;
    const requestSessionId = state.sessionId;
    const user = {role:'user',content:prompt,model,provider:p.id};
    const assistant = {role:'assistant',content:'',model,provider:p.id,streaming:true};
    state.messages.push(user,assistant);
    elements.promptInput.value=''; autoResize();
    renderMessages(true);updateComposer();
    let streamHadDone = false;
    try {
      const response = await fetch('/api/chat/stream', {
        method:'POST', headers:{'Content-Type':'application/json'}, signal:controller.signal,
        body:JSON.stringify({session_id:requestSessionId, provider:p.id,model,prompt,system_prompt:state.prefs.systemPrompt,temperature:Number(state.prefs.temperature),max_tokens:Number(state.prefs.maxTokens),think:!!state.prefs.think}),
      });
      if (!response.ok) {
        let error=`HTTP ${response.status}`;
        try {const r=await response.json();error=typeof r.detail==='string'?r.detail:error;} catch (_) {}
        throw new Error(error);
      }
      const reader = response.body.getReader(); const decoder = new TextDecoder();let buf='';
      let lastEvent='message';
      function consume(frame) {
        let eventName='message', dataText='';
        for (const line of frame.split('\n')) {
          if (line.startsWith('event:')) eventName = line.slice(6).trim();
          else if (line.startsWith('data:')) dataText += line.slice(5).trimStart();
        }
        if (!dataText) return;
        try {const data=JSON.parse(dataText);handleEvent(eventName,data,assistant);if (eventName==='done') streamHadDone=true;}
        catch (error) { console.error('Invalid stream frame', error); }
      }
      for (;;) {
        const {value,done} = await reader.read();
        if (done) break;
        buf+=decoder.decode(value,{stream:true}).replace(/\r\n/g,'\n');
        let boundary;
        while ((boundary=buf.indexOf('\n\n'))!==-1) {consume(buf.slice(0,boundary));buf=buf.slice(boundary+2);}
      }
      if (buf.trim()) consume(buf);
      if (!assistant.error && !streamHadDone && !controller.signal.aborted) assistant.error = 'The connection ended before generation completed.';
    } catch (error) {
      if (error.name !== 'AbortError') assistant.error=error.message || 'Unable to reach the AI provider.';
    } finally {
      assistant.streaming=false;
      // The user may have navigated away during the stream.
      if (state.abort === controller) {state.abort=null;state.generating=false;updateComposer();renderMessages();await loadSessions();}
    }
  }
  function showSettings() {
    elements.systemPromptInput.value = state.prefs.systemPrompt;
    elements.temperatureRange.value = state.prefs.temperature;
    elements.tempValue.textContent = Number(state.prefs.temperature).toFixed(1);
    elements.maxTokensInput.value = state.prefs.maxTokens;
    elements.thinkToggle.checked = !!state.prefs.think;
    renderSettingsProviders();elements.settingsBackdrop.hidden=false;
  }
  function hideSettings(){elements.settingsBackdrop.hidden=true;}
  function renderSettingsProviders() {
    elements.settingsProviders.innerHTML = state.providers.map(p=>`<div class="settings-provider"><span class="provider-status ${p.configured ? 'ok':''}"></span><div><div class="settings-provider-name">${escapeHtml(p.name)}</div><div class="settings-provider-sub">${escapeHtml(p.endpoint || p.hint)}</div></div><span>${p.configured ? (p.kind==='cloud'?'Key loaded':'Configured'):'Not set'}</span></div>`).join('');
  }
  function saveSettings() {
    state.prefs.systemPrompt = elements.systemPromptInput.value;
    state.prefs.temperature = Number(elements.temperatureRange.value);
    state.prefs.maxTokens = Math.max(128,Math.min(8192,Number(elements.maxTokensInput.value)||2048));
    state.prefs.think = !!elements.thinkToggle.checked;
    localStorage.setItem('kubechat:prefs',JSON.stringify(state.prefs));
    hideSettings();toast('Preferences saved');
  }
  function registerEvents() {
    elements.newChat.addEventListener('click',newChat);
    elements.brandHome.addEventListener('click',e=>{e.preventDefault();newChat();});
    elements.searchChats.addEventListener('input',renderHistory);
    elements.historyList.addEventListener('click',e=>{
      const action=e.target.closest('[data-action]');if(action){e.stopPropagation();closeMenus();performHistoryAction(action.dataset.action,action.dataset.id);return;}
      const menu=e.target.closest('[data-menu]');if(menu){e.stopPropagation();openHistoryMenu(menu.dataset.menu,menu);return;}
      const item=e.target.closest('[data-session]');if(item)openSession(item.dataset.session);
    });
    elements.historyList.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('[data-session]'))openSession(e.target.dataset.session);});
    document.addEventListener('click',e=>{if(!e.target.closest('.history-more,.history-actions'))closeMenus();});
    elements.menuToggle.addEventListener('click',()=>{elements.sidebar.classList.add('open');elements.sidebarScrim.classList.add('open');});
    elements.sidebarScrim.addEventListener('click',closeSidebar);
    elements.providerSelect.addEventListener('change',async()=>{state.providerId=elements.providerSelect.value;localStorage.setItem('kubechat:provider',state.providerId);await loadModels();});
    elements.modelSelect.addEventListener('change',()=>{elements.customModelWrap.hidden=elements.modelSelect.value!=='__custom__';rememberModel();if(elements.modelSelect.value==='__custom__') elements.customModelInput.focus();});
    elements.customModelInput.addEventListener('input',rememberModel);
    elements.sendBtn.addEventListener('click',sendMessage);
    elements.stopBtn.addEventListener('click',()=>{if(state.abort)state.abort.abort();toast('Generation stopped');});
    elements.promptInput.addEventListener('input',autoResize);
    elements.promptInput.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();sendMessage();}});
    document.querySelectorAll('[data-prompt]').forEach(el=>el.addEventListener('click',()=>{elements.promptInput.value=el.dataset.prompt;autoResize();elements.promptInput.focus();}));
    for (const id of ['settingsBtn','sidebarSettings','modelInfoBtn']) elements[id].addEventListener('click',showSettings);
    elements.closeSettings.addEventListener('click',hideSettings);
    elements.settingsBackdrop.addEventListener('click',e=>{if(e.target===elements.settingsBackdrop)hideSettings();});
    elements.temperatureRange.addEventListener('input',()=>{elements.tempValue.textContent=Number(elements.temperatureRange.value).toFixed(1);});
    elements.saveSettings.addEventListener('click',saveSettings);
    elements.themeBtn.addEventListener('click',()=>{setTheme(state.prefs.theme==='dark'?'light':'dark');localStorage.setItem('kubechat:prefs',JSON.stringify(state.prefs));});
    elements.exportBtn.addEventListener('click',downloadChat);
    elements.messageList.addEventListener('click',e=>{const b=e.target.closest('[data-copy]');if(b){const msg=state.messages[Number(b.dataset.copy)];if(msg)copyText(msg.content);}});
    document.addEventListener('keydown',e=>{
      if(e.key==='Escape'){hideSettings();closeSidebar();closeMenus();}
      if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();newChat();}
      if(e.key==='/'&&document.activeElement?.tagName!=='INPUT'&&document.activeElement?.tagName!=='TEXTAREA'){e.preventDefault();elements.searchChats.focus();}
    });
  }
  async function start() {
    hydrateIcons();setTheme(state.prefs.theme);registerEvents();
    try {
      await Promise.all([loadProviders(),loadSessions()]);
      const last = localStorage.getItem('kubechat:lastSession');
      if (last && state.sessions.some(s=>s.id===last)) await openSession(last);
    } catch (error) {toast('Unable to connect to the KubeChat backend: '+error.message);}
    updateComposer();autoResize();
  }
  start();
})();
