// Command Palette with Fuzzy Search
class CommandPalette {
  constructor() {
    this.palette = document.getElementById('command-palette');
    this.input = document.getElementById('command-input');
    this.results = document.getElementById('command-results');
    this.isVisible = false;
    this.selectedIndex = 0;

    // Define searchable commands and sections
    this.commands = [
      { name: 'Home', type: 'section', target: '#hero' },
      { name: 'About', type: 'section', target: '#about' },
      { name: 'Work', type: 'section', target: '#work' },
      { name: 'Blog', type: 'section', target: '#blog' },
      { name: 'GitHub Stats', type: 'section', target: '#stats' },
      { name: 'Contact', type: 'section', target: '#contact' },
      { name: 'View Resume', type: 'page', target: '/resume.html' },
      { name: 'Toggle CRT Effect', type: 'action', action: () => this.toggleScanlines() },
      // Projects
      { name: 'Multi-Agent Risk Analysis', type: 'project', target: '#work' },
      { name: 'Neural Architecture Search', type: 'project', target: '#work' },
      { name: 'Recommendation Systems', type: 'project', target: '#work' },
    ];

    // Initialize Fuse.js
    this.fuse = new Fuse(this.commands, {
      keys: ['name', 'type'],
      threshold: 0.3,
      includeScore: true
    });

    this.init();
  }

  init() {
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Cmd+K or Ctrl+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.toggle();
      }

      // Escape to close
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }

      // Arrow navigation
      if (this.isVisible) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.selectNext();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.selectPrevious();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          this.executeSelected();
        }
      }
    });

    // Input handler
    this.input.addEventListener('input', () => {
      this.search(this.input.value);
    });

    // Click outside to close
    this.palette.addEventListener('click', (e) => {
      if (e.target === this.palette) {
        this.hide();
      }
    });
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    this.palette.classList.remove('hidden');
    this.input.focus();
    this.isVisible = true;
    this.search(''); // Show all commands initially
  }

  hide() {
    this.palette.classList.add('hidden');
    this.input.value = '';
    this.results.innerHTML = '';
    this.isVisible = false;
    this.selectedIndex = 0;
  }

  search(query) {
    let items = this.commands;

    if (query.trim()) {
      const fuseResults = this.fuse.search(query);
      items = fuseResults.map(result => result.item);
    }

    this.renderResults(items);
  }

  renderResults(items) {
    if (items.length === 0) {
      this.results.innerHTML = '<div class="command-item no-results">No results found</div>';
      return;
    }

    this.results.innerHTML = items.map((item, index) => `
      <div class="command-item ${index === this.selectedIndex ? 'selected' : ''}" data-index="${index}">
        <span class="command-icon">${this.getIcon(item.type)}</span>
        <span class="command-name">${item.name}</span>
        <span class="command-type">${item.type}</span>
      </div>
    `).join('');

    // Add click handlers
    this.results.querySelectorAll('.command-item').forEach((el, index) => {
      el.addEventListener('click', () => {
        this.selectedIndex = index;
        this.executeSelected();
      });

      el.addEventListener('mouseenter', () => {
        this.selectedIndex = index;
        this.updateSelection();
      });
    });
  }

  getIcon(type) {
    const icons = {
      section: '§',
      page: '→',
      action: '⚙',
      project: '◆'
    };
    return icons[type] || '•';
  }

  selectNext() {
    const items = this.results.querySelectorAll('.command-item:not(.no-results)');
    if (items.length === 0) return;

    this.selectedIndex = (this.selectedIndex + 1) % items.length;
    this.updateSelection();
    this.scrollToSelected();
  }

  selectPrevious() {
    const items = this.results.querySelectorAll('.command-item:not(.no-results)');
    if (items.length === 0) return;

    this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
    this.updateSelection();
    this.scrollToSelected();
  }

  updateSelection() {
    this.results.querySelectorAll('.command-item').forEach((el, index) => {
      el.classList.toggle('selected', index === this.selectedIndex);
    });
  }

  scrollToSelected() {
    const selected = this.results.querySelector('.command-item.selected');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  executeSelected() {
    const items = this.getCurrentItems();
    if (items.length === 0) return;

    const item = items[this.selectedIndex];
    if (!item) return;

    if (item.action) {
      // Execute custom action
      item.action();
    } else if (item.target) {
      if (item.target.startsWith('#')) {
        // Scroll to section
        const target = document.querySelector(item.target);
        if (target) {
          this.hide();
          setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      } else {
        // Navigate to page
        window.location.href = item.target;
      }
    }

    this.hide();
  }

  getCurrentItems() {
    const query = this.input.value.trim();
    if (query) {
      const fuseResults = this.fuse.search(query);
      return fuseResults.map(result => result.item);
    }
    return this.commands;
  }

  toggleScanlines() {
    document.body.classList.toggle('scanlines-active');
    const isActive = document.body.classList.contains('scanlines-active');
    localStorage.setItem('scanlines', isActive);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new CommandPalette();
});
