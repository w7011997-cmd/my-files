// app.js
(() => {
  const el = (id) => document.getElementById(id);

  const normalTopbar = el("normalTopbar");
  const selectionTopbar = el("selectionTopbar");
  const backBtn = el("backBtn");
  const hamburgerBtn = el("hamburgerBtn");
  const searchBtn = el("searchBtn");
  const searchWrap = el("searchWrap");
  const searchInput = el("searchInput");
  const folderTitle = el("folderTitle");
  const layoutBtn = el("layoutBtn");
  const folderMenuBtn = el("folderMenuBtn");
  const settingsBtn = el("settingsBtn");

  const selectionCancelBtn = el("selectionCancelBtn");
  const selectionCount = el("selectionCount");
  const selectionInfoBtn = el("selectionInfoBtn");
  const selectionRenameBtn = el("selectionRenameBtn");
  const selectionLockBtn = el("selectionLockBtn");
  const selectionDownloadBtn = el("selectionDownloadBtn");
  const selectionCopyBtn = el("selectionCopyBtn");
  const selectionMoveBtn = el("selectionMoveBtn");
  const selectionDeleteBtn = el("selectionDeleteBtn");

  const content = el("content");
  const emptyState = el("emptyState");
  const emptyTitle = el("emptyTitle");
  const fabBtn = el("fabBtn");
  const fileInput = el("fileInput");
  const backupImportInput = el("backupImportInput");
  const uploadProgress = el("uploadProgress");
  const uploadFill = el("uploadFill");
  const uploadLabel = el("uploadLabel");

  const addSheet = el("addSheet");
  const addFolderAction = el("addFolderAction");
  const addFileAction = el("addFileAction");
  const addCodeFileAction = el("addCodeFileAction");

  const folderOptionsSheet = el("folderOptionsSheet");
  const folderInfoAction = el("folderInfoAction");
  const renameFolderAction = el("renameFolderAction");
  const toggleLockFolderAction = el("toggleLockFolderAction");
  const downloadFolderAction = el("downloadFolderAction");
  const moveFolderAction = el("moveFolderAction");
  const copyFolderAction = el("copyFolderAction");
  const deleteFolderAction = el("deleteFolderAction");

  const hamburgerSheet = el("hamburgerSheet");
  const toggleAppLockAction = el("toggleAppLockAction");
  const lockAllFoldersAction = el("lockAllFoldersAction");
  const unlockAllFoldersAction = el("unlockAllFoldersAction");
  const toggleFakeLockAction = el("toggleFakeLockAction");

  const folderModal = el("folderModal");
  const folderModalTitle = el("folderModalTitle");
  const folderModalHint = el("folderModalHint");
  const folderNameInput = el("folderNameInput");
  const folderCancelBtn = el("folderCancelBtn");
  const folderCreateBtn = el("folderCreateBtn");

  const settingsModal = el("settingsModal");
  const cloudNameInput = el("cloudNameInput");
  const uploadPresetInput = el("uploadPresetInput");
  const settingsCancelBtn = el("settingsCancelBtn");
  const settingsSaveBtn = el("settingsSaveBtn");
  const selfDestructBtn = el("selfDestructBtn");
  const statsBox = el("statsBox");
  const exportBackupBtn = el("exportBackupBtn");
  const importBackupBtn = el("importBackupBtn");

  const pinModal = el("pinModal");
  const pinModalTitle = el("pinModalTitle");
  const pinInput = el("pinInput");
  const pinConfirmInput = el("pinConfirmInput");
  const pinError = el("pinError");
  const pinCancelBtn = el("pinCancelBtn");
  const pinSubmitBtn = el("pinSubmitBtn");

  const lockScreen = el("lockScreen");
  const lockScreenInput = el("lockScreenInput");
  const lockScreenError = el("lockScreenError");
  const lockScreenSubmit = el("lockScreenSubmit");

  const pickerModal = el("pickerModal");
  const pickerTitle = el("pickerTitle");
  const pickerPath = el("pickerPath");
  const pickerList = el("pickerList");
  const pickerCancelBtn = el("pickerCancelBtn");
  const pickerConfirmBtn = el("pickerConfirmBtn");

  const infoModal = el("infoModal");
  const infoTitle = el("infoTitle");
  const infoRows = el("infoRows");
  const infoCloseBtn = el("infoCloseBtn");

  const previewOverlay = el("previewOverlay");
  const previewTrack = el("previewTrack");
  const previewCounter = el("previewCounter");
  const previewCloseBtn = el("previewCloseBtn");
  const previewRunBtn = el("previewRunBtn");
  const previewMoreBtn = el("previewMoreBtn");
  const previewOptionsSheet = el("previewOptionsSheet");
  const previewInfoAction = el("previewInfoAction");
  const previewEditAction = el("previewEditAction");
  const previewSaveAction = el("previewSaveAction");
  const previewUndoAction = el("previewUndoAction");
  const previewRedoAction = el("previewRedoAction");
  const previewDownloadAction = el("previewDownloadAction");
  const previewRenameAction = el("previewRenameAction");
  const previewRemoveAction = el("previewRemoveAction");

  const runOverlay = el("runOverlay");
  const runFrame = el("runFrame");
  const runCloseBtn = el("runCloseBtn");

  let navPath = [];
  let searchActive = false;
  let folderModalMode = "create"; // create | rename-folder | rename-file | create-file
  let renameTargetId = null;
  let previewFiles = [];
  let previewIndex = 0;

  let selectionActive = false;
  let selectedFolders = new Set();
  let selectedFiles = new Set();
  const unlockedFoldersThisSession = new Set();

  // Code editing state (one slide editable at a time)
  let editingFile = null;
  let editingTextarea = null;
  let undoStack = [];
  let redoStack = [];
  let hasUnsavedEdits = false;
  let lastUndoPushTime = 0;

  function currentFolderId() { return navPath.length ? navPath[navPath.length - 1] : Store.ROOT; }
  function escapeHtml(str) { const d = document.createElement("div"); d.textContent = str || ""; return d.innerHTML; }
  function isImage(m) { return m && m.startsWith("image/"); }
  function isVideo(m) { return m && m.startsWith("video/"); }
  const CODE_EXTS = new Set(["html","htm","css","js","mjs","jsx","tsx","ts","json","php","xml","md","txt","yml","yaml","py","java","c","cpp","h","hpp","sh","sql","rb","go","rs","ini","conf","log","csv","svg","dart"]);
  function getExt(name) { const parts = (name || "").split("."); return parts.length > 1 ? parts.pop().toLowerCase() : ""; }
  function isCodeFile(file) { return CODE_EXTS.has(getExt(file.originalName)); }
  function formatBytes(bytes) {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0, val = bytes;
    while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
    return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
  }
  function formatDateTime(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) + " · " +
      d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  function genericFileSVG() { return `<svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5"/></svg>`; }

  function openSheet(s) { s.classList.remove("hidden"); }
  function closeSheet(s) { s.classList.add("hidden"); }
  [addSheet, folderOptionsSheet, hamburgerSheet, previewOptionsSheet].forEach((s) => {
    s.addEventListener("click", (e) => { if (e.target === s) closeSheet(s); });
  });
  [folderModal, settingsModal, pinModal, pickerModal, infoModal].forEach((m) => {
    m.addEventListener("click", (e) => { if (e.target === m) m.classList.add("hidden"); });
  });

  // ---------- Selection mode ----------
  function enterSelection(type, id) {
    selectionActive = true;
    selectedFolders.clear();
    selectedFiles.clear();
    if (type === "folder") selectedFolders.add(id); else selectedFiles.add(id);
    render();
  }
  function toggleSelect(type, id) {
    const set = type === "folder" ? selectedFolders : selectedFiles;
    if (set.has(id)) set.delete(id); else set.add(id);
    if (selectedFolders.size === 0 && selectedFiles.size === 0) selectionActive = false;
    render();
  }
  function exitSelection() { selectionActive = false; selectedFolders.clear(); selectedFiles.clear(); render(); }
  selectionCancelBtn.addEventListener("click", exitSelection);

  function attachLongPress(elm, onLongPress, onTap) {
    let timer = null, fired = false, startX = 0, startY = 0;
    const clear = () => { clearTimeout(timer); timer = null; };
    elm.addEventListener("pointerdown", (e) => {
      fired = false; startX = e.clientX; startY = e.clientY;
      timer = setTimeout(() => { fired = true; onLongPress(); }, 480);
    });
    elm.addEventListener("pointermove", (e) => {
      if (timer && (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10)) clear();
    });
    elm.addEventListener("pointerup", () => { clear(); if (!fired) onTap(); });
    elm.addEventListener("pointerleave", clear);
  }

  // ---------- Top bar ----------
  function renderTopbar() {
    if (selectionActive) {
      normalTopbar.classList.add("hidden");
      selectionTopbar.classList.remove("hidden");
      fabBtn.classList.add("hidden");
      const count = selectedFolders.size + selectedFiles.size;
      selectionCount.textContent = `${count} selected`;
      selectionInfoBtn.classList.toggle("hidden", count !== 1);
      selectionRenameBtn.classList.toggle("hidden", count !== 1);
      const onlyFolders = selectedFiles.size === 0 && selectedFolders.size > 0;
      selectionLockBtn.classList.toggle("hidden", !onlyFolders || Store.getMode() === "decoy");
      return;
    }
    normalTopbar.classList.remove("hidden");
    selectionTopbar.classList.add("hidden");
    fabBtn.classList.remove("hidden");

    const folderId = currentFolderId();
    const folder = folderId === Store.ROOT ? null : Store.getFolder(folderId);

    backBtn.classList.toggle("hidden", navPath.length === 0);
    const isDecoy = Store.getMode() === "decoy";
    hamburgerBtn.classList.toggle("hidden", navPath.length !== 0 || isDecoy);
    folderMenuBtn.classList.toggle("hidden", folderId === Store.ROOT);
    settingsBtn.classList.toggle("hidden", folderId !== Store.ROOT);

    if (searchActive) {
      folderTitle.classList.add("hidden");
      searchWrap.classList.remove("hidden");
      searchInput.value = "";
      setTimeout(() => searchInput.focus(), 30);
    } else {
      folderTitle.classList.remove("hidden");
      searchWrap.classList.add("hidden");
      folderTitle.textContent = folder ? folder.name : "My Files";
    }
  }

  backBtn.addEventListener("click", () => { navPath.pop(); searchActive = false; render(); });
  searchBtn.addEventListener("click", () => { searchActive = !searchActive; renderTopbar(); if (!searchActive) renderContent(); });
  searchInput.addEventListener("input", renderContent);

  layoutBtn.addEventListener("click", () => {
    const folderId = currentFolderId();
    const cur = Store.getLayout(folderId);
    Store.setLayout(folderId, cur === "grid" ? "list" : "grid");
    renderContent();
  });

  folderMenuBtn.addEventListener("click", () => {
    const f = Store.getFolder(currentFolderId());
    toggleLockFolderAction.textContent = f && f.locked ? "Unlock folder" : "Lock folder";
    toggleLockFolderAction.classList.toggle("hidden", Store.getMode() === "decoy");
    openSheet(folderOptionsSheet);
  });
  hamburgerBtn.addEventListener("click", () => {
    toggleAppLockAction.textContent = Store.isLockEnabled() ? "Disable lock" : "Set lock";
    toggleFakeLockAction.textContent = Store.hasFakePin() ? "Remove fake lock" : "Set fake lock";
    openSheet(hamburgerSheet);
  });
  settingsBtn.addEventListener("click", openSettingsModal);

  // ---------- Navigation ----------
  async function openFolder(id) {
    const folder = Store.getFolder(id);
    if (folder && folder.locked && !unlockedFoldersThisSession.has(id)) {
      const ok = await requestPin("verify", `Unlock "${folder.name}"`);
      if (!ok) return;
      unlockedFoldersThisSession.add(id);
    }
    navPath.push(id);
    searchActive = false;
    render();
  }

  // ---------- Rendering ----------
  function renderContent() {
    const folderId = currentFolderId();
    const query = searchActive ? searchInput.value.trim().toLowerCase() : "";
    let subfolders = Store.getSubfolders(folderId);
    let files = Store.getFiles(folderId);
    if (query) {
      subfolders = subfolders.filter((f) => f.name.toLowerCase().includes(query));
      files = files.filter((f) => f.originalName.toLowerCase().includes(query));
    }
    const total = subfolders.length + files.length;
    emptyState.classList.toggle("hidden", total > 0 || selectionActive);
    content.classList.toggle("hidden", total === 0);
    if (total === 0) emptyTitle.textContent = query ? "No matches" : "This folder is empty";

    const layout = Store.getLayout(folderId);
    content.innerHTML = "";
    if (layout === "grid") renderIconGrid(subfolders, files);
    else renderListView(subfolders, files);

    const iconEl = layoutBtn.querySelector("svg");
    if (iconEl) iconEl.outerHTML = layoutIconSVG(layout);
  }

  function layoutIconSVG(current) {
    if (current === "grid") return `<svg id="layoutIcon" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`;
    return `<svg id="layoutIcon" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`;
  }

  function renderIconGrid(subfolders, files) {
    const grid = document.createElement("div");
    grid.className = "icon-grid";
    subfolders.forEach((folder) => {
      const counts = Store.countItems(folder.id);
      const item = document.createElement("div");
      item.className = "icon-item" + (selectedFolders.has(folder.id) ? " selected" : "");
      item.innerHTML = `
        <div class="folder-glyph${folder.locked ? " locked" : ""}"></div>
        <div class="label">${escapeHtml(folder.name)}</div>
        <div class="sub-label">${counts.total} item${counts.total === 1 ? "" : "s"}</div>
        ${selectedFolders.has(folder.id) ? '<div class="check-badge">✓</div>' : ""}
      `;
      attachLongPress(item, () => enterSelection("folder", folder.id),
        () => { if (selectionActive) toggleSelect("folder", folder.id); else openFolder(folder.id); });
      grid.appendChild(item);
    });
    files.forEach((file) => {
      const item = document.createElement("div");
      item.className = "icon-item" + (selectedFiles.has(file.id) ? " selected" : "");
      const thumbHtml = isImage(file.mimeType)
        ? `<div class="thumb"><img src="${file.url}" loading="lazy" /></div>`
        : `<div class="thumb">${genericFileSVG()}</div>`;
      item.innerHTML = `${thumbHtml}<div class="label">${escapeHtml(file.originalName)}</div>${selectedFiles.has(file.id) ? '<div class="check-badge">✓</div>' : ""}`;
      attachLongPress(item, () => enterSelection("file", file.id),
        () => { if (selectionActive) toggleSelect("file", file.id); else openPreview(files, files.indexOf(file)); });
      grid.appendChild(item);
    });
    content.appendChild(grid);
  }

  function renderListView(subfolders, files) {
    const wrap = document.createElement("div");
    wrap.className = "list-view";
    wrap.innerHTML = `<div class="list-header"><span>Name</span><span>Modified</span><span>Size</span></div>`;
    subfolders.forEach((folder) => {
      const counts = Store.countItems(folder.id);
      const row = document.createElement("div");
      row.className = "list-row" + (selectedFolders.has(folder.id) ? " selected" : "");
      row.innerHTML = `
        <div class="name-cell"><div class="mini-folder"></div><span class="name">${escapeHtml(folder.name)}</span>${folder.locked ? '<span class="lock-tag">🔒</span>' : ""}</div>
        <span class="meta-cell">${formatDateTime(folder.createdAt)}</span>
        <span class="meta-cell">${counts.total} item${counts.total === 1 ? "" : "s"}</span>
        ${selectedFolders.has(folder.id) ? '<div class="check-badge">✓</div>' : ""}
      `;
      attachLongPress(row, () => enterSelection("folder", folder.id),
        () => { if (selectionActive) toggleSelect("folder", folder.id); else openFolder(folder.id); });
      wrap.appendChild(row);
    });
    files.forEach((file) => {
      const row = document.createElement("div");
      row.className = "list-row" + (selectedFiles.has(file.id) ? " selected" : "");
      const iconHtml = isImage(file.mimeType)
        ? `<div class="icon-wrap"><img src="${file.url}" loading="lazy" /></div>`
        : `<div class="icon-wrap">${genericFileSVG()}</div>`;
      row.innerHTML = `
        <div class="name-cell">${iconHtml}<span class="name">${escapeHtml(file.originalName)}</span></div>
        <span class="meta-cell">${formatDateTime(file.createdAt)}</span>
        <span class="meta-cell">${formatBytes(file.bytes)}</span>
        ${selectedFiles.has(file.id) ? '<div class="check-badge">✓</div>' : ""}
      `;
      attachLongPress(row, () => enterSelection("file", file.id),
        () => { if (selectionActive) toggleSelect("file", file.id); else openPreview(files, files.indexOf(file)); });
      wrap.appendChild(row);
    });
    content.appendChild(wrap);
  }

  function render() { renderTopbar(); renderContent(); }

  // ---------- FAB / Add ----------
  fabBtn.addEventListener("click", () => openSheet(addSheet));
  addFolderAction.addEventListener("click", () => {
    closeSheet(addSheet);
    folderModalMode = "create";
    folderModalTitle.textContent = "New folder";
    folderModalHint.classList.add("hidden");
    folderNameInput.value = "";
    folderModal.classList.remove("hidden");
    setTimeout(() => folderNameInput.focus(), 50);
  });
  addFileAction.addEventListener("click", () => { closeSheet(addSheet); fileInput.click(); });
  addCodeFileAction.addEventListener("click", () => {
    closeSheet(addSheet);
    folderModalMode = "create-file";
    folderModalTitle.textContent = "New file";
    folderModalHint.classList.remove("hidden");
    folderNameInput.value = "";
    folderModal.classList.remove("hidden");
    setTimeout(() => folderNameInput.focus(), 50);
  });

  folderCancelBtn.addEventListener("click", () => folderModal.classList.add("hidden"));
  folderCreateBtn.addEventListener("click", async () => {
    const name = folderNameInput.value.trim();
    if (!name) return;
    if (folderModalMode === "create") {
      Store.createFolder(name, currentFolderId());
      folderModal.classList.add("hidden");
      renderContent();
    } else if (folderModalMode === "rename-folder") {
      Store.renameFolder(renameTargetId, name);
      folderModal.classList.add("hidden");
      renderContent();
    } else if (folderModalMode === "rename-file") {
      Store.renameFile(renameTargetId, name);
      folderModal.classList.add("hidden");
      renderContent();
    } else if (folderModalMode === "create-file") {
      const ext = getExt(name);
      if (!CODE_EXTS.has(ext)) {
        alert("Use a supported code/text extension, e.g. .html, .css, .js, .json, .md, .php, .dart");
        return;
      }
      const settings = Store.getSettings();
      if (!settings.cloudName || !settings.uploadPreset) {
        alert("Add your Cloudinary cloud name and upload preset in Settings first.");
        return;
      }
      folderModal.classList.add("hidden");
      const boilerplate = ext === "html"
        ? "<!DOCTYPE html>\n<html>\n<head>\n  <title></title>\n</head>\n<body>\n\n</body>\n</html>\n"
        : "";
      const blob = new File([boilerplate], name, { type: "text/plain" });
      try {
        const meta = await Cloudinary.upload(blob, settings, () => {});
        const newFile = Store.addFile(currentFolderId(), meta);
        renderContent();
        const files = Store.getFiles(currentFolderId());
        const idx = files.findIndex((f) => f.id === newFile.id);
        openPreview(files, idx);
        setTimeout(() => startEditingCurrentSlide(), 600);
      } catch (err) {
        alert("Couldn't create the file: " + err.message);
      }
    }
  });
  folderNameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") folderCreateBtn.click(); });

  function openRenameModal(mode, id, currentName) {
    folderModalMode = mode;
    renameTargetId = id;
    folderModalTitle.textContent = mode === "rename-file" ? "Rename file" : "Rename folder";
    folderModalHint.classList.add("hidden");
    folderNameInput.value = currentName;
    folderModal.classList.remove("hidden");
    setTimeout(() => folderNameInput.focus(), 50);
  }

  // ---------- Folder options ----------
  folderInfoAction.addEventListener("click", () => { closeSheet(folderOptionsSheet); showInfo("folder", currentFolderId()); });
  renameFolderAction.addEventListener("click", () => {
    closeSheet(folderOptionsSheet);
    const f = Store.getFolder(currentFolderId());
    if (f) openRenameModal("rename-folder", f.id, f.name);
  });
  toggleLockFolderAction.addEventListener("click", async () => {
    closeSheet(folderOptionsSheet);
    const f = Store.getFolder(currentFolderId());
    if (!f) return;
    if (!f.locked) {
      if (!Store.hasPin()) { await requestPin("set", "Set a PIN to lock folders"); if (!Store.hasPin()) return; }
      Store.setFolderLocked(f.id, true);
    } else {
      const ok = await requestPin("verify", "Confirm PIN to unlock");
      if (ok) Store.setFolderLocked(f.id, false);
    }
    render();
  });
  downloadFolderAction.addEventListener("click", () => { closeSheet(folderOptionsSheet); downloadFolderZip(currentFolderId()); });
  moveFolderAction.addEventListener("click", () => { closeSheet(folderOptionsSheet); openPicker("move", [currentFolderId()], []); });
  copyFolderAction.addEventListener("click", () => { closeSheet(folderOptionsSheet); openPicker("copy", [currentFolderId()], []); });
  deleteFolderAction.addEventListener("click", () => {
    closeSheet(folderOptionsSheet);
    const folder = Store.getFolder(currentFolderId());
    if (!folder) return;
    if (confirm(`Delete "${folder.name}" and everything inside it? This can't be undone.`)) {
      const idToDelete = currentFolderId();
      navPath.pop();
      Store.deleteFolder(idToDelete);
      render();
    }
  });

  // ---------- Hamburger menu ----------
  toggleAppLockAction.addEventListener("click", async () => {
    closeSheet(hamburgerSheet);
    if (Store.isLockEnabled()) {
      const ok = await requestPin("verify", "Confirm PIN to disable lock");
      if (ok) { Store.disableLock(); alert("Lock disabled."); }
    } else {
      await requestPin("set", "Set a PIN to lock My Files");
    }
  });
  lockAllFoldersAction.addEventListener("click", async () => {
    closeSheet(hamburgerSheet);
    if (!Store.hasPin()) { await requestPin("set", "Set a PIN first"); if (!Store.hasPin()) return; }
    Store.lockAllFolders();
    render();
  });
  unlockAllFoldersAction.addEventListener("click", async () => {
    closeSheet(hamburgerSheet);
    const ok = await requestPin("verify", "Confirm PIN to unlock all folders");
    if (ok) { Store.unlockAllFolders(); render(); }
  });
  toggleFakeLockAction.addEventListener("click", async () => {
    closeSheet(hamburgerSheet);
    if (Store.hasFakePin()) {
      const ok = await requestPin("verify", "Confirm your real PIN to remove the fake lock");
      if (ok) { Store.removeFakePin(); alert("Fake lock removed."); }
    } else {
      if (!Store.hasPin()) { alert("Set your real lock PIN first, then add a fake one."); return; }
      await requestPin("set-fake", "Set a fake PIN (must differ from your real PIN)");
    }
  });

  // ---------- PIN modal ----------
  let pinResolve = null;
  function requestPin(mode, title) {
    return new Promise((resolve) => {
      pinResolve = resolve;
      pinModalTitle.textContent = title;
      pinInput.value = ""; pinConfirmInput.value = "";
      pinError.classList.add("hidden");
      pinConfirmInput.classList.toggle("hidden", mode !== "set" && mode !== "set-fake");
      pinModal.dataset.mode = mode;
      pinModal.classList.remove("hidden");
      setTimeout(() => pinInput.focus(), 50);
    });
  }
  pinCancelBtn.addEventListener("click", () => { pinModal.classList.add("hidden"); if (pinResolve) pinResolve(false); });
  pinSubmitBtn.addEventListener("click", async () => {
    const mode = pinModal.dataset.mode;
    const pin = pinInput.value.trim();
    if (!pin) return;
    if (mode === "set" || mode === "set-fake") {
      if (pin !== pinConfirmInput.value.trim()) { pinError.textContent = "PINs didn't match. Try again."; pinError.classList.remove("hidden"); return; }
      if (mode === "set-fake") {
        const matchesReal = await Store.verifyPin(pin);
        if (matchesReal) { pinError.textContent = "Fake PIN can't be the same as your real PIN."; pinError.classList.remove("hidden"); return; }
        await Store.setFakePin(pin);
        alert("Fake lock set. Entering that PIN on the lock screen opens an empty space instead.");
      } else {
        await Store.setPin(pin);
      }
      pinModal.classList.add("hidden");
      if (pinResolve) pinResolve(true);
    } else {
      const ok = await Store.verifyPin(pin);
      if (!ok) { pinError.textContent = "Incorrect PIN."; pinError.classList.remove("hidden"); return; }
      pinModal.classList.add("hidden");
      if (pinResolve) pinResolve(true);
    }
  });

  // ---------- App lock screen ----------
  async function checkAppLock() {
    if (!Store.isLockEnabled() && !Store.hasFakePin()) return;
    lockScreen.classList.remove("hidden");
    return new Promise((resolve) => {
      lockScreenSubmit.onclick = async () => {
        const entered = lockScreenInput.value.trim();
        if (Store.isLockEnabled() && (await Store.verifyPin(entered))) {
          Store.setMode("real"); lockScreen.classList.add("hidden"); resolve(); return;
        }
        if (Store.hasFakePin() && (await Store.verifyFakePin(entered))) {
          Store.setMode("decoy"); lockScreen.classList.add("hidden"); resolve(); return;
        }
        lockScreenError.classList.remove("hidden");
      };
    });
  }

  // ---------- Settings ----------
  function openSettingsModal() {
    const s = Store.getSettings();
    cloudNameInput.value = s.cloudName || "";
    uploadPresetInput.value = s.uploadPreset || "";
    const stats = Store.getStats();
    statsBox.textContent = `${stats.folderCount} folders · ${stats.fileCount} files · ${formatBytes(stats.totalBytes)} tracked`;
    settingsModal.classList.remove("hidden");
  }
  settingsCancelBtn.addEventListener("click", () => settingsModal.classList.add("hidden"));
  settingsSaveBtn.addEventListener("click", () => {
    Store.saveSettings({ cloudName: cloudNameInput.value.trim(), uploadPreset: uploadPresetInput.value.trim() });
    settingsModal.classList.add("hidden");
  });
  selfDestructBtn.addEventListener("click", () => {
    if (confirm("This permanently erases every folder and file record from this app. Files remain safe on Cloudinary. Continue?")) {
      Store.selfDestruct();
      navPath = [];
      settingsModal.classList.add("hidden");
      render();
    }
  });
  exportBackupBtn.addEventListener("click", () => {
    const blob = new Blob([Store.exportBackup()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `my-files-backup-${Date.now()}.json`;
    a.click();
  });
  importBackupBtn.addEventListener("click", () => backupImportInput.click());
  backupImportInput.addEventListener("change", () => {
    const file = backupImportInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        Store.importBackup(reader.result);
        alert("Backup restored.");
        navPath = [];
        settingsModal.classList.add("hidden");
        render();
      } catch (e) { alert("That file doesn't look like a valid backup."); }
    };
    reader.readAsText(file);
    backupImportInput.value = "";
  });

  // ---------- Upload ----------
  fileInput.addEventListener("change", async () => {
    const files = Array.from(fileInput.files || []);
    if (!files.length) return;
    const settings = Store.getSettings();
    if (!settings.cloudName || !settings.uploadPreset) {
      alert("Add your Cloudinary cloud name and upload preset in Settings first.");
      fileInput.value = "";
      return;
    }
    uploadProgress.classList.remove("hidden");
    const folderId = currentFolderId();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      uploadLabel.textContent = `Uploading ${i + 1} of ${files.length} — ${file.name}`;
      uploadFill.style.width = "0%";
      try {
        const meta = await Cloudinary.upload(file, settings, (pct) => { uploadFill.style.width = pct + "%"; });
        Store.addFile(folderId, meta);
        renderContent();
      } catch (err) { alert(`Couldn't upload ${file.name}: ${err.message}`); }
    }
    uploadProgress.classList.add("hidden");
    fileInput.value = "";
  });

  // ---------- Info modal ----------
  function showInfo(type, id) {
    let rows = [];
    if (type === "folder") {
      const f = Store.getFolder(id);
      if (!f) return;
      const counts = Store.countItems(id);
      const path = Store.getFolderPath(id);
      infoTitle.textContent = f.name;
      rows = [
        ["Location", path.slice(0, -1).length ? "My Files / " + path.slice(0, -1).join(" / ") : "My Files"],
        ["Created", formatDateTime(f.createdAt)],
        ["Contains", `${counts.total} item${counts.total === 1 ? "" : "s"}`],
        ["Locked", f.locked ? "Yes" : "No"],
      ];
    } else {
      const f = Store.getFile(id);
      if (!f) return;
      const path = Store.getFolderPath(f.folderId);
      infoTitle.textContent = f.originalName;
      rows = [
        ["Location", path.length ? "My Files / " + path.join(" / ") : "My Files"],
        ["Created", formatDateTime(f.createdAt)],
        ["Size", formatBytes(f.bytes)],
        ["Type", (f.format || getExt(f.originalName) || "file").toUpperCase()],
      ];
    }
    infoRows.innerHTML = rows.map(([label, value]) => `<div class="info-row"><span class="label">${escapeHtml(label)}</span><span class="value">${escapeHtml(value)}</span></div>`).join("");
    infoModal.classList.remove("hidden");
  }
  infoCloseBtn.addEventListener("click", () => infoModal.classList.add("hidden"));

  // ---------- Downloads ----------
  async function downloadFileBlob(file) {
    try {
      const res = await fetch(file.url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = file.originalName;
      a.click();
    } catch (e) {
      alert("Couldn't download that file.");
    }
  }

  function collectFilesRecursive(folderId, prefix, out) {
    Store.getFiles(folderId).forEach((f) => out.push({ path: prefix + f.originalName, file: f }));
    Store.getSubfolders(folderId).forEach((sub) => collectFilesRecursive(sub.id, prefix + sub.name + "/", out));
  }

  async function zipAndDownload(entries, zipName) {
    if (!entries.length) { alert("Nothing to download."); return; }
    uploadProgress.classList.remove("hidden");
    const zip = new JSZip();
    for (let i = 0; i < entries.length; i++) {
      uploadLabel.textContent = `Preparing ${i + 1} of ${entries.length}`;
      uploadFill.style.width = Math.round(((i + 1) / entries.length) * 100) + "%";
      try {
        const res = await fetch(entries[i].file.url);
        const blob = await res.blob();
        zip.file(entries[i].path, blob);
      } catch (e) {}
    }
    const content = await zip.generateAsync({ type: "blob" });
    uploadProgress.classList.add("hidden");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = zipName;
    a.click();
  }

  function downloadFolderZip(folderId) {
    const folder = Store.getFolder(folderId);
    const entries = [];
    collectFilesRecursive(folderId, "", entries);
    zipAndDownload(entries, `${folder ? folder.name : "folder"}.zip`);
  }

  function downloadSelection(folderIds, fileIds) {
    if (folderIds.length === 0 && fileIds.length === 1) {
      downloadFileBlob(Store.getFile(fileIds[0]));
      return;
    }
    const entries = [];
    fileIds.forEach((id) => { const f = Store.getFile(id); if (f) entries.push({ path: f.originalName, file: f }); });
    folderIds.forEach((id) => { const f = Store.getFolder(id); collectFilesRecursive(id, (f ? f.name : "folder") + "/", entries); });
    zipAndDownload(entries, "my-files-export.zip");
  }

  // ---------- Selection actions ----------
  selectionInfoBtn.addEventListener("click", () => {
    if (selectedFolders.size === 1 && selectedFiles.size === 0) showInfo("folder", [...selectedFolders][0]);
    else if (selectedFiles.size === 1 && selectedFolders.size === 0) showInfo("file", [...selectedFiles][0]);
  });
  selectionRenameBtn.addEventListener("click", () => {
    if (selectedFolders.size === 1 && selectedFiles.size === 0) {
      const id = [...selectedFolders][0]; const f = Store.getFolder(id);
      exitSelection(); openRenameModal("rename-folder", id, f.name);
    } else if (selectedFiles.size === 1 && selectedFolders.size === 0) {
      const id = [...selectedFiles][0]; const f = Store.getFile(id);
      exitSelection(); openRenameModal("rename-file", id, f.originalName);
    }
  });
  selectionLockBtn.addEventListener("click", async () => {
    const ids = [...selectedFolders];
    const allLocked = ids.every((id) => Store.getFolder(id).locked);
    if (!allLocked) {
      if (!Store.hasPin()) { await requestPin("set", "Set a PIN to lock folders"); if (!Store.hasPin()) return; }
      ids.forEach((id) => Store.setFolderLocked(id, true));
    } else {
      const ok = await requestPin("verify", "Confirm PIN to unlock");
      if (!ok) return;
      ids.forEach((id) => Store.setFolderLocked(id, false));
    }
    exitSelection();
  });
  selectionDownloadBtn.addEventListener("click", () => downloadSelection([...selectedFolders], [...selectedFiles]));
  selectionCopyBtn.addEventListener("click", () => openPicker("copy", [...selectedFolders], [...selectedFiles]));
  selectionMoveBtn.addEventListener("click", () => openPicker("move", [...selectedFolders], [...selectedFiles]));
  selectionDeleteBtn.addEventListener("click", () => {
    const count = selectedFolders.size + selectedFiles.size;
    if (!confirm(`Delete ${count} item${count === 1 ? "" : "s"}? This can't be undone.`)) return;
    selectedFolders.forEach((id) => Store.deleteFolder(id));
    selectedFiles.forEach((id) => Store.removeFile(id));
    exitSelection();
  });

  // ---------- Move / Copy picker ----------
  let pickerMode = "move";
  let pickerSourceFolders = [];
  let pickerSourceFiles = [];
  let pickerNav = [];
  function openPicker(mode, folderIds, fileIds) {
    pickerMode = mode; pickerSourceFolders = folderIds; pickerSourceFiles = fileIds; pickerNav = [];
    pickerTitle.textContent = mode === "move" ? "Move to…" : "Copy to…";
    pickerConfirmBtn.textContent = mode === "move" ? "Move here" : "Copy here";
    renderPicker();
    pickerModal.classList.remove("hidden");
  }
  function pickerCurrentId() { return pickerNav.length ? pickerNav[pickerNav.length - 1] : Store.ROOT; }
  function renderPicker() {
    const curId = pickerCurrentId();
    const folder = curId === Store.ROOT ? null : Store.getFolder(curId);
    pickerPath.textContent = folder ? folder.name : "My Files";
    let subfolders = Store.getSubfolders(curId);
    if (pickerMode === "move") subfolders = subfolders.filter((f) => !pickerSourceFolders.includes(f.id));
    pickerList.innerHTML = "";
    if (pickerNav.length) {
      const up = document.createElement("div");
      up.className = "picker-item";
      up.innerHTML = `<span>⬅</span><span>.. (up)</span>`;
      up.addEventListener("click", () => { pickerNav.pop(); renderPicker(); });
      pickerList.appendChild(up);
    }
    subfolders.forEach((f) => {
      const row = document.createElement("div");
      row.className = "picker-item";
      row.innerHTML = `<div class="mini-folder"></div><span>${escapeHtml(f.name)}</span>`;
      row.addEventListener("click", () => { pickerNav.push(f.id); renderPicker(); });
      pickerList.appendChild(row);
    });
    if (!subfolders.length && !pickerNav.length) pickerList.innerHTML += `<div class="picker-item" style="color:var(--text-dim)">No subfolders here</div>`;
  }
  pickerCancelBtn.addEventListener("click", () => pickerModal.classList.add("hidden"));
  pickerConfirmBtn.addEventListener("click", () => {
    const dest = pickerCurrentId();
    if (pickerMode === "move") Store.moveItems(pickerSourceFolders, pickerSourceFiles, dest);
    else Store.copyItems(pickerSourceFolders, pickerSourceFiles, dest);
    pickerModal.classList.add("hidden");
    exitSelection();
  });

  // ---------- Full-screen swipeable preview ----------
  function openPreview(files, index) {
    previewFiles = files;
    previewIndex = index;
    resetEditingState();
    previewTrack.innerHTML = "";
    files.forEach((file) => {
      const slide = document.createElement("div");
      slide.className = "preview-slide";
      if (isImage(file.mimeType)) {
        slide.innerHTML = `<img src="${file.url}" alt="${escapeHtml(file.originalName)}" />`;
        attachZoom(slide.querySelector("img"));
      } else if (isVideo(file.mimeType)) {
        slide.innerHTML = `<video src="${file.url}" controls playsinline></video>`;
      } else if (isCodeFile(file)) {
        slide.innerHTML = `<pre class="code-pre">Loading…</pre>`;
        const pre = slide.querySelector("pre");
        fetch(file.url).then((r) => { if (!r.ok) throw new Error(); return r.text(); })
          .then((text) => { pre.textContent = text; })
          .catch(() => { pre.textContent = "Couldn't load this file's contents."; });
      } else {
        slide.innerHTML = `<div class="file-generic-full">${genericFileSVG()}<span>${escapeHtml(file.originalName)}</span></div>`;
      }
      previewTrack.appendChild(slide);
    });
    previewOverlay.classList.remove("hidden");
    requestAnimationFrame(() => {
      previewTrack.scrollLeft = index * previewTrack.clientWidth;
      updatePreviewCounter();
    });
  }

  function attachZoom(img) {
    let scale = 1, panX = 0, panY = 0, lastTap = 0;
    const pointers = new Map();
    let pinchStartDist = 0, pinchStartScale = 1, dragStart = null;
    function apply() { img.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`; }
    function reset() { scale = 1; panX = 0; panY = 0; apply(); }
    img.addEventListener("pointerdown", (e) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const pts = [...pointers.values()];
        pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchStartScale = scale;
      } else if (pointers.size === 1 && scale > 1) {
        dragStart = { x: e.clientX - panX, y: e.clientY - panY };
      }
    });
    img.addEventListener("pointermove", (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const pts = [...pointers.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        scale = Math.min(4, Math.max(1, pinchStartScale * (dist / pinchStartDist)));
        apply();
      } else if (pointers.size === 1 && dragStart) {
        panX = e.clientX - dragStart.x; panY = e.clientY - dragStart.y; apply();
      }
    });
    function endPointer(e) {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchStartDist = 0;
      if (pointers.size === 0) dragStart = null;
      if (scale <= 1.02) reset();
    }
    img.addEventListener("pointerup", endPointer);
    img.addEventListener("pointercancel", endPointer);
    img.addEventListener("pointerup", () => {
      const now = Date.now();
      if (now - lastTap < 300) { if (scale > 1) reset(); else { scale = 2.5; apply(); } }
      lastTap = now;
    });
    img._resetZoom = reset;
  }

  function updatePreviewCounter() {
    const width = previewTrack.clientWidth || 1;
    const idx = Math.round(previewTrack.scrollLeft / width);
    previewIndex = Math.max(0, Math.min(idx, previewFiles.length - 1));
    previewCounter.textContent = `${previewIndex + 1} / ${previewFiles.length}`;
    previewTrack.querySelectorAll("img").forEach((img) => { if (img._resetZoom) img._resetZoom(); });
    const file = previewFiles[previewIndex];
    previewRunBtn.classList.toggle("hidden", !(file && isCodeFile(file)));
  }
  let scrollTimer = null;
  previewTrack.addEventListener("scroll", () => {
    if (editingFile) return; // scrolling disabled while editing anyway
    clearTimeout(scrollTimer); scrollTimer = setTimeout(updatePreviewCounter, 80);
  });

  previewCloseBtn.addEventListener("click", async () => {
    if (editingFile && hasUnsavedEdits) await saveCurrentEdits();
    resetEditingState();
    previewOverlay.classList.add("hidden");
    previewTrack.innerHTML = "";
  });
  previewMoreBtn.addEventListener("click", () => {
    const file = previewFiles[previewIndex];
    const code = file && isCodeFile(file);
    previewEditAction.classList.toggle("hidden", !code || !!editingFile);
    previewSaveAction.classList.toggle("hidden", !code || !editingFile);
    previewUndoAction.classList.toggle("hidden", !code || !editingFile);
    previewRedoAction.classList.toggle("hidden", !code || !editingFile);
    openSheet(previewOptionsSheet);
  });
  previewInfoAction.addEventListener("click", () => { closeSheet(previewOptionsSheet); showInfo("file", previewFiles[previewIndex].id); });
  previewDownloadAction.addEventListener("click", () => { closeSheet(previewOptionsSheet); downloadFileBlob(previewFiles[previewIndex]); });
  previewRenameAction.addEventListener("click", () => {
    closeSheet(previewOptionsSheet);
    const file = previewFiles[previewIndex];
    if (!file) return;
    previewOverlay.classList.add("hidden");
    openRenameModal("rename-file", file.id, file.originalName);
  });
  previewRemoveAction.addEventListener("click", () => {
    closeSheet(previewOptionsSheet);
    const file = previewFiles[previewIndex];
    if (!file) return;
    if (confirm("Remove this file from the folder? It stays on Cloudinary but won't show here anymore.")) {
      Store.removeFile(file.id);
      previewOverlay.classList.add("hidden");
      previewTrack.innerHTML = "";
      renderContent();
    }
  });

  // ---------- Code editing (edit / save / undo / redo) ----------
  function resetEditingState() {
    editingFile = null; editingTextarea = null; undoStack = []; redoStack = []; hasUnsavedEdits = false;
    previewTrack.style.overflowX = "";
  }

  function startEditingCurrentSlide() {
    const file = previewFiles[previewIndex];
    if (!file || !isCodeFile(file)) return;
    const slide = previewTrack.children[previewIndex];
    const pre = slide.querySelector("pre");
    if (!pre || pre.textContent === "Loading…") { alert("Still loading — try again in a moment."); return; }
    const value = pre.textContent;
    const textarea = document.createElement("textarea");
    textarea.className = "code-edit";
    textarea.value = value;
    slide.innerHTML = "";
    slide.appendChild(textarea);
    textarea.focus();
    editingFile = file;
    editingTextarea = textarea;
    undoStack = [value];
    redoStack = [];
    hasUnsavedEdits = false;
    previewTrack.style.overflowX = "hidden";
    lastUndoPushTime = Date.now();
    textarea.addEventListener("input", () => {
      hasUnsavedEdits = true;
      const now = Date.now();
      if (now - lastUndoPushTime > 700) {
        undoStack.push(textarea.value);
        redoStack = [];
        lastUndoPushTime = now;
      }
    });
  }
  previewEditAction.addEventListener("click", () => { closeSheet(previewOptionsSheet); startEditingCurrentSlide(); });

  async function saveCurrentEdits() {
    if (!editingFile || !editingTextarea) return;
    const settings = Store.getSettings();
    const newContent = editingTextarea.value;
    try {
      const meta = await Cloudinary.upload(new File([newContent], editingFile.originalName, { type: "text/plain" }), settings, () => {});
      Store.updateFile(editingFile.id, { url: meta.url, publicId: meta.publicId, bytes: meta.bytes, format: meta.format });
      editingFile.url = meta.url;
      editingFile.bytes = meta.bytes;
      hasUnsavedEdits = false;
    } catch (e) {
      alert("Couldn't save your edits: " + e.message);
    }
  }
  previewSaveAction.addEventListener("click", async () => { closeSheet(previewOptionsSheet); await saveCurrentEdits(); });
  previewUndoAction.addEventListener("click", () => {
    closeSheet(previewOptionsSheet);
    if (!editingTextarea || undoStack.length < 2) return;
    redoStack.push(undoStack.pop());
    editingTextarea.value = undoStack[undoStack.length - 1];
    hasUnsavedEdits = true;
  });
  previewRedoAction.addEventListener("click", () => {
    closeSheet(previewOptionsSheet);
    if (!editingTextarea || !redoStack.length) return;
    const v = redoStack.pop();
    undoStack.push(v);
    editingTextarea.value = v;
    hasUnsavedEdits = true;
  });

  // ---------- Run ----------
  function getCurrentSlideContent() {
    const slide = previewTrack.children[previewIndex];
    if (!slide) return "";
    const ta = slide.querySelector("textarea");
    if (ta) return ta.value;
    const pre = slide.querySelector("pre");
    return pre ? pre.textContent : "";
  }
  previewRunBtn.addEventListener("click", () => {
    const file = previewFiles[previewIndex];
    if (!file) return;
    const ext = getExt(file.originalName);
    const content = getCurrentSlideContent();
    let html;
    if (ext === "html" || ext === "htm") {
      html = content;
    } else if (ext === "css") {
      html = `<html><body style="margin:0;font-family:sans-serif"><style>${content}</style><div style="padding:24px">CSS applied to this page — style real elements to preview them.</div></body></html>`;
    } else if (ext === "js" || ext === "mjs") {
      html = `<html><body style="margin:0;padding:14px;font-family:monospace;white-space:pre-wrap;color:#111"><div id="out"></div>
        <script>
          const out=document.getElementById('out');
          const origLog=console.log;
          console.log=(...a)=>{ out.textContent += a.join(' ') + "\\n"; origLog(...a); };
          try { ${content} } catch(e) { out.textContent += "Error: " + e.message; }
        <\/script></body></html>`;
    } else {
      html = `<html><body style="margin:0;padding:20px;font-family:monospace;white-space:pre-wrap;color:#111">Live run isn't supported for .${ext} files yet — showing raw content:\n\n${content.replace(/</g, "&lt;")}</body></html>`;
    }
    runFrame.srcdoc = html;
    runOverlay.classList.remove("hidden");
  });
  runCloseBtn.addEventListener("click", () => { runOverlay.classList.add("hidden"); runFrame.srcdoc = ""; });

  // ---------- Boot ----------
  (async () => {
    await checkAppLock();
    render();
    if (!Store.getSettings().cloudName) setTimeout(openSettingsModal, 300);
  })();
})();
