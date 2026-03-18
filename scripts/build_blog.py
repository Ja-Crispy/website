#!/usr/bin/env python3
"""
Blog & garden builder
Converts markdown files in src/blog/ to HTML in public/blog/
Processes src/garden/*.md into public/garden/garden-data.json
"""

import markdown
import json
import re
from pathlib import Path
from datetime import datetime
import frontmatter

# Configuration
SRC_DIR = Path('src/blog')
OUT_DIR = Path('public/blog')
METADATA_FILE = Path('public/blog/metadata.json')
GARDEN_SRC_DIR = Path('src/garden')
GARDEN_OUT_DIR = Path('public/garden')
GARDEN_DATA_FILE = Path('public/garden/garden-data.json')

# Markdown extensions
MD_EXTENSIONS = [
    'fenced_code',
    'codehilite',
    'tables',
    'toc',
    'sane_lists'
]

FONTS_LINK = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    '  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1'
    '&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,400'
    '&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">'
)

KATEX_LINK = (
    '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">'
)

KATEX_SCRIPT = (
    '<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>\n'
    '  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" '
    'onload="renderMathInElement(document.body,{delimiters:[{left:\'$$\',right:\'$$\',display:true},'
    '{left:\'$\',right:\'$\',display:false}]})"></script>'
)


def estimate_reading_time(content):
    """Estimate reading time in minutes"""
    words = len(re.findall(r'\w+', content))
    return max(1, round(words / 200))


def process_markdown(md_file):
    """Convert single markdown file to HTML"""
    with open(md_file, 'r', encoding='utf-8') as f:
        post = frontmatter.load(f)

    title = post.get('title', md_file.stem.replace('-', ' ').title())
    date_raw = post.get('date', datetime.now())
    tags = post.get('tags', [])
    summary = post.get('summary', '')

    content = markdown.markdown(post.content, extensions=MD_EXTENSIONS)
    reading_time = estimate_reading_time(post.content)

    if isinstance(date_raw, str):
        date_obj = datetime.fromisoformat(date_raw)
    elif isinstance(date_raw, datetime):
        date_obj = date_raw
    else:
        date_obj = datetime.combine(date_raw, datetime.min.time())

    date_iso = date_obj.isoformat()
    formatted_date = date_obj.strftime('%B %d, %Y')

    return {
        'slug': md_file.stem,
        'title': title,
        'date': date_iso,
        'formatted_date': formatted_date,
        'reading_time': reading_time,
        'tags': tags,
        'summary': summary,
        'content': content,
        'series': post.get('series', ''),
        'series_order': post.get('series_order', 0),
        'has_math': '$$' in post.content,
    }


def generate_html(post_data, series_posts=None):
    """Generate HTML for a blog post"""
    tags_html = ''
    if post_data['tags']:
        tags_html = '<div class="post-header__tags">' + ''.join(
            f'<span class="tag">{t}</span>' for t in post_data['tags']
        ) + '</div>'

    series_html = ''
    if post_data.get('series') and series_posts:
        items = ''
        for sp in series_posts:
            if sp['slug'] == post_data['slug']:
                items += f'<li class="series-nav__item series-nav__item--current">#{sp["series_order"]}: {sp["title"]}</li>\n'
            else:
                items += f'<li class="series-nav__item"><a href="/blog/{sp["slug"]}.html">#{sp["series_order"]}: {sp["title"]}</a></li>\n'
        series_html = f'''
      <nav class="series-nav">
        <div class="series-nav__label">{post_data["series"]}</div>
        <ol class="series-nav__list">
          {items}
        </ol>
      </nav>'''

    math_css = KATEX_LINK if post_data.get('has_math') else ''
    math_js = KATEX_SCRIPT if post_data.get('has_math') else ''

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{post_data['title']} — vaishnav varma</title>
    {FONTS_LINK}
    {math_css}
    <link rel="stylesheet" href="/css/main.css">
</head>
<body>
  <div class="site-wrapper">

    <nav class="site-nav">
      <ul class="site-nav__links">
        <li><a href="/">home</a></li>
        <li><a href="/blog/" class="active">blog</a></li>
        <li><a href="/work.html">work</a></li>
        <li><a href="/garden/">garden</a></li>
      </ul>
      <span class="cmd-hint" id="cmd-hint">ctrl+k</span>
    </nav>

    <article class="post-page">
      <header class="post-header">
        <h1 class="post-header__title">{post_data['title']}</h1>
        <div class="post-header__meta">
          <time datetime="{post_data['date']}">{post_data['formatted_date']}</time>
          <span>{post_data['reading_time']} min read</span>
        </div>
        {tags_html}
      </header>
{series_html}
      <div class="post-content">
        {post_data['content']}
      </div>

      <footer class="post-footer">
        <a href="/blog/" class="back-link">&larr; all posts</a>
      </footer>
    </article>

    <footer class="site-footer">
      <span>&copy; 2025 vaishnav varma</span>
      <span class="site-footer__signoff" id="footer-signoff"></span>
      <div class="site-footer__links">
        <a href="https://github.com/Ja-Crispy">gh</a>
        <a href="https://www.linkedin.com/in/vaishnav-varma/">li</a>
        <a href="mailto:vaisgovivarma@gmail.com">mail</a>
      </div>
    </footer>
  </div>

  <div id="command-palette" class="command-palette hidden">
    <div class="command-palette__box">
      <input type="text" id="command-input" class="command-palette__input"
             placeholder="search or jump to..." autocomplete="off" spellcheck="false">
      <div id="command-results" class="command-palette__results"></div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/fuse.js@6.6.2"></script>
  <script src="/js/main.js"></script>
  {math_js}
