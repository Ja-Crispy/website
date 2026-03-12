/* ============================================
   rotating footer sign-offs
   ============================================ */
const SIGNOFFS = [
  // ml / optimization
  'rolling towards the global minima',
  'somewhere on the loss landscape',
  'exploring the manifold',
  'stuck in a local optimum, but the view is nice',
  'gradient: nonzero',
  'backpropagating through life',
  'overfitting to reality',
  'attention is all you need',
  // subleq / research
  'subtracting towards something',
  'one instruction at a time',
  'if mem[b] <= 0: goto next',
  'still mutating',
  'searching for the basin',
  'evolving in the dark',
  // life
  'tending the garden',
  'chaos is beauty',
  'looking through a small, carefully curated window',
  // dev / meta
  'just vanilla html/css/js',
  'view source, i dare you',
  'no frameworks were harmed',
  'works on my machine',
  'it\'s not a bug, it\'s a feature',
  // old internet / memes
  'all your base are belong to us',
  'the cake is a lie',
  'do a barrel roll',
  'it\'s over 9000',
  'this is fine',
  'sudo make me a sandwich',
  'there is no spoon',
  '42',
  'hello, world',
  'have you tried turning it off and on again',
  'it\'s dangerous to go alone',
  'i am become dev, destroyer of bugs',
  'we\'re all stories in the end',
  'here be dragons',
  'rm -rf / (just kidding)',
  'i for one welcome our new robot overlords',
];

function initFooterSignoff() {
  const el = document.getElementById('footer-signoff');
  if (!el) return;
  el.textContent = SIGNOFFS[Math.floor(Math.random() * SIGNOFFS.length)];
}


/* ============================================
   command palette
   ============================================ */
const CommandPalette = {
  commands: [
    { name: 'home',            icon: '~',  type: 'page',   target: '/' },
    { name: 'blog',            icon: '/',  type: 'page',   target: '/blog/' },
    { name: 'work & projects', icon: '>',  type: 'page',   target: '/work.html' },
    { name: 'github',          icon: '@',  type: 'ext',    target: 'https://github.com/Ja-Crispy' },
    { name: 'linkedin',        icon: '@',  type: 'ext',    target: 'https://www.linkedin.com/in/vaishnav-varma/' },
    { name: 'email',           icon: '@',  type: 'ext',    target: 'mailto:vaisgovivarma@gmail.com' },
  ],

  secrets: {
    'garden':          'seeds planted. watching them grow...',
    '/garden':         'seeds planted. watching them grow...',
    'hello world':     'hello, friend.',
    'hello':           'hello, friend.',
    '42':              'the answer to life, the universe, and everything.',
    'all your base':   'all your base are belong to us',
    'sudo':            'nice try.',
    'vim':             'how do i exit',
    'emacs':           'M-x butterfly',
    'leeroy':          'LEEROOOOY JENKIIIIINS',
    'cake':            'the cake is a lie.',
    'konami':          '\u2191\u2191\u2193\u2193\u2190\u2192\u2190\u2192BA \u2014 you know the way.',
    'meaning of life': 'see also: 42',
    'matrix':          'there is no spoon.',
    'help':            'try: garden, doom, 42, all your base, konami',
    'xkcd':            'sudo chown -R us /your/base',
    'rickroll':        'never gonna give you up.',
    'i am groot':      'i am groot.',
    'bazinga':         'no.',
    'ping':            'pong.',
    'make me a sandwich': 'what? make it yourself.',
    'sudo make me a sandwich': 'okay.',
  },

  fuse: null,
  palette: null,
  input: null,
  results: null,
  selectedIndex: 0,
  isOpen: false,

  init() {
    this.palette = document.getElementById('command-palette');
    this.input = document.getElementById('command-input');
    this.results = document.getElementById('command-results');

    if (!this.palette || !this.input) return;

    this.fuse = new Fuse(this.commands, {
      keys: ['name'],
      threshold: 0.35,
      includeScore: true
    });

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.toggle();
      }
      if (e.key === 'Escape' && this.isOpen) {
        this.hide();
      }
    });

    this.input.addEventListener('input', () => this.search(this.input.value));

    this.input.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      const items = this.results.querySelectorAll('.command-palette__item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectedIndex = (this.selectedIndex + 1) % (items.length || 1);
        this.updateSelection(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectedIndex = (this.selectedIndex - 1 + (items.length || 1)) % (items.length || 1);
        this.updateSelection(items);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.execute(items);
      }
    });

    this.palette.addEventListener('click', (e) => {
      if (e.target === this.palette) this.hide();
    });

    document.getElementById('cmd-hint')?.addEventListener('click', () => this.toggle());
  },

  toggle() {
    this.isOpen ? this.hide() : this.show();
  },

  show() {
    this.palette.classList.remove('hidden');
    this.input.focus();
    this.isOpen = true;
    this.selectedIndex = 0;
    this.search('');
  },

  hide() {
    this.palette.classList.add('hidden');
    this.input.value = '';
    this.results.textContent = '';
    this.isOpen = false;
  },

  search(query) {
    let items = this.commands;
    if (query.trim()) {
      items = this.fuse.search(query).map(r => r.item);
    }
    this.selectedIndex = 0;
    this.render(items);
  },

  render(items) {
    this.results.textContent = '';

    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'command-palette__empty';
      empty.textContent = 'no results';
      this.results.appendChild(empty);
      return;
    }

    items.forEach((item, i) => {
      const row = document.createElement('div');
      row.className = 'command-palette__item' + (i === this.selectedIndex ? ' selected' : '');
      row.dataset.index = i;

      const icon = document.createElement('span');
      icon.className = 'command-palette__item-icon';
      icon.textContent = item.icon;

      const name = document.createElement('span');
      name.className = 'command-palette__item-name';
      name.textContent = item.name;

      const type = document.createElement('span');
      type.className = 'command-palette__item-type';
      type.textContent = item.type;

      row.appendChild(icon);
      row.appendChild(name);
      row.appendChild(type);

      row.addEventListener('click', () => {
        this.selectedIndex = i;
        this.execute(this.results.querySelectorAll('.command-palette__item'));
      });
      row.addEventListener('mouseenter', () => {
        this.selectedIndex = i;
        this.updateSelection(this.results.querySelectorAll('.command-palette__item'));
      });

      this.results.appendChild(row);
    });
  },

  updateSelection(items) {
    items.forEach((el, i) => el.classList.toggle('selected', i === this.selectedIndex));
    items[this.selectedIndex]?.scrollIntoView({ block: 'nearest' });
  },

  execute() {
    const query = this.input.value.trim().toLowerCase();

    // secret commands
    if (this.handleSecret(query)) {
      this.hide();
      return;
    }

    let cmds = this.commands;
    if (query) {
      cmds = this.fuse.search(query).map(r => r.item);
    }
    const cmd = cmds[this.selectedIndex];
    if (!cmd) return;

    if (cmd.action) {
      cmd.action();
    } else if (cmd.target) {
      if (cmd.type === 'ext') {
        window.open(cmd.target, '_blank');
      } else {
        window.location.href = cmd.target;
      }
    }
    this.hide();
  },

  handleSecret(query) {
    if (query === 'doom') {
      this.launchDoom();
      return true;
    }
    if (this.secrets[query]) {
      showToast(this.secrets[query]);
      return true;
    }
    return false;
  },

  launchDoom() {
    showToast('DOOM.exe — loading WAD file...');
    setTimeout(() => DoomEngine.launch(), 600);
  }
};


/* ============================================
   blog post loader (homepage recent posts)
   ============================================ */
const PostLoader = {
  async init() {
    const container = document.getElementById('post-list');
    if (!container) return;

    try {
      const resp = await fetch('/blog/metadata.json');
      if (!resp.ok) throw new Error('no metadata');
      const posts = await resp.json();
      this.render(container, posts.slice(0, 5));
    } catch {
      container.textContent = '';
      const p = document.createElement('p');
      p.className = 'text-muted text-sm';
      p.textContent = 'no posts yet.';
      container.appendChild(p);
    }
  },

  render(container, posts) {
    container.textContent = '';

    if (posts.length === 0) {
      const p = document.createElement('p');
      p.className = 'text-muted text-sm';
      p.textContent = 'no posts yet.';
      container.appendChild(p);
      return;
    }

    const ul = document.createElement('ul');
    ul.className = 'post-list';

    posts.forEach((p, i) => {
      const d = new Date(p.date);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const li = document.createElement('li');
      li.style.animationDelay = `${i * 50}ms`;

      const a = document.createElement('a');
      a.href = `/blog/${p.slug}.html`;
      a.className = 'post-item';

      const title = document.createElement('span');
      title.className = 'post-item__title';
      title.textContent = p.title;

      const date = document.createElement('span');
      date.className = 'post-item__date';
      date.textContent = dateStr;

      a.appendChild(title);
      a.appendChild(date);
      li.appendChild(a);
      ul.appendChild(li);
    });

    container.appendChild(ul);
  }
};


/* ============================================
   scroll fade-in (IntersectionObserver)
   ============================================ */
