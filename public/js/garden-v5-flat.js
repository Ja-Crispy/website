/* ============================================
   garden — cyber-organic maximalist herbarium
   recursive L-system branching, perlin noise,
   bioluminescent nodes, starfield nebula bg
   ============================================ */

/* --- simplex-ish noise (fast 2D) --- */
const Noise = {
  _p: null,
  init() {
    this._p = new Uint8Array(512);
    const perm = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,
      140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,
      0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,
      174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,
      158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,
      244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,
      169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,
      217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,
      227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,
      163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,
      113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,
      144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,
      181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,
      205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
    for (let i = 0; i < 256; i++) { this._p[i] = perm[i]; this._p[256 + i] = perm[i]; }
  },
  _fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); },
  _lerp(a, b, t) { return a + t * (b - a); },
  _grad(h, x, y) {
    const v = (h & 1) === 0 ? x : y;
    return (h & 2) === 0 ? v : -v;
  },
  get(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = this._fade(xf), v = this._fade(yf);
    const p = this._p;
    const aa = p[p[X] + Y], ab = p[p[X] + Y + 1];
    const ba = p[p[X + 1] + Y], bb = p[p[X + 1] + Y + 1];
    return this._lerp(
      this._lerp(this._grad(aa, xf, yf), this._grad(ba, xf - 1, yf), u),
      this._lerp(this._grad(ab, xf, yf - 1), this._grad(bb, xf - 1, yf - 1), u), v
    );
  },
};
Noise.init();


/* --- data layer --- */
const GardenData = {
  raw: null, items: [], categories: {},
  dateRange: { min: 0, max: 0 },

  async init() {
    const resp = await fetch('/garden/garden-data.json');
    this.raw = await resp.json();
    this.categories = this.raw.categories;
    this.items = this.raw.items;
    const times = this.items.map(i => new Date(i.date_added).getTime());
    this.dateRange.min = Math.min(...times);
    this.dateRange.max = Math.max(...times);
  },

  getItemsForCategory(catKey) {
    return this.items.filter(i => i.primary_category === catKey);
  },
};


/* --- seeded RNG --- */
function mkRng(seed) {
  let s = seed;
  return function() { s = (s * 16807) % 2147483647; return s / 2147483647; };
}


/* --- recursive L-system tree generation --- */
function generateTree(rng, baseX, groundY, opts) {
  const segments = [];  // { x1, y1, x2, y2, depth, thickness }
  const tips = [];      // { x, y, depth, size } — every branch terminal

  function branch(x, y, angle, len, depth, thickness) {
    if (depth > opts.maxDepth || len < 2) return;

    // perlin wobble along the branch
    const noiseScale = 0.02;
    const nx = Noise.get(x * noiseScale + opts.noiseSeed, y * noiseScale) * opts.wobble;
    const ny = Noise.get(x * noiseScale, y * noiseScale + opts.noiseSeed) * opts.wobble * 0.5;

    const x2 = x + Math.sin(angle) * len + nx;
    const y2 = y - Math.cos(angle) * len + ny;

    segments.push({ x1: x, y1: y, x2, y2, depth, thickness });

    // tip node at every branch end
    const tipSize = Math.max(1.5, 4 - depth * 0.6 + rng() * 2);

    // 20% chance to sprout a sub-branch (+ always main splits)
    const mainSplits = depth < 2 ? (2 + Math.floor(rng() * 2)) : (rng() < 0.65 ? 2 : 1);

    if (depth >= opts.maxDepth - 1 || (depth > 1 && rng() > 0.7)) {
      tips.push({ x: x2, y: y2, depth, size: tipSize });
      return;
    }

    let spawned = false;
    for (let i = 0; i < mainSplits; i++) {
      const spread = opts.spreadAngle * (0.6 + rng() * 0.8);
      const childAngle = angle + (i === 0 ? -spread : spread) + (rng() - 0.5) * 0.3;
      const childLen = len * (opts.lenDecay + (rng() - 0.5) * 0.15);
      const childThick = thickness * 0.65;
      branch(x2, y2, childAngle, childLen, depth + 1, childThick);
      spawned = true;
    }

    // random extra sub-branches (20% chance per node)
    if (rng() < 0.2 && depth < opts.maxDepth - 1) {
      const extraAngle = angle + (rng() - 0.5) * 1.8;
      const extraLen = len * (0.3 + rng() * 0.4);
      branch(x2, y2, extraAngle, extraLen, depth + 1, thickness * 0.5);
    }

    // if no children spawned, this is a tip
    if (!spawned) tips.push({ x: x2, y: y2, depth, size: tipSize });
  }

  // start from ground going up
  const startAngle = opts.baseAngle || 0;
  branch(baseX, groundY, startAngle, opts.stemLen, 0, opts.stemThick);

  return { segments, tips };
}


