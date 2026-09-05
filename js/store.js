// store.js
// Everything is kept in localStorage on-device. There is no server database —
// Cloudinary holds the actual files, this just remembers what you uploaded
// and which folder it belongs to.

const Store = (() => {
  const DATA_KEY = "myfiles_data_v1";
  const SETTINGS_KEY = "myfiles_settings_v1";

  function _load() {
    try {
      const raw = localStorage.getItem(DATA_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { folders: [], files: [] };
  }

  function _save(data) {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
  }

  function _uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  let data = _load();

  return {
    getFolders() {
      return [...data.folders].sort((a, b) => a.name.localeCompare(b.name));
    },

    getFolder(id) {
      return data.folders.find((f) => f.id === id) || null;
    },

    createFolder(name) {
      const folder = { id: _uid(), name: name.trim(), createdAt: Date.now() };
      data.folders.push(folder);
      _save(data);
      return folder;
    },

    deleteFolder(id) {
      data.folders = data.folders.filter((f) => f.id !== id);
      data.files = data.files.filter((f) => f.folderId !== id);
      _save(data);
    },

    getFiles(folderId) {
      return data.files
        .filter((f) => f.folderId === folderId)
        .sort((a, b) => b.createdAt - a.createdAt);
    },

    getFile(id) {
      return data.files.find((f) => f.id === id) || null;
    },

    countFiles(folderId) {
      return data.files.filter((f) => f.folderId === folderId).length;
    },

    addFile(folderId, meta) {
      const file = {
        id: _uid(),
        folderId,
        createdAt: Date.now(),
        ...meta,
      };
      data.files.push(file);
      _save(data);
      return file;
    },

    removeFile(id) {
      data.files = data.files.filter((f) => f.id !== id);
      _save(data);
    },

    // Cloudinary account settings (cloud name + unsigned upload preset)
    getSettings() {
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return { cloudName: "", uploadPreset: "" };
    },

    saveSettings(settings) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    },
  };
})();
