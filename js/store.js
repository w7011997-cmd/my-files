// store.js
// Local on-device "database" (localStorage). No server. Cloudinary holds the
// actual files; this remembers folder structure (nested, unlimited depth)
// and which files live where, plus your layout preference per folder.

const Store = (() => {
  const DATA_KEY = "myfiles_data_v2";
  const SETTINGS_KEY = "myfiles_settings_v1";
  const LAYOUT_KEY = "myfiles_layouts_v1";

  function _load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return fallback;
  }
  function _save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function _uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  let data = _load(DATA_KEY, { folders: [], files: [] });
  let layouts = _load(LAYOUT_KEY, {});

  const ROOT = null;

  return {
    ROOT,

    // ---- Folders ----
    getSubfolders(parentId) {
      return data.folders
        .filter((f) => f.parentId === parentId)
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    getFolder(id) {
      return data.folders.find((f) => f.id === id) || null;
    },

    createFolder(name, parentId) {
      const folder = { id: _uid(), name: name.trim(), parentId, createdAt: Date.now() };
      data.folders.push(folder);
      _save(DATA_KEY, data);
      return folder;
    },

    renameFolder(id, newName) {
      const folder = this.getFolder(id);
      if (folder) {
        folder.name = newName.trim();
        _save(DATA_KEY, data);
      }
    },

    deleteFolder(id) {
      // Recursively collect this folder + all descendants
      const toDelete = new Set([id]);
      let changed = true;
      while (changed) {
        changed = false;
        data.folders.forEach((f) => {
          if (toDelete.has(f.parentId) && !toDelete.has(f.id)) {
            toDelete.add(f.id);
            changed = true;
          }
        });
      }
      data.folders = data.folders.filter((f) => !toDelete.has(f.id));
      data.files = data.files.filter((f) => !toDelete.has(f.folderId));
      _save(DATA_KEY, data);
    },

    // ---- Files ----
    getFiles(folderId) {
      return data.files
        .filter((f) => f.folderId === folderId)
        .sort((a, b) => a.originalName.localeCompare(b.originalName));
    },

    getFile(id) {
      return data.files.find((f) => f.id === id) || null;
    },

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

    removeFile(id) {
      data.files = data.files.filter((f) => f.id !== id);
      _save(DATA_KEY, data);
    },

    // ---- Layout preference per folder (or "root") ----
    getLayout(folderId) {
      const key = folderId === ROOT ? "root" : folderId;
      return layouts[key] || "grid";
    },
    setLayout(folderId, layout) {
      const key = folderId === ROOT ? "root" : folderId;
      layouts[key] = layout;
      _save(LAYOUT_KEY, layouts);
    },

    // ---- Cloudinary settings ----
    getSettings() {
      return _load(SETTINGS_KEY, { cloudName: "", uploadPreset: "" });
    },
    saveSettings(settings) {
      _save(SETTINGS_KEY, settings);
    },
  };
})();