/* --- plant field: generate L-system trees for each item --- */
const PlantField = {
  plants: [],
  starfield: [],  // pre-computed starfield particles

  build(data, w, h) {
    this.plants = [];
    const rng = mkRng(42069);
    const items = data.items;
    const n = items.length;
    const groundY = h - 50;

    // scatter positions using golden angle
    const padX = 40, padTop = 30;
    const fieldW = w - padX * 2;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    const sorted = [...items].sort((a, b) =>
      new Date(a.date_added).getTime() - new Date(b.date_added).getTime()
    );

    sorted.forEach((item, i) => {
      const theta = i * goldenAngle;
      const r = Math.sqrt((i + 0.5) / n);
      let sx = (fieldW * 0.5 + padX) + r * Math.cos(theta) * fieldW * 0.46;
      sx += (rng() - 0.5) * fieldW * 0.08;
      const x = Math.max(padX + 20, Math.min(w - padX - 20, sx));

      const cat = data.categories[item.primary_category];
      const color = cat ? cat.color : '#ffffff';

      // tree complexity scales with "importance" (more tags = more branches)
      const tagCount = item.tags.length;
      const stemLen = 45 + rng() * 60 + tagCount * 8;
      const maxDepth = Math.min(6, 3 + Math.floor(tagCount / 2) + (rng() > 0.5 ? 1 : 0));

      const tree = generateTree(rng, x, groundY, {
        stemLen,
        stemThick: 2 + rng() * 1.5,
        maxDepth,
        spreadAngle: 0.35 + rng() * 0.4,
        lenDecay: 0.62 + rng() * 0.15,
        wobble: 6 + rng() * 8,
        noiseSeed: rng() * 1000,
        baseAngle: (rng() - 0.5) * 0.25,  // slight lean
      });

      this.plants.push({
        item, x, groundY, tree, color,
        catKey: item.primary_category,
        hasOrbit: item.status === 'experimenting' || item.status === 'reading',
        orbitPhase: rng() * Math.PI * 2,
      });
    });

    // generate starfield (nebula background)
    this.starfield = [];
    const starRng = mkRng(777);
    for (let i = 0; i < 350; i++) {
      this.starfield.push({
        x: starRng() * w,
        y: starRng() * (groundY + 10),
        r: 0.3 + starRng() * 1.2,
        a: 0.02 + starRng() * 0.06,
        speed: 0.5 + starRng() * 2,
        phase: starRng() * Math.PI * 2,
      });
    }
  },
};


