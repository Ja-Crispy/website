/* ============================================
   garden — cyber-organic maximalist herbarium
   recursive L-system branching, perlin noise,
   bioluminescent nodes, starfield nebula bg
   category cluster trees — one tree per domain
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

  function branch(x, y, angle, len, depth, thickness, parentSegIdx) {
    if (depth > opts.maxDepth || len < 2) return;

    // perlin wobble along the branch
    const noiseScale = 0.02;
    const nx = Noise.get(x * noiseScale + opts.noiseSeed, y * noiseScale) * opts.wobble;
    const ny = Noise.get(x * noiseScale, y * noiseScale + opts.noiseSeed) * opts.wobble * 0.5;

    const x2 = x + Math.sin(angle) * len + nx;
    const y2 = y - Math.cos(angle) * len + ny;

    const segIdx = segments.length;
    segments.push({ x1: x, y1: y, x2, y2, depth, thickness, parentIdx: parentSegIdx });

    // tip node at every branch end
    const tipSize = Math.max(1.5, 4 - depth * 0.6 + rng() * 2);

    // 20% chance to sprout a sub-branch (+ always main splits)
    const mainSplits = depth < 2 ? (2 + Math.floor(rng() * 2)) : (rng() < 0.65 ? 2 : 1);

    if (depth >= opts.maxDepth - 1 || (depth > 1 && rng() > 0.7)) {
      tips.push({ x: x2, y: y2, depth, size: tipSize, segIdx });
      return;
    }

    let spawned = false;
    for (let i = 0; i < mainSplits; i++) {
      const spread = opts.spreadAngle * (0.6 + rng() * 0.8);
      const childAngle = angle + (i === 0 ? -spread : spread) + (rng() - 0.5) * 0.3;
      const childLen = len * (opts.lenDecay + (rng() - 0.5) * 0.15);
      const childThick = thickness * 0.65;
      branch(x2, y2, childAngle, childLen, depth + 1, childThick, segIdx);
      spawned = true;
    }

    // random extra sub-branches (20% chance per node)
    if (rng() < 0.2 && depth < opts.maxDepth - 1) {
      const extraAngle = angle + (rng() - 0.5) * 1.8;
      const extraLen = len * (0.3 + rng() * 0.4);
      branch(x2, y2, extraAngle, extraLen, depth + 1, thickness * 0.5, segIdx);
    }

    // if no children spawned, this is a tip
    if (!spawned) tips.push({ x: x2, y: y2, depth, size: tipSize, segIdx });
  }

  // start from ground going up
  const startAngle = opts.baseAngle || 0;
  branch(baseX, groundY, startAngle, opts.stemLen, 0, opts.stemThick, -1);

  // leaf particles scattered around branch tips
  const leaves = [];
  for (const tip of tips) {
    const count = 1 + Math.floor(rng() * 3);
    for (let j = 0; j < count; j++) {
      const ang = rng() * Math.PI * 2;
      const rad = 4 + rng() * 12;
      leaves.push({
        x: tip.x + Math.cos(ang) * rad,
        y: tip.y + Math.sin(ang) * rad,
        size: 0.4 + rng() * 1.2,
        phase: rng() * Math.PI * 2,
        speed: 1.5 + rng() * 2,
      });
    }
  }

  return { segments, tips, leaves };
}


/* --- plant field: one tree per category cluster --- */
const PlantField = {
  plants: [],
  starfield: [],
  crossLinks: [],  // connections between category trees

  build(data, w, h) {
    this.plants = [];
    this.crossLinks = [];
    const rng = mkRng(42069);
    const groundY = h - 50;

    // group items by primary category
    const groups = {};
    for (const item of data.items) {
      const cat = item.primary_category;
      (groups[cat] = groups[cat] || []).push(item);
    }

    const catKeys = Object.keys(groups);
    const nCats = catKeys.length;
    const padX = 55;
    const fieldW = w - padX * 2;

    catKeys.forEach((catKey, ci) => {
      const items = groups[catKey];
      const catData = data.categories[catKey];
      const color = catData ? catData.color : '#ffffff';
      const nItems = items.length;

      // position: evenly spaced with slight jitter
      const baseX = padX + (ci + 0.5) * fieldW / nCats;
      const x = baseX + (rng() - 0.5) * fieldW * 0.03;

      // tree size scales with item count
      const stemLen = 55 + nItems * 20 + rng() * 25;
      const maxDepth = Math.min(6, 3 + Math.ceil(nItems / 2));
      const stemThick = 2 + nItems * 0.4 + rng() * 1;

      const tree = generateTree(rng, x, groundY, {
        stemLen,
        stemThick,
        maxDepth,
        spreadAngle: 0.3 + rng() * 0.4,
        lenDecay: 0.6 + rng() * 0.15,
        wobble: 6 + rng() * 8,
        noiseSeed: rng() * 1000,
        baseAngle: (rng() - 0.5) * 0.2,
      });

      // assign items to the most prominent tips (sorted by size desc, depth asc)
      const sortedTipIndices = tree.tips
        .map((tip, idx) => ({ idx, size: tip.size, depth: tip.depth }))
        .sort((a, b) => b.size - a.size || a.depth - b.depth);

      const tipItemMap = new Array(tree.tips.length).fill(null);
      items.forEach((item, i) => {
        if (i < sortedTipIndices.length) {
          tipItemMap[sortedTipIndices[i].idx] = item;
        }
      });

      const dates = items.map(it => new Date(it.date_added).getTime());

      this.plants.push({
        catKey, category: catData, x, groundY, tree, color,
        items, tipItemMap,
        hasOrbit: items.some(it => it.status === 'experimenting' || it.status === 'reading'),
        orbitPhase: rng() * Math.PI * 2,
        earliestDate: Math.min(...dates),
      });
    });

    // --- adaptive horizontal spacing ---
    for (const plant of this.plants) {
      let minX = Infinity, maxX = -Infinity;
      for (const seg of plant.tree.segments) {
        minX = Math.min(minX, seg.x1, seg.x2);
        maxX = Math.max(maxX, seg.x1, seg.x2);
      }
      for (const tip of plant.tree.tips) { minX = Math.min(minX, tip.x); maxX = Math.max(maxX, tip.x); }
      for (const leaf of plant.tree.leaves) { minX = Math.min(minX, leaf.x); maxX = Math.max(maxX, leaf.x); }
      plant._extL = plant.x - minX;
      plant._extR = maxX - plant.x;
    }

    const minGap = 30;
    let curX = padX;
    for (const plant of this.plants) {
      const newX = curX + plant._extL;
      const dx = newX - plant.x;
      if (Math.abs(dx) > 0.01) {
        plant.x = newX;
        for (const seg of plant.tree.segments) { seg.x1 += dx; seg.x2 += dx; }
        for (const tip of plant.tree.tips) { tip.x += dx; }
        for (const leaf of plant.tree.leaves) { leaf.x += dx; }
      }
      curX = newX + plant._extR + minGap;
    }

    // center the row
    const totalUsed = curX - minGap;
    const rowOffset = (w - totalUsed) / 2;
    if (Math.abs(rowOffset) > 1) {
      for (const plant of this.plants) {
        plant.x += rowOffset;
        for (const seg of plant.tree.segments) { seg.x1 += rowOffset; seg.x2 += rowOffset; }
        for (const tip of plant.tree.tips) { tip.x += rowOffset; }
        for (const leaf of plant.tree.leaves) { leaf.x += rowOffset; }
      }
    }

    // compute world bounds for zoom-to-fit
    let wMinX = Infinity, wMaxX = -Infinity, wMinY = Infinity, wMaxY = -Infinity;
    for (const plant of this.plants) {
      for (const seg of plant.tree.segments) {
        wMinX = Math.min(wMinX, seg.x1, seg.x2); wMaxX = Math.max(wMaxX, seg.x1, seg.x2);
        wMinY = Math.min(wMinY, seg.y1, seg.y2); wMaxY = Math.max(wMaxY, seg.y1, seg.y2);
      }
      for (const tip of plant.tree.tips) {
        wMinX = Math.min(wMinX, tip.x); wMaxX = Math.max(wMaxX, tip.x);
        wMinY = Math.min(wMinY, tip.y); wMaxY = Math.max(wMaxY, tip.y);
      }
    }
    this.worldBounds = {
      minX: wMinX - 35, maxX: wMaxX + 35,
      minY: wMinY - 25, maxY: wMaxY + 25,
    };

    // cross-category connections (items that share secondary categories)
    for (let i = 0; i < this.plants.length; i++) {
      for (let j = i + 1; j < this.plants.length; j++) {
        const a = this.plants[i], b = this.plants[j];
        const aSecondary = new Set();
        a.items.forEach(it => { if (it.categories) it.categories.forEach(c => aSecondary.add(c)); });
        const bSecondary = new Set();
        b.items.forEach(it => { if (it.categories) it.categories.forEach(c => bSecondary.add(c)); });
        if (aSecondary.has(b.catKey) || bSecondary.has(a.catKey)) {
          this.crossLinks.push([i, j]);
        }
      }
    }

    // generate starfield (falling nebula particles)
    this.starfield = [];
    const starRng = mkRng(777);
    for (let i = 0; i < 500; i++) {
      this.starfield.push({
        x: starRng() * w,
        y: starRng() * (h - 30),
        r: 0.3 + starRng() * 1.2,
        a: 0.02 + starRng() * 0.06,
        speed: 0.5 + starRng() * 2,
        phase: starRng() * Math.PI * 2,
        vy: 0.08 + starRng() * 0.25,
        vx: (starRng() - 0.5) * 0.1,
      });
    }
  },
};


