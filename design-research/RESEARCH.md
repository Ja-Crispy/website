# Blog Design Research

## Reference Sites Analyzed

### tokenbender.com (PRIMARY INFLUENCE)
- **Screenshots**: tokenbender-full.png (light), tokenbender-dark.png (dark), tokenbender-post.png (article)
- **Palette (dark)**: bg `#1a1511` (warm brown-black), accent `#daa520` (goldenrod), text `#ddd2c7` (cream)
- **Palette (light)**: bg `#fffff8`, text `#111`, accent `#daa520`
- **Fonts**: ET Book (Tufte typeface) for body, sans + mono for UI
- **Layout**: 84ch max-width, three-column categorized post grid on homepage
- **Key traits**: All lowercase UI, zero decoration, "just vanilla html/css/js" footer
- **Article layout**: TOC sidebar left, main content center, sidenotes possible
- **Takeaway**: Warmth from palette + type only. Academic minimalism done right.

### kalomaze.bearblog.dev (PRIMARY INFLUENCE)
- **Screenshots**: kalomaze-full.png (home), kalomaze-blog.png (blog listing)
- **Palette**: bg `#222129` (dark purple-black), accent `#FFA86A` (coral/orange)
- **Fonts**: Fira Code monospace — ONE font for everything
- **Layout**: 720px max-width, bordered `<main>` (1px solid) — signature element
- **Key traits**: 2-color discipline, dashed `<hr>`, inverted title badge (accent bg + dark text), bold = heading color
- **Blog listing**: Clean date + title rows, monospace alignment
- **Takeaway**: Info density from narrow width + monospace + bordered frame + zero chrome.

### seated.ro (ENERGY INFLUENCE)
- **Screenshots**: seated-full.png (full page with scanlines)
- **Palette**: Gruvbox — bg `#282828`, green accent `#98971a`, text `#ebdbb2`
- **Fonts**: GeistMono, Berkeley Mono, iA Writer Quattro
- **Layout**: Two-column work/projects, live stats dashboard, coding stats
- **Key traits**: Scanlines (CSS gradient), command palette (Cmd+K), live WakaTime stats, "not coding" status indicator, ASCII art
- **Stats section**: Mouse clicks (463K), mouse travel (266K ft), scrolls (58M), keypresses (3.8M)
- **Coding stats**: Time coding, main project, main editor, daily average, language breakdown
- **Takeaway**: The site feels ALIVE. Dashboard energy. Status indicators. The "not coding" dot is genius.

### brandur.org (STRUCTURE INFLUENCE)
- **Screenshots**: brandur-viewport.png
- **Palette**: Warm cream bg, dark text, minimal accent
- **Fonts**: Serif body (looks like system serif), clean hierarchy
- **Layout**: Full-width hero text, three-column content grid below
- **Content taxonomy**: Articles (long), Fragments (short thoughts), Atoms (tweet-like), Newsletter, Sequences (photo series), Now page, Uses page
- **Key traits**: Multi-tier content structure, "Now" page as first-class, photography sequences
- **Takeaway**: Content taxonomy is the design. Different thought-sizes get different containers.

### paco.me (RESTRAINT INFLUENCE)
- **Screenshots**: paco-full.png
- **Palette**: White bg, near-black text, zero color accent
- **Fonts**: Clean serif for body, minimal
- **Layout**: ~700px max-width, generous whitespace
- **Key traits**: Three-column "Building / Projects / Writing" grid, personal "Now" section with flowing paragraphs, footer aphorism ("Pray at the altar of hard work.")
- **Takeaway**: Extreme restraint. Personal voice in the Now section. The footer quote is a small personality stamp.

### solar.lowtechmagazine.com (CONCEPT INFLUENCE)
- **Screenshots**: lowtechmagazine-viewport.png
- **Palette**: Warm cream/beige, colored category links (green, red), monospace accents
- **Key traits**: DITHERED IMAGES (genuine design identity), page weight in footer (532.15KB), battery status, solar panel power, server stats, "this site sometimes goes offline"
- **Takeaway**: The site itself as a living system. Constraints as design identity.

### gwern.net (DEPTH INFLUENCE)
- **Screenshots**: gwern-viewport.png
- **Palette**: Light, serif-heavy, academic
- **Key traits**: Sidenotes/footnotes, popup link previews on hover, enormous depth, custom logo, multi-column lists
- **Takeaway**: Academic maximalism. Good reference for article-level features (sidenotes, TOC).