/* --- renderer --- */
const GardenRenderer = {
  canvas: null, ctx: null, dpr: 1, w: 0, h: 0,
  growProgress: 0, growStart: 0, growDuration: 4500,
  timelineProgress: 1,
  hoveredPlant: null, selectedPlant: null,
  activeFilters: new Set(), filterMode: 'or',
  _growing: false, _phase: 0, _running: false,
  _redrawQueued: false,

  init(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this.resize();
  },

  resize() {
    const wrapper = this.canvas.parentElement;
    const rect = wrapper.getBoundingClientRect();
    this.w = rect.width;
    this.h = Math.max(rect.height - 38, 300);
    this.canvas.width = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    this.canvas.style.width = this.w + 'px';
    this.canvas.style.height = this.h + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    PlantField.build(GardenData, this.w, this.h);
  },

  startGrow() {
    this.growProgress = 0;
    this.growStart = performance.now();
    this._growing = true;
    this._loop();
  },

  _loop() {
    if (this._growing) {
      this.growProgress = Math.min(1, (performance.now() - this.growStart) / this.growDuration);
      if (this.growProgress >= 1) this._growing = false;
    }
    this._phase = (performance.now() / 3000) % (Math.PI * 2);
    this.draw();
    if (this._growing || this._running) requestAnimationFrame(() => this._loop());
  },

  startBreathing() {
    if (this._running) return;
    this._running = true;
    this._loop();
  },

  requestRedraw() {
    if (this._running || this._growing) return;
    if (this._redrawQueued) return;
    this._redrawQueued = true;
    requestAnimationFrame(() => { this._redrawQueued = false; this.draw(); });
  },

  _hex(hex) {
    return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
  },

  draw() {
    const ctx = this.ctx, w = this.w, h = this.h;
    const gp = this._ease(this.growProgress);
    const breath = Math.sin(this._phase) * 0.5 + 0.5;
    const t = performance.now() / 1000;

    ctx.clearRect(0, 0, w, h);

    // --- starfield nebula background ---
    for (const star of PlantField.starfield) {
      const twinkle = Math.sin(t * star.speed + star.phase) * 0.5 + 0.5;
      const alpha = star.a * (0.3 + twinkle * 0.7) * Math.min(1, gp * 3);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- ground zone ---
    const groundY = h - 50;
    const grd = ctx.createLinearGradient(0, groundY - 20, 0, h);
    grd.addColorStop(0, 'rgba(255,255,255,0)');
    grd.addColorStop(1, 'rgba(255,255,255,0.015)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, groundY - 20, w, h - groundY + 20);

    // ground line
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([1, 8]);
    ctx.beginPath();
    ctx.moveTo(0, groundY + 1);
    ctx.lineTo(w, groundY + 1);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- connection lines between same-category plants ---
    if (gp > 0.5) {
      const cAlpha = Math.min(0.04, (gp - 0.5) * 0.08);
      ctx.setLineDash([2, 5]);
      ctx.lineWidth = 0.4;
      const groups = {};
      for (const p of PlantField.plants) {
        if (!this._vis(p)) continue;
        (groups[p.catKey] = groups[p.catKey] || []).push(p);
      }
      for (const g of Object.values(groups)) {
        if (g.length < 2) continue;
        const rgb = this._hex(g[0].color);
        for (let i = 0; i < g.length - 1; i++) {
          const a = g[i], b = g[i + 1];
          if (this.activeFilters.size && !this._act(a) && !this._act(b)) continue;
          // find topmost tip of each tree for connection point
          const at = this._topTip(a), bt = this._topTip(b);
          ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${cAlpha})`;
          ctx.beginPath();
          ctx.moveTo(at.x, at.y);
          ctx.quadraticCurveTo((at.x + bt.x) / 2, Math.min(at.y, bt.y) - 25, bt.x, bt.y);
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
    }

    // --- draw each plant ---
    for (const plant of PlantField.plants) {
      if (!this._vis(plant)) continue;
      const dimmed = this.activeFilters.size > 0 && !this._act(plant);
      this._drawTree(ctx, plant, gp, dimmed, breath, t);
    }

    // when growth finishes, start breathing
    if (!this._growing && !this._running) this.startBreathing();
  },

  _topTip(plant) {
    let best = { x: plant.x, y: plant.groundY };
    for (const tip of plant.tree.tips) {
      if (tip.y < best.y) best = tip;
    }
    return best;
  },

  _drawTree(ctx, plant, gp, dimmed, breath, t) {
    const alpha = dimmed ? 0.06 : 1;
    const rgb = this._hex(plant.color);
    const isHov = this.hoveredPlant === plant;

    // stagger growth by date
    const itemTime = new Date(plant.item.date_added).getTime();
    const dr = GardenData.dateRange;
    const dateN = dr.max > dr.min ? (itemTime - dr.min) / (dr.max - dr.min) : 0;
    const pg = this._ease(Math.max(0, Math.min(1, (gp - dateN * 0.5) / 0.5)));
    if (pg <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';

    // draw segments (branches) — semi-transparent, tapering
    const segs = plant.tree.segments;
    const totalSegs = segs.length;
    const visibleSegs = Math.floor(totalSegs * pg);

    for (let i = 0; i < visibleSegs; i++) {
      const seg = segs[i];
      // partial drawing for last few segments during growth
      const segProgress = i === visibleSegs - 1 ? (totalSegs * pg - visibleSegs + 1) : 1;

      const x2 = seg.x1 + (seg.x2 - seg.x1) * segProgress;
      const y2 = seg.y1 + (seg.y2 - seg.y1) * segProgress;

      // thickness tapers with depth
      const thick = Math.max(0.3, seg.thickness * (1 - seg.depth * 0.12));

      // color: white core with category tint at depth
      const depthRatio = seg.depth / 5;
      const sr = Math.floor(255 - (255 - rgb.r) * depthRatio * 0.3);
      const sg = Math.floor(255 - (255 - rgb.g) * depthRatio * 0.3);
      const sb = Math.floor(255 - (255 - rgb.b) * depthRatio * 0.3);
      const stemAlpha = (0.15 + (isHov ? 0.1 : 0)) * (1 - seg.depth * 0.08);

      ctx.strokeStyle = `rgba(${sr},${sg},${sb},${stemAlpha})`;
      ctx.lineWidth = thick + (isHov ? 0.3 : 0);
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // draw tip nodes — every branch end gets a glowing orb
    if (pg > 0.3) {
      const tipAlpha = Math.min(1, (pg - 0.3) / 0.4);
      ctx.globalAlpha = alpha * tipAlpha;

      for (let i = 0; i < plant.tree.tips.length; i++) {
        const tip = plant.tree.tips[i];
        // check if this tip's parent segment is visible
        const tipSegIdx = this._findTipSegment(segs, tip);
        if (tipSegIdx >= visibleSegs) continue;

        const breathOffset = Math.sin(this._phase + i * 0.7 + plant.orbitPhase) * 0.5 + 0.5;
        const r = tip.size * (0.9 + breathOffset * 0.2);

        // gaussian glow — large soft bloom
        const glowR = r * 5;
        const glow = ctx.createRadialGradient(tip.x, tip.y, r * 0.2, tip.x, tip.y, glowR);
        glow.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${0.15 + breathOffset * 0.06})`);
        glow.addColorStop(0.3, `rgba(${rgb.r},${rgb.g},${rgb.b},${0.05})`);
        glow.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        // core orb with specular highlight
        const core = ctx.createRadialGradient(
          tip.x - r * 0.3, tip.y - r * 0.3, r * 0.05,
          tip.x, tip.y, r
        );
        core.addColorStop(0, 'rgba(255,255,255,0.9)');
        core.addColorStop(0.3, `rgba(${rgb.r},${rgb.g},${rgb.b},0.85)`);
        core.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0.4)`);
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // orbit ring for experimenting/reading
    if (plant.hasOrbit && pg > 0.5) {
      const mainTip = this._topTip(plant);
      const orbitR = 12 + breath * 3;
      const rot = this._phase * 0.5 + plant.orbitPhase;
      ctx.globalAlpha = alpha * 0.4;
      ctx.setLineDash([2, 3.5]);
      ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.4)`;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.arc(mainTip.x, mainTip.y, orbitR, rot, rot + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // hover label
    if (isHov && pg > 0.5) {
      const top = this._topTip(plant);
      ctx.globalAlpha = 0.85;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText(plant.item.title, top.x, top.y - 14);
    }

    ctx.restore();
  },

  _findTipSegment(segs, tip) {
    // find the segment closest to this tip
    let best = 0, bestDist = Infinity;
    for (let i = 0; i < segs.length; i++) {
      const dx = segs[i].x2 - tip.x, dy = segs[i].y2 - tip.y;
      const d = dx * dx + dy * dy;
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return best;
  },

  hitTest(mx, my) {
    // test against the MAIN tip (topmost) of each plant
    for (let i = PlantField.plants.length - 1; i >= 0; i--) {
      const plant = PlantField.plants[i];
      if (!this._vis(plant)) continue;
      // test against all tips, not just top
      for (const tip of plant.tree.tips) {
        const dx = mx - tip.x, dy = my - tip.y;
        if (dx * dx + dy * dy < 15 * 15) return plant;
      }
      // also test main top
      const top = this._topTip(plant);
      const dx = mx - top.x, dy = my - top.y;
      if (dx * dx + dy * dy < 20 * 20) return plant;
    }
    return null;
  },

  _vis(plant) {
    if (this.timelineProgress >= 1) return true;
    const t = new Date(plant.item.date_added).getTime();
    const r = GardenData.dateRange;
    return t <= r.min + (r.max - r.min) * this.timelineProgress;
  },

  _act(plant) {
    if (this.activeFilters.size === 0) return true;
    const tags = new Set(plant.item.tags);
    const af = [...this.activeFilters];
    return this.filterMode === 'or' ? af.some(f => tags.has(f)) : af.every(f => tags.has(f));
  },

  _ease(t) { return 1 - Math.pow(1 - t, 3); },
};


/* --- detail panel --- */
const DetailPanel = {
  panel: null, content: null,

  init() {
    this.panel = document.getElementById('garden-detail');
    this.content = document.getElementById('detail-content');
  },

  show(item) {
    this.panel.classList.remove('hidden');
    document.querySelector('.garden-container').classList.add('detail-open');

    const statusIcons = { finished: '\u25cf', reading: '\u25d0', experimenting: '\u25cb' };
    const linkText = item.source === 'blog' ? 'read post' : 'visit';

    this.content.textContent = '';

    const h2 = document.createElement('h2');
    h2.className = 'garden-detail__title';
    h2.textContent = item.title;
    this.content.appendChild(h2);

    const meta = document.createElement('div');
    meta.className = 'garden-detail__meta';
    const typeBadge = document.createElement('span');
    typeBadge.className = 'garden-detail__badge';
    typeBadge.textContent = item.type;
    meta.appendChild(typeBadge);
    const statusBadge = document.createElement('span');
    statusBadge.className = 'garden-detail__badge';
    statusBadge.textContent = (statusIcons[item.status] || '\u25cf') + ' ' + item.status;
    meta.appendChild(statusBadge);
    const dateSpan = document.createElement('span');
    dateSpan.className = 'garden-detail__date';
    dateSpan.textContent = item.date_added;
    meta.appendChild(dateSpan);
    this.content.appendChild(meta);

    const tagsDiv = document.createElement('div');
    tagsDiv.className = 'garden-detail__tags';
    item.tags.forEach(t => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.textContent = t;
      tagsDiv.appendChild(span);
    });
    this.content.appendChild(tagsDiv);

    if (item.notes) {
      const p = document.createElement('p');
      p.className = 'garden-detail__notes';
      p.textContent = item.notes;
      this.content.appendChild(p);
    }

    if (item.reading_time) {
      const rt = document.createElement('p');
      rt.className = 'garden-detail__reading-time';
      rt.textContent = item.reading_time + ' min read';
      this.content.appendChild(rt);
    }

    const link = document.createElement('a');
    link.href = item.url;
    link.target = item.source === 'blog' ? '_self' : '_blank';
    link.rel = 'noopener';
    link.className = 'garden-detail__link';
    link.textContent = linkText + ' \u2192';
    this.content.appendChild(link);

    setTimeout(() => GardenRenderer.resize(), 320);
  },

  hide() {
    this.panel.classList.add('hidden');
    document.querySelector('.garden-container').classList.remove('detail-open');
    setTimeout(() => { GardenRenderer.resize(); GardenRenderer.requestRedraw(); }, 320);
  },
};


/* --- tag sidebar --- */
const TagSidebar = {
  init() {
    const container = document.getElementById('tag-list');

    for (const [catKey, catData] of Object.entries(GardenData.categories)) {
      const tagsInUse = new Set();
      GardenData.items.forEach(item => {
        item.tags.forEach(t => { if (catData.tags.includes(t)) tagsInUse.add(t); });
      });
      if (tagsInUse.size === 0) continue;

      const header = document.createElement('div');
      header.className = 'garden-sidebar__cat';
      header.style.color = catData.color;
      header.textContent = catData.label.toLowerCase();
      container.appendChild(header);

      for (const tag of tagsInUse) {
        const count = GardenData.items.filter(i => i.tags.includes(tag)).length;
        const pill = document.createElement('button');
        pill.className = 'garden-tag';
        pill.dataset.tag = tag;
        pill.style.setProperty('--tag-color', catData.color);

        const nameSpan = document.createElement('span');
        nameSpan.className = 'garden-tag__name';
        nameSpan.textContent = tag;
        pill.appendChild(nameSpan);

        const countSpan = document.createElement('span');
        countSpan.className = 'garden-tag__count';
        countSpan.textContent = count;
        pill.appendChild(countSpan);

        container.appendChild(pill);
      }
    }
  },
};


/* --- interactions --- */
const GardenInteraction = {
  init() {
    const canvas = GardenRenderer.canvas;

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const plant = GardenRenderer.hitTest(e.clientX - rect.left, e.clientY - rect.top);
      canvas.style.cursor = plant ? 'pointer' : 'default';
      GardenRenderer.hoveredPlant = plant;
    });

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const plant = GardenRenderer.hitTest(e.clientX - rect.left, e.clientY - rect.top);
      if (plant) { GardenRenderer.selectedPlant = plant; DetailPanel.show(plant.item); }
      else { GardenRenderer.selectedPlant = null; DetailPanel.hide(); }
    });

    canvas.addEventListener('mouseleave', () => { GardenRenderer.hoveredPlant = null; });

    document.getElementById('tag-list').addEventListener('click', (e) => {
      const tagEl = e.target.closest('.garden-tag');
      if (!tagEl) return;
      const tag = tagEl.dataset.tag;
      if (GardenRenderer.activeFilters.has(tag)) {
        GardenRenderer.activeFilters.delete(tag);
        tagEl.classList.remove('active');
      } else {
        GardenRenderer.activeFilters.add(tag);
        tagEl.classList.add('active');
      }
    });

    document.getElementById('filter-mode-btn').addEventListener('click', function() {
      GardenRenderer.filterMode = GardenRenderer.filterMode === 'or' ? 'and' : 'or';
      this.textContent = GardenRenderer.filterMode;
    });

    document.getElementById('reset-filters-btn').addEventListener('click', () => {
      GardenRenderer.activeFilters.clear();
      document.querySelectorAll('.garden-tag.active').forEach(el => el.classList.remove('active'));
    });

    const scrubber = document.getElementById('timeline-scrubber');
    scrubber.addEventListener('input', () => {
      GardenRenderer.timelineProgress = parseInt(scrubber.value) / 100;
      this._updateTimelineLabel();
    });

    let playing = false, playRAF = null;
    const playBtn = document.getElementById('timeline-play');
    playBtn.addEventListener('click', () => {
      playing = !playing;
      playBtn.textContent = playing ? '\u23f8' : '\u25b6';
      if (playing) {
        scrubber.value = 0;
        GardenRenderer.timelineProgress = 0;
        const start = performance.now(), dur = 6000;
        const tick = (now) => {
          const p = Math.min(1, (now - start) / dur);
          scrubber.value = Math.floor(p * 100);
          GardenRenderer.timelineProgress = p;
          this._updateTimelineLabel();
          if (p < 1 && playing) playRAF = requestAnimationFrame(tick);
          else { playing = false; playBtn.textContent = '\u25b6'; }
        };
        playRAF = requestAnimationFrame(tick);
      } else cancelAnimationFrame(playRAF);
    });

    document.getElementById('detail-close').addEventListener('click', () => {
      DetailPanel.hide();
      GardenRenderer.selectedPlant = null;
    });

    new ResizeObserver(() => {
      GardenRenderer.resize();
    }).observe(document.getElementById('garden-canvas-wrapper'));
  },

  _updateTimelineLabel() {
    const label = document.getElementById('timeline-label');
    if (GardenRenderer.timelineProgress >= 0.99) { label.textContent = 'now'; return; }
    const r = GardenData.dateRange;
    const d = new Date(r.min + (r.max - r.min) * GardenRenderer.timelineProgress);
    label.textContent = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  },
};


