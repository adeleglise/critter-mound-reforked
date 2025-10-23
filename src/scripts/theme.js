/**
 * Theme Manager
 * Handles light/dark mode toggling and persistence
 */

class ThemeManager {
  constructor() {
    this.storageKey = 'critter-mound-theme'
    this.init()
  }

  init() {
    // Check for saved theme preference or default to system preference
    const savedTheme = this.getSavedTheme()
    const systemTheme = this.getSystemTheme()
    const theme = savedTheme || systemTheme

    this.setTheme(theme, false)
    this.setupListeners()
  }

  getSavedTheme() {
    return localStorage.getItem(this.storageKey)
  }

  getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  setTheme(theme, save = true) {
    const root = document.documentElement

    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark')
    } else {
      root.removeAttribute('data-theme')
    }

    if (save) {
      localStorage.setItem(this.storageKey, theme)
    }

    // Update toggle button if it exists
    this.updateToggleButton(theme)
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme')
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
    this.setTheme(newTheme)
  }

  updateToggleButton(theme) {
    const toggleBtn = document.getElementById('theme-toggle')
    if (!toggleBtn) return

    const icon = toggleBtn.querySelector('.theme-icon')
    if (icon) {
      icon.textContent = theme === 'dark' ? '☀️' : '🌙'
    }

    toggleBtn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`)
  }

  setupListeners() {
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      // Only auto-switch if user hasn't set a preference
      if (!this.getSavedTheme()) {
        this.setTheme(e.matches ? 'dark' : 'light', false)
      }
    })

    // Setup toggle button listener
    document.addEventListener('DOMContentLoaded', () => {
      const toggleBtn = document.getElementById('theme-toggle')
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => this.toggleTheme())
      }
    })
  }
}

// Initialize theme manager
const themeManager = new ThemeManager()

// Expose globally for manual control
window.themeManager = themeManager
