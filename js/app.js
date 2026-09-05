// app.js
(() => {
  const el = (id) => document.getElementById(id);

  const backBtn = el("backBtn");
  const searchBtn = el("searchBtn");
  const searchWrap = el("searchWrap");
  const searchInput = el("searchInput");
  const folderTitle = el("folderTitle");
  const layoutBtn = el("layoutBtn");
  const folderMenuBtn = el("folderMenuBtn");
  const settingsBtn = el("settingsBtn");
  const content = el("content");
  const emptyState = el("emptyState");
  const emptyTitle = el("emptyTitle");
  const fabBtn = el("fabBtn");
  const fileInput = el("fileInput");
  const uploadProgress = el("uploadProgress");
  const uploadFill = el("uploadFill");
  const uploadLabel = el("uploadLabel");

  const addSheet = el("addSheet");
  const addFolderAction = el("addFolderAction");
  const addFileAction = el("addFileAction");

  const folderOptionsSheet = el("folderOptionsSheet");
  const renameFolderAction = el("renameFolderAction");
  const deleteFolderAction = el("deleteFolderAction");

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

  const previewOverlay = el("previewOverlay");
  const previewTrack = el("previewTrack");
  const previewCounter = el("previewCounter");
  const previewCloseBtn = el("previewCloseBtn");
  const previewMoreBtn = el("previewMoreBtn");
  const previewOptionsSheet = el("previewOptionsSheet");
  const previewRemoveAction = el("previewRemoveAction");

  let navPath = []; // stack of folder ids; [] = root
  let searchActive = false;
  let folderModalMode = "create"; // or "rename"
  let previewFiles = [];
  let previewIndex = 0;

  function currentFolderId() {
    return navPath.length ? navPath[navPath.length - 1] : Store.ROOT;
  }

  // ---------- Helpers ----------
  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str || "";
    return d.innerHTML;
  }
  function isImage(mimeType) { return mimeType && mimeType.startsWith("image/"); }
  function isVideo(mimeType) { return mimeType && mimeType.startsWith("video/"); }
  function formatBytes(bytes) {
    if (!bytes) return "";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0, val = bytes;
    while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
    return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
  }
  function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
  function kindLabel(file) {
    if (isImage(file.mimeType)) return (file.format || "image").toUpperCase() + " image";
    if (isVideo(file.mimeType)) return (file.format || "video").toUpperCase() + " video";
    return (file.format || "file").toUpperCase() + " file";
  }
  function genericFileSVG() {
    return `<svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5"/></svg>`;
  }

  // ---------- Top bar ----------
  function renderTopbar() {
    const folderId = currentFolderId();
    const folder = folderId === Store.ROOT ? null : Store.getFolder(folderId);

    backBtn.classList.toggle("hidden", navPath.length === 0);
    folderMenuBtn.classList.toggle("hidden", folderId === Store.ROOT);

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

    const layout = Store.getLayout(folderId);
    layoutBtn.title = layout === "grid" ? "Switch to list view" : "Switch to grid view";
  }

  backBtn.addEventListener("click", () => {
    navPath.pop();
    searchActive = false;
    render();
  });

  searchBtn.addEventListener("click", () => {
    searchActive = !searchActive;
    renderTopbar();
    if (!searchActive) renderContent();
  });
  searchInput.addEventListener("input", renderContent);

  layoutBtn.addEventListener("click", () => {
    const folderId = currentFolderId();
    const current = Store.getLayout(folderId);
    Store.setLayout(folderId, current === "grid" ? "list" : "grid");
    renderTopbar();
    renderContent();
  });

  folderMenuBtn.addEventListener("click", () => openSheet(folderOptionsSheet));
  settingsBtn.addEventListener("click", openSettingsModal);

  // ---------- Navigation into a folder ----------
  function openFolder(id) {
    navPath.push(id);
    searchActive = false;
    render();
  }

  // ---------- Rendering content ----------
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
    emptyState.classList.toggle("hidden", total > 0);
    content.classList.toggle("hidden", total === 0);
    if (total === 0) {
      emptyTitle.textContent = query ? "No matches" : "This folder is empty";
    }

    const layout = Store.getLayout(folderId);
    content.innerHTML = "";

    if (layout === "grid") {
      renderIconGrid(subfolders, files);
      layoutBtn.querySelector("svg").outerHTML = layoutIconSVG("grid");
    } else {
      renderListView(subfolders, files);
      layoutBtn.querySelector("svg").outerHTML = layoutIconSVG("list");
    }
  }

  function layoutIconSVG(current) {
    if (current === "grid") {
      // show list icon as the "switch to" affordance
      return `<svg id="layoutIcon" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>`;
    }
    return `<svg id="layoutIcon" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`;
  }

  function renderIconGrid(subfolders, files) {
    const grid = document.createElement("div");
    grid.className = "icon-grid";

    subfolders.forEach((folder) => {
      const counts = Store.countItems(folder.id);
      const item = document.createElement("div");
      item.className = "icon-item";
      item.innerHTML = `
        <div class="folder-glyph"></div>
        <div class="label">${escapeHtml(folder.name)}</div>
        <div class="sub-label">${counts.total} item${counts.total === 1 ? "" : "s"}</div>
      `;
      item.addEventListener("click", () => openFolder(folder.id));
      grid.appendChild(item);
    });

    files.forEach((file) => {
      const item = document.createElement("div");
      item.className = "icon-item";
      let thumbHtml;
      if (isImage(file.mimeType)) {
        thumbHtml = `<div class="thumb"><img src="${file.url}" loading="lazy" /></div>`;
      } else {
        thumbHtml = `<div class="thumb">${genericFileSVG()}</div>`;
      }
      item.innerHTML = `${thumbHtml}<div class="label">${escapeHtml(file.originalName)}</div>`;
      item.addEventListener("click", () => openPreview(files, files.indexOf(file)));
      grid.appendChild(item);
    });

    content.appendChild(grid);
  }

  function renderListView(subfolders, files) {
    const wrap = document.createElement("div");
    wrap.className = "list-view";
    wrap.innerHTML = `
      <div class="list-header">
        <span>Name</span><span>Modified</span><span>Size</span>
      </div>
    `;

    subfolders.forEach((folder) => {
      const counts = Store.countItems(folder.id);
      const row = document.createElement("div");
      row.className = "list-row";
      row.innerHTML = `
        <div class="name-cell">
          <div class="mini-folder"></div>
          <span class="name">${escapeHtml(folder.name)}</span>
        </div>
        <span class="meta-cell">${formatDate(folder.createdAt)}</span>
        <span class="meta-cell">${counts.total} item${counts.total === 1 ? "" : "s"}</span>
      `;
      row.addEventListener("click", () => openFolder(folder.id));
      wrap.appendChild(row);
    });

    files.forEach((file) => {
      const row = document.createElement("div");
      row.className = "list-row";
      let iconHtml;
      if (isImage(file.mimeType)) {
        iconHtml = `<div class="icon-wrap"><img src="${file.url}" loading="lazy" /></div>`;
      } else {
        iconHtml = `<div class="icon-wrap">${genericFileSVG()}</div>`;
      }
      row.innerHTML = `
        <div class="name-cell">
          ${iconHtml}
          <span class="name">${escapeHtml(file.originalName)}</span>
        </div>
        <span class="meta-cell">${formatDate(file.createdAt)}</span>
        <span class="meta-cell">${formatBytes(file.bytes)}</span>
      `;
      row.addEventListener("click", () => openPreview(files, files.indexOf(file)));
      wrap.appendChild(row);
    });

    content.appendChild(wrap);
  }

  function render() {
    renderTopbar();
    renderContent();
  }

  // ---------- Sheets ----------
  function openSheet(sheet) { sheet.classList.remove("hidden"); }
  function closeSheet(sheet) { sheet.classList.add("hidden"); }

  [addSheet, folderOptionsSheet, previewOptionsSheet].forEach((sheet) => {
    sheet.addEventListener("click", (e) => { if (e.target === sheet) closeSheet(sheet); });
  });

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

  addFileAction.addEventListener("click", () => {
    closeSheet(addSheet);
    fileInput.click();
  });

  folderCancelBtn.addEventListener("click", () => folderModal.classList.add("hidden"));
  folderCreateBtn.addEventListener("click", () => {
    const name = folderNameInput.value.trim();
    if (!name) return;
    if (folderModalMode === "create") {
      Store.createFolder(name, currentFolderId());
    } else {
      Store.renameFolder(currentFolderId(), name);
    }
    folderModal.classList.add("hidden");
    render();
  });
  folderNameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") folderCreateBtn.click(); });

  // ---------- Folder options (rename / delete) ----------
  renameFolderAction.addEventListener("click", () => {
    closeSheet(folderOptionsSheet);
    const folder = Store.getFolder(currentFolderId());
    folderModalMode = "rename";
    folderModalTitle.textContent = "Rename folder";
    folderNameInput.value = folder ? folder.name : "";
    folderModal.classList.remove("hidden");
    setTimeout(() => folderNameInput.focus(), 50);
  });

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

  // ---------- Settings ----------
  function openSettingsModal() {
    const s = Store.getSettings();
    cloudNameInput.value = s.cloudName || "";
    uploadPresetInput.value = s.uploadPreset || "";
    settingsModal.classList.remove("hidden");
  }
  settingsCancelBtn.addEventListener("click", () => settingsModal.classList.add("hidden"));
  settingsSaveBtn.addEventListener("click", () => {
    Store.saveSettings({
      cloudName: cloudNameInput.value.trim(),
      uploadPreset: uploadPresetInput.value.trim(),
    });
    settingsModal.classList.add("hidden");
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
      } catch (err) {
        alert(`Couldn't upload ${file.name}: ${err.message}`);
      }
    }

    uploadProgress.classList.add("hidden");
    fileInput.value = "";
  });

  // ---------- Full-screen swipeable preview ----------
  function openPreview(files, index) {
    previewFiles = files;
    previewIndex = index;

    previewTrack.innerHTML = "";
    files.forEach((file) => {
      const slide = document.createElement("div");
      slide.className = "preview-slide";
      if (isImage(file.mimeType)) {
        slide.innerHTML = `<img src="${file.url}" alt="${escapeHtml(file.originalName)}" />`;
      } else if (isVideo(file.mimeType)) {
        slide.innerHTML = `<video src="${file.url}" controls playsinline></video>`;
      } else {
        slide.innerHTML = `<div class="file-generic-full">${genericFileSVG()}<span>${escapeHtml(file.originalName)}</span></div>`;
      }
      previewTrack.appendChild(slide);
    });

    previewOverlay.classList.remove("hidden");
    requestAnimationFrame(() => {
      previewTrack.scrollTo({ left: index * previewTrack.clientWidth, behavior: "instant" in document.documentElement.style ? "instant" : "auto" });
      updatePreviewCounter();
    });
  }

  function updatePreviewCounter() {
    const width = previewTrack.clientWidth || 1;
    const idx = Math.round(previewTrack.scrollLeft / width);
    previewIndex = Math.max(0, Math.min(idx, previewFiles.length - 1));
    previewCounter.textContent = `${previewIndex + 1} / ${previewFiles.length}`;
  }

  let scrollTimer = null;
  previewTrack.addEventListener("scroll", () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(updatePreviewCounter, 60);
  });

  previewCloseBtn.addEventListener("click", () => {
    previewOverlay.classList.add("hidden");
    previewTrack.innerHTML = "";
  });

  previewMoreBtn.addEventListener("click", () => openSheet(previewOptionsSheet));

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

  // Close modals when tapping the dark backdrop
  [folderModal, settingsModal].forEach((modal) => {
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });
  });

  // ---------- Boot ----------
  render();
  if (!Store.getSettings().cloudName) {
    setTimeout(openSettingsModal, 300);
  }
})();