function initFadeIn() {
  const els = document.querySelectorAll('.fade-in');
  if (!els.length) return;

  requestAnimationFrame(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px 50px 0px' });

    els.forEach(el => observer.observe(el));
  });
}


/* ============================================
   warm palette rotation
   ============================================ */
const PaletteManager = {
  palettes: ['amber', 'sage', 'rose', 'ocean'],
  current: 0,

  init() {
    this.current = Math.floor(Math.random() * this.palettes.length);
    this.apply();

    const signoff = document.getElementById('footer-signoff');
    if (signoff) {
      signoff.style.cursor = 'pointer';
      signoff.title = 'click to shift palette';
      signoff.addEventListener('click', () => this.next());
    }
  },

  apply() {
    document.documentElement.setAttribute('data-palette', this.palettes[this.current]);
  },

  next() {
    this.current = (this.current + 1) % this.palettes.length;
    this.apply();
  }
};


/* ============================================
   easter eggs
   ============================================ */
const EasterEggs = {
  konamiSeq: ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'],
  konamiIdx: 0,

  init() {
    this.consoleArt();
    this.initKonami();
    this.initHeroGlitch();
  },

  consoleArt() {
    console.log(
      '%c' +
      '  \u2588\u2588\u2557   \u2588\u2588\u2557\u2588\u2588\u2557   \u2588\u2588\u2557\n' +
      '  \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2551   \u2588\u2588\u2551\n' +
      '  \u2588\u2588\u2551   \u2588\u2588\u2551\u2588\u2588\u2551   \u2588\u2588\u2551\n' +
      '  \u255a\u2588\u2588\u2557 \u2588\u2588\u2554\u255d\u255a\u2588\u2588\u2557 \u2588\u2588\u2554\u255d\n' +
      '   \u255a\u2588\u2588\u2588\u2588\u2554\u255d  \u255a\u2588\u2588\u2588\u2588\u2554\u255d\n' +
      '    \u255a\u2550\u2550\u2550\u255d    \u255a\u2550\u2550\u2550\u255d',
      'color: #daa520; font-family: monospace; font-size: 11px; line-height: 1.2;'
    );
    console.log('%c  vaishnav varma', 'color: #daa520; font-family: monospace; font-size: 12px; font-weight: bold;');
    console.log('%c  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500', 'color: #3d362e;');
    console.log('%c  nice, you read source code too.', 'color: #a89a8c; font-style: italic;');
    console.log('%c  all your base are belong to us.', 'color: #6b5d4f; font-size: 10px;');
    console.log('%c  try doom() for a surprise \u{1f525}', 'color: #6b5d4f; font-size: 10px;');
    console.log('%c  or type "help" in the command palette (ctrl+k)', 'color: #6b5d4f; font-size: 10px;');
  },

  initKonami() {
    document.addEventListener('keydown', (e) => {
      if (CommandPalette.isOpen) return; // don't capture while typing
      if (e.key === this.konamiSeq[this.konamiIdx]) {
        this.konamiIdx++;
        if (this.konamiIdx === this.konamiSeq.length) {
          this.konamiIdx = 0;
          this.triggerKonami();
        }
      } else {
        this.konamiIdx = 0;
      }
    });
  },

  triggerKonami() {
    showToast('\u2191\u2191\u2193\u2193\u2190\u2192\u2190\u2192BA \u2014 +30 lives. try doom() in console.');
    // bonus: briefly invert the page
    document.body.style.transition = 'filter 0.3s ease';
    document.body.style.filter = 'invert(1) hue-rotate(180deg)';
    setTimeout(() => {
      document.body.style.filter = '';
      setTimeout(() => { document.body.style.transition = ''; }, 300);
    }, 1500);
  },

  initHeroGlitch() {
    const name = document.querySelector('.hero__name');
    if (!name) return;
    let clicks = 0;
    let timer = null;

    name.addEventListener('click', () => {
      clicks++;
      clearTimeout(timer);
      timer = setTimeout(() => { clicks = 0; }, 2000);

      if (clicks >= 5) {
        clicks = 0;
        this.glitchText(name);
      }
    });
  },

  glitchText(el) {
    const original = el.textContent;
    const chars = '!@#$%^&*_+-=|<>?0123456789abcdefghijklmnopqrstuvwxyz';
    let iterations = 0;

    // temporarily stop shimmer for clean glitch
    el.style.animation = 'none';
    el.style.webkitTextFillColor = 'var(--accent)';

    const interval = setInterval(() => {
      el.textContent = original
        .split('')
        .map((char, i) => {
          if (char === ' ') return ' ';
          if (i < iterations) return original[i];
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');

      iterations += 0.5;
      if (iterations >= original.length) {
        el.textContent = original;
        el.style.animation = '';
        el.style.webkitTextFillColor = '';
        clearInterval(interval);
      }
    }, 35);
  }
};


/* ============================================
   mascot v2 — canvas Q-learning creature
   platforming, pellets, speech, evolution
   ============================================ */
const Mascot = {
  // === CONFIG ===
  TICK_MS: 600,
  GRAVITY: 500,
  JUMP_VEL: -420,
  MOVE_SPEED: 200,
  MULTI_JUMP: 3,       // can jump this many times before landing
  CS: 32,               // canvas size
  MAX_PELLETS: 10,
  PLATFORM_SCAN_MS: 2000,
  PELLET_LIFETIME: 30000,
  LINGER_MS: 10000,
  SAVE_EVERY: 50,       // ticks between saves

  // === Q-LEARNING ===
  alpha: 0.12,
  gamma: 0.9,
  epsilon: 0.25,
  Q: {},
  ACTIONS: ['move_left', 'move_right', 'jump', 'idle', 'sleep', 'eat', 'emote', 'speak'],

  // === PHYSICS STATE ===
  x: 100, y: 0,
  vx: 0, vy: 0,
  onGround: false,
  direction: 1,
  jumpsLeft: 3,

  // === CREATURE STATE ===
  energy: 10, maxEnergy: 10,
  emotion: 'idle',
  stage: 0,
  totalTicks: 0,
  visitCount: 0,
  visitedZones: null,    // Set, inited in init()

  // === WORLD ===
  platforms: [],
  pellets: [],
  cursorX: -1, cursorY: -1,
  userActivity: 'idle',
  _scrollTimer: null,
  _clickTimer: null,
  _lingerMap: {},        // elementIndex -> timestamp
  _lingerObserver: null,
  _codeTreatTimer: 0,

  // === VOICE ===
  _speechTimeout: null,
  _deferredSpeechReward: false,
  _deferredSpeechTimer: null,
  _lastSpeechTick: -999,  // cooldown: min ticks between speeches
  _lastEmoteTick: -999,
  SPEECH_COOLDOWN: 5,     // ~3 seconds between speeches
  EMOTE_COOLDOWN: 5,      // ~3 seconds between emotes
  _platformSettleTicks: 0, // suppress jump after landing
  _platformTicks: 0,       // how long on current platform (for reward decay)

  // === RENDER ===
  container: null,
  canvas: null,
  ctx: null,
  bubbleEl: null,
  shadowEl: null,
  _accentRGB: [218, 165, 32],
  _bgHex: '#1a1511',
  lastFrame: 0,
  tickAccum: 0,
  _saveCounter: 0,
  _platformTimer: 0,
  _bobPhase: 0,

  // === SPEECH POOLS ===
  SPEECH: {
    nearHeading: [
      'ooh, a title!', 'what\'s this about?', 'big words up here',
      'i can see far from here', 'new section!', 'oh we\'re here now',
      'this looks important', 'chapter break!',
    ],
    nearCode: [
      'beep boop', '01101001', 'is this subleq?', 'looks like code',
      'semicolons everywhere', '*reads intensely*', 'i understand none of this',
      'ah yes, code', 'mem[b] -= mem[a]...', 'this compiles right?',
      'goto considered harmful', 'but does it halt?',
    ],
    nearImage: [
      'pretty picture!', 'ooh colors', 'nice pixels', '*stares*',
      'that\'s a graph!', 'data is beautiful', 'look at those curves',
      'i\'d hang this on my wall', 'mesa topology!',
    ],
    nearTable: [
      'spreadsheet energy', 'numbers!', 'N=10 is sus',
      'i love a good table', 'data data data',
    ],
    nearQuote: [
      'deep thoughts', 'wise words', 'who said that?', '*nods sagely*',
      'forty-two.', 'the answer!',
    ],
    pelletNearby: [
      'snack time!', 'is that food?', 'ooh crumbs!', 'nom?',
      'feed me!', 'yum yum', '*sniff sniff*', 'crumb detected',
    ],
    tired: [
      'so sleepy...', 'need rest...', '*yawn*', 'five more min...',
      'energy low...', 'running on empty', 'zzz soon',
    ],
    happy: [
      ':)', 'this is nice', 'good vibes', 'wheee!',
      'life is good', '*happy wiggle*', 'i like it here',
    ],
    greeting: ['hi!', 'hello!', 'hey there :)', 'oh! a human!'],
    returnVisit: [
      'you came back!', 'missed you!', 'welcome back!',
      'i\'ve grown since last time!', 'remember me?',
      'hi again!', 'i saved your spot',
    ],
    idle: [
      '...', 'hmm', '*looks around*', '*whistles*', 'anyone there?',
      '*taps foot*', 'i wonder...', 'what\'s over there?',
      '*existential crisis*', 'i think therefore i beep',
    ],
    falling: ['!!', 'aaaa', 'whoa!', '*flails*', 'gravity!', 'not again!'],
    onPlatform: [
      'nice view from here', 'i\'m on top of things', 'look at me!',
      'king of the hill', 'parkour!', 'higher ground!',
    ],
    airborne: [
      'wheee!', 'i believe i can fly', '*flap flap*',
      'to infinity!', 'look ma no hands',
    ],
  },

  // === EVOLUTION THRESHOLDS ===
  STAGES: [0, 500, 2000, 5000, 12000, 25000],

  // ─────────────────────────────────────
  //  INIT
  // ─────────────────────────────────────
  init() {
    this.visitedZones = new Set();
    this._load();
    this.visitCount++;
    this._createDOM();
    this._setupListeners();

    // spawn position
    this.x = Math.random() * (window.innerWidth - 60) + 30;
    this.y = window.innerHeight - this.CS;
    this.onGround = true;

    // greet
    if (this.visitCount > 1) {
      setTimeout(() => this._speak(this._pick(this.SPEECH.returnVisit)), 1500);
    } else {
      setTimeout(() => this._speak(this._pick(this.SPEECH.greeting)), 2000);
    }

    // platform scan
    this._scanPlatforms();

    // linger observer for reading crumbs
    this._setupLingerObserver();

    // start loop
    this.lastFrame = performance.now();
    requestAnimationFrame((t) => this._loop(t));

    // debug access
    window._mascot = this;

    // trace system
    this._trace = [];
    this._traceActive = false;
    window._mascotTrace = (action) => {
      if (action === 'start') {
        this._trace = [];
        this._traceActive = true;
        this._traceStartTime = Date.now();
        console.log('[mascot trace] recording started. interact with the page for 3-5 min, then call _mascotTrace("stop")');
        return 'trace started';
      }
      if (action === 'stop') {
        this._traceActive = false;
        const summary = this._traceReport();
        console.log('[mascot trace] stopped.', this._trace.length, 'events recorded.');
        console.log(summary);
        return summary;
      }
      if (action === 'dump') {
        const blob = new Blob([JSON.stringify({ events: this._trace, summary: this._traceReport() }, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'mascot-trace-' + Date.now() + '.json'; a.click();
        URL.revokeObjectURL(url);
        return 'downloaded ' + this._trace.length + ' events';
      }
      // default: return current trace data
      return { events: this._trace, summary: this._traceReport(), active: this._traceActive };
    };
  },

  // ─────────────────────────────────────
  //  DOM CREATION
  // ─────────────────────────────────────
  _createDOM() {
    const c = document.createElement('div');
    c.className = 'mascot';
    c.title = 'i\'m exploring :)';

    const cvs = document.createElement('canvas');
    cvs.className = 'mascot__canvas';
    cvs.width = this.CS;
    cvs.height = this.CS;

    const shadow = document.createElement('div');
    shadow.className = 'mascot__shadow';

    const bubble = document.createElement('div');
    bubble.className = 'mascot__bubble';

    c.appendChild(cvs);
    c.appendChild(shadow);
    c.appendChild(bubble);
    document.body.appendChild(c);

    this.container = c;
    this.canvas = cvs;
    this.ctx = cvs.getContext('2d');
    this.shadowEl = shadow;
    this.bubbleEl = bubble;
  },

  // ─────────────────────────────────────
  //  EVENT LISTENERS
  // ─────────────────────────────────────
  _setupListeners() {
    // cursor tracking
    document.addEventListener('mousemove', (e) => {
      this.cursorX = e.clientX;
      this.cursorY = e.clientY;
    });

    // touch support
    document.addEventListener('touchmove', (e) => {
      if (e.touches[0]) {
        this.cursorX = e.touches[0].clientX;
        this.cursorY = e.touches[0].clientY;
      }
    }, { passive: true });

    // click → pellet spawn
    document.addEventListener('click', (e) => {
      // don't spawn pellets on UI elements
      if (e.target.closest('.mascot, .command-palette, .doom-modal')) return;
      this._spawnPellet(e.clientX, e.clientY, 'click');

      // user activity
      this.userActivity = 'clicking';
      clearTimeout(this._clickTimer);
      this._clickTimer = setTimeout(() => { this.userActivity = 'idle'; }, 3000);
    });

    // touch → pellet
    document.addEventListener('touchend', (e) => {
      if (e.target.closest('.mascot, .command-palette, .doom-modal')) return;
      const t = e.changedTouches[0];
      if (t) this._spawnPellet(t.clientX, t.clientY, 'click');
    }, { passive: true });

    // scroll tracking + scroll crumbs
    let scrollRAF = false;
    this._lastScrollCrumb = 0;
    window.addEventListener('scroll', () => {
      this.userActivity = 'scrolling';
      clearTimeout(this._scrollTimer);
      this._scrollTimer = setTimeout(() => {
        this.userActivity = 'idle';
        // spawn a reading crumb where user stopped scrolling (throttled to 8s)
        const now = Date.now();
        if (now - this._lastScrollCrumb > 8000) {
          this._lastScrollCrumb = now;
          const vw = window.innerWidth, vh = window.innerHeight;
          this._spawnPellet(vw * (0.3 + Math.random() * 0.4), vh * (0.4 + Math.random() * 0.2), 'reading');
        }
      }, 2000);
      if (!scrollRAF) {
        scrollRAF = true;
        requestAnimationFrame(() => { this._scanPlatforms(); scrollRAF = false; });
      }
    }, { passive: true });

    // resize
    window.addEventListener('resize', () => this._scanPlatforms());

    // click on creature
    this.container.addEventListener('click', (e) => {
      e.stopPropagation();
      this.emotion = 'happy';
      this.vy = this.JUMP_VEL * 0.5;
      this.onGround = false;
      // deferred speech reward
      if (this._deferredSpeechReward) {
        this._deferredSpeechReward = false;
        this._pendingClickReward = 3.0;
      }
    });

    // save on unload
    window.addEventListener('beforeunload', () => this._save());

    // palette changes — watch for accent color updates
    this._readAccentColor();
    const obs = new MutationObserver(() => this._readAccentColor());
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-palette'] });
  },

  // ─────────────────────────────────────
  //  MAIN LOOP (60fps render + 900ms brain)
  // ─────────────────────────────────────
  _loop(timestamp) {
    const dt = Math.min((timestamp - this.lastFrame) / 1000, 0.05);
    this.lastFrame = timestamp;

    // physics at frame rate
    this._physUpdate(dt);

    // Q-learning at tick rate
    this.tickAccum += dt * 1000;
    if (this.tickAccum >= this.TICK_MS) {
      this.tickAccum -= this.TICK_MS;
      this._brainUpdate();
    }

    // pellet aging
    this._updatePellets();

    // code block treats (check every ~30s)
    this._codeTreatTimer += dt;
    if (this._codeTreatTimer > 30) {
      this._codeTreatTimer = 0;
      this._tryCodeTreat();
    }

    // platform rescan timer
    this._platformTimer += dt;
    if (this._platformTimer > this.PLATFORM_SCAN_MS / 1000) {
      this._platformTimer = 0;
      this._scanPlatforms();
    }

    // render
    this._render();

    // position DOM
    this.container.style.left = Math.round(this.x) + 'px';
    this.container.style.top = Math.round(this.y) + 'px';

    // shadow visibility (visible when airborne)
    const airDist = this._distToGround();
    this.shadowEl.style.opacity = this.onGround ? '0' : Math.min(1, airDist / 100).toFixed(2);

    requestAnimationFrame((t) => this._loop(t));
  },

  // ─────────────────────────────────────
  //  PHYSICS
  // ─────────────────────────────────────
  _physUpdate(dt) {
    const prevY = this.y;

    // gravity
    if (!this.onGround) {
      this.vy += this.GRAVITY * dt;
    }

    // apply velocity
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // friction on horizontal (gentle — let it glide)
    this.vx *= 0.97;

    // viewport bounds
    const W = window.innerWidth, H = window.innerHeight;
    if (this.x < 0) { this.x = 0; this.vx = 0; }
    if (this.x > W - this.CS) { this.x = W - this.CS; this.vx = 0; }

    // ground (viewport bottom)
    const groundY = H - this.CS;
    if (this.y >= groundY) {
      this.y = groundY;
      this.vy = 0;
      this.onGround = true;
      this.jumpsLeft = this.MULTI_JUMP;
    }

    // platform collision — swept detection (prev frame → this frame)
    if (this.vy > 0) {
      const cx = this.x + this.CS / 2;
      const bottom = this.y + this.CS;
      const prevBottom = prevY + this.CS;
      for (const p of this.platforms) {
        // horizontal: creature center within platform bounds
        // vertical: creature bottom swept through platform top this frame
        if (cx > p.left && cx < p.right && prevBottom <= p.top + 2 && bottom >= p.top) {
          this.y = p.top - this.CS;
          this.vy = 0;
          this.onGround = true;
          this.jumpsLeft = this.MULTI_JUMP;
          this._platformSettleTicks = 3; // stay on platform for a few brain ticks
          if (this._traceActive) {
            this._trace.push({ t: Date.now() - (this._traceStartTime || 0), type: 'platform_land', x: Math.round(this.x), y: Math.round(this.y), platform: { left: Math.round(p.left), right: Math.round(p.right), top: Math.round(p.top), type: p.type, raw: p.raw } });
          }
          break;
        }
      }
    }

    // platform collision — overlap check (creature peaked inside platform zone)
    // triggers near peak (vy > -50) so we catch the overlap even at slight upward velocity
    if (this.vy > -50 && !this.onGround) {
      const cx = this.x + this.CS / 2;
      for (const p of this.platforms) {
        if (cx > p.left && cx < p.right
            && this.y < p.top                    // head above platform
            && this.y + this.CS >= p.top         // feet at or below platform
            && this.y + this.CS < p.top + 30) {  // not too deep (just straddling)
          this.y = p.top - this.CS;
          this.vy = 0;
          this.onGround = true;
          this.jumpsLeft = this.MULTI_JUMP;
          this._platformSettleTicks = 3;
          if (this._traceActive) {
            this._trace.push({ t: Date.now() - (this._traceStartTime || 0), type: 'platform_land', subtype: 'overlap_snap', x: Math.round(this.x), y: Math.round(this.y), platform: { left: Math.round(p.left), right: Math.round(p.right), top: Math.round(p.top), type: p.type, raw: p.raw } });
          }
          break;
        }
      }
    }

    // auto multi-jump: at jump peak, chain toward nearest reachable platform above
    if (!this.onGround && this.jumpsLeft > 0 && this.vy > -30 && this.vy < 80) {
      const jumpH = this.JUMP_VEL * this.JUMP_VEL / (2 * this.GRAVITY);
      const totalReach = this.jumpsLeft * jumpH + 60;
      const cx = this.x + this.CS / 2;
      let bestP = null, bestDist = Infinity;
      for (const p of this.platforms) {
        if (p.top < this.y && cx > p.left - 80 && cx < p.right + 80) {
          const dist = this.y - p.top;
          if (dist < totalReach && dist < bestDist) {
            bestDist = dist;
            bestP = p;
          }
        }
      }
      if (bestP) {
        this.vy = this.JUMP_VEL;
        this.jumpsLeft--;
        const platCenter = (bestP.left + bestP.right) / 2;
        const drift = platCenter - cx;
        this.vx += drift * 0.3;
        if (this._traceActive) {
          this._trace.push({ t: Date.now() - (this._traceStartTime || 0), type: 'multi_jump', x: Math.round(this.x), y: Math.round(this.y), jumpsLeft: this.jumpsLeft, targetPlatform: { top: Math.round(bestP.top), type: bestP.type, raw: bestP.raw } });
        }
      }
    }

    // check if we walked off a platform
    if (this.onGround && this.y < groundY - 2) {
      const cx = this.x + this.CS / 2;
      const bottom = this.y + this.CS;
      let onAny = false;
      for (const p of this.platforms) {
        if (cx > p.left && cx < p.right && Math.abs(bottom - p.top) < 5) {
          onAny = true;
          break;
        }
      }
      if (!onAny) {
        this.onGround = false;
        this.jumpsLeft = 0; // no air jumps from walking off a ledge
        if (this.emotion !== 'sleepy') this.emotion = 'surprised';
      }
    }

    // bob phase for idle animation
    this._bobPhase += dt * 3;
  },

  _distToGround() {
    const groundY = window.innerHeight - this.CS;
    return groundY - this.y;
  },

  // ─────────────────────────────────────
  //  PLATFORM DETECTION
  // ─────────────────────────────────────
  _scanPlatforms() {
    this.platforms = [];
    const selectors = 'h1,h2,h3,h4,h5,h6,img,figure,pre,table,blockquote,nav.site-nav,.site-footer';
    const els = document.querySelectorAll(selectors);
    const H = window.innerHeight;
    for (const el of els) {
      if (el.closest('.mascot, .command-palette, .doom-modal')) continue;
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > H + 200 || r.width < 30 || r.height < 8) continue;
      const tag = el.tagName.toLowerCase();
      let type = 'other';
      if (/^h[1-6]$/.test(tag)) type = 'heading';
      else if (tag === 'img' || tag === 'figure') type = 'image';
      else if (tag === 'pre' || el.closest('.codehilite')) type = 'code';
      this.platforms.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom, type, raw: tag });
    }
  },

  // ─────────────────────────────────────
  //  Q-LEARNING BRAIN
  // ─────────────────────────────────────
  _nearestPellet() {
    let minD = 500, best = null;
    const cx = this.x + 16, cy = this.y + 16;
    for (const p of this.pellets) {
      const d = Math.hypot(cx - p.x, cy - p.y);
      if (d < minD) { minD = d; best = p; }
    }
    return best;
  },

  _nearestElementType() {
    let minD = Infinity, type = 3;
    const cx = this.x + 16, cy = this.y + 16;
    for (const p of this.platforms) {
      const px = (p.left + p.right) / 2, py = p.top;
      const d = Math.hypot(cx - px, cy - py);
      if (d < minD) { minD = d; type = p.type === 'heading' ? 0 : p.type === 'image' ? 1 : p.type === 'code' ? 2 : 3; }
    }
    return type;
  },

  _contentBounds() {
    const el = document.querySelector('.post-content') || document.querySelector('article');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, center: (r.left + r.right) / 2 };
  },

  _brainStateKey() {
    const W = window.innerWidth, H = window.innerHeight;
    const xz = Math.min(9, Math.floor(this.x / (W / 10)));
    const yz = Math.min(4, Math.floor(this.y / (H / 5)));
    const e = this.energy > 6 ? 2 : this.energy > 3 ? 1 : 0;
    let cp = 0;
    if (this.cursorX >= 0) {
      const d = Math.hypot(this.x + 16 - this.cursorX, this.y + 16 - this.cursorY);
      cp = d < 80 ? 2 : d < 250 ? 1 : 0;
    }
    const ne = this._nearestElementType();
    const ua = this.userActivity === 'scrolling' ? 1 : this.userActivity === 'clicking' ? 2 : 0;
    const pn = this._nearestPellet() ? 1 : 0;
    return `${xz}_${yz}_${e}_${cp}_${ne}_${ua}_${pn}`;
  },

  _getQ(s, a) { return this.Q[s + '_' + a] || 0; },
  _setQ(s, a, v) { this.Q[s + '_' + a] = v; },

  _brainChooseAction(s) {
    if (Math.random() < this.epsilon) {
      return this.ACTIONS[Math.floor(Math.random() * this.ACTIONS.length)];
    }
    let bestV = -Infinity;
    const tied = [];
    for (const a of this.ACTIONS) {
      const v = this._getQ(s, a);
      if (v > bestV) { bestV = v; tied.length = 0; tied.push(a); }
      else if (v === bestV) { tied.push(a); }
    }
    return tied[Math.floor(Math.random() * tied.length)];
  },

  _brainUpdate() {
    this.totalTicks++;
    this._saveCounter++;

    const s = this._brainStateKey();
    let action = this._brainChooseAction(s);

    // INSTINCT: pellet chase override (40% when food exists)
    const instinctPellet = this._nearestPellet();
    if (instinctPellet && this.energy > 1 && Math.random() < 0.4) {
      const dx = instinctPellet.x - (this.x + 16);
      const dy = instinctPellet.y - (this.y + 16);
      if (dy < -40 && this.jumpsLeft > 0) action = 'jump';
      else action = dx > 0 ? 'move_right' : 'move_left';
    }

    // COOLDOWN: speech/emote spam prevention
    if (action === 'speak' && (this.totalTicks - this._lastSpeechTick) < this.SPEECH_COOLDOWN) action = 'idle';
    if (action === 'emote' && (this.totalTicks - this._lastEmoteTick) < this.EMOTE_COOLDOWN) action = 'idle';

    // SETTLE: stay on platform after landing (suppress jump for a few ticks)
    if (this._platformSettleTicks > 0) {
      this._platformSettleTicks--;
      if (action === 'jump') action = 'idle';
    }

    let reward = -0.03;

    // deferred click reward
    if (this._pendingClickReward) { reward += this._pendingClickReward; this._pendingClickReward = 0; }

    // execute action
    switch (action) {
      case 'move_left':
        this.vx = -this.MOVE_SPEED; this.direction = -1;
        this.energy = Math.max(0, this.energy - 0.2); this.emotion = 'curious'; break;
      case 'move_right':
        this.vx = this.MOVE_SPEED; this.direction = 1;
        this.energy = Math.max(0, this.energy - 0.2); this.emotion = 'curious'; break;
      case 'jump':
        if (this.jumpsLeft > 0) {
          this.vy = this.JUMP_VEL; this.onGround = false; this.jumpsLeft--;
          this.energy = Math.max(0, this.energy - 0.5); reward += 0.2; this.emotion = 'happy';
        } break;
      case 'idle':
        this.vx *= 0.3; this.energy = Math.min(this.maxEnergy, this.energy + 0.3);
        this.emotion = 'idle'; break;
      case 'sleep':
        this.vx = 0; this.energy = Math.min(this.maxEnergy, this.energy + 1.5);
        this.emotion = 'sleepy'; if (this.energy < 4) reward += 1.5; break;
      case 'eat': {
        const p = this._nearestPellet();
        if (p && Math.hypot(this.x + 16 - p.x, this.y + 16 - p.y) < 60) {
          this._removePellet(p);
          // different pellet types give different rewards + energy
          if (p.type === 'click') {
            this.energy = Math.min(this.maxEnergy, this.energy + 3);
            reward += 6.0; this._emote('\u2728'); // sparkle — user interaction, best food
          } else if (p.type === 'code') {
            this.energy = Math.min(this.maxEnergy, this.energy + 2);
            reward += 4.0; this._emote('\u{1F4A1}'); // lightbulb — code treat
          } else {
            this.energy = Math.min(this.maxEnergy, this.energy + 1);
            reward += 3.0; this._emote('\u2764'); // heart — reading crumb, light snack
          }
          this.emotion = 'happy';
        } break;
      }
      case 'emote': {
        const emotes = ['\u2728', '\u2757', '\u2753', '\u266a'];
        this._emote(emotes[Math.floor(Math.random() * emotes.length)]);
        this.energy = Math.max(0, this.energy - 0.1); this._lastEmoteTick = this.totalTicks;
        if (this._nearestElementType() === 2) reward += 0.5; break;
      }
      case 'speak': {
        this._speak(this._chooseText());
        this.energy = Math.max(0, this.energy - 0.2); this._lastSpeechTick = this.totalTicks;
        this._deferredSpeechReward = true;
        clearTimeout(this._deferredSpeechTimer);
        this._deferredSpeechTimer = setTimeout(() => { this._deferredSpeechReward = false; }, 5000);
        break;
      }
    }

    // ── REWARDS ──
    // exploration
    const xz = Math.min(9, Math.floor(this.x / (window.innerWidth / 10)));
    const yz = Math.min(4, Math.floor(this.y / (window.innerHeight / 5)));
    const zoneKey = xz * 5 + yz;
    if (!this.visitedZones.has(zoneKey)) { this.visitedZones.add(zoneKey); reward += 2.0; }

    // cursor proximity
    if (this.cursorX >= 0) {
      const d = Math.hypot(this.x + 16 - this.cursorX, this.y + 16 - this.cursorY);
      if (d < 80) reward += 0.4; else if (d < 250) reward += 0.15;
    }

    // pellet approach
    const np = this._nearestPellet();
    if (np && (action === 'move_left' || action === 'move_right')) {
      const dx = np.x - (this.x + 16);
      if ((action === 'move_right' && dx > 0) || (action === 'move_left' && dx < 0)) reward += 1.0;
      else reward -= 0.3;
    }

    // content area gravity — reward being over content, penalize margins
    const content = this._contentBounds();
    if (content) {
      const cx = this.x + 16;
      if (cx >= content.left && cx <= content.right) reward += 0.3;
      else reward -= 0.5;
    }

    // on-platform bonus (decays so creature doesn't stay up forever)
    if (this.onGround && this.y < window.innerHeight - this.CS - 10) {
      // first 5 ticks on platform: full reward, then diminishes
      if (!this._platformTicks) this._platformTicks = 0;
      this._platformTicks++;
      reward += this._platformTicks <= 5 ? 0.8 : 0.1;
    } else {
      // ground return bonus — reward coming back down
      if (this._platformTicks > 0) { reward += 1.0; this._platformTicks = 0; }
    }

    // exhaustion penalty
    if (this.energy <= 0 && action !== 'sleep' && action !== 'idle') reward -= 2.0;

    // auto-eat within range
    if (action !== 'eat') {
      const autoP = this._nearestPellet();
      if (autoP && Math.hypot(this.x + 16 - autoP.x, this.y + 16 - autoP.y) < 50) {
        this._removePellet(autoP); this.energy = Math.min(this.maxEnergy, this.energy + 2);
        reward += 5.0; this.emotion = 'happy'; this._emote('\u2764');
      }
    }

    // Q-update
    const s2 = this._brainStateKey();
    let maxQ2 = -Infinity;
    for (const a of this.ACTIONS) maxQ2 = Math.max(maxQ2, this._getQ(s2, a));
    const oldQ = this._getQ(s, action);
    this._setQ(s, action, oldQ + this.alpha * (reward + this.gamma * maxQ2 - oldQ));

    // trace: record brain tick
    if (this._traceActive) {
      this._trace.push({
        t: Date.now() - (this._traceStartTime || 0),
        type: 'brain',
        tick: this.totalTicks,
        state: s,
        qAction: this._brainChooseAction(s), // what Q wanted (before overrides)
        action,
        instinctOverride: !!(instinctPellet && this.energy > 1),
        reward: Math.round(reward * 1000) / 1000,
        x: Math.round(this.x),
        y: Math.round(this.y),
        vx: Math.round(this.vx),
        vy: Math.round(this.vy),
        onGround: this.onGround,
        energy: Math.round(this.energy * 10) / 10,
        emotion: this.emotion,
        stage: this.stage,
        pelletCount: this.pellets.length,
        nearestPelletDist: np ? Math.round(Math.hypot(this.x + 16 - np.x, this.y + 16 - np.y)) : -1,
        platformCount: this.platforms.length,
        qValue: Math.round(this._getQ(s, action) * 1000) / 1000,
        jumpsLeft: this.jumpsLeft,
        zonesExplored: this.visitedZones.size,
      });
    }

    // evolution
    this._updateStage();

    // tooltip
    this.container.title = `stage ${this.stage} | energy ${Math.round(this.energy)}/${this.maxEnergy} | explored ${this.visitedZones.size}/50 | ticks ${this.totalTicks}`;

    // auto-save
    if (this._saveCounter >= this.SAVE_EVERY) { this._saveCounter = 0; this._save(); }
  },

  // ─────────────────────────────────────
  //  PELLET SYSTEM
  // ─────────────────────────────────────
  _spawnPellet(x, y, type) {
    if (this.pellets.length >= this.MAX_PELLETS) {
      this._removePellet(this.pellets[0]);
    }
    const el = document.createElement('div');
    el.className = 'mascot-pellet mascot-pellet--' + type;
    el.style.left = (x - 2) + 'px';
    el.style.top = (y - 2) + 'px';
    document.body.appendChild(el);
    this.pellets.push({ x, y, type, born: Date.now(), el });
  },

  _removePellet(p) {
    const i = this.pellets.indexOf(p);
    if (i >= 0) this.pellets.splice(i, 1);
    if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el);
  },

  _updatePellets() {
    const now = Date.now();
    for (let i = this.pellets.length - 1; i >= 0; i--) {
      const p = this.pellets[i];
      const age = now - p.born;
      if (age > this.PELLET_LIFETIME) {
        this._removePellet(p);
      } else if (age > this.PELLET_LIFETIME * 0.7) {
        p.el.style.opacity = (1 - (age - this.PELLET_LIFETIME * 0.7) / (this.PELLET_LIFETIME * 0.3)).toFixed(2);
      }
    }
  },

  _setupLingerObserver() {
    const content = document.querySelector('.post-content');
    if (!content) return;
    const children = content.querySelectorAll(':scope > *');
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const idx = e.target.dataset.lingerIdx;
        if (e.isIntersecting) {
          if (!this._lingerMap[idx]) this._lingerMap[idx] = Date.now();
        } else {
          delete this._lingerMap[idx];
        }
      }
      // check for lingered sections
      const now = Date.now();
      for (const [idx, start] of Object.entries(this._lingerMap)) {
        if (now - start > this.LINGER_MS && !this._lingerMap[idx + '_done']) {
          this._lingerMap[idx + '_done'] = true;
          const el = document.querySelector(`[data-linger-idx="${idx}"]`);
          if (el) {
            const r = el.getBoundingClientRect();
            this._spawnPellet(r.left + Math.random() * r.width * 0.6 + r.width * 0.2, r.top + r.height * 0.5, 'reading');
          }
        }
      }
    }, { threshold: 0.5 });

    children.forEach((child, i) => {
      child.dataset.lingerIdx = i;
      obs.observe(child);
    });
    this._lingerObserver = obs;
  },

  _tryCodeTreat() {
    const blocks = document.querySelectorAll('.codehilite pre, pre code');
    for (const b of blocks) {
      const r = b.getBoundingClientRect();
      if (r.top > 0 && r.bottom < window.innerHeight && Math.random() < 0.3) {
        this._spawnPellet(r.left + Math.random() * r.width * 0.5 + r.width * 0.25, r.bottom - 5, 'code');
        break;
      }
    }
  },

  // ─────────────────────────────────────
  //  VOICE & EMOTES
  // ─────────────────────────────────────
  _speak(text) {
    this.bubbleEl.textContent = text;
    this.bubbleEl.classList.add('visible');
    clearTimeout(this._speechTimeout);
    this._speechTimeout = setTimeout(() => {
      this.bubbleEl.classList.remove('visible');
    }, 3000);
    if (this._traceActive) {
      this._trace.push({ t: Date.now() - (this._traceStartTime || 0), type: 'speech', text, x: Math.round(this.x), y: Math.round(this.y) });
    }
  },

  _emote(char) {
    const el = document.createElement('span');
    el.className = 'mascot-emote';
    el.textContent = char;
    el.style.left = '12px';
    el.style.top = '-8px';
    this.container.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1500);
  },

  _chooseText() {
    const np = this._nearestPellet();
    if (np && Math.hypot(this.x + 16 - np.x, this.y + 16 - np.y) < 200) return this._pick(this.SPEECH.pelletNearby);
    if (this.energy < 3) return this._pick(this.SPEECH.tired);
    if (!this.onGround && this.vy < -50) return this._pick(this.SPEECH.airborne);
    if (this.onGround && this.y < window.innerHeight - this.CS - 10) return this._pick(this.SPEECH.onPlatform);

    // check nearest element with more granularity
    const nearest = this._nearestPlatform();
    if (nearest && nearest.dist < 150) {
      if (nearest.type === 'heading') return this._pick(this.SPEECH.nearHeading);
      if (nearest.type === 'code') return this._pick(this.SPEECH.nearCode);
      if (nearest.type === 'image') return this._pick(this.SPEECH.nearImage);
      // check for table/blockquote specifically
      if (nearest.raw === 'table') return this._pick(this.SPEECH.nearTable);
      if (nearest.raw === 'blockquote') return this._pick(this.SPEECH.nearQuote);
    }

    if (this.emotion === 'happy') return this._pick(this.SPEECH.happy);
    return this._pick(this.SPEECH.idle);
  },

  _nearestPlatform() {
    let minD = Infinity, best = null;
    const cx = this.x + 16, cy = this.y + 16;
    for (const p of this.platforms) {
      const px = (p.left + p.right) / 2, py = p.top;
      const d = Math.hypot(cx - px, cy - py);
      if (d < minD) { minD = d; best = { ...p, dist: d }; }
    }
    return best;
  },

  _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

  // ─────────────────────────────────────
  //  CANVAS RENDERING
  // ─────────────────────────────────────
  _readAccentColor() {
    const s = getComputedStyle(document.documentElement);
    const hex = s.getPropertyValue('--accent').trim();
    const bg = s.getPropertyValue('--bg').trim();
    if (hex) {
      const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
      if (m) this._accentRGB = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
    }
    if (bg) this._bgHex = bg;
  },

  _render() {
    const c = this.ctx, S = this.CS;
    const [ar, ag, ab] = this._accentRGB;
    c.clearRect(0, 0, S, S);

    // flip for direction
    c.save();
    if (this.direction === -1) {
      c.translate(S, 0);
      c.scale(-1, 1);
    }

    // bob offset for idle
    const bob = this.onGround && this.emotion === 'idle' ? Math.sin(this._bobPhase) * 1.5 : 0;

    if (this.stage === 0) {
      // tiny 6x6 blob
      c.fillStyle = `rgb(${ar},${ag},${ab})`;
      this._roundRect(c, 13, 13 + bob, 6, 6, 2);
    } else if (this.stage === 1) {
      // 10x8 blob + eyes
      c.fillStyle = `rgb(${ar},${ag},${ab})`;
      this._roundRect(c, 11, 12 + bob, 10, 8, 3);
      // eyes
      c.fillStyle = this._bgHex;
      this._drawEyes(c, 14, 15 + bob, 18, 15 + bob);
    } else {
      // stage 2+: full body
      const bx = 9, by = 8 + bob, bw = 14, bh = 12;
      c.fillStyle = `rgb(${ar},${ag},${ab})`;
      this._roundRect(c, bx, by, bw, bh, 4);

      // eyes
      c.fillStyle = this._bgHex;
      this._drawEyes(c, bx + 4, by + 4, bx + 9, by + 4);

      // legs (stage 2+)
      c.fillStyle = `rgb(${Math.max(0,ar-30)},${Math.max(0,ag-30)},${Math.max(0,ab-30)})`;
      const legOff = this.vx !== 0 ? Math.sin(this._bobPhase * 4) * 2 : 0;
      c.fillRect(bx + 3, by + bh, 3, 4 + legOff);
      c.fillRect(bx + bw - 6, by + bh, 3, 4 - legOff);

      // antennae (stage 3+)
      if (this.stage >= 3) {
        c.fillStyle = `rgb(${ar},${ag},${ab})`;
        c.fillRect(bx + 4, by - 4, 1, 5);
        c.fillRect(bx + 4, by - 5, 2, 2);
        c.fillRect(bx + 9, by - 3, 1, 4);
        c.fillRect(bx + 9, by - 4, 2, 2);
      }

      // markings (stage 4+)
      if (this.stage >= 4) {
        c.fillStyle = `rgba(${Math.max(0,ar-50)},${Math.max(0,ag-50)},${Math.max(0,ab-50)},0.4)`;
        c.fillRect(bx + 2, by + 6, bw - 4, 1);
        c.fillRect(bx + 3, by + 8, bw - 6, 1);
      }

      // accessory — tiny scarf (stage 5)
      if (this.stage >= 5) {
        // complementary-ish color
        c.fillStyle = `rgb(${255 - ar},${Math.min(255, ag + 80)},${Math.min(255, ab + 80)})`;
        c.fillRect(bx + 1, by + bh - 3, bw - 2, 2);
        c.fillRect(bx + bw - 2, by + bh - 3, 2, 5); // dangling end
      }
    }

    c.restore();
  },

  _drawEyes(c, lx, ly, rx, ry) {
    switch (this.emotion) {
      case 'happy':
        // squint (bottom arc only)
        c.fillRect(lx, ly + 1, 2, 1);
        c.fillRect(rx, ry + 1, 2, 1);
        break;
      case 'sleepy':
        // half-closed line
        c.fillRect(lx, ly, 2, 1);
        c.fillRect(rx, ry, 2, 1);
        break;
      case 'surprised':
        // big circles
        c.fillRect(lx - 1, ly - 1, 3, 3);
        c.fillRect(rx - 1, ry - 1, 3, 3);
        break;
      case 'curious':
        // shifted — looking to the side
        c.fillRect(lx + 1, ly, 2, 2);
        c.fillRect(rx + 1, ry, 2, 2);
        break;
      default:
        // normal 2x2
        c.fillRect(lx, ly, 2, 2);
        c.fillRect(rx, ry, 2, 2);
    }
  },

  _roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.fill();
  },

  // ─────────────────────────────────────
  //  EVOLUTION
  // ─────────────────────────────────────
  _updateStage() {
    for (let i = this.STAGES.length - 1; i >= 0; i--) {
      if (this.totalTicks >= this.STAGES[i]) { this.stage = i; return; }
    }
  },

  // ─────────────────────────────────────
  //  TRACE REPORT
  // ─────────────────────────────────────
  _traceReport() {
    const brainEvents = this._trace.filter(e => e.type === 'brain');
    const lands = this._trace.filter(e => e.type === 'platform_land');
    const jumps = this._trace.filter(e => e.type === 'multi_jump');
    const speeches = this._trace.filter(e => e.type === 'speech');

    // action frequency
    const actionCounts = {};
    const actionRewards = {};
    for (const e of brainEvents) {
      actionCounts[e.action] = (actionCounts[e.action] || 0) + 1;
      actionRewards[e.action] = (actionRewards[e.action] || 0) + e.reward;
    }
    // avg reward per action
    const actionAvgReward = {};
    for (const a of Object.keys(actionCounts)) {
      actionAvgReward[a] = Math.round(actionRewards[a] / actionCounts[a] * 1000) / 1000;
    }

    // instinct override rate
    const instinctCount = brainEvents.filter(e => e.instinctOverride).length;

    // position heatmap (10x5 grid)
    const posGrid = {};
    for (const e of brainEvents) {
      const key = e.state.split('_').slice(0, 2).join('_');
      posGrid[key] = (posGrid[key] || 0) + 1;
    }

    // energy over time
    const energyTimeline = brainEvents.filter((_, i) => i % 5 === 0).map(e => ({ tick: e.tick, energy: e.energy }));

    // reward distribution
    const rewards = brainEvents.map(e => e.reward);
    const avgReward = rewards.length ? Math.round(rewards.reduce((a, b) => a + b, 0) / rewards.length * 1000) / 1000 : 0;
    const maxReward = rewards.length ? Math.max(...rewards) : 0;
    const minReward = rewards.length ? Math.min(...rewards) : 0;

    // platform stats
    const platformTypes = {};
    for (const l of lands) {
      const key = l.platform.raw || l.platform.type;
      platformTypes[key] = (platformTypes[key] || 0) + 1;
    }

    // Q-table size
    const qSize = Object.keys(this.Q).length;

    // time on ground vs airborne
    const groundTicks = brainEvents.filter(e => e.onGround).length;

    return {
      duration_ms: this._trace.length ? this._trace[this._trace.length - 1].t : 0,
      total_events: this._trace.length,
      brain_ticks: brainEvents.length,
      action_counts: actionCounts,
      action_avg_reward: actionAvgReward,
      instinct_override_rate: brainEvents.length ? Math.round(instinctCount / brainEvents.length * 100) + '%' : '0%',
      reward_stats: { avg: avgReward, min: Math.round(minReward * 1000) / 1000, max: Math.round(maxReward * 1000) / 1000 },
      platform_landings: lands.length,
      platform_types_landed: platformTypes,
      multi_jumps: jumps.length,
      speeches: speeches.length,
      speech_texts: speeches.map(s => s.text),
      ground_vs_air: { ground_pct: brainEvents.length ? Math.round(groundTicks / brainEvents.length * 100) + '%' : '0%', air_pct: brainEvents.length ? Math.round((brainEvents.length - groundTicks) / brainEvents.length * 100) + '%' : '0%' },
      position_heatmap: posGrid,
      energy_timeline: energyTimeline,
      q_table_size: qSize,
      zones_explored: this.visitedZones.size,
      evolution_stage: this.stage,
    };
  },

  // ─────────────────────────────────────
  //  PERSISTENCE
  // ─────────────────────────────────────
  _save() {
    try {
      const data = {
        version: 3,
        Q: {},
        totalTicks: this.totalTicks,
        stage: this.stage,
        visitedZones: [...this.visitedZones],
        visitCount: this.visitCount,
        lastVisit: Date.now()
      };
      // prune near-zero Q values
      for (const [k, v] of Object.entries(this.Q)) {
        if (Math.abs(v) > 0.01) data.Q[k] = Math.round(v * 1000) / 1000;
      }
      localStorage.setItem('mascot_v2', JSON.stringify(data));
    } catch (e) { /* quota exceeded — silently fail */ }
  },

  _load() {
    try {
      const raw = localStorage.getItem('mascot_v2');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.version !== 3) return; // v3: Q-table reset for new reward structure
      this.Q = data.Q || {};
      this.totalTicks = data.totalTicks || 0;
      this.stage = data.stage || 0;
      this.visitedZones = new Set(data.visitedZones || []);
      this.visitCount = data.visitCount || 0;
    } catch (e) { /* corrupt data — start fresh */ }
  },
};


