// Blog Preview Loader
class BlogPreview {
  constructor() {
    this.container = document.getElementById('blog-posts');
    if (this.container) {
      this.loadRecentPosts();
    }
  }

  async loadRecentPosts() {
    try {
      // Fetch blog index (assuming you have a blog/index.json or similar)
      // For now, we'll create placeholder posts
      const posts = await this.fetchPosts();
      this.renderPosts(posts);
    } catch (error) {
      console.error('Error loading blog posts:', error);
      this.container.innerHTML = '<p class="error-message">Unable to load blog posts</p>';
    }
  }

  async fetchPosts() {
    // Try to fetch from blog index
    try {
      const response = await fetch('/blog/posts.json');
      if (response.ok) {
        const data = await response.json();
        return data.posts.slice(0, 3); // Get 3 most recent
      }
    } catch (e) {
      console.log('No posts.json found, using placeholder data');
    }

    // Placeholder data if no posts.json exists
    return [
      {
        title: 'Getting Started with Multi-Agent Systems',
        slug: 'multi-agent-systems-intro',
        date: '2024-01-15',
        excerpt: 'An introduction to building distributed multi-agent systems for complex problem solving.',
        tags: ['AI', 'Multi-Agent', 'Systems']
      },
      {
        title: 'Neural Architecture Search: A Practical Guide',
        slug: 'neural-architecture-search-guide',
        date: '2024-01-10',
        excerpt: 'Learn how to automate the design of neural networks using NAS techniques.',
        tags: ['Deep Learning', 'NAS', 'PyTorch']
      },
      {
        title: 'Optimizing Large Language Models',
        slug: 'optimizing-large-language-models',
        date: '2024-01-05',
        excerpt: 'Techniques for efficient training and inference of large language models.',
        tags: ['LLM', 'Optimization', 'Transformers']
      }
    ];
  }

  renderPosts(posts) {
    if (posts.length === 0) {
      this.container.innerHTML = '<p>No blog posts yet. Check back soon!</p>';
      return;
    }

    this.container.innerHTML = posts.map(post => `
      <article class="blog-card">
        <div class="blog-card-header">
          <h3><a href="/blog/${post.slug}.html">${this.escapeHtml(post.title)}</a></h3>
          <time class="blog-date">${this.formatDate(post.date)}</time>
        </div>
        <p class="blog-excerpt">${this.escapeHtml(post.excerpt)}</p>
        <div class="blog-tags">
          ${post.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
        </div>
        <a href="/blog/${post.slug}.html" class="blog-read-more">Read more →</a>
      </article>
    `).join('');
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  new BlogPreview();
});
