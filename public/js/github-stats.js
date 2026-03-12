// GitHub Stats Widget
class GitHubStats {
  constructor(username, token = null) {
    this.username = username;
    this.token = token;
    this.apiBase = 'https://api.github.com';
    this.init();
  }

  async init() {
    try {
      await Promise.all([
        this.renderContributionHeatmap(),
        this.renderLanguageStats(),
        this.renderRecentCommits()
      ]);
    } catch (error) {
      console.error('Error loading GitHub stats:', error);
    }
  }

  async fetchAPI(endpoint) {
    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };

    if (this.token) {
      headers['Authorization'] = `token ${this.token}`;
    }

    const response = await fetch(`${this.apiBase}${endpoint}`, { headers });
    if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
    return response.json();
  }

  async renderContributionHeatmap() {
    const container = document.getElementById('github-heatmap');
    if (!container) return;

    try {
      // For now, create a visual placeholder
      // To get actual contribution data, you'd need to use GitHub GraphQL API or a service like github-contributions-api
      container.innerHTML = this.createPlaceholderHeatmap();
    } catch (error) {
      container.innerHTML = '<p class="error-message">Unable to load contribution data</p>';
    }
  }

  createPlaceholderHeatmap() {
    const weeks = 52;
    const days = 7;
    let html = '<div class="heatmap-grid">';

    for (let week = 0; week < weeks; week++) {
      html += '<div class="heatmap-week">';
      for (let day = 0; day < days; day++) {
        const level = Math.floor(Math.random() * 5); // 0-4 contribution levels
        html += `<div class="heatmap-day level-${level}" title="Contributions"></div>`;
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  async renderLanguageStats() {
    const container = document.getElementById('language-stats');
    if (!container) return;

    try {
      const repos = await this.fetchAPI(`/users/${this.username}/repos?per_page=100&sort=updated`);
      const languageData = this.aggregateLanguages(repos);

      container.innerHTML = this.createLanguageChart(languageData);
    } catch (error) {
      container.innerHTML = '<p class="error-message">Unable to load language stats</p>';
    }
  }

  aggregateLanguages(repos) {
    const langCount = {};

    repos.forEach(repo => {
      if (repo.language) {
        langCount[repo.language] = (langCount[repo.language] || 0) + 1;
      }
    });

    // Convert to array and sort by count
    return Object.entries(langCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5) // Top 5 languages
      .map(([lang, count]) => ({ name: lang, count }));
  }

  createLanguageChart(data) {
    if (data.length === 0) {
      return '<p>No language data available</p>';
    }

    const total = data.reduce((sum, item) => sum + item.count, 0);
    const colors = {
      Python: '#3572A5',
      JavaScript: '#f1e05a',
      TypeScript: '#2b7489',
      Rust: '#dea584',
      Go: '#00ADD8',
      Java: '#b07219',
      C: '#555555',
      'C++': '#f34b7d',
      HTML: '#e34c26',
      CSS: '#563d7c'
    };

    let html = '<div class="language-list">';

    data.forEach(item => {
      const percentage = ((item.count / total) * 100).toFixed(1);
      const color = colors[item.name] || '#8b949e';

      html += `
        <div class="language-item">
          <div class="language-header">
            <span class="language-name">
              <span class="language-color" style="background-color: ${color}"></span>
              ${item.name}
            </span>
            <span class="language-percent">${percentage}%</span>
          </div>
          <div class="language-bar">
            <div class="language-bar-fill" style="width: ${percentage}%; background-color: ${color}"></div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  async renderRecentCommits() {
    const container = document.getElementById('recent-commits');
    if (!container) return;

    try {
      const events = await this.fetchAPI(`/users/${this.username}/events/public?per_page=10`);
      const pushEvents = events.filter(e => e.type === 'PushEvent').slice(0, 5);

      container.innerHTML = this.createCommitsList(pushEvents);
    } catch (error) {
      container.innerHTML = '<p class="error-message">Unable to load recent commits</p>';
    }
  }

  createCommitsList(events) {
    if (events.length === 0) {
      return '<p>No recent commits found</p>';
    }

    let html = '<div class="commits-list">';

    events.forEach(event => {
      const repo = event.repo.name;
      const commits = event.payload.commits || [];
      const commit = commits[0]; // Show first commit from push

      if (commit) {
        const date = new Date(event.created_at);
        const timeAgo = this.getTimeAgo(date);
        const message = commit.message.split('\n')[0]; // First line only
        const truncated = message.length > 60 ? message.substring(0, 60) + '...' : message;

        html += `
          <div class="commit-item">
            <div class="commit-repo">${repo}</div>
            <div class="commit-message">${this.escapeHtml(truncated)}</div>
            <div class="commit-time">${timeAgo}</div>
          </div>
        `;
      }
    });

    html += '</div>';
    return html;
  }

  getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
      }
    }

    return 'just now';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  // Replace with your GitHub username
  const username = 'Ja-Crispy';
  // Optional: Add your GitHub personal access token for higher rate limits
  const token = null; // or 'your_github_token'

  new GitHubStats(username, token);
});