/* ============================================
   doom engine — wolfenstein-style raycaster
   ============================================ */
const DoomEngine = {
  W: 320, H: 200,
  FOV: Math.PI / 3,
  MAP_SIZE: 16,
  MAP: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,2,2,0,0,0,0,0,0,0,3,3,3,0,1],
    [1,0,2,0,0,0,0,0,0,0,0,0,0,3,0,1],
    [1,0,0,0,0,0,4,4,4,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,4,0,4,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,4,0,4,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,5,0,0,0,1],
    [1,0,3,0,0,0,0,0,0,0,0,2,0,0,0,1],
    [1,0,3,0,0,5,0,0,0,5,0,2,0,0,0,1],
    [1,0,3,3,0,0,0,0,0,0,0,2,2,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,4,0,0,0,4,0,0,0,0,0,1],
    [1,0,5,0,0,4,0,0,0,4,0,0,0,5,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  COLORS: {
    1: [140,110,80],   // brown stone
    2: [80,130,80],    // green moss
    3: [130,75,70],    // red brick
    4: [85,90,130],    // blue steel
    5: [160,140,60],   // gold pillar
  },

  // player state
  px: 3.5, py: 3.5, pa: 0,
  vz: 0,          // vertical velocity (jump)
  pz: 0,          // view height offset (jump/bob)
  bobPhase: 0,    // head bob cycle
  bobAmt: 0,      // current bob amplitude (ramps up/down)
  moving: false,

  // per-column depth buffer for floor casting
  zBuf: null,

  keys: {},
  running: false,
  lastTime: 0,
  modal: null,
  canvas: null,
  ctx: null,
  raf: null,

  launch() {
    if (this.running) return;
    this.running = true;
    this.px = 3.5; this.py = 3.5; this.pa = 0;
    this.vz = 0; this.pz = 0; this.bobPhase = 0; this.bobAmt = 0;
    this.keys = {};
    this.zBuf = new Float64Array(this.W);
    this.lastTime = performance.now();
    this.createModal();
    this.loop();
  },

  createModal() {
    const modal = document.createElement('div');
    modal.className = 'doom-modal';

    const content = document.createElement('div');
    content.className = 'doom-modal__content';

    const header = document.createElement('div');
    header.className = 'doom-modal__header';
    header.innerHTML = '<span>DOOM.exe — wasd/arrows, shift=run, space=jump, esc=quit</span>';
    const close = document.createElement('button');
    close.className = 'doom-modal__close';
    close.textContent = '\u00d7';
    close.onclick = () => this.close();
    header.appendChild(close);

    const canvas = document.createElement('canvas');
    canvas.width = this.W;
    canvas.height = this.H;
    canvas.style.cssText = 'width:100%;height:auto;display:block;image-rendering:pixelated;background:#000;';

    content.appendChild(header);
    content.appendChild(canvas);
    modal.appendChild(content);
    document.body.appendChild(modal);

    this.modal = modal;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this._onKey = (e) => {
      if (e.key === 'Escape') { this.close(); return; }
      const key = e.key.toLowerCase();
      this.keys[key] = e.type === 'keydown';
      if (e.key === 'Shift') this.keys['shift'] = e.type === 'keydown';
      if (['w','a','s','d',' ','q','e','arrowup','arrowdown','arrowleft','arrowright'].includes(key)) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', this._onKey);
    document.addEventListener('keyup', this._onKey);
    modal.addEventListener('click', (e) => { if (e.target === modal) this.close(); });
  },

  close() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    document.removeEventListener('keydown', this._onKey);
    document.removeEventListener('keyup', this._onKey);
    if (this.modal) this.modal.remove();
    this.modal = null;
  },

  loop() {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05); // cap at 50ms
    this.lastTime = now;
    this.update(dt);
    this.render();
    this.raf = requestAnimationFrame(() => this.loop());
  },

  wallAt(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y);
    if (ix < 0 || ix >= this.MAP_SIZE || iy < 0 || iy >= this.MAP_SIZE) return 1;
    return this.MAP[iy][ix];
  },

  update(dt) {
    const k = this.keys;
    const sprint = k['shift'] ? 1.8 : 1;
    const spd = 4.0 * sprint * dt;   // units/sec
    const rot = 3.0 * dt;            // rad/sec

    // rotation
    if (k['arrowleft'])  this.pa -= rot;
    if (k['arrowright']) this.pa += rot;

    // forward/back + strafe
    let dx = 0, dy = 0;
    const fwdX = Math.cos(this.pa), fwdY = Math.sin(this.pa);
    const strX = Math.cos(this.pa - Math.PI / 2), strY = Math.sin(this.pa - Math.PI / 2);

    if (k['w'] || k['arrowup'])    { dx += fwdX * spd; dy += fwdY * spd; }
    if (k['s'] || k['arrowdown'])  { dx -= fwdX * spd; dy -= fwdY * spd; }
    if (k['a'])                     { dx += strX * spd; dy += strY * spd; }
    if (k['d'])                     { dx -= strX * spd; dy -= strY * spd; }

    this.moving = (dx !== 0 || dy !== 0);

    // wall-sliding collision (check X and Y independently)
    const margin = 0.2;
    if (dx !== 0) {
      const nx = this.px + dx;
      const probe = nx + margin * Math.sign(dx);
      if (!this.wallAt(probe, this.py - margin) && !this.wallAt(probe, this.py + margin)) {
        this.px = nx;
      }
    }
    if (dy !== 0) {
      const ny = this.py + dy;
      const probe = ny + margin * Math.sign(dy);
      if (!this.wallAt(this.px - margin, probe) && !this.wallAt(this.px + margin, probe)) {
        this.py = ny;
      }
    }

    // jump physics
    if (k[' '] && this.pz === 0) {
      this.vz = 3.5;
    }
    this.vz -= 12.0 * dt; // gravity
    this.pz += this.vz * dt;
    if (this.pz <= 0) { this.pz = 0; this.vz = 0; }

    // head bob
    if (this.moving && this.pz === 0) {
      this.bobPhase += dt * 10 * sprint;
      this.bobAmt = Math.min(this.bobAmt + dt * 8, 1);
    } else {
      this.bobAmt = Math.max(this.bobAmt - dt * 6, 0);
    }
  },

  // procedural wall texture: returns brightness multiplier 0-1
  wallTexel(hitType, u, v) {
    switch (hitType) {
      case 1: { // stone — horizontal brick rows
        const row = (v * 8) | 0;
        const brickU = u * 4 + (row % 2) * 0.5;
        const onMortar = (v * 8) % 1 < 0.08 || (brickU % 1) < 0.06;
        return onMortar ? 0.55 : 0.85 + Math.sin(u * 37 + v * 23) * 0.1;
      }
      case 2: { // moss — vertical streaks
        const streak = Math.sin(u * 20) * 0.5 + 0.5;
        const drip = Math.sin(u * 13 + v * 7) * 0.15;
        return 0.6 + streak * 0.3 + drip;
      }
      case 3: { // brick — classic pattern
        const row = (v * 6) | 0;
        const brickU = u * 3 + (row % 2) * 0.5;
        const onMortar = (v * 6) % 1 < 0.1 || (brickU % 1) < 0.08;
        return onMortar ? 0.4 : 0.8 + Math.sin(u * 47 + v * 31) * 0.12;
      }
      case 4: { // steel — panel lines
        const panelH = (v * 4) % 1;
        const panelW = (u * 4) % 1;
        const onSeam = panelH < 0.04 || panelH > 0.96 || panelW < 0.04 || panelW > 0.96;
        const rivet = (panelH > 0.08 && panelH < 0.14 && panelW > 0.08 && panelW < 0.14);
        return onSeam ? 0.4 : rivet ? 1.0 : 0.75 + Math.sin(u * 60) * 0.05;
      }
      case 5: { // gold pillar — vertical fluting
        const flute = Math.sin(u * Math.PI * 8);
        return 0.7 + flute * 0.25;
      }
      default: return 0.8;
    }
  },

  render() {
    const ctx = this.ctx;
    const W = this.W, H = this.H;
    const img = ctx.createImageData(W, H);
    const d = img.data;

    // view height offset from jump + head bob
    const bobOffset = Math.sin(this.bobPhase) * 3 * this.bobAmt;
    const viewShift = this.pz * 30 + bobOffset; // pixels
    const horizonY = (H / 2 + viewShift) | 0;

    // sky gradient
    for (let y = 0; y < H; y++) {
      if (y >= horizonY) break;
      const t = y / Math.max(horizonY, 1);
      const r = 6 + t * 18 | 0;
      const g = 5 + t * 14 | 0;
      const b = 16 + t * 28 | 0;
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        d[i] = r; d[i+1] = g; d[i+2] = b; d[i+3] = 255;
      }
    }

    // raycast walls
    for (let col = 0; col < W; col++) {
      const angle = this.pa - this.FOV / 2 + (col / W) * this.FOV;
      const sin = Math.sin(angle), cos = Math.cos(angle);

      // DDA
      const mapX = Math.floor(this.px), mapY = Math.floor(this.py);
      const dDistX = Math.abs(1 / (cos || 1e-10));
      const dDistY = Math.abs(1 / (sin || 1e-10));
      const stepX = cos >= 0 ? 1 : -1;
      const stepY = sin >= 0 ? 1 : -1;
      let sDistX = cos >= 0 ? (mapX + 1 - this.px) * dDistX : (this.px - mapX) * dDistX;
      let sDistY = sin >= 0 ? (mapY + 1 - this.py) * dDistY : (this.py - mapY) * dDistY;
      let cx = mapX, cy = mapY, side = 0, hit = false, hitType = 1;

      for (let step = 0; step < 64; step++) {
        if (sDistX < sDistY) {
          sDistX += dDistX; cx += stepX; side = 0;
        } else {
          sDistY += dDistY; cy += stepY; side = 1;
        }
        if (this.wallAt(cx, cy)) {
          hitType = this.MAP[cy][cx];
          hit = true;
          break;
        }
      }

      if (!hit) { this.zBuf[col] = 999; continue; }

      // perpendicular distance (fisheye correction)
      const dist = Math.abs(side === 0
        ? (cx - this.px + (1 - stepX) / 2) / (cos || 1e-10)
        : (cy - this.py + (1 - stepY) / 2) / (sin || 1e-10));
      this.zBuf[col] = dist;

      // wall hit U coordinate (0-1 along wall face)
      let wallU;
      if (side === 0) {
        wallU = this.py + dist * sin;
      } else {
        wallU = this.px + dist * cos;
      }
      wallU = wallU - Math.floor(wallU);

      // wall height in pixels
      const wallH = Math.min(H * 2, (H / (dist || 0.01)) * 0.85) | 0;
      const wallTop = (horizonY - wallH / 2) | 0;
      const wallBot = wallTop + wallH;

      const rgb = this.COLORS[hitType] || [140,110,80];
      const distShade = Math.max(0.12, 1 - dist / 14);
      const sideShade = side ? 0.7 : 1.0;

      for (let y = Math.max(0, wallTop); y < Math.min(H, wallBot); y++) {
        const v = (y - wallTop) / wallH; // 0-1 vertical
        const texel = this.wallTexel(hitType, wallU, v);
        const shade = distShade * sideShade * texel;
        const i = (y * W + col) * 4;
        d[i]   = Math.min(255, rgb[0] * shade) | 0;
        d[i+1] = Math.min(255, rgb[1] * shade) | 0;
        d[i+2] = Math.min(255, rgb[2] * shade) | 0;
        d[i+3] = 255;
      }

      // floor casting below this wall column
      for (let y = Math.max(horizonY, wallBot); y < H; y++) {
        const rowDist = (H * 0.42) / (y - horizonY + 0.5);
        const floorX = this.px + rowDist * cos;
        const floorY = this.py + rowDist * sin;

        // checkerboard pattern
        const checker = ((Math.floor(floorX) + Math.floor(floorY)) & 1);
        const floorShade = Math.max(0.08, 0.5 - rowDist * 0.035);
        const base = checker ? 0.7 : 0.45;
        const r = (28 * base * floorShade) | 0;
        const g = (22 * base * floorShade) | 0;
        const b = (18 * base * floorShade) | 0;

        const i = (y * W + col) * 4;
        d[i] = r + 15; d[i+1] = g + 10; d[i+2] = b + 6; d[i+3] = 255;
      }

      // ceiling casting above this wall column
      for (let y = Math.min(horizonY, wallTop) - 1; y >= 0; y--) {
        const rowDist = (H * 0.42) / (horizonY - y + 0.5);
        const ceilX = this.px + rowDist * cos;
        const ceilY = this.py + rowDist * sin;
        const ceilShade = Math.max(0.06, 0.35 - rowDist * 0.03);
        const grid = ((Math.floor(ceilX * 2) + Math.floor(ceilY * 2)) & 1);
        const base = grid ? 0.5 : 0.35;

        const i = (y * W + col) * 4;
        d[i]   = (12 * base * ceilShade + 6) | 0;
        d[i+1] = (10 * base * ceilShade + 5) | 0;
        d[i+2] = (22 * base * ceilShade + 14) | 0;
        d[i+3] = 255;
      }
    }

    ctx.putImageData(img, 0, 0);

    // crosshair
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#daa520';
    ctx.lineWidth = 1;
    const cx2 = W / 2, cy2 = H / 2 + viewShift * 0.3;
    ctx.beginPath();
    ctx.moveTo(cx2 - 5, cy2); ctx.lineTo(cx2 - 2, cy2);
    ctx.moveTo(cx2 + 2, cy2); ctx.lineTo(cx2 + 5, cy2);
    ctx.moveTo(cx2, cy2 - 5); ctx.lineTo(cx2, cy2 - 2);
    ctx.moveTo(cx2, cy2 + 2); ctx.lineTo(cx2, cy2 + 5);
    ctx.stroke();

    // minimap
    const ms = 3, mx = 4, my = 4;
    ctx.globalAlpha = 0.45;
    for (let y = 0; y < this.MAP_SIZE; y++) {
      for (let x = 0; x < this.MAP_SIZE; x++) {
        const cell = this.MAP[y][x];
        if (cell) {
          const c = this.COLORS[cell];
          ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
        } else {
          ctx.fillStyle = '#0a0a0a';
        }
        ctx.fillRect(mx + x * ms, my + y * ms, ms, ms);
      }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#daa520';
    ctx.fillRect(mx + this.px * ms - 1, my + this.py * ms - 1, 3, 3);
    ctx.strokeStyle = '#daa520';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(mx + this.px * ms, my + this.py * ms);
    ctx.lineTo(mx + (this.px + Math.cos(this.pa) * 1.5) * ms, my + (this.py + Math.sin(this.pa) * 1.5) * ms);
    ctx.stroke();
  }
};


/* ============================================
   utility — shared toast
   ============================================ */
function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'easter-toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 500);
  }, 2500);
}

// global doom() for console use
window.doom = function() {
  console.log('%c\ud83d\udd2b loading DOOM...', 'color: #daa520; font-size: 14px;');
  DoomEngine.launch();
};


/* ============================================
   init
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  PaletteManager.init();
  initFooterSignoff();
  CommandPalette.init();
  PostLoader.init();
  initFadeIn();
  EasterEggs.init();
  Mascot.init();
});