### rauno.me (NOT OUR VIBE but noted)
- **Screenshots**: rauno-full.png
- **Palette**: White/light gray, bold yellow accent, stark black type
- **Key traits**: Portfolio cards, interaction design showcase, horizontal scrolling grid
- **Takeaway**: Too portfolio-y. But the craft and attention to micro-interaction is inspiring.

---

## @poetengineer__ Living Garden Concept
- **Source**: Twitter @poetengineer__, Mar 2 2026
- **Concept**: Obsidian notes visualized as growing plants on dark canvas
- **How it works**:
  - Each tag = a plant species/type
  - Trunk = older notes
  - Leaves = newer notes
  - Timeline scrubber lets you watch garden grow chronologically
  - Color-coded tags flanking the visualization
- **Visual**: Dark bg, colorful plant structures (dandelions, trees, flowers), dotted connection lines, tag labels in bordered boxes
- **Relevance**: Philosophy of "tending your garden" — site as living, growing thing. Could be:
  - (a) A literal `/garden` page visualization (ambitious)
  - (b) A small generative SVG element on homepage (moderate)
  - (c) Just the philosophical energy — "alive" signals throughout the site (minimal)

---

## Design Synthesis (Current Direction)

### Palette
- Background: `#1a1511` to `#1c1714` (warm brown-black, NOT blue-black)
- Text: `#ddd2c7` (cream)
- Accent: `#daa520` (goldenrod) — single accent, 2-color discipline
- Muted: `#6b5d4f` (for dates, metadata)
- Zero cool tones anywhere

### Typography
- **UI/nav/labels**: JetBrains Mono, all lowercase
- **Body prose**: Instrument Serif or ET Book
- **Headings**: Weight 400 (Tufte approach — large but light)
- **Code**: JetBrains Mono (double duty)

### Layout
- Max-width: ~76-80ch
- Spacing: Fibonacci scale (1rem, 1.618rem, 2.618rem, 4.236rem)
- Dashed `<hr>` separators between sections
- **Selective borders** (NOT full-page border):
  - Blog posts: subtle left accent border (notebook margin line)
  - Stats/now cards: bordered boxes (discrete info units)
  - Code blocks: naturally bordered/backgrounded
  - Homepage sections: NO borders, Fibonacci spacing does the work

### Structure
- **Homepage**: Name + bio, Now section (hybrid: status line + structured items), Recent posts, Footer
- **Blog**: Post listing with dates, tokenbender-style TOC sidebar on articles
- **Work/Projects**: Separate page, reference only
- **Command palette**: Kept (Cmd+K)
- **Dashboard stats**: Real API integrations (WakaTime, GitHub) — seated.ro energy

### Text Casing
- ALL LOWERCASE everywhere. Hierarchy through font size + weight, not capitalization.
- Section labels in monospace: `research · 6 min read`

### Micro-animations (planned)
1. Link underline sweep on hover (CSS `background-size`)
2. Fade-in on scroll (IntersectionObserver, ~200ms)
3. Blinking cursor on "now" status
4. Command palette backdrop blur
5. Post list stagger on load (50ms between items)

### Footer
- **Rotating sign-offs**: Random pick from a growing list on each page load
- Seed collection:
  - ML: "rolling towards the global minima", "somewhere on the loss landscape", "exploring the manifold", "stuck in a local optimum, but the view is nice", "gradient: nonzero"
  - SUBLEQ: "subtracting towards something", "one instruction at a time", "if mem[b] <= 0: goto next", "still mutating", "searching for the basin"
  - Life: "tending the garden", "chaos is beauty", "looking through a small, carefully curated window"
  - Meta: "just vanilla html/css/js", "this page mass: ~47KB"

### Garden (PHASE 2)
- @poetengineer__ living garden concept — deferred until after site ships
- Will need: canvas/SVG visualization, data model for posts/tags as plants, timeline scrubber
- Discuss how it ties into blog content structure and tag taxonomy

### Resolved Questions
1. **Casing**: All lowercase
2. **Now section**: Hybrid — freeform status line + structured items below
3. **Stats**: Real API integrations (WakaTime, GitHub, etc.)
4. **Borders**: Selective — left accent on articles, boxed cards for stats, no full-page border
5. **Garden**: Phase 2
6. **Blog layout**: TOC sidebar (tokenbender style)
7. **Footer**: Rotating random sign-offs from a growing collection
