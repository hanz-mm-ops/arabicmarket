/* ─── The Arabic Market · Auth System ─── */
(function() {
  // Simple hash function
  function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash.toString(36);
  }

  // ─── Password Storage ───
  const STORAGE_KEY = 'tam_passwords';

  function getPasswordData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    // Default: main password is "1234"
    const defaults = {
      mainHash: simpleHash("1234"),
      tempPasswords: [] // { code, label, hash, expiresAt, maxUses, usedCount, active }
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }

  function savePasswordData(pd) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pd));
  }

  // Check if user is authenticated
  function isAuthenticated() {
    return sessionStorage.getItem("tam_auth") === "valid";
  }

  // Validate password against main + temp passwords
  function validatePassword(password) {
    const pd = getPasswordData();
    const hash = simpleHash(password);

    // Check main password
    if (hash === pd.mainHash) return { valid: true, type: 'main' };

    // Check temp passwords
    const now = Date.now();
    for (let i = 0; i < pd.tempPasswords.length; i++) {
      const tp = pd.tempPasswords[i];
      if (!tp.active) continue;
      if (tp.expiresAt && now > tp.expiresAt) { tp.active = false; continue; }
      if (tp.maxUses && tp.usedCount >= tp.maxUses) { tp.active = false; continue; }
      if (tp.hash === hash) {
        tp.usedCount = (tp.usedCount || 0) + 1;
        if (tp.maxUses && tp.usedCount >= tp.maxUses) tp.active = false;
        savePasswordData(pd);
        return { valid: true, type: 'temp', label: tp.label };
      }
    }
    // Clean up expired
    savePasswordData(pd);
    return { valid: false };
  }

  // If not on login/admin page and not authenticated, redirect
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  if (currentPage !== "login.html" && currentPage !== "admin.html" && !isAuthenticated()) {
    window.location.href = "login.html";
  }

  // Expose auth functions globally
  window.TAM_Auth = {
    login: function(password) {
      const result = validatePassword(password);
      if (result.valid) {
        sessionStorage.setItem("tam_auth", "valid");
        return result;
      }
      return { valid: false };
    },

    logout: function() {
      sessionStorage.removeItem("tam_auth");
      window.location.href = "login.html";
    },

    isAuthenticated: isAuthenticated,

    // ─── Password Management (for admin) ───
    changeMainPassword: function(newPassword) {
      const pd = getPasswordData();
      pd.mainHash = simpleHash(newPassword);
      savePasswordData(pd);
    },

    createTempPassword: function(code, label, expiresInHours, maxUses) {
      const pd = getPasswordData();
      const tp = {
        code: code,
        label: label || 'Guest',
        hash: simpleHash(code),
        createdAt: Date.now(),
        expiresAt: expiresInHours ? Date.now() + (expiresInHours * 3600000) : null,
        maxUses: maxUses || null,
        usedCount: 0,
        active: true
      };
      pd.tempPasswords.push(tp);
      savePasswordData(pd);
      return tp;
    },

    getTempPasswords: function() {
      const pd = getPasswordData();
      const now = Date.now();
      // Auto-deactivate expired
      pd.tempPasswords.forEach(tp => {
        if (tp.active && tp.expiresAt && now > tp.expiresAt) tp.active = false;
        if (tp.active && tp.maxUses && tp.usedCount >= tp.maxUses) tp.active = false;
      });
      savePasswordData(pd);
      return pd.tempPasswords;
    },

    deactivateTempPassword: function(index) {
      const pd = getPasswordData();
      if (pd.tempPasswords[index]) {
        pd.tempPasswords[index].active = false;
        savePasswordData(pd);
      }
    },

    deleteTempPassword: function(index) {
      const pd = getPasswordData();
      pd.tempPasswords.splice(index, 1);
      savePasswordData(pd);
    },

    generateRandomCode: function(length) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let result = '';
      for (let i = 0; i < (length || 6); i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  };
})();