/* --- renderer --- */
const GardenRenderer = {
  canvas: null, ctx: null, dpr: 1, w: 0, h: 0,
  growProgress: 0, growStart: 0, growDuration: 4500,
  timelineProgress: 1,
  hoveredPlant: null, hoveredItem: null, selectedPlant: null, selectedItem: null,
  zoom: 1, panX: 0, panY: 0,
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
    this._fitToView();
  },

  _fitToView() {
    const wb = PlantField.worldBounds;
    if (!wb) return;
    const worldW = wb.maxX - wb.minX;
    // horizontal fit — show all trees, ground near bottom
    this.zoom = Math.min(this.w / worldW, 1);
    this.panX = (this.w - worldW * this.zoom) / 2 - wb.minX * this.zoom;
    // position ground line (~h-50 in world) at 90% of canvas height
    const groundWorld = this.h - 50;
    this.panY = this.h * 0.9 - groundWorld * this.zoom;
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

    // --- screen-space: starfield + fog (unaffected by zoom/pan) ---
    for (const star of PlantField.starfield) {
      star.y += star.vy;
      star.x += Math.sin(t * 0.3 + star.phase) * star.vx;
      if (star.y > h + 5) { star.y = -5; star.x = Math.random() * w; }

      const twinkle = Math.sin(t * star.speed + star.phase) * 0.5 + 0.5;
      const alpha = star.a * (0.3 + twinkle * 0.7) * Math.min(1, gp * 3);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // fog removed — was creating visible dark rectangular patch

    // --- world-space: zoom/pan transform ---
    ctx.save();
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoom, this.zoom);

    // --- ground line ---
    const groundY = h - 50;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([1, 8]);
    ctx.beginPath();
    ctx.moveTo(-300, groundY + 1);
    ctx.lineTo(w + 300, groundY + 1);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- cross-category connection lines ---
    if (gp > 0.5) {
      const cAlpha = Math.min(0.04, (gp - 0.5) * 0.08);
      ctx.setLineDash([2, 5]);
      ctx.lineWidth = 0.4;
      for (const [ai, bi] of PlantField.crossLinks) {
        const a = PlantField.plants[ai], b = PlantField.plants[bi];
        if (!this._vis(a) || !this._vis(b)) continue;
        if (this.activeFilters.size && !this._act(a) && !this._act(b)) continue;
        const at = this._topTip(a), bt = this._topTip(b);
        const rgb = this._hex(a.color);
        ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${cAlpha})`;
        ctx.beginPath();
        ctx.moveTo(at.x, at.y);
        ctx.quadraticCurveTo((at.x + bt.x) / 2, Math.min(at.y, bt.y) - 25, bt.x, bt.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // --- category labels at ground ---
    if (gp > 0.3) {
      ctx.globalAlpha = Math.min(0.35, (gp - 0.3) * 0.5);
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      for (const plant of PlantField.plants) {
        if (!this._vis(plant)) continue;
        const dim = this.activeFilters.size > 0 && !this._act(plant);
        ctx.fillStyle = dim ? 'rgba(255,255,255,0.1)' : plant.color;
        ctx.fillText(plant.category.label.toLowerCase(), plant.x, plant.groundY + 14);
      }
      ctx.globalAlpha = 1;
    }

    // --- draw each plant ---
    for (const plant of PlantField.plants) {
      if (!this._vis(plant)) continue;
      const dimmed = this.activeFilters.size > 0 && !this._act(plant);
      this._drawTree(ctx, plant, gp, dimmed, breath, t);
    }

    ctx.restore();

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

    // stagger growth by earliest date in this category
    const dr = GardenData.dateRange;
    const dateN = dr.max > dr.min ? (plant.earliestDate - dr.min) / (dr.max - dr.min) : 0;
    const pg = this._ease(Math.max(0, Math.min(1, (gp - dateN * 0.5) / 0.5)));
    if (pg <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';

    // gentle tree sway
    const swayAngle = Math.sin(t * 0.5 + plant.x * 0.1) * 0.008;
    ctx.translate(plant.x, plant.groundY);
    ctx.rotate(swayAngle);
    ctx.translate(-plant.x, -plant.groundY);

    // draw segments (branches) — semi-transparent, tapering
    const segs = plant.tree.segments;
    const totalSegs = segs.length;
    const visibleSegs = Math.floor(totalSegs * pg);

    // compute selected branch path for highlight
    let selectedPath = null;
    if (this.selectedPlant === plant && this.selectedItem) {
      selectedPath = new Set();
      const tipIdx = plant.tipItemMap.indexOf(this.selectedItem);
      if (tipIdx >= 0 && plant.tree.tips[tipIdx]) {
        let si = plant.tree.tips[tipIdx].segIdx;
        while (si >= 0) { selectedPath.add(si); si = segs[si].parentIdx; }
      }
    }

    for (let i = 0; i < visibleSegs; i++) {
      const seg = segs[i];
      const segProgress = i === visibleSegs - 1 ? (totalSegs * pg - visibleSegs + 1) : 1;

      const x2 = seg.x1 + (seg.x2 - seg.x1) * segProgress;
      const y2 = seg.y1 + (seg.y2 - seg.y1) * segProgress;

      let thick = Math.max(0.3, seg.thickness * (1 - seg.depth * 0.12));

      const depthRatio = seg.depth / 5;
      const sr = Math.floor(255 - (255 - rgb.r) * depthRatio * 0.3);
      const sg = Math.floor(255 - (255 - rgb.g) * depthRatio * 0.3);
      const sb = Math.floor(255 - (255 - rgb.b) * depthRatio * 0.3);

      let stemAlpha;
      if (selectedPath && selectedPath.has(i)) {
        stemAlpha = 0.25 + depthRatio * 0.3;  // bright flow: trunk→tip
        thick += 0.8;
      } else if (selectedPath) {
        stemAlpha = 0.2;  // rest of selected tree: elevated
      } else {
        stemAlpha = (0.15 + (isHov ? 0.1 : 0)) * (1 - seg.depth * 0.08);
      }

      ctx.strokeStyle = `rgba(${sr},${sg},${sb},${stemAlpha})`;
      ctx.lineWidth = thick + (isHov && !selectedPath ? 0.3 : 0);
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // glow pass along selected branch
    if (selectedPath && selectedPath.size > 0) {
      ctx.globalCompositeOperation = 'lighter';
      for (const si of selectedPath) {
        if (si >= visibleSegs) continue;
        const seg = segs[si];
        const ga = 0.06 + (seg.depth / 5) * 0.08;
        ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${ga})`;
        ctx.lineWidth = seg.thickness * 0.6 + 3;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    // per-tree ambient halo
    if (pg > 0.2) {
      const top = this._topTip(plant);
      const haloY = plant.groundY - (plant.groundY - top.y) * 0.55;
      const haloR = 30 + pg * 25;
      const haloAlpha = (dimmed ? 0.02 : 0.06) * Math.min(1, (pg - 0.2) / 0.3);
      const halo = ctx.createRadialGradient(plant.x, haloY, 0, plant.x, haloY, haloR);
      halo.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${haloAlpha})`);
      halo.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(plant.x, haloY, haloR, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    // draw tip nodes
    if (pg > 0.3) {
      const tipAlpha = Math.min(1, (pg - 0.3) / 0.4);

      for (let i = 0; i < plant.tree.tips.length; i++) {
        const tip = plant.tree.tips[i];
        const tipSegIdx = this._findTipSegment(segs, tip);
        if (tipSegIdx >= visibleSegs) continue;

        const item = plant.tipItemMap[i];
        const isItemTip = !!item;
        const isHoveredTip = isItemTip && item === this.hoveredItem;
        const isSelectedTip = isItemTip && item === this.selectedItem;

        // item tips: full size + glow. decorative tips: smaller, dimmer
        const sizeMult = isItemTip ? 1 : 0.5;
        const alphaMult = isItemTip ? 1 : 0.35;

        // per-tip filter dimming
        let tipFilterDim = 1;
        if (this.activeFilters.size > 0 && isItemTip) {
          tipFilterDim = this._itemMatchesFilter(item) ? 1 : 0.08;
        }

        ctx.globalAlpha = alpha * tipAlpha * alphaMult * tipFilterDim;

        const breathOffset = Math.sin(this._phase + i * 0.7 + plant.orbitPhase) * 0.5 + 0.5;
        const r = tip.size * sizeMult * (0.9 + breathOffset * 0.2) + (isHoveredTip ? 1.5 : 0) + (isSelectedTip ? 2 : 0);

        // gaussian glow — large soft bloom (additive)
        ctx.globalCompositeOperation = 'lighter';
        const glowR = r * (isItemTip ? 5 : 3);
        const glow = ctx.createRadialGradient(tip.x, tip.y, r * 0.2, tip.x, tip.y, glowR);
        glow.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${0.15 + breathOffset * 0.06})`);
        glow.addColorStop(0.3, `rgba(${rgb.r},${rgb.g},${rgb.b},${0.05})`);
        glow.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, glowR, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        // core orb with specular highlight
        const core = ctx.createRadialGradient(
          tip.x - r * 0.3, tip.y - r * 0.3, r * 0.05,
          tip.x, tip.y, r
        );
        core.addColorStop(0, `rgba(255,255,255,${isItemTip ? 0.9 : 0.5})`);
        core.addColorStop(0.3, `rgba(${rgb.r},${rgb.g},${rgb.b},${isItemTip ? 0.85 : 0.5})`);
        core.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},${isItemTip ? 0.4 : 0.15})`);
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, r, 0, Math.PI * 2);
        ctx.fill();

        // hover label at the specific hovered tip
        if (isHoveredTip && pg > 0.5) {
          ctx.globalAlpha = 0.9;
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.fillText(item.title, tip.x, tip.y - r - 8);
        }
      }
    }

    // orbit ring for experimenting/reading items
    if (plant.hasOrbit && pg > 0.5) {
      // find an item tip with orbit status
      for (let i = 0; i < plant.tipItemMap.length; i++) {
        const item = plant.tipItemMap[i];
        if (!item || (item.status !== 'experimenting' && item.status !== 'reading')) continue;
        const tip = plant.tree.tips[i];
        const orbitR = 10 + breath * 3;
        const rot = this._phase * 0.5 + plant.orbitPhase + i;
        ctx.globalAlpha = alpha * 0.4;
        ctx.setLineDash([2, 3.5]);
        ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},0.4)`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, orbitR, rot, rot + Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // leaf particles — floating dots around branches
    if (pg > 0.4 && plant.tree.leaves) {
      ctx.globalAlpha = alpha * Math.min(1, (pg - 0.4) / 0.3);
      ctx.globalCompositeOperation = 'lighter';
      for (const leaf of plant.tree.leaves) {
        const bob = Math.sin(t * leaf.speed + leaf.phase) * 2.5;
        const lx = leaf.x, ly = leaf.y + bob;
        const la = 0.1 + Math.sin(t * leaf.speed * 0.5 + leaf.phase) * 0.05;
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${la})`;
        ctx.beginPath();
        ctx.arc(lx, ly, leaf.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore();
  },

  _findTipSegment(segs, tip) {
    let best = 0, bestDist = Infinity;
    for (let i = 0; i < segs.length; i++) {
      const dx = segs[i].x2 - tip.x, dy = segs[i].y2 - tip.y;
      const d = dx * dx + dy * dy;
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return best;
  },

  hitTest(mx, my) {
    // transform screen coords to world coords
    const wx = (mx - this.panX) / this.zoom;
    const wy = (my - this.panY) / this.zoom;
    const hitR = 18 / this.zoom;  // fixed screen-pixel radius

    // test item tips only (reverse order for foreground priority)
    for (let i = PlantField.plants.length - 1; i >= 0; i--) {
      const plant = PlantField.plants[i];
      if (!this._vis(plant)) continue;
      for (let ti = 0; ti < plant.tree.tips.length; ti++) {
        const item = plant.tipItemMap[ti];
        if (!item) continue;  // skip decorative tips
        const tip = plant.tree.tips[ti];
        const dx = wx - tip.x, dy = wy - tip.y;
        if (dx * dx + dy * dy < hitR * hitR) return { plant, item };
      }
    }
    return null;
  },

  _vis(plant) {
    if (this.timelineProgress >= 1) return true;
    const r = GardenData.dateRange;
    const cutoff = r.min + (r.max - r.min) * this.timelineProgress;
    return plant.earliestDate <= cutoff;
  },

  _act(plant) {
    if (this.activeFilters.size === 0) return true;
    return plant.items.some(item => this._itemMatchesFilter(item));
  },

  _itemMatchesFilter(item) {
    if (this.activeFilters.size === 0) return true;
    const tags = new Set(item.tags);
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
  _dragState: null,
  _didDrag: false,

  init() {
    const canvas = GardenRenderer.canvas;

    // --- zoom via scroll wheel ---
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const oldZoom = GardenRenderer.zoom;
      const factor = e.deltaY > 0 ? 0.92 : 1.08;
      GardenRenderer.zoom = Math.max(0.3, Math.min(3, GardenRenderer.zoom * factor));
      GardenRenderer.panX = mx - (mx - GardenRenderer.panX) * (GardenRenderer.zoom / oldZoom);
      GardenRenderer.panY = my - (my - GardenRenderer.panY) * (GardenRenderer.zoom / oldZoom);
    }, { passive: false });

    // --- drag to pan ---
    canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      this._dragState = { sx: e.clientX, sy: e.clientY, px: GardenRenderer.panX, py: GardenRenderer.panY };
      this._didDrag = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this._dragState) return;
      const dx = e.clientX - this._dragState.sx;
      const dy = e.clientY - this._dragState.sy;
      if (Math.abs(dx) + Math.abs(dy) > 3) this._didDrag = true;
      GardenRenderer.panX = this._dragState.px + dx;
      GardenRenderer.panY = this._dragState.py + dy;
    });

    window.addEventListener('mouseup', () => {
      this._dragState = null;
      canvas.style.cursor = 'default';
    });

    // --- hover detection (skip during drag) ---
    canvas.addEventListener('mousemove', (e) => {
      if (this._dragState) { canvas.style.cursor = 'grabbing'; return; }
      const rect = canvas.getBoundingClientRect();
      const hit = GardenRenderer.hitTest(e.clientX - rect.left, e.clientY - rect.top);
      canvas.style.cursor = hit ? 'pointer' : 'default';
      GardenRenderer.hoveredPlant = hit ? hit.plant : null;
      GardenRenderer.hoveredItem = hit ? hit.item : null;
    });

    canvas.addEventListener('click', (e) => {
      e.stopPropagation();  // prevent mascot pellet spawn
      if (this._didDrag) return;  // suppress click after pan drag
      const rect = canvas.getBoundingClientRect();
      const hit = GardenRenderer.hitTest(e.clientX - rect.left, e.clientY - rect.top);
      if (hit) {
        GardenRenderer.selectedPlant = hit.plant;
        GardenRenderer.selectedItem = hit.item;
        DetailPanel.show(hit.item);
      } else {
        GardenRenderer.selectedPlant = null;
        GardenRenderer.selectedItem = null;
        DetailPanel.hide();
      }
    });

    canvas.addEventListener('mouseleave', () => {
      if (!this._dragState) {
        GardenRenderer.hoveredPlant = null;
        GardenRenderer.hoveredItem = null;
      }
    });

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
      GardenRenderer.selectedItem = null;
    });

    // --- zoom buttons ---
    const zoomToward = (cx, cy, factor) => {
      const oldZoom = GardenRenderer.zoom;
      GardenRenderer.zoom = Math.max(0.3, Math.min(3, GardenRenderer.zoom * factor));
      GardenRenderer.panX = cx - (cx - GardenRenderer.panX) * (GardenRenderer.zoom / oldZoom);
      GardenRenderer.panY = cy - (cy - GardenRenderer.panY) * (GardenRenderer.zoom / oldZoom);
    };
    document.getElementById('zoom-in').addEventListener('click', (e) => {
      e.stopPropagation();
      zoomToward(GardenRenderer.w / 2, GardenRenderer.h / 2, 1.25);
    });
    document.getElementById('zoom-out').addEventListener('click', (e) => {
      e.stopPropagation();
      zoomToward(GardenRenderer.w / 2, GardenRenderer.h / 2, 0.8);
    });
    document.getElementById('zoom-fit').addEventListener('click', (e) => {
      e.stopPropagation();
      GardenRenderer._fitToView();
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
