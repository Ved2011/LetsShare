/**
 * dragDrop.js  —  LetsShare reusable drag-and-drop image uploader
 *
 * Usage:
 *   makeDragDrop(fileInputId, options)
 *
 * Options:
 *   label      {string}  text shown inside the zone when empty
 *   previewId  {string}  id of an existing <img> to use as preview (optional)
 *   maxMB      {number}  max file size in MB (default: 5)
 *   onFile     {fn}      callback(File) called whenever a file is accepted
 */
(function () {
  window.makeDragDrop = function (fileInputId, opts = {}) {
    const input = document.getElementById(fileInputId);
    if (!input) return;

    const label   = opts.label   || 'Drag & drop an image here, or <u>click to browse</u>';
    const maxMB   = opts.maxMB   || 5;
    const onFile  = opts.onFile  || null;

    // ── Build the drop zone ──────────────────────────────────────────────────
    const zone = document.createElement('div');
    zone.id = fileInputId + '_dropZone';
    zone.style.cssText = `
      border: 2px dashed var(--border, #d1d5db);
      border-radius: 12px;
      padding: 2rem 1.5rem;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      background: var(--surface, #f9fafb);
      position: relative;
      user-select: none;
    `;

    const icon = document.createElement('div');
    icon.innerHTML = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent,#4f7cde)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin:0 auto 0.6rem;display:block;opacity:0.7;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;

    const text = document.createElement('p');
    text.style.cssText = 'margin:0 0 0.35rem; font-size:0.9rem; color:var(--text,#374151);';
    text.innerHTML = label;

    const sub = document.createElement('p');
    sub.style.cssText = 'margin:0; font-size:0.75rem; color:var(--muted,#9ca3af);';
    sub.textContent = `PNG, JPG, WEBP up to ${maxMB} MB`;

    const previewWrap = document.createElement('div');
    previewWrap.style.cssText = 'display:none; margin-top:1rem;';

    let previewImg;
    if (opts.previewId) {
      previewImg = document.getElementById(opts.previewId);
    } else {
      previewImg = document.createElement('img');
      previewImg.style.cssText = 'max-width:100%; max-height:180px; border-radius:8px; object-fit:contain; display:none;';
      previewWrap.appendChild(previewImg);
    }

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.textContent = '\u2715 Remove';
    clearBtn.style.cssText = `
      display: none;
      margin-top: 0.5rem;
      padding: 0.25rem 0.75rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: #dc3545;
      background: rgba(220,53,69,0.08);
      border: 1px solid rgba(220,53,69,0.3);
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.15s;
    `;
    clearBtn.onmouseover = () => { clearBtn.style.background = '#dc3545'; clearBtn.style.color = '#fff'; };
    clearBtn.onmouseout  = () => { clearBtn.style.background = 'rgba(220,53,69,0.08)'; clearBtn.style.color = '#dc3545'; };

    zone.appendChild(icon);
    zone.appendChild(text);
    zone.appendChild(sub);
    zone.appendChild(previewWrap);
    zone.appendChild(clearBtn);

    input.style.cssText = 'position:absolute; width:1px; height:1px; opacity:0; pointer-events:none;';
    input.parentNode.insertBefore(zone, input);

    // ── Helpers ──────────────────────────────────────────────────────────────
    function showPreview(file) {
      const reader = new FileReader();
      reader.onload = e => {
        previewImg.src = e.target.result;
        previewImg.style.display = 'block';
        previewWrap.style.display = 'block';
        if (opts.previewId) previewImg.style.display = 'block';
        clearBtn.style.display = 'inline-block';
        text.innerHTML = `<strong style="color:var(--accent);">\uD83D\uDCCE ${file.name}</strong>`;
        sub.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
        zone.style.borderColor = 'var(--accent, #4f7cde)';
        zone.style.background  = 'rgba(79,124,222,0.04)';
      };
      reader.readAsDataURL(file);
    }

    function clearFile() {
      input.value = '';
      previewImg.src = '';
      previewImg.style.display = 'none';
      previewWrap.style.display = 'none';
      clearBtn.style.display = 'none';
      text.innerHTML = label;
      sub.textContent = `PNG, JPG, WEBP up to ${maxMB} MB`;
      zone.style.borderColor = 'var(--border, #d1d5db)';
      zone.style.background  = 'var(--surface, #f9fafb)';
    }

    function acceptFile(file) {
      if (!file.type.startsWith('image/')) {
        if (window.showAlert) window.showAlert('Please select an image file.', 'error');
        return;
      }
      if (file.size > maxMB * 1024 * 1024) {
        if (window.showAlert) window.showAlert(`Image must be under ${maxMB} MB.`, 'error');
        return;
      }
      try {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
      } catch (_) {}
      showPreview(file);
      if (onFile) onFile(file);
    }

    // ── Events ───────────────────────────────────────────────────────────────
    zone.addEventListener('click', e => {
      if (e.target === clearBtn || clearBtn.contains(e.target)) return;
      input.click();
    });

    input.addEventListener('change', () => {
      if (input.files && input.files[0]) acceptFile(input.files[0]);
    });

    clearBtn.addEventListener('click', e => {
      e.stopPropagation();
      clearFile();
    });

    zone.addEventListener('dragover', e => {
      e.preventDefault();
      zone.style.borderColor = 'var(--accent, #4f7cde)';
      zone.style.background  = 'rgba(79,124,222,0.08)';
    });

    zone.addEventListener('dragleave', e => {
      if (!zone.contains(e.relatedTarget) && (!input.files || !input.files[0])) {
        zone.style.borderColor = 'var(--border, #d1d5db)';
        zone.style.background  = 'var(--surface, #f9fafb)';
      }
    });

    zone.addEventListener('drop', e => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) acceptFile(file);
    });
  };
})();
