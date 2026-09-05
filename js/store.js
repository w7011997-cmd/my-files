// store.js — local on-device "database" (localStorage). No server.
// Cloudinary holds actual files; this remembers structure, layout prefs,
// and lock/security state.

const Store = (() => {
  const DATA_KEY = "myfiles_data_v2";
  const SETTINGS_KEY = "myfiles_settings_v1";
  const LAYOUT_KEY = "myfiles_layouts_v1";
  const SECURITY_KEY = "myfiles_security_v1";

  function _load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return fallback;
  }
  function _save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function _uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  let data = _load(DATA_KEY, { folders: [], files: [] });
  let layouts = _load(LAYOUT_KEY, {});
  let security = _load(SECURITY_KEY, { pinHash: null, lockEnabled: false });

  const ROOT = null;

  async function sha256(text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function isDescendant(folderId, ancestorId) {
    let f = data.folders.find((x) => x.id === folderId);
    while (f && f.parentId !== ROOT) {
      if (f.parentId === ancestorId) return true;
      f = data.folders.find((x) => x.id === f.parentId);
    }
    return false;
  }

  return {
    ROOT,

    // ---- Folders ----
    getSubfolders(parentId) {
      return data.folders.filter((f) => f.parentId === parentId).sort((a, b) => a.name.localeCompare(b.name));
    },
    getFolder(id) { return data.folders.find((f) => f.id === id) || null; },
    getAllFolders() { return [...data.folders]; },

    createFolder(name, parentId) {
      const folder = { id: _uid(), name: name.trim(), parentId, createdAt: Date.now(), locked: false };
      data.folders.push(folder);
      _save(DATA_KEY, data);
      return folder;
    },
    renameFolder(id, newName) {
      const f = this.getFolder(id);
      if (f) { f.name = newName.trim(); _save(DATA_KEY, data); }
    },
    setFolderLocked(id, locked) {
      const f = this.getFolder(id);
      if (f) { f.locked = locked; _save(DATA_KEY, data); }
    },
    lockAllFolders() {
      data.folders.forEach((f) => (f.locked = true));
      _save(DATA_KEY, data);
    },
    unlockAllFolders() {
      data.folders.forEach((f) => (f.locked = false));
      _save(DATA_KEY, data);
    },
    deleteFolder(id) {
      const toDelete = new Set([id]);
      let changed = true;
      while (changed) {
        changed = false;
        data.folders.forEach((f) => {
          if (toDelete.has(f.parentId) && !toDelete.has(f.id)) { toDelete.add(f.id); changed = true; }
        });
      }
      data.folders = data.folders.filter((f) => !toDelete.has(f.id));
      data.files = data.files.filter((f) => !toDelete.has(f.folderId));
      _save(DATA_KEY, data);
    },

    // ---- Files ----
    getFiles(folderId) {
      return data.files.filter((f) => f.folderId === folderId).sort((a, b) => a.originalName.localeCompare(b.originalName));
    },
    getFile(id) { return data.files.find((f) => f.id === id) || null; },
    countItems(folderId) {
      const subfolders = this.getSubfolders(folderId).length;
      const files = data.files.filter((f) => f.folderId === folderId).length;
      return { subfolders, files, total: subfolders + files };
    },
    addFile(folderId, meta) {
      const file = { id: _uid(), folderId, createdAt: Date.now(), ...meta };
      data.files.push(file);
      _save(DATA_KEY, data);
      return file;
    },
    renameFile(id, newName) {
      const f = this.getFile(id);
      if (f) { f.originalName = newName.trim(); _save(DATA_KEY, data); }
    },
    removeFile(id) {
      data.files = data.files.filter((f) => f.id !== id);
      _save(DATA_KEY, data);
    },

    // ---- Move / Copy ----
    isDescendant,
    moveItems(folderIds, fileIds, destId) {
      folderIds.forEach((fid) => {
        if (fid === destId || isDescendant(destId, fid)) return; // illegal, skip
        const f = this.getFolder(fid);
        if (f) f.parentId = destId;
      });
      fileIds.forEach((fid) => {
        const f = this.getFile(fid);
        if (f) f.folderId = destId;
      });
      _save(DATA_KEY, data);
    },
    copyItems(folderIds, fileIds, destId) {
      const cloneFolder = (folderId, newParentId) => {
        const src = this.getFolder(folderId);
        if (!src) return;
        const clone = { id: _uid(), name: src.name, parentId: newParentId, createdAt: Date.now(), locked: false };
        data.folders.push(clone);
        this.getSubfolders(folderId).forEach((sub) => cloneFolder(sub.id, clone.id));
        data.files.filter((f) => f.folderId === folderId).forEach((f) => {
          data.files.push({ ...f, id: _uid(), folderId: clone.id, createdAt: Date.now() });
        });
      };
      folderIds.forEach((fid) => { if (fid !== destId && !isDescendant(destId, fid)) cloneFolder(fid, destId); });
      fileIds.forEach((fid) => {
        const src = this.getFile(fid);
        if (src) data.files.push({ ...src, id: _uid(), folderId: destId, createdAt: Date.now() });
      });
      _save(DATA_KEY, data);
    },

    // ---- Layout preference ----
    getLayout(folderId) { return layouts[folderId === ROOT ? "root" : folderId] || "grid"; },
    setLayout(folderId, layout) {
      layouts[folderId === ROOT ? "root" : folderId] = layout;
      _save(LAYOUT_KEY, layouts);
    },

    // ---- Cloudinary settings ----
    getSettings() { return _load(SETTINGS_KEY, { cloudName: "", uploadPreset: "" }); },
    saveSettings(s) { _save(SETTINGS_KEY, s); },

    // ---- Security / lock ----
    isLockEnabled() { return !!security.lockEnabled && !!security.pinHash; },
    hasPin() { return !!security.pinHash; },
    async setPin(pin) {
      security.pinHash = await sha256(pin);
      security.lockEnabled = true;
      _save(SECURITY_KEY, security);
    },
    async verifyPin(pin) {
      if (!security.pinHash) return false;
      const hash = await sha256(pin);
      return hash === security.pinHash;
    },
    disableLock() {
      security.lockEnabled = false;
      security.pinHash = null;
      _save(SECURITY_KEY, security);
    },

    // ---- Stats / backup / self-destruct ----
    getStats() {
      let totalBytes = 0;
      data.files.forEach((f) => (totalBytes += f.bytes || 0));
      return { folderCount: data.folders.length, fileCount: data.files.length, totalBytes };
    },
    exportBackup() { return JSON.stringify(data, null, 2); },
    importBackup(jsonString) {
      const parsed = JSON.parse(jsonString);
      if (!parsed.folders || !parsed.files) throw new Error("Invalid backup file");
      data = { folders: parsed.folders, files: parsed.files };
      _save(DATA_KEY, data);
    },
    selfDestruct() {
      data = { folders: [], files: [] };
      layouts = {};
      _save(DATA_KEY, data);
      _save(LAYOUT_KEY, layouts);
    },
  };
})();
