// app.js
(() => {
  const el = (id) => document.getElementById(id);

  // Screens
  const folderTopbar = el("folderTopbar");
  const detailTopbar = el("detailTopbar");
  const folderScreen = el("folderScreen");
  const detailScreen = el("detailScreen");
  const folderGrid = el("folderGrid");
  const folderEmpty = el("folderEmpty");
  const fileGrid = el("fileGrid");
  const fileEmpty = el("fileEmpty");
  const detailTitle = el("detailTitle");
  const searchInput = el("searchInput");

  // FAB + inputs
  const fabBtn = el("fabBtn");
  const fileInput = el("fileInput");
  const uploadProgress = el("uploadProgress");
  const uploadFill = el("uploadFill");
  const uploadLabel = el("uploadLabel");

  // Folder modal
  const folderModal = el("folderModal");
  const folderNameInput = el("folderNameInput");
  const folderCancelBtn = el("folderCancelBtn");
  const folderCreateBtn = el("folderCreateBtn");

  // Settings modal
  const settingsBtn = el("settingsBtn");
  const settingsModal = el("settingsModal");
  const cloudNameInput = el("cloudNameInput");
  const uploadPresetInput = el("uploadPresetInput");
  const settingsCancelBtn = el("settingsCancelBtn");
  const settingsSaveBtn = el("settingsSaveBtn");

  // Preview modal
  const previewModal = el("previewModal");
  const previewBody = el("previewBody");
  const previewDeleteBtn = el("previewDeleteBtn");
  const previewCloseBtn = el("previewCloseBtn");

  const backBtn = el("backBtn");

  let currentFolderId = null;
  let previewFileId = null;

  // ---------- Navigation ----------
  function showFolderScreen() {
    currentFolderId = null;
    folderTopbar.classList.remove("hidden");
    detailTopbar.classList.add("hidden");
    folderScreen.classList.remove("hidden");
    detailScreen.classList.add("hidden");
    renderFolders();
  }

  function showDetailScreen(folderId) {
    currentFolderId = folderId;
    folderTopbar.classList.add("hidden");
    detailTopbar.classList.remove("hidden");
    folderScreen.classList.add("hidden");
    detailScreen.classList.remove("hidden");
    const folder = Store.getFolder(folderId);
    detailTitle.textContent = folder ? folder.name : "Folder";
    renderFiles();
  }

  backBtn.addEventListener("click", showFolderScreen);

  // ---------- Folder rendering ----------
  function folderIconSVG() {
    return '<div class="folder-icon"></div>';
  }

  function renderFolders() {
    const query = searchInput.value.trim().toLowerCase();
    const folders = Store.getFolders().filter((f) =>
      f.name.toLowerCase().includes(query)
    );

    folderGrid.innerHTML = "";
    folderEmpty.classList.toggle("hidden", folders.length > 0);

    folders.forEach((folder) => {
      const card = document.createElement("div");
      card.className = "folder-card";
      const count = Store.countFiles(folder.id);
      card.innerHTML = `
        ${folderIconSVG()}
        <div class="folder-row">
          <span class="folder-name">${escapeHtml(folder.name)}</span>
          <svg class="folder-chevron" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>
        </div>
        <div class="folder-count">${count} file${count === 1 ? "" : "s"}</div>
      `;
      card.addEventListener("click", () => showDetailScreen(folder.id));
      folderGrid.appendChild(card);
    });
  }

  searchInput.addEventListener("input", renderFolders);

  // ---------- File rendering ----------
  function isImage(mimeType) {
    return mimeType && mimeType.startsWith("image/");
  }

  function fileGenericSVG(label) {
    return `
      <div class="file-generic">
        <svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v15H6z"/><path d="M15 2v5h5"/></svg>
        <span>${escapeHtml(label)}</span>
      </div>`;
  }

  function renderFiles() {
    const files = Store.getFiles(currentFolderId);
    fileGrid.innerHTML = "";
    fileEmpty.classList.toggle("hidden", files.length > 0);

    files.forEach((file) => {
      const card = document.createElement("div");
      card.className = "file-card";
      if (isImage(file.mimeType)) {
        card.innerHTML = `<img src="${file.url}" loading="lazy" alt="${escapeHtml(file.originalName)}" />`;
      } else {
        const label = file.originalName || file.format || "file";
        card.innerHTML = fileGenericSVG(label);
      }
      card.addEventListener("click", () => openPreview(file.id));
      fileGrid.appendChild(card);
    });
  }

  function escapeHtml(str) {
    const d = document.createElement("div");
    d.textContent = str || "";
    return d.innerHTML;
  }

  // ---------- New folder modal ----------
  function openFolderModal() {
    folderNameInput.value = "";
    folderModal.classList.remove("hidden");
    setTimeout(() => folderNameInput.focus(), 50);
  }
  function closeFolderModal() {
    folderModal.classList.add("hidden");
  }
  folderCancelBtn.addEventListener("click", closeFolderModal);
  folderCreateBtn.addEventListener("click", () => {
    const name = folderNameInput.value.trim();
    if (!name) return;
    Store.createFolder(name);
    closeFolderModal();
    renderFolders();
  });
  folderNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") folderCreateBtn.click();
  });

  // ---------- Settings modal ----------
  function openSettingsModal() {
    const s = Store.getSettings();
    cloudNameInput.value = s.cloudName || "";
    uploadPresetInput.value = s.uploadPreset || "";
    settingsModal.classList.remove("hidden");
  }
  function closeSettingsModal() {
    settingsModal.classList.add("hidden");
  }
  settingsBtn.addEventListener("click", openSettingsModal);
  settingsCancelBtn.addEventListener("click", closeSettingsModal);
  settingsSaveBtn.addEventListener("click", () => {
    Store.saveSettings({
      cloudName: cloudNameInput.value.trim(),
      uploadPreset: uploadPresetInput.value.trim(),
    });
    closeSettingsModal();
  });

  // ---------- FAB behaviour (context-sensitive) ----------
  fabBtn.addEventListener("click", () => {
    if (currentFolderId) {
      fileInput.click();
    } else {
      openFolderModal();
    }
  });

  // ---------- Upload flow ----------
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

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      uploadLabel.textContent = `Uploading ${i + 1} of ${files.length} — ${file.name}`;
      uploadFill.style.width = "0%";
      try {
        const meta = await Cloudinary.upload(file, settings, (pct) => {
          uploadFill.style.width = pct + "%";
        });
        Store.addFile(currentFolderId, meta);
        renderFiles();
      } catch (err) {
        alert(`Couldn't upload ${file.name}: ${err.message}`);
      }
    }

    uploadProgress.classList.add("hidden");
    fileInput.value = "";
  });

  // ---------- Preview modal ----------
  function openPreview(fileId) {
    previewFileId = fileId;
    const file = Store.getFile(fileId);
    if (!file) return;

    if (isImage(file.mimeType)) {
      previewBody.innerHTML = `<img src="${file.url}" alt="${escapeHtml(file.originalName)}" />`;
    } else if (file.mimeType && file.mimeType.startsWith("video/")) {
      previewBody.innerHTML = `<video src="${file.url}" controls></video>`;
    } else {
      previewBody.innerHTML = fileGenericSVG(file.originalName || file.format || "file");
    }
    previewModal.classList.remove("hidden");
  }
  function closePreview() {
    previewModal.classList.add("hidden");
    previewBody.innerHTML = "";
    previewFileId = null;
  }
  previewCloseBtn.addEventListener("click", closePreview);
  previewDeleteBtn.addEventListener("click", () => {
    if (!previewFileId) return;
    if (confirm("Remove this file from the folder? It stays on Cloudinary but won't show here anymore.")) {
      Store.removeFile(previewFileId);
      closePreview();
      renderFiles();
      renderFolders();
    }
  });

  // Close modals when tapping the dark backdrop
  [folderModal, settingsModal, previewModal].forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.add("hidden");
    });
  });

  // ---------- Boot ----------
  showFolderScreen();
  if (!Store.getSettings().cloudName) {
    // Nudge the user to configure Cloudinary on first run
    setTimeout(openSettingsModal, 300);
  }
})();