</body>
</html>"""


def build():
    """Main build function"""
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # first pass: process all markdown
    all_posts = []
    md_files = list(SRC_DIR.glob('*.md'))
    print(f"Found {len(md_files)} markdown files")

    for md_file in md_files:
        print(f"Processing {md_file.name}...")
        try:
            all_posts.append(process_markdown(md_file))
        except Exception as e:
            print(f"  x Error: {e}")

    # group series posts
    series_map = {}
    for p in all_posts:
        if p.get('series'):
            series_map.setdefault(p['series'], []).append(p)
    for posts in series_map.values():
        posts.sort(key=lambda p: p['series_order'])

    # second pass: generate HTML with series context
    posts_metadata = []
    for post_data in all_posts:
        try:
            series_posts = series_map.get(post_data.get('series', ''))
            html = generate_html(post_data, series_posts)

            out_file = OUT_DIR / f"{post_data['slug']}.html"
            out_file.write_text(html, encoding='utf-8')

            metadata = {k: v for k, v in post_data.items() if k != 'content'}
            posts_metadata.append(metadata)
            print(f"  + {out_file.name}")
        except Exception as e:
            print(f"  x Error: {e}")

    posts_metadata.sort(key=lambda p: p['date'], reverse=True)

    METADATA_FILE.write_text(json.dumps(posts_metadata, indent=2), encoding='utf-8')
    print(f"\nBuilt {len(posts_metadata)} posts")


# Tag category definitions with colors
TAG_CATEGORIES = {
    'core-ml': {
        'label': 'Core ML/AI',
        'color': '#e8c547',
        'tags': ['llm', 'neural-networks', 'transformers', 'interpretability', 'alignment', 'embeddings'],
    },
    'systems': {
        'label': 'Systems',
        'color': '#7c9a72',
        'tags': ['agents', 'context-management', 'architecture', 'infrastructure', 'performance', 'inference', 'dev-tools'],
    },
    'gpu': {
        'label': 'GPU',
        'color': '#c4837a',
        'tags': ['gpu', 'cuda'],
    },
    'math': {
        'label': 'Math & Theory',
        'color': '#a89ae8',
        'tags': ['optimization', 'probability', 'geometry', 'math', 'computation', 'compilers', 'programming-languages'],
    },
    'domains': {
        'label': 'Domains',
        'color': '#e89a7c',
        'tags': ['game-dev', 'graphics', 'physics', 'vision', 'web'],
    },
    'security': {
        'label': 'Security',
        'color': '#9ac4e8',
        'tags': ['security', 'cryptography', 'policy-engines'],
    },
    'meta': {
        'label': 'Meta',
        'color': '#c4a645',
        'tags': ['research', 'subleq', 'evolution', 'jane-street', 'puzzles', 'combinatorics', 'open-source', 'meta'],
    },
}


def get_categories_for_tags(tags):
    """Return list of category keys, ordered by first matching tag position."""
    cat_positions = {}
    for cat_key, cat_data in TAG_CATEGORIES.items():
        for i, t in enumerate(tags):
            if t in cat_data['tags']:
                if cat_key not in cat_positions or i < cat_positions[cat_key]:
                    cat_positions[cat_key] = i
                break
    cats = sorted(cat_positions.keys(), key=lambda k: cat_positions[k])
    return cats if cats else ['meta']


def build_garden():
    """Build garden-data.json from garden markdown files + blog metadata."""
    GARDEN_OUT_DIR.mkdir(parents=True, exist_ok=True)

    items = []

    # Process garden markdown files
    garden_files = [f for f in GARDEN_SRC_DIR.glob('*.md') if f.name != 'TAGS.md']
    print(f"\nGarden: found {len(garden_files)} items")

    for md_file in garden_files:
        try:
            with open(md_file, 'r', encoding='utf-8') as f:
                post = frontmatter.load(f)

            tags = post.get('tags', [])
            cats = get_categories_for_tags(tags)

            items.append({
                'id': md_file.stem,
                'title': post.get('title', md_file.stem.replace('-', ' ')),
                'type': post.get('type', 'blog'),
                'url': post.get('url', ''),
                'tags': tags,
                'status': post.get('status', 'finished'),
                'date_added': str(post.get('date_added', '')),
                'notes': post.content.strip(),
                'source': 'garden',
                'categories': cats,
                'primary_category': cats[0],
            })
            print(f"  + {md_file.stem}")
        except Exception as e:
            print(f"  x {md_file.name}: {e}")

    # Add blog posts from metadata
    if METADATA_FILE.exists():
        blog_meta = json.loads(METADATA_FILE.read_text(encoding='utf-8'))
        for post in blog_meta:
            tags = post.get('tags', [])
            cats = get_categories_for_tags(tags)
            items.append({
                'id': post['slug'],
                'title': post['title'],
                'type': 'post',
                'url': f"/blog/{post['slug']}.html",
                'tags': tags,
                'status': 'finished',
                'date_added': post['date'][:10],
                'notes': post.get('summary', ''),
                'source': 'blog',
                'reading_time': post.get('reading_time', 0),
                'categories': cats,
                'primary_category': cats[0],
            })
            print(f"  + {post['slug']} (blog post)")

    # Sort by date
    items.sort(key=lambda x: x['date_added'])

    garden_data = {
        'categories': {k: {'label': v['label'], 'color': v['color'], 'tags': v['tags']}
                       for k, v in TAG_CATEGORIES.items()},
        'items': items,
    }

    GARDEN_DATA_FILE.write_text(json.dumps(garden_data, indent=2), encoding='utf-8')
    print(f"Garden: built {len(items)} total items")


if __name__ == '__main__':
    build()
    build_garden()
