// app.js
(() => {
  const el = (id) => document.getElementById(id);

  // Topbars
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
  const selectionRenameBtn = el("selectionRenameBtn");
  const selectionLockBtn = el("selectionLockBtn");
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

  const folderOptionsSheet = el("folderOptionsSheet");
  const renameFolderAction = el("renameFolderAction");
  const toggleLockFolderAction = el("toggleLockFolderAction");
  const moveFolderAction = el("moveFolderAction");
  const copyFolderAction = el("copyFolderAction");
  const deleteFolderAction = el("deleteFolderAction");

  const hamburgerSheet = el("hamburgerSheet");
  const toggleAppLockAction = el("toggleAppLockAction");
  const lockAllFoldersAction = el("lockAllFoldersAction");
  const unlockAllFoldersAction = el("unlockAllFoldersAction");

  const folderModal = el("folderModal");
  const folderModalTitle = el("folderModalTitle");
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

  const previewOverlay = el("previewOverlay");
  const previewTrack = el("previewTrack");
  const previewCounter = el("previewCounter");
  const previewCloseBtn = el("previewCloseBtn");
  const previewMoreBtn = el("previewMoreBtn");
  const previewOptionsSheet = el("previewOptionsSheet");
  const previewRenameAction = el("previewRenameAction");
  const previewRemoveAction = el("previewRemoveAction");

  let navPath = [];
  let searchActive = false;
  let folderModalMode = "create"; // create | rename-folder | rename-file
  let renameTargetId = null;
  let previewFiles = [];
  let previewIndex = 0;

  // Selection state
  let selectionActive = false;
  let selectedFolders = new Set();
  let selectedFiles = new Set();
  const unlockedFoldersThisSession = new Set();

  function currentFolderId() { return navPath.length ? navPath[navPath.length - 1] : Store.ROOT; }
  function escapeHtml(str) { const d = document.createElement("div"); d.textContent = str || ""; return d.innerHTML; }
  function isImage(m) { return m && m.startsWith("image/"); }
  function isVideo(m) { return m && m.startsWith("video/"); }
  function formatBytes(bytes) {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0, val = bytes;
    while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
    return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
  }
  function formatDate(ts) { return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
  function genericFileSVG() { return `<svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5"/></svg>`; }

  // ---------- Sheets / modals helpers ----------
  function openSheet(s) { s.classList.remove("hidden"); }
  function closeSheet(s) { s.classList.add("hidden"); }
  [addSheet, folderOptionsSheet, hamburgerSheet, previewOptionsSheet].forEach((s) => {
    s.addEventListener("click", (e) => { if (e.target === s) closeSheet(s); });
  });
  [folderModal, settingsModal, pinModal, pickerModal].forEach((m) => {
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
  function exitSelection() {
    selectionActive = false;
    selectedFolders.clear();
    selectedFiles.clear();
    render();
  }
  selectionCancelBtn.addEventListener("click", exitSelection);

  function attachLongPress(elm, onLongPress, onTap) {
    let timer = null, fired = false, startX = 0, startY = 0;
    const clear = () => { clearTimeout(timer); timer = null; };
    elm.addEventListener("pointerdown", (e) => {
      fired = false;
      startX = e.clientX; startY = e.clientY;
      timer = setTimeout(() => { fired = true; onLongPress(); }, 480);
    });
    elm.addEventListener("pointermove", (e) => {
      if (timer && (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10)) clear();
    });
    elm.addEventListener("pointerup", () => {
      clear();
      if (!fired) onTap();
    });
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
      selectionRenameBtn.classList.toggle("hidden", count !== 1);
      const onlyFolders = selectedFiles.size === 0 && selectedFolders.size > 0;
      selectionLockBtn.classList.toggle("hidden", !onlyFolders);
      return;
    }
    normalTopbar.classList.remove("hidden");
    selectionTopbar.classList.add("hidden");
    fabBtn.classList.remove("hidden");

    const folderId = currentFolderId();
    const folder = folderId === Store.ROOT ? null : Store.getFolder(folderId);

    backBtn.classList.toggle("hidden", navPath.length === 0);
    hamburgerBtn.classList.toggle("hidden", navPath.length !== 0);
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
    openSheet(folderOptionsSheet);
  });
  hamburgerBtn.addEventListener("click", () => {
    toggleAppLockAction.textContent = Store.isLockEnabled() ? "Disable lock" : "Set lock";
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
    if (selectionActive) { renderTopbar(); }
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
      attachLongPress(item,
        () => enterSelection("folder", folder.id),
        () => { if (selectionActive) toggleSelect("folder", folder.id); else openFolder(folder.id); }
      );
      grid.appendChild(item);
    });

    files.forEach((file) => {
      const item = document.createElement("div");
      item.className = "icon-item" + (selectedFiles.has(file.id) ? " selected" : "");
      const thumbHtml = isImage(file.mimeType)
        ? `<div class="thumb"><img src="${file.url}" loading="lazy" /></div>`
        : `<div class="thumb">${genericFileSVG()}</div>`;
      item.innerHTML = `${thumbHtml}<div class="label">${escapeHtml(file.originalName)}</div>${selectedFiles.has(file.id) ? '<div class="check-badge">✓</div>' : ""}`;
      attachLongPress(item,
        () => enterSelection("file", file.id),
        () => { if (selectionActive) toggleSelect("file", file.id); else openPreview(files, files.indexOf(file)); }
      );
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
        <span class="meta-cell">${formatDate(folder.createdAt)}</span>
        <span class="meta-cell">${counts.total} item${counts.total === 1 ? "" : "s"}</span>
        ${selectedFolders.has(folder.id) ? '<div class="check-badge">✓</div>' : ""}
      `;
      attachLongPress(row,
        () => enterSelection("folder", folder.id),
        () => { if (selectionActive) toggleSelect("folder", folder.id); else openFolder(folder.id); }
      );
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
        <span class="meta-cell">${formatDate(file.createdAt)}</span>
        <span class="meta-cell">${formatBytes(file.bytes)}</span>
        ${selectedFiles.has(file.id) ? '<div class="check-badge">✓</div>' : ""}
      `;
      attachLongPress(row,
        () => enterSelection("file", file.id),
        () => { if (selectionActive) toggleSelect("file", file.id); else openPreview(files, files.indexOf(file)); }
      );
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
    folderNameInput.value = "";
    folderModal.classList.remove("hidden");
    setTimeout(() => folderNameInput.focus(), 50);
  });
  addFileAction.addEventListener("click", () => { closeSheet(addSheet); fileInput.click(); });

  folderCancelBtn.addEventListener("click", () => folderModal.classList.add("hidden"));
  folderCreateBtn.addEventListener("click", () => {
    const name = folderNameInput.value.trim();
    if (!name) return;
    if (folderModalMode === "create") Store.createFolder(name, currentFolderId());
    else if (folderModalMode === "rename-folder") Store.renameFolder(renameTargetId, name);
    else if (folderModalMode === "rename-file") Store.renameFile(renameTargetId, name);
    folderModal.classList.add("hidden");
    renderContent();
  });
  folderNameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") folderCreateBtn.click(); });

  function openRenameModal(mode, id, currentName) {
    folderModalMode = mode;
    renameTargetId = id;
    folderModalTitle.textContent = mode === "rename-file" ? "Rename file" : "Rename folder";
    folderNameInput.value = currentName;
    folderModal.classList.remove("hidden");
    setTimeout(() => folderNameInput.focus(), 50);
  }

  // ---------- Folder options ----------
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

  // ---------- PIN modal (promise-based) ----------
  let pinResolve = null;
  function requestPin(mode, title) {
    return new Promise((resolve) => {
      pinResolve = resolve;
      pinModalTitle.textContent = title;
      pinInput.value = ""; pinConfirmInput.value = "";
      pinError.classList.add("hidden");
      pinConfirmInput.classList.toggle("hidden", mode !== "set");
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
    if (mode === "set") {
      if (pin !== pinConfirmInput.value.trim()) { pinError.textContent = "PINs didn't match. Try again."; pinError.classList.remove("hidden"); return; }
      await Store.setPin(pin);
      pinModal.classList.add("hidden");
      if (pinResolve) pinResolve(true);
    } else {
      const ok = await Store.verifyPin(pin);
      if (!ok) { pinError.textContent = "Incorrect PIN."; pinError.classList.remove("hidden"); return; }
      pinModal.classList.add("hidden");
      if (pinResolve) pinResolve(true);
    }
  });

  // ---------- App lock screen (on boot) ----------
  async function checkAppLock() {
    if (!Store.isLockEnabled()) return;
    lockScreen.classList.remove("hidden");
    return new Promise((resolve) => {
      lockScreenSubmit.onclick = async () => {
        const ok = await Store.verifyPin(lockScreenInput.value.trim());
        if (ok) { lockScreen.classList.add("hidden"); resolve(); }
        else { lockScreenError.classList.remove("hidden"); }
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

  // ---------- Selection actions ----------
  selectionRenameBtn.addEventListener("click", () => {
    if (selectedFolders.size === 1 && selectedFiles.size === 0) {
      const id = [...selectedFolders][0];
      const f = Store.getFolder(id);
      exitSelection();
      openRenameModal("rename-folder", id, f.name);
    } else if (selectedFiles.size === 1 && selectedFolders.size === 0) {
      const id = [...selectedFiles][0];
      const f = Store.getFile(id);
      exitSelection();
      openRenameModal("rename-file", id, f.originalName);
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
    pickerMode = mode;
    pickerSourceFolders = folderIds;
    pickerSourceFiles = fileIds;
    pickerNav = [];
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
    // hide folders being moved themselves (avoid nonsense) — copy can go anywhere
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
    if (!subfolders.length && !pickerNav.length) {
      pickerList.innerHTML += `<div class="picker-item" style="color:var(--text-dim)">No subfolders here</div>`;
    }
  }
  pickerCancelBtn.addEventListener("click", () => pickerModal.classList.add("hidden"));
  pickerConfirmBtn.addEventListener("click", () => {
    const dest = pickerCurrentId();
    if (pickerMode === "move") Store.moveItems(pickerSourceFolders, pickerSourceFiles, dest);
    else Store.copyItems(pickerSourceFolders, pickerSourceFiles, dest);
    pickerModal.classList.add("hidden");
    exitSelection();
  });

  // ---------- Full-screen swipeable preview with zoom ----------
  function openPreview(files, index) {
    previewFiles = files;
    previewIndex = index;
    previewTrack.innerHTML = "";
    files.forEach((file) => {
      const slide = document.createElement("div");
      slide.className = "preview-slide";
      if (isImage(file.mimeType)) {
        slide.innerHTML = `<img src="${file.url}" alt="${escapeHtml(file.originalName)}" />`;
        attachZoom(slide.querySelector("img"));
      } else if (isVideo(file.mimeType)) {
        slide.innerHTML = `<video src="${file.url}" controls playsinline></video>`;
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
    let scale = 1, panX = 0, panY = 0;
    let lastTap = 0;
    const pointers = new Map();
    let pinchStartDist = 0, pinchStartScale = 1;
    let dragStart = null;

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
        panX = e.clientX - dragStart.x;
        panY = e.clientY - dragStart.y;
        apply();
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

    img.addEventListener("pointerup", (e) => {
      const now = Date.now();
      if (now - lastTap < 300) {
        if (scale > 1) reset();
        else { scale = 2.5; apply(); }
      }
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
  }
  let scrollTimer = null;
  previewTrack.addEventListener("scroll", () => { clearTimeout(scrollTimer); scrollTimer = setTimeout(updatePreviewCounter, 80); });

  previewCloseBtn.addEventListener("click", () => { previewOverlay.classList.add("hidden"); previewTrack.innerHTML = ""; });
  previewMoreBtn.addEventListener("click", () => openSheet(previewOptionsSheet));
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

  // ---------- Boot ----------
  (async () => {
    await checkAppLock();
    render();
    if (!Store.getSettings().cloudName) setTimeout(openSettingsModal, 300);
  })();
})();
