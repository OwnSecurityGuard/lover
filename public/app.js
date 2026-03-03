const QUOTES = [
  { text: 'The best sleep aid: first, get really tired.', sub: '最佳睡眠助手：首先，你得变得非常疲惫' },
  {
    text: 'The most common mistake we make is to do a great job on an unimportant task.',
    sub: '我们最常见的错误就是在不重要的事情上做得很棒',
  },
  {
    text: 'There is no formula for success, but there are two for failure: not trying, and not persisting.',
    sub: '成功没有公式，不过失败有两个：不去尝试，以及无法坚持',
  },
  { text: 'Slow progress is a million times better than no progress.', sub: '进展很慢比没有进展好上一百万倍' },
  { text: 'When you are right, you are learning nothing.', sub: '当你是正确的时候，你啥也没学到' },
  {
    text: 'Education is overly expensive. Gladly pay for it anyway, because ignorance is even more expensive.',
    sub: '教育其实已经过于昂贵，但还是要支付，因为无知比它昂贵多了',
  },
  {
    text: 'What others want from you is mostly to be seen. Let others know you see them.',
    sub: '别人对你最大的期待，只是被看见，所以告诉他们你看到了他们',
  },
  { text: "Happy Girls' Day!", sub: '属于你的节日快乐~' },
];

const FLASH_WORDS = [
  'vectorize(memories)',
  'RAG(回忆检索)',
  'embedding++',
  'attention=ON',
  'teacher.sleep.api: 200 OK',
  'sincerity.dll loaded',
  'romance.ts compiling…',
  'cache: miss (yet)',
  'timeline: future++',
  'retry×3',
  'humor=true',
  'truth=very',
  'plan: giftFirst()',
];

const $ = (sel) => document.querySelector(sel);

function getSessionId() {
  const key = 'girlsday_session_id';
  let v = localStorage.getItem(key);
  if (!v) {
    v = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(key, v);
  }
  return v;
}

const sessionId = getSessionId();

async function postEvent(type, payload) {
  try {
    await fetch('/api/event', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId, type, payload: payload || null }),
    });
  } catch {
    // ignore
  }
}

async function fetchGift() {
  const res = await fetch('/api/gift');
  if (!res.ok) throw new Error('gift fetch failed');
  return res.json();
}

function smoothTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showToast(text) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = String(text);
  el.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove('show'), 2200);
}

function popAt(x, y, text, tone) {
  const layer = $('#popLayer');
  if (!layer) return;
  const s = document.createElement('span');
  s.className = 'pop';
  s.textContent = text;
  s.style.left = `${x}px`;
  s.style.top = `${y}px`;
  s.style.setProperty('--dx', `${(Math.random() * 54 - 27).toFixed(0)}px`);
  s.style.fontSize = `${Math.floor(18 + Math.random() * 14)}px`;
  if (tone === 'accent') s.style.color = 'rgba(203, 63, 45, 0.96)';
  if (tone === 'ok') s.style.color = 'rgba(42, 123, 111, 0.96)';
  if (tone === 'dark') s.style.color = 'rgba(30, 27, 22, 0.86)';
  layer.appendChild(s);
  setTimeout(() => s.remove(), 1100);
}

function popFromElement(el, texts, tone) {
  const r = el.getBoundingClientRect();
  const x = r.left + r.width * (0.25 + Math.random() * 0.5);
  const y = r.top + r.height * (0.25 + Math.random() * 0.5);
  const t = texts[Math.floor(Math.random() * texts.length)];
  popAt(x, y, t, tone);
}

function setupHeroFun() {
  const stamp = document.querySelector('.stamp');
  const btnPat = $('#btnPat');
  const btnStar = $('#btnStar');
  const sticker = $('#heroSticker');

  if (stamp) {
    stamp.addEventListener('click', async () => {
      for (let i = 0; i < 6; i += 1) popFromElement(stamp, ['Zzz', 'OK', '3.7', 'Hi', '★'], i % 2 ? 'accent' : 'ok');
      showToast('检测到点击：已触发“女生节小掉落”。（不是 bug，是彩蛋）');
      await postEvent('stamp_click');
    });
  }

  btnPat?.addEventListener('click', async () => {
    for (let i = 0; i < 4; i += 1) popFromElement(btnPat, ['轻轻拍', '别睡啦', '醒一下', '…还是睡吧'], 'dark');
    showToast('我：拍拍。你：继续睡。很合理。');
    await postEvent('hero_pat');
  });

  btnStar?.addEventListener('click', async () => {
    for (let i = 0; i < 7; i += 1) popFromElement(btnStar, ['★', '★', '★', 'A+', 'Nice'], 'accent');
    showToast('已加星。你负责发光，我负责在旁边当路灯。');
    await postEvent('hero_star');
  });

  sticker?.addEventListener('click', async () => {
    const awake = sticker.classList.toggle('awake');
    sticker.textContent = awake ? 'awake mode' : 'Zzz club';
    for (let i = 0; i < 6; i += 1) popFromElement(sticker, awake ? ['OK', 'Go', 'Nice'] : ['Zzz', '…', 'Zzz'], awake ? 'ok' : 'dark');
    showToast(awake ? '已切换：清醒模式（但不保证你真的清醒）。' : '已切换：打盹模式（这才符合人设）。');
    await postEvent('sticker_toggle', { awake });
  });
}