/* --- mobile fallback --- */
const GardenMobile = {
  init() {
    const container = document.getElementById('garden-mobile');

    for (const [catKey, catData] of Object.entries(GardenData.categories)) {
      const items = GardenData.getItemsForCategory(catKey);
      if (items.length === 0) continue;

      const section = document.createElement('div');
      section.className = 'garden-mobile__section';

      const label = document.createElement('div');
      label.className = 'section-label';
      label.style.color = catData.color;
      label.textContent = catData.label.toLowerCase();
      section.appendChild(label);

      for (const item of items) {
        const card = document.createElement('a');
        card.href = item.url;
        card.target = item.source === 'blog' ? '_self' : '_blank';
        card.rel = 'noopener';
        card.className = 'garden-mobile__card';

        const title = document.createElement('div');
        title.className = 'garden-mobile__card-title';
        title.textContent = item.title;
        card.appendChild(title);

        const meta = document.createElement('div');
        meta.className = 'garden-mobile__card-meta';
        const typeSpan = document.createElement('span');
        typeSpan.textContent = item.type;
        const statusSpan = document.createElement('span');
        statusSpan.textContent = item.status;
        meta.appendChild(typeSpan);
        meta.appendChild(statusSpan);
        card.appendChild(meta);

        if (item.notes) {
          const notes = document.createElement('p');
          notes.className = 'garden-mobile__card-notes';
          notes.textContent = item.notes;
          card.appendChild(notes);
        }

        const tags = document.createElement('div');
        tags.className = 'garden-mobile__card-tags';
        item.tags.forEach(t => {
          const span = document.createElement('span');
          span.className = 'tag';
          span.textContent = t;
          tags.appendChild(span);
        });
        card.appendChild(tags);

        section.appendChild(card);
      }
      container.appendChild(section);
    }
  },
};


/* --- init --- */
(async function () {
  await GardenData.init();

  if (window.innerWidth <= 768) {
    GardenMobile.init();
  } else {
    const canvas = document.getElementById('garden-canvas');
    GardenRenderer.init(canvas);
    TagSidebar.init();
    DetailPanel.init();
    GardenInteraction.init();
    GardenRenderer.startGrow();
  }
})();
