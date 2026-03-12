# Blog Style Guide & Agent Instructions

You are rewriting/creating a blog post for vaishnav's personal site. Follow these rules exactly.

## Voice & Tone

- **Casual but rigorous.** Data stays precise, prose stays loose.
- **All lowercase** for headings and body text (except proper nouns, acronyms like SUBLEQ, SGD, etc.)
- Short sentences. Punchy. No filler. No "In this post, we will explore..."
- Contractions always ("it's" not "it is", "don't" not "do not")
- First person plural ("we found", "we measured") for research. First person singular ("i wanted", "i built") for personal stuff.
- No exclamation marks. Excitement comes from the content, not punctuation.
- No emoji in prose. Ever.
- Swearing is fine if it fits. Don't force it.

## Pop Fiction Theme

Each post borrows the voice/references of ONE piece of fiction. This is the signature style.

Examples:
- **Hitchhiker's Guide to the Galaxy** — references to 42, babel fish, magrathea, infinite improbability drive, "don't panic", towels
- **Lord of the Rings** — one ring metaphors, shire vs mordor, "one does not simply...", fellowship analogies
- **Dune** — spice, fear is the mind-killer, plans within plans, desert metaphors
- **Star Wars** — force analogies, "I have a bad feeling about this", dark side temptations

Rules:
- The theme should feel natural, not forced. If a reference doesn't fit, don't use it.
- Open with a thematic quote (real or stylized).
- Section titles can riff on the fiction (e.g., "one instruction to rule them all").
- Weave references into technical explanations as metaphors. The data is the star, the fiction is the seasoning.
- The conclusion title should be a themed riff (e.g., "so long, and thanks for all the gradients").

## Frontmatter

```yaml
---
title: "lowercase title here"
date: YYYY-MM-DD
tags: ["tag1", "tag2", "tag3"]
summary: "one sentence. lowercase. what this post is about in plain language."
---
```

- Title: lowercase, thematic, intriguing
- Tags: 3-5, lowercase, relevant categories
- Summary: one sentence, casual, should make someone want to click

## Structure

1. **Opening quote** — blockquote from the fiction theme
2. **Hook paragraph** — what this is about, why it matters, in 2-3 sentences
3. **Context section** — background/setup (what is X, why do we care)
4. **Core findings** — the meat, with data, figures, tables
5. **Implications/surprises** — weird results, unexpected findings
6. **What didn't work** — null results are interesting too, include them
7. **Conclusion** — themed title, tie it together, one-liner kicker at the end

Keep sections short. If a section is more than ~5 paragraphs, split it.

## Images

### Research Figures

Standard markdown, full width:
```markdown
![caption describing what the figure shows](/blog/images/{post-slug}/filename.png)
```

- Alt text = descriptive caption (what the figure shows, not just the title)
- All figures go in `/public/blog/images/{post-slug}/` (subdirectory per post)
- Copy figures from the project's results dir, don't move them

### Memes

Centered with witty caption using HTML figure element:
```html
<figure class="meme">
<img src="/blog/images/{post-slug}/meme-name.jpg" alt="meme description">
<figcaption>short witty caption in lowercase</figcaption>
</figure>
```

- Max 3-4 memes per post. Don't overdo it.
- Place them after key points as punctuation, not decoration.
- Captions should be deadpan funny — relate the meme to the specific technical point.
- Filename: kebab-case, no spaces (e.g., `surprised-pikachu.jpg`, `this-is-fine.jpg`)

### Meme Placement Strategy

Good spots for memes:
- After explaining something counterintuitive
- After a null result / something that didn't work
- After the setup before the punchline finding
- At section transitions for comic relief

When writing, mark meme spots with:
```html
<!-- MEME: [description of what meme would fit here and why] -->
```
These will be reviewed and filled in with actual images later.

## Tables

Use standard markdown tables. CSS handles styling.

```markdown
| column 1 | column 2 | column 3 |
|---|---|---|
| data | data | data |
| **highlighted row** | **data** | **data** |
```

Bold the key/winning row.

## Code Blocks

Use fenced code blocks with language hints:
````
```python
code here
```
````

Keep code blocks short (< 10 lines). If longer, trim to the essential part.

## Citations & Links

- Link to source material inline where first mentioned: `[did something analogous](https://url)`
- Twitter/X links are fine as citations
- Add a references line at the bottom:
  ```
  *thanks to [person] for [what they contributed]. their [work](url) is worth reading.*
  ```
- GitHub repo link at bottom: `*code and data at [repo-name](url).*`

## Build Process

```bash
cd E:\Work\blog
python scripts/build_blog.py
```

- Source markdown goes in `src/blog/{slug}.md`
- Built HTML goes to `public/blog/{slug}.html`
- Images go in `public/blog/images/{slug}/`
- Metadata auto-generated to `public/blog/metadata.json`
- CSS changes don't need rebuild (they're in `public/css/main.css` directly)

## File Naming

- Post slug: kebab-case (e.g., `subleq-mesa`, `rl-mascot`)
- Image files: kebab-case, no spaces, descriptive (e.g., `fig1-mesa.png`, `this-is-fine.jpg`)
- Image subdirectory matches post slug exactly

## Checklist Before Done

- [ ] Frontmatter complete (title, date, tags, summary)
- [ ] Opening quote from fiction theme
- [ ] All data/numbers verified against source
- [ ] Research figures copied to `public/blog/images/{slug}/`
- [ ] Meme spots marked or filled
- [ ] No TODOs left (or clearly marked for user)
- [ ] Tables render (check with build)
- [ ] Links work
- [ ] Build succeeds: `python scripts/build_blog.py`
