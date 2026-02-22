// Window Manager - Modular UI System
// Handles draggable, resizable, dockable windows

const WindowManager = {
  windows: {},
  activeWindow: null,
  nextZIndex: 100,
  dragState: null,
  resizeState: null,
  notifications: {}, // Track notifications per window
  
  init() {
    // Set up global event listeners
    document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    
    // Don't load layout here - it will be called after windows are created
  },
  
  showToast(message, options = {}) {
    const defaults = {
      title: 'Notification',
      icon: '📢',
      type: 'info', // info, success, warning, error
      duration: 3000,
      windowId: null, // Associate with a window for badge
    };
    
    const config = { ...defaults, ...options };
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${config.type}`;
    toast.innerHTML = `
      <div class="toast-header">
        <span class="toast-icon">${config.icon}</span>
        <span class="toast-title">${config.title}</span>
      </div>
      <div class="toast-message">${message}</div>
    `;
    
    // Add to container
    const container = document.getElementById('toast-container');
    container.appendChild(toast);
    
    // Add badge to window toolbar button if associated
    if (config.windowId && this.windows[config.windowId] && !this.windows[config.windowId].state.visible) {
      this.addNotificationBadge(config.windowId);
    }
    
    // Auto-dismiss
    setTimeout(() => {
      toast.classList.add('toast-fade-out');
      setTimeout(() => toast.remove(), 300);
    }, config.duration);
    
    // Click to dismiss
    toast.addEventListener('click', () => {
      toast.classList.add('toast-fade-out');
      setTimeout(() => toast.remove(), 300);
    });
  },
  
  addNotificationBadge(windowId) {
    if (!this.notifications[windowId]) {
      this.notifications[windowId] = 0;
    }
    this.notifications[windowId]++;
    
    const btn = document.getElementById(`toolbar-btn-${windowId}`);
    if (btn) {
      btn.classList.add('has-notification');
    }
  },
  
  clearNotificationBadge(windowId) {
    this.notifications[windowId] = 0;
    
    const btn = document.getElementById(`toolbar-btn-${windowId}`);
    if (btn) {
      btn.classList.remove('has-notification');
    }
  },
  
  createWindow(id, options) {
    const defaults = {
      title: 'Window',
      x: 100,
      y: 100,
      width: 300,
      height: 400,
      minWidth: 200,
      minHeight: 150,
      minimized: false,
      maximized: false,
      visible: true,
      content: '',
    };
    
    const config = { ...defaults, ...options };
    
    // Create window element
    const windowEl = document.createElement('div');
    windowEl.className = 'ui-window';
    windowEl.id = `window-${id}`;
    windowEl.style.left = config.x + 'px';
    windowEl.style.top = config.y + 'px';
    windowEl.style.width = config.width + 'px';
    windowEl.style.height = config.height + 'px';
    windowEl.style.zIndex = this.nextZIndex++;
    
    // Title bar
    const titleBar = document.createElement('div');
    titleBar.className = 'ui-window-titlebar';
    titleBar.innerHTML = `
      <span class="ui-window-title">${config.title}</span>
      <div class="ui-window-controls">
        <button class="ui-btn-minimize" title="Minimize">_</button>
        <button class="ui-btn-maximize" title="Maximize">□</button>
        <button class="ui-btn-close" title="Close">×</button>
      </div>
    `;
    
    // Content area
    const content = document.createElement('div');
    content.className = 'ui-window-content';
    content.id = `window-content-${id}`;
    if (typeof config.content === 'string') {
      content.innerHTML = config.content;
    } else if (config.content instanceof HTMLElement) {
      content.appendChild(config.content);
    }
    
    // Resize handles
    const handles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
    handles.forEach(dir => {
      const handle = document.createElement('div');
      handle.className = `ui-resize-handle ui-resize-${dir}`;
      handle.dataset.direction = dir;
      windowEl.appendChild(handle);
    });
    
    windowEl.appendChild(titleBar);
    windowEl.appendChild(content);
    document.body.appendChild(windowEl);
    
    // Store window state
    this.windows[id] = {
      id,
      element: windowEl,
      titleBar,
      content,
      config,
      state: {
        x: config.x,
        y: config.y,
        width: config.width,
        height: config.height,
        minimized: config.minimized,
        maximized: config.maximized,
        visible: config.visible,
        zIndex: windowEl.style.zIndex,
        autoShown: false, // Track if window was auto-shown
      },
    };
    
    // Set up event handlers
    this.setupWindowEvents(id);
    
    // Add toolbar button
    this.addToolbarButton(id, config.title);
    
    return this.windows[id];
  },
  
  addToolbarButton(id, title) {
    const toolbar = document.getElementById('window-toolbar');
    if (!toolbar) return;
    
    const btn = document.createElement('button');
    btn.className = 'window-toolbar-btn';
    btn.id = `toolbar-btn-${id}`;
    btn.textContent = title;
    btn.dataset.windowId = id;
    
    btn.addEventListener('click', () => {
      const win = this.windows[id];
      if (win.state.visible) {
        this.hideWindow(id);
      } else {
        this.showWindow(id);
      }
      this.updateToolbarButtons();
    });
    
    toolbar.appendChild(btn);
    this.updateToolbarButtons();
  },
  
  updateToolbarButtons() {
    Object.keys(this.windows).forEach(id => {
      const btn = document.getElementById(`toolbar-btn-${id}`);
      const win = this.windows[id];
      if (btn && win) {
        btn.classList.toggle('active', win.state.visible);
        btn.classList.toggle('hidden', !win.state.visible);
      }
    });
  },
  
  setupWindowEvents(id) {
    const win = this.windows[id];
    
    // Bring to front on click
    win.element.addEventListener('mousedown', (e) => {
      this.bringToFront(id);
    });
    
    // Minimize button
    win.titleBar.querySelector('.ui-btn-minimize').addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMinimize(id);
    });
    
    // Maximize button
    win.titleBar.querySelector('.ui-btn-maximize').addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMaximize(id);
    });
    
    // Close button
    win.titleBar.querySelector('.ui-btn-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.hideWindow(id);
    });
  },
  
  handleMouseDown(e) {
    // Check if clicking on a title bar (start drag)
    if (e.target.closest('.ui-window-titlebar')) {
      const windowEl = e.target.closest('.ui-window');
      if (!windowEl) return;
      
      const id = windowEl.id.replace('window-', '');
      const win = this.windows[id];
      
      if (win.state.maximized) return; // Can't drag maximized windows
      
      this.dragState = {
        windowId: id,
        startX: e.clientX,
        startY: e.clientY,
        initialX: win.state.x,
        initialY: win.state.y,
      };
      
      windowEl.classList.add('ui-dragging');
      e.preventDefault();
      return;
    }
    
    // Check if clicking on a resize handle
    if (e.target.classList.contains('ui-resize-handle')) {
      const windowEl = e.target.closest('.ui-window');
      if (!windowEl) return;
      
      const id = windowEl.id.replace('window-', '');
      const win = this.windows[id];
      
      if (win.state.maximized) return; // Can't resize maximized windows
      
      this.resizeState = {
        windowId: id,
        direction: e.target.dataset.direction,
        startX: e.clientX,
        startY: e.clientY,
        initialX: win.state.x,
        initialY: win.state.y,
        initialWidth: win.state.width,
        initialHeight: win.state.height,
      };
      
      windowEl.classList.add('ui-resizing');
      e.preventDefault();
    }
  },
  
  handleMouseMove(e) {
    // Handle dragging
    if (this.dragState) {
      const win = this.windows[this.dragState.windowId];
      const dx = e.clientX - this.dragState.startX;
      const dy = e.clientY - this.dragState.startY;
      
      win.state.x = this.dragState.initialX + dx;
      win.state.y = this.dragState.initialY + dy;
      
      win.element.style.left = win.state.x + 'px';
      win.element.style.top = win.state.y + 'px';
      
      e.preventDefault();
      return;
    }
    
    // Handle resizing
    if (this.resizeState) {
      const win = this.windows[this.resizeState.windowId];
      const dx = e.clientX - this.resizeState.startX;
      const dy = e.clientY - this.resizeState.startY;
      const dir = this.resizeState.direction;
      
      let newX = this.resizeState.initialX;
      let newY = this.resizeState.initialY;
      let newWidth = this.resizeState.initialWidth;
      let newHeight = this.resizeState.initialHeight;
      
      // Calculate new dimensions based on direction
      if (dir.includes('e')) newWidth += dx;
      if (dir.includes('w')) { newWidth -= dx; newX += dx; }
      if (dir.includes('s')) newHeight += dy;
      if (dir.includes('n')) { newHeight -= dy; newY += dy; }
      
      // Enforce minimum dimensions
      if (newWidth < win.config.minWidth) {
        if (dir.includes('w')) newX = this.resizeState.initialX + (this.resizeState.initialWidth - win.config.minWidth);
        newWidth = win.config.minWidth;
      }
      if (newHeight < win.config.minHeight) {
        if (dir.includes('n')) newY = this.resizeState.initialY + (this.resizeState.initialHeight - win.config.minHeight);
        newHeight = win.config.minHeight;
      }
      
      win.state.x = newX;
      win.state.y = newY;
      win.state.width = newWidth;
      win.state.height = newHeight;
      
      win.element.style.left = newX + 'px';
      win.element.style.top = newY + 'px';
      win.element.style.width = newWidth + 'px';
      win.element.style.height = newHeight + 'px';
      
      e.preventDefault();
    }
  },
  
  handleMouseUp(e) {
    if (this.dragState) {
      const win = this.windows[this.dragState.windowId];
      win.element.classList.remove('ui-dragging');
      this.dragState = null;
      this.saveLayout();
    }
    
    if (this.resizeState) {
      const win = this.windows[this.resizeState.windowId];
      win.element.classList.remove('ui-resizing');
      this.resizeState = null;
      this.saveLayout();
    }
  },
  
  bringToFront(id) {
    const win = this.windows[id];
    if (!win) return;
    
    // Remove active class from all windows
    Object.values(this.windows).forEach(w => {
      w.element.classList.remove('ui-window-active');
    });
    
    // Set new z-index and active state
    win.element.style.zIndex = this.nextZIndex++;
    win.state.zIndex = win.element.style.zIndex;
    win.element.classList.add('ui-window-active');
    this.activeWindow = id;
  },
  
  toggleMinimize(id) {
    const win = this.windows[id];
    if (!win) return;
    
    win.state.minimized = !win.state.minimized;
    
    if (win.state.minimized) {
      win.element.classList.add('ui-window-minimized');
    } else {
      win.element.classList.remove('ui-window-minimized');
    }
    
    this.saveLayout();
  },
  
  toggleMaximize(id) {
    const win = this.windows[id];
    if (!win) return;
    
    win.state.maximized = !win.state.maximized;
    
    if (win.state.maximized) {
      // Store current position/size
      win.state.restoreX = win.state.x;
      win.state.restoreY = win.state.y;
      win.state.restoreWidth = win.state.width;
      win.state.restoreHeight = win.state.height;
      
      // Maximize to full screen (minus HUD)
      const hudHeight = document.getElementById('hud').offsetHeight;
      win.element.style.left = '0px';
      win.element.style.top = hudHeight + 'px';
      win.element.style.width = '100%';
      win.element.style.height = `calc(100vh - ${hudHeight}px)`;
      win.element.classList.add('ui-window-maximized');
    } else {
      // Restore previous position/size
      win.element.style.left = win.state.restoreX + 'px';
      win.element.style.top = win.state.restoreY + 'px';
      win.element.style.width = win.state.restoreWidth + 'px';
      win.element.style.height = win.state.restoreHeight + 'px';
      win.element.classList.remove('ui-window-maximized');
    }
    
    this.saveLayout();
  },
  
  hideWindow(id) {
    const win = this.windows[id];
    if (!win) return;
    
    win.state.visible = false;
    win.element.style.display = 'none';
    this.updateToolbarButtons();
    this.saveLayout();
  },
  
  showWindow(id) {
    const win = this.windows[id];
    if (!win) return;
    
    win.state.visible = true;
    win.state.autoShown = true; // Mark as auto-shown
    win.element.style.display = 'block';
    this.bringToFront(id);
    this.clearNotificationBadge(id); // Clear badge when opening
    this.updateToolbarButtons();
    this.saveLayout();
    
    // Redraw tech tree canvas if showing tech tree window
    if (id === 'tech-tree-window') {
      setTimeout(() => {
        if (typeof updateTechTree === 'function') {
          updateTechTree();
        }
      }, 50);
    }
  },
  
  saveLayout() {
    const layout = {};
    Object.keys(this.windows).forEach(id => {
      const win = this.windows[id];
      layout[id] = {
        x: win.state.x,
        y: win.state.y,
        width: win.state.width,
        height: win.state.height,
        minimized: win.state.minimized,
        maximized: win.state.maximized,
        visible: win.state.visible,
        autoShown: win.state.autoShown,
      };
    });
    localStorage.setItem('univaUILayout', JSON.stringify(layout));
  },
  
  loadLayout() {
    try {
      const saved = localStorage.getItem('univaUILayout');
      if (!saved) return;
      
      const layout = JSON.parse(saved);
      Object.keys(layout).forEach(id => {
        if (this.windows[id]) {
          const win = this.windows[id];
          const state = layout[id];
          
          win.state.x = state.x;
          win.state.y = state.y;
          win.state.width = state.width;
          win.state.height = state.height;
          win.state.minimized = state.minimized;
          win.state.maximized = state.maximized;
          win.state.visible = state.visible;
          win.state.autoShown = state.autoShown !== undefined ? state.autoShown : false;
          
          win.element.style.left = state.x + 'px';
          win.element.style.top = state.y + 'px';
          win.element.style.width = state.width + 'px';
          win.element.style.height = state.height + 'px';
          
          if (state.minimized) win.element.classList.add('ui-window-minimized');
          if (state.maximized) this.toggleMaximize(id);
          if (!state.visible) win.element.style.display = 'none';
        }
      });
    } catch (e) {
      console.error('Failed to load UI layout:', e);
    }
  },
};