function setupQuoteDeck() {
  const total = QUOTES.length;
  const idxEl = $('#quoteIndex');
  const totalEl = $('#quoteTotal');
  const card = $('#quoteCardLarge');
  const enEl = $('#quoteEn');
  const cnEl = $('#quoteCn');
  const viewport = $('#quoteViewport');
  const btnPrev = $('#btnPrevQuote');
  const btnNext = $('#btnNextQuote');
  const btnAuto = $('#btnAutoQuote');
  const footer = $('#deckFooter');

  if (!idxEl || !totalEl || !card || !enEl || !cnEl || !viewport || !btnPrev || !btnNext || !btnAuto) return;
  totalEl.textContent = String(total);

  let idx = 0;
  let auto = false;
  let autoTimer = null;

  function bumpFooter() {
    if (!footer) return;
    const lines = [
      '我会的词不多，但我想把你喜欢的那几句先学会。',
      '这页不考词汇量，只考“我有没有认真听你说话”。',
      '如果你愿意，以后我想把“摘录”变成“回忆”。',
      'English teacher, please be gentle: I am trying.',
    ];
    footer.textContent = lines[Math.floor(Math.random() * lines.length)];
  }

  function render(direction) {
    idxEl.textContent = String(idx + 1);
    const q = QUOTES[idx];

    card.classList.remove('shiftLeft', 'shiftRight');
    card.offsetHeight;
    card.classList.add('ready');
    card.classList.add(direction === 'prev' ? 'shiftRight' : 'shiftLeft');

    enEl.textContent = q.text;
    cnEl.textContent = q.sub;

    try {
      enEl.animate(
        [
          { opacity: 0, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'translateY(0px)' },
        ],
        { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' },
      );
      cnEl.animate(
        [
          { opacity: 0, transform: 'translateY(6px)' },
          { opacity: 1, transform: 'translateY(0px)' },
        ],
        { duration: 460, delay: 40, easing: 'cubic-bezier(.2,.8,.2,1)' },
      );
    } catch {
      // ignore
    }

    if (idx === total - 1) showToast('最后一句了：你看，我真的有在“背这几句”。');
    bumpFooter();
  }

  function next(from) {
    idx = (idx + 1) % total;
    render('next');
    postEvent('quote_next', { from: from || 'button', idx });
  }

  function prev(from) {
    idx = (idx - 1 + total) % total;
    render('prev');
    postEvent('quote_prev', { from: from || 'button', idx });
  }

  function setAuto(on) {
    auto = on;
    btnAuto.textContent = `自动播放：${auto ? '开' : '关'}`;
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
    if (auto) {
      autoTimer = setInterval(() => next('auto'), 5200);
      showToast('自动播放开启：你负责看，我负责紧张。');
    }
    postEvent('quote_auto', { on: auto });
  }

  btnNext.addEventListener('click', () => next('button'));
  btnPrev.addEventListener('click', () => prev('button'));
  btnAuto.addEventListener('click', () => setAuto(!auto));

  viewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') next('key');
    if (e.key === 'ArrowLeft') prev('key');
  });

  let sx = 0;
  let sy = 0;
  viewport.addEventListener(
    'touchstart',
    (e) => {
      const t = e.touches && e.touches[0];
      if (!t) return;
      sx = t.clientX;
      sy = t.clientY;
    },
    { passive: true },
  );
  viewport.addEventListener(
    'touchend',
    (e) => {
      const t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      if (Math.abs(dx) < 42 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) next('swipe');
      else prev('swipe');
    },
    { passive: true },
  );

  const deck = $('#quoteDeck');
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          render('next');
          io.disconnect();
          postEvent('quote_deck_view');
        }
      }
    },
    { threshold: 0.18 },
  );
  if (deck) io.observe(deck);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function typeLine(container, text, cls, opts) {
  const el = document.createElement('div');
  el.className = `termLine ${cls || ''}`;
  container.appendChild(el);

  let out = '';
  const baseDelay = typeof opts?.baseDelay === 'number' ? opts.baseDelay : 16;
  for (let i = 0; i < text.length; i += 1) {
    out += text[i];
    el.textContent = out;
    await sleep(baseDelay + Math.random() * 18);
    if (Math.random() < 0.025) {
      el.textContent = `${out}▍`;
      await sleep(80);
    }
  }

  try {
    const lines = Array.from(container.querySelectorAll('.termLine'));
    while (lines.length > 18) {
      const n = lines.shift();
      n?.remove();
    }
    container.scrollTop = container.scrollHeight;
  } catch {
    // ignore
  }
}

