// API Sync Module for Univa Idle
// Handles authentication and cloud save sync

const API_URL = 'https://api.playuniva.com/api'; // Full URL to avoid CORS issues

class APISync {
  constructor() {
    this.isLoggedIn = false;
    this.user = null;
    this.syncInterval = null;
    this.lastSyncTime = 0;
  }

  async checkAuth() {
    try {
      console.log('[API Sync] Checking authentication...');
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        this.isLoggedIn = true;
        this.user = data.user;
        console.log('[API Sync] Logged in as:', this.user.email);
        return true;
      } else {
        console.log('[API Sync] Not authenticated, status:', response.status);
      }
    } catch (err) {
      console.log('[API Sync] Auth check failed:', err.message);
    }
    
    this.isLoggedIn = false;
    this.user = null;
    return false;
  }

  async loadFromCloud() {
    if (!this.isLoggedIn) {
      console.log('[API Sync] Cannot load from cloud - not logged in');
      return null;
    }

    try {
      console.log('[API Sync] Loading save from cloud...');
      const response = await fetch(`${API_URL}/game-state/idle`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[API Sync] Cloud save loaded:', data.data ? 'Found' : 'Empty');
        return data.data;
      } else {
        console.log('[API Sync] Failed to load from cloud, status:', response.status);
      }
    } catch (err) {
      console.error('[API Sync] Load error:', err);
    }
    
    return null;
  }

  async saveToCloud(gameState) {
    if (!this.isLoggedIn) {
      console.log('[API Sync] Cannot save to cloud - not logged in');
      return false;
    }

    try {
      console.log('[API Sync] Saving to cloud...');
      const response = await fetch(`${API_URL}/game-state/idle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ data: gameState }),
      });

      if (response.ok) {
        this.lastSyncTime = Date.now();
        console.log('[API Sync] Saved to cloud successfully');
        return true;
      } else {
        console.log('[API Sync] Failed to save to cloud, status:', response.status);
      }
    } catch (err) {
      console.error('[API Sync] Save error:', err);
    }
    
    return false;
  }

  startAutoSync(saveCallback, intervalMs = 60000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      if (this.isLoggedIn) {
        const gameState = saveCallback();
        const success = await this.saveToCloud(gameState);
        if (success && window.showSyncStatus) {
          window.showSyncStatus('Synced');
        }
      }
    }, intervalMs);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  showLoginPrompt() {
    const banner = document.createElement('div');
    banner.id = 'login-banner';
    banner.style.cssText = `
      position: fixed;
      top: 60px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 170, 255, 0.95);
      color: #000;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 170, 255, 0.5);
      display: flex;
      gap: 15px;
      align-items: center;
    `;
    
    banner.innerHTML = `
      <span>☁️ Sign in to sync your progress across devices</span>
      <a href="https://playuniva.com/play/login" style="
        background: #000;
        color: #0af;
        padding: 6px 12px;
        border-radius: 4px;
        text-decoration: none;
        font-weight: bold;
      ">Sign In</a>
      <button id="dismiss-login" style="
        background: transparent;
        border: none;
        color: #000;
        cursor: pointer;
        font-size: 18px;
        padding: 0 4px;
      ">×</button>
    `;
    
    document.body.appendChild(banner);
    
    document.getElementById('dismiss-login').addEventListener('click', () => {
      banner.remove();
      localStorage.setItem('loginPromptDismissed', Date.now());
    });
  }

  shouldShowLoginPrompt() {
    const dismissed = localStorage.getItem('loginPromptDismissed');
    if (!dismissed) return true;
    
    // Show again after 24 hours
    const dayInMs = 24 * 60 * 60 * 1000;
    return Date.now() - parseInt(dismissed) > dayInMs;
  }
}

// Make APISync available globally (not as module)
window.APISync = APISync;
