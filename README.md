# Personal Portfolio Website

Terminal-inspired portfolio with command bar navigation, blog system, and activity widgets. Built with vanilla JavaScript, no frameworks.

## Features

- **Command Bar Navigation**: Press `/` or `Ctrl+K` to open terminal-style command palette
- **Blog System**: Write in Markdown, auto-convert to styled HTML
- **Activity Widgets**: GitHub contributions heatmap, Spotify/Last.fm now playing
- **Dark/Light Themes**: Default dark mode with localStorage persistence
- **Project Showcase**: Grid layout with modal details
- **Fully Static**: No backend required, deploy anywhere
- **Fast**: Vanilla JS, optimized for performance

## Tech Stack

- HTML5, CSS3, Vanilla JavaScript (ES6+)
- Python (Markdown → HTML conversion)
- Cloudflare Pages (deployment)
- GitHub API & Last.fm API (widgets)

## Getting Started

### Prerequisites

- Python 3.10+
- Git

### Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd blog
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r scripts/requirements.txt
   ```

3. **Configure personal information**:

   Update the following files with your information:

   - `public/js/widgets.js`: Replace `yourusername` (GitHub), `yourlastfmusername`, and `YOUR_LASTFM_API_KEY`
   - `public/js/commands.js`: Update GitHub profile URL
   - `public/data/projects.json`: Add your projects
   - `public/resume.html`: Update with your resume details
   - `public/index.html`: Update intro text if desired

4. **Build blog posts**:
   ```bash
   python scripts/build_blog.py
   ```

5. **Run local server**:
   ```bash
   cd public
   python -m http.server 8000
   ```

6. **Visit**: http://localhost:8000

## Creating Blog Posts

1. Create a new Markdown file in `src/blog/`:
   ```markdown
   ---
   title: "Your Post Title"
   date: 2025-01-27
   tags: ["tag1", "tag2"]
   summary: "Brief description of the post"
   ---

   # Your Content Here

   Write your post content in Markdown...
   ```

2. Build the blog:
   ```bash
   python scripts/build_blog.py
   ```

3. The HTML will be generated in `public/blog/`

## Project Structure

```
blog/
├── public/                 # Static site output
│   ├── index.html         # Landing page
│   ├── work.html          # Projects page
│   ├── blog/              # Blog posts
│   │   ├── index.html     # Blog listing
│   │   └── *.html         # Generated posts
│   ├── resume.html        # Resume page
│   ├── fun.html           # Misc content
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript modules
│   ├── assets/            # Images, fonts, cursors
│   └── data/              # JSON data files
├── src/
│   └── blog/              # Markdown blog posts
├── scripts/
│   └── build_blog.py      # Blog generator
└── README.md
```

## Customization

### Theme Colors

Edit CSS variables in `public/css/main.css`:
```css
:root {
  --accent-green: #00ff88;  /* Primary accent */
  --accent-purple: #b794f6; /* Secondary accent */
  /* ... */
}
```

### Command Bar Commands

Add/modify commands in `public/js/commands.js`:
```javascript
const COMMANDS = [
  {
    cmd: '/yourcommand',
    desc: 'Description',
    type: 'page',
    action: () => window.location.href = '/yourpage.html'
  },
  // ...
];
```

### Projects

Update `public/data/projects.json` with your projects:
```json
{
  "title": "Project Name",
  "summary": "Short description",
  "description": "Detailed description",
  "tech": ["Python", "PyTorch"],
  "features": ["Feature 1", "Feature 2"],
  "github": "https://github.com/...",
  "image": "/assets/images/project.png"
}
```

## Deployment

### Cloudflare Pages (Recommended)

1. Push to GitHub
2. Connect repository to Cloudflare Pages
3. Configure build settings:
   - **Build command**: `pip install -r scripts/requirements.txt && python scripts/build_blog.py`
   - **Build output directory**: `public`
4. Deploy automatically on push

### GitHub Pages

1. Enable GitHub Pages in repository settings
2. Use GitHub Actions workflow (`.github/workflows/deploy.yml`)
3. Set source to `gh-pages` branch

### Other Platforms

Any static hosting works:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Azure Static Web Apps

Just build locally and upload the `public/` directory.

## API Keys

### GitHub Widget

No API key required. Uses public API with rate limits.

Update username in `public/js/widgets.js`:
```javascript
const gitWidget = new GitHubWidget('yourusername', 'git-heatmap');
```

### Last.fm Widget (Spotify)

1. Create account at https://www.last.fm
2. Get API key: https://www.last.fm/api/account/create
3. Connect Spotify to Last.fm
4. Update in `public/js/widgets.js`:
   ```javascript
   const spotifyWidget = new SpotifyWidget('yourusername', 'YOUR_API_KEY', 'spotify-display');
   ```

## Commands

Press `/` or `Ctrl+K` anywhere to open command bar:

- `/work` - View projects
- `/blog` - Browse blog posts
- `/resume` - View resume
- `/fun` - Misc content
- `/home` - Back to landing page
- `/theme` - Toggle dark/light mode
- `/github` - Open GitHub profile
- Type text without `/` to search

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Vanilla JS (no framework overhead)
- CSS custom properties for theming
- Lazy loading for images
- Optimized fonts with `font-display: swap`
- Static generation (no runtime SSR)

## License

MIT License - feel free to use this for your own portfolio!

## Credits

- Berkeley Mono font (trial version included)
- Open Sans via Google Fonts
- Inspired by terminal aesthetics and command palettes

## Contributing

Issues and pull requests welcome! This is primarily a personal project, but improvements are appreciated.

---

Built with ❤️ and vanilla JavaScript