async function runGenerator() {
  const termBody = $('#termBody');
  const termActions = $('#termActions');
  const after = $('#afterFailActions');
  const statusEl = $('#genStatus');
  const percentEl = $('#genPercent');
  const barEl = $('#genBar');
  const flashLayer = $('#flashLayer');

  if (!termBody || !termActions || !after) return;

  termActions.classList.add('hidden');
  after.classList.add('hidden');
  termBody.innerHTML = '';

  if (runGenerator._running) return;
  runGenerator._running = true;

  let pct = 0;
  const setPct = (v) => {
    pct = Math.max(0, Math.min(100, Math.floor(v)));
    if (percentEl) percentEl.textContent = `${pct}%`;
    if (barEl) barEl.style.width = `${pct}%`;
  };
  const setStatus = (s) => {
    if (statusEl) statusEl.textContent = String(s);
  };

  function capLines(max) {
    const nodes = termBody ? Array.from(termBody.querySelectorAll('.termLine')) : [];
    while (nodes.length > max) {
      const n = nodes.shift();
      n?.remove();
    }
  }

  function addLine(text, cls) {
    const el = document.createElement('div');
    el.className = `termLine ${cls || ''}`;
    el.textContent = text;
    termBody.appendChild(el);
    capLines(16);
    termBody.scrollTop = termBody.scrollHeight;
  }

  function flashWord() {
    if (!flashLayer) return;
    const w = FLASH_WORDS[Math.floor(Math.random() * FLASH_WORDS.length)];
    const el = document.createElement('span');
    const r = Math.random();
    const cls = r < 0.12 ? 'err' : r < 0.32 ? 'hot' : r < 0.52 ? 'ok' : '';
    el.className = `flash ${cls}`.trim();
    el.textContent = w;
    el.style.left = `${Math.floor(6 + Math.random() * 76)}%`;
    el.style.top = `${Math.floor(6 + Math.random() * 80)}%`;
    flashLayer.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }

  setStatus('boot');
  setPct(2);
  addLine('[boot] starting girlsday.generator…', 'faint');
  await sleep(260);

  const flashTimer = setInterval(() => {
    if (Math.random() < 0.88) flashWord();
  }, 170);

  const noiseTimer = setInterval(() => {
    if (Math.random() < 0.55) return;
    const n = [
      '[dbg] heartbeat ok',
      '[net] retrying…',
      '[io] reading memories.db',
      '[cpu] warming up sincerity cores',
      '[memo] note: 你今天也要对自己好一点',
    ];
    addLine(n[Math.floor(Math.random() * n.length)], 'faint');
  }, 420);

  const progressTimer = setInterval(() => {
    if (pct >= 86) return;
    const bump = 1 + Math.random() * 4;
    setPct(pct + bump);
  }, 320);

  try {
    setStatus('scan');
    await typeLine(termBody, '[scan] connecting to teacher.sleep.api…', 'faint', { baseDelay: 8 });
    await sleep(180);
    addLine('[ok] response: still sleepy (respect)', 'ok');
    await sleep(220);
    setPct(18);

    setStatus('memory_search');
    await typeLine(termBody, '[scan] searching shared memories…', 'faint', { baseDelay: 9 });
    await sleep(160);
    addLine('[warn] 回忆不足！！ (目前: 0 条)', 'warn');
    await sleep(260);
    setPct(39);

    setStatus('profile_fetch');
    await typeLine(termBody, '[scan] fetching her profile…', 'faint', { baseDelay: 9 });
    await sleep(180);
    addLine('[err] 信息不足！！ (字段缺失: 太多了我不敢说)', 'err');
    await sleep(220);
    setPct(62);

    setStatus('attempt_generate');
    await typeLine(termBody, '[try] generating surprise… (stubborn mode)', 'faint', { baseDelay: 8 });
    await sleep(240);
    addLine('[note] installing romance@0.0.1-beta…', 'faint');
    await sleep(180);
    addLine('[note] installing sincerity@latest…', 'faint');
    await sleep(180);
    setPct(86);

    await sleep(520);
    setStatus('finalize');
    setPct(93);
    await typeLine(termBody, '[final] assembling…', 'faint', { baseDelay: 10 });
    await sleep(420);

    setStatus('failed');
    setPct(100);
    addLine('[err] 生成失败：认识太短，数据太少', 'err');
    addLine('[tip] 但我有个替代方案：giftFirst(); storyLater();', 'ok');
    addLine('[tip] 来日方长：我们可以把“回忆不足”变成“回忆溢出”。', 'ok');
    await postEvent('generator_failed_shown');
    showToast('生成失败不是借口，是实话：我想把更大的惊喜留给以后。');
  } finally {
    clearInterval(flashTimer);
    clearInterval(noiseTimer);
    clearInterval(progressTimer);
    after.classList.remove('hidden');
    runGenerator._running = false;
  }
}

function setupModal() {
  const modal = $('#modal');
  const form = $('#profileForm');
  const btnClose = $('#btnClose');
  const btnCancel = $('#btnCancel');

  if (!modal || !form || !btnClose || !btnCancel) {
    return { open: () => {} };
  }

  function close() {
    try {
      modal.close();
    } catch {
      modal.removeAttribute('open');
    }
  }

  btnClose.addEventListener('click', () => {
    close();
    postEvent('profile_close');
  });
  btnCancel.addEventListener('click', () => {
    close();
    postEvent('profile_cancel');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const answers = Object.fromEntries(Array.from(fd.entries()).map(([k, v]) => [k, String(v).trim()]));

    await postEvent('profile_submit_click', { keys: Object.keys(answers) });
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId, answers }),
      });
    } catch {
      // ignore
    }

    close();
    await postEvent('profile_submitted');
    smoothTo('gift');
  });

  return {
    open: () => {
      postEvent('profile_open');
      try {
        modal.showModal();
      } catch {
        modal.setAttribute('open', '');
      }
    },
  };
}

async function setupGift() {
  const box = $('#giftBox');
  const card = $('#giftCard');
  const qr = $('#qrImg');
  const codeEl = $('#giftCode');
  const btnCopy = $('#btnCopy');
  const copied = $('#copied');

  if (!box || !card || !qr || !codeEl || !btnCopy || !copied) return;

  let gift = null;
  async function ensureGift() {
    if (gift) return gift;
    gift = await fetchGift();
    qr.src = gift.qrUrl;
    codeEl.textContent = gift.code;
    return gift;
  }

  box.addEventListener('click', async () => {
    box.classList.add('open');
    card.classList.remove('hidden');
    await ensureGift();
    await postEvent('gift_open');
  });

  btnCopy.addEventListener('click', async () => {
    await ensureGift();
    try {
      await navigator.clipboard.writeText(codeEl.textContent.trim());
      copied.classList.add('show');
      setTimeout(() => copied.classList.remove('show'), 2400);
      await postEvent('gift_copy');
    } catch {
      await postEvent('gift_copy_failed');
      alert('复制失败了，你可以长按/手动选中复制。');
    }
  });
}

function wireActions(modalApi) {
  $('#btnJumpGift')?.addEventListener('click', () => {
    postEvent('jump_gift');
    smoothTo('gift');
  });

  $('#btnStart')?.addEventListener('click', async () => {
    const btn = $('#btnStart');
    if (btn) btn.disabled = true;
    await postEvent('generator_start');
    await runGenerator();
  });

  $('#btnSkip')?.addEventListener('click', async () => {
    await postEvent('generator_skip');
    smoothTo('gift');
  });

  $('#btnFill')?.addEventListener('click', () => {
    postEvent('generator_fill');
    modalApi.open();
  });
}

function trackSectionViewOnce(id, eventType) {
  const el = document.getElementById(id);
  if (!el) return;
  let done = false;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!done && e.isIntersecting) {
          done = true;
          postEvent(eventType);
          io.disconnect();
        }
      }
    },
    { threshold: 0.22 },
  );
  io.observe(el);
}

async function main() {
  setupHeroFun();
  setupQuoteDeck();
  const modalApi = setupModal();
  wireActions(modalApi);
  await setupGift();
  trackSectionViewOnce('gift', 'gift_view');
  await postEvent('page_view', { tz: Intl.DateTimeFormat().resolvedOptions().timeZone || '' });
}

main();
