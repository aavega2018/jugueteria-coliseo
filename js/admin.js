(() => {
  "use strict";

  const STORAGE_KEY = "jugueteria_coliseo_admin_data_v3";
  const SESSION_KEY = "jugueteria_coliseo_admin_session_v3";
  const SESSION_MINUTES = 30;

  const ADMIN_USER = "admin";
  const ADMIN_PASSWORD_HASH = "f697587e4b6442256322eb780e347fc15caf77485b06faf07d90251c06e0eba4";

  const $ = id => document.getElementById(id);
  let data = normalizeData(window.SITE_DATA || {});
  let editingIndex = null;
  let dirty = false;

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function normalizeData(raw) {
    const d = clone(raw || {});
    d.negocio = d.negocio || {};
    d.categorias = Array.isArray(d.categorias) ? d.categorias : [];
    d.productos = Array.isArray(d.productos) ? d.productos : [];
    d.productos = d.productos.map(p => ({
      nombre: String(p.nombre ?? ""),
      precio: Number(p.precio ?? 0),
      categoria: String(p.categoria ?? ""),
      imagen: String(p.imagen ?? ""),
      descripcion: String(p.descripcion ?? ""),
      activo: p.activo !== false
    }));
    return d;
  }

  function escapeHtml(v) {
    return String(v ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[c]));
  }

  function setMessage(text, type="ok") {
    const box = $("message");
    if (!box) return;
    box.textContent = text;
    box.className = "message show " + type;
    clearTimeout(setMessage.timer);
    setMessage.timer = setTimeout(() => box.className = "message", 5000);
  }

  function saveLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    dirty = true;
    updateSessionInfo();
  }

  function loadLocal() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) data = normalizeData(JSON.parse(saved));
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY);
      setMessage("No se pudo leer la copia local. Se cargaron los datos originales.", "warn");
    }
  }

  function populateSite() {
    const n = data.negocio;
    $("siteName").value = n.nombre || "";
    $("tagline").value = n.lema || "";
    $("direccion").value = n.direccion || "";
    $("telefono1").value = n.telefono1 || "";
    $("telefono2").value = n.telefono2 || "";
    $("whatsapp").value = n.whatsapp || "";
    $("horario").value = n.horario || "";
    $("facebook").value = n.facebook || "";
    $("instagram").value = n.instagram || "";
    $("mapa").value = n.mapa || "";
  }

  function renderCategories() {
    const list = $("categoryList");
    list.innerHTML = "";
    data.categorias.forEach((cat, i) => {
      const count = data.productos.filter(p => p.categoria === cat).length;
      const li = document.createElement("li");
      li.innerHTML = `<div class="item-main"><strong>${escapeHtml(cat)}</strong><small>${count} producto(s)</small></div>
      <div class="item-actions">
        <button class="btn-secondary" data-action="rename-cat" data-i="${i}">✏ Renombrar</button>
        <button class="btn-danger" data-action="delete-cat" data-i="${i}">🗑 Eliminar</button>
      </div>`;
      list.appendChild(li);
    });
    renderCategorySelect();
  }

  function renderCategorySelect(selected="") {
    const select = $("pCategoria");
    select.innerHTML = `<option value="">Selecciona una categoría</option>`;
    data.categorias.forEach(cat => {
      const o = document.createElement("option");
      o.value = cat;
      o.textContent = cat;
      if (cat === selected) o.selected = true;
      select.appendChild(o);
    });
  }

  function renderProducts() {
    const list = $("productList");
    list.innerHTML = "";
    data.productos.forEach((p, i) => {
      const li = document.createElement("li");
      li.innerHTML = `<div class="item-main">
        <strong>${escapeHtml(p.nombre)}</strong>
        <small>CUP ${Number(p.precio || 0).toLocaleString("es-CU", {minimumFractionDigits:2})} · ${escapeHtml(p.categoria || "Sin categoría")} · ${p.activo === false ? "OCULTO" : "ACTIVO"}</small>
      </div>
      <div class="item-actions">
        <button class="btn-secondary" data-action="edit-product" data-i="${i}">✏ Editar</button>
        <button class="btn-secondary" data-action="duplicate-product" data-i="${i}">📋 Duplicar</button>
        <button class="btn-secondary" data-action="toggle-product" data-i="${i}">${p.activo === false ? "👁 Mostrar" : "🙈 Ocultar"}</button>
        <button class="btn-danger" data-action="delete-product" data-i="${i}">🗑 Eliminar</button>
      </div>`;
      list.appendChild(li);
    });
  }

  function renderAll() {
    populateSite();
    renderCategories();
    renderProducts();
    updateSessionInfo();
  }

  function markDirty() {
    saveLocal();
    renderCategories();
    renderProducts();
  }

  function resetProductForm() {
    editingIndex = null;
    $("formTitle").textContent = "➕ Agregar producto";
    $("saveProductText").textContent = "Agregar producto";
    $("cancelEdit").hidden = true;
    $("productForm").reset();
    $("pActivo").checked = true;
    renderCategorySelect();
  }

  function editProduct(i) {
    const p = data.productos[i];
    if (!p) return;
    editingIndex = i;
    $("formTitle").textContent = "✏ Editar producto";
    $("saveProductText").textContent = "Guardar cambios";
    $("cancelEdit").hidden = false;
    $("pNombre").value = p.nombre;
    $("pPrecio").value = p.precio;
    renderCategorySelect(p.categoria);
    $("pImagen").value = p.imagen;
    $("pDescripcion").value = p.descripcion;
    $("pActivo").checked = p.activo !== false;
    window.scrollTo({top:$("productForm").getBoundingClientRect().top + window.scrollY - 90, behavior:"smooth"});
  }

  function validateProduct(p) {
    if (!p.nombre.trim()) return "El producto necesita un nombre.";
    if (!Number.isFinite(p.precio) || p.precio < 0) return "El precio no es válido.";
    if (!p.categoria || !data.categorias.includes(p.categoria)) return "Selecciona una categoría válida.";
    if (!p.imagen.trim()) return "Indica la ruta de la imagen.";
    return "";
  }

  async function sha256(text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }

  async function checkLogin(user, pass) {
    if (!window.crypto?.subtle) return false;
    const hash = await sha256(pass);
    return user === ADMIN_USER && hash === ADMIN_PASSWORD_HASH;
  }

  function sessionValid() {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      return !!(s && s.user === ADMIN_USER && Number(s.expires) > Date.now());
    } catch {
      return false;
    }
  }

  function startSession() {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      user: ADMIN_USER,
      expires: Date.now() + SESSION_MINUTES * 60000
    }));
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    $("adminApp").hidden = true;
    $("loginScreen").hidden = false;
    $("loginPass").value = "";
  }

  function showAdmin() {
    $("loginScreen").hidden = true;
    $("adminApp").hidden = false;
    loadLocal();
    renderAll();
  }

  function updateSessionInfo() {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      if (s && $("sessionInfo")) {
        const mins = Math.max(0, Math.ceil((Number(s.expires) - Date.now()) / 60000));
        $("sessionInfo").textContent = `Sesión activa como ${s.user}. Expira en aproximadamente ${mins} minuto(s).`;
      }
    } catch {}
  }

  function downloadData() {
    const clean = normalizeData(data);
    const js = `// Datos de Juguetería Coliseo
// Generado desde admin.html
window.SITE_DATA = ${JSON.stringify(clean, null, 2)};
`;
    const blob = new Blob([js], {type:"application/javascript;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.js";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    dirty = false;
    setMessage("data.js generado correctamente. Ahora reemplázalo en js/data.js de GitHub.", "ok");
  }

  $("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    $("loginError").textContent = "";
    const ok = await checkLogin($("loginUser").value.trim(), $("loginPass").value);
    if (!ok) {
      $("loginError").textContent = "Usuario o contraseña incorrectos.";
      $("loginPass").select();
      return;
    }
    startSession();
    showAdmin();
  });

  $("logoutBtn").addEventListener("click", () => {
    if (dirty && !confirm("Hay cambios pendientes. ¿Cerrar sesión sin descargar data.js?")) return;
    logout();
  });

  $("saveSite").addEventListener("click", () => {
    data.negocio = {
      ...data.negocio,
      nombre: $("siteName").value.trim(),
      lema: $("tagline").value.trim(),
      direccion: $("direccion").value.trim(),
      telefono1: $("telefono1").value.trim(),
      telefono2: $("telefono2").value.trim(),
      whatsapp: $("whatsapp").value.replace(/\D/g, ""),
      horario: $("horario").value.trim(),
      facebook: $("facebook").value.trim(),
      instagram: $("instagram").value.trim(),
      mapa: $("mapa").value.trim()
    };
    markDirty();
    setMessage("Datos del negocio guardados en este navegador.", "ok");
  });

  $("categoryForm").addEventListener("submit", e => {
    e.preventDefault();
    const value = $("newCategory").value.trim().replace(/\s+/g, " ");
    if (!value) return;
    if (data.categorias.some(c => c.toLowerCase() === value.toLowerCase())) {
      setMessage("Esa categoría ya existe.", "warn");
      return;
    }
    data.categorias.push(value);
    $("newCategory").value = "";
    markDirty();
    setMessage("Categoría agregada.", "ok");
  });

  $("categoryList").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    const i = Number(b.dataset.i);
    const cat = data.categorias[i];
    if (!cat) return;

    if (b.dataset.action === "rename-cat") {
      const nuevo = prompt("Nuevo nombre de la categoría:", cat);
      if (nuevo === null) return;
      const value = nuevo.trim().replace(/\s+/g, " ");
      if (!value) return setMessage("El nombre no puede quedar vacío.", "warn");
      if (data.categorias.some((c,j) => j !== i && c.toLowerCase() === value.toLowerCase()))
        return setMessage("Ya existe otra categoría con ese nombre.", "warn");
      data.productos.forEach(p => { if (p.categoria === cat) p.categoria = value; });
      data.categorias[i] = value;
      markDirty();
      setMessage("Categoría renombrada y productos actualizados.", "ok");
    }

    if (b.dataset.action === "delete-cat") {
      const used = data.productos.some(p => p.categoria === cat);
      if (used) return setMessage(`No se puede eliminar "${cat}" porque tiene productos asociados. Renómbrala o mueve primero esos productos.`, "warn");
      if (!confirm(`¿Eliminar la categoría "${cat}"?`)) return;
      data.categorias.splice(i, 1);
      markDirty();
      setMessage("Categoría eliminada.", "ok");
    }
  });

  $("productForm").addEventListener("submit", e => {
    e.preventDefault();
    const p = {
      nombre: $("pNombre").value.trim(),
      precio: Number($("pPrecio").value),
      categoria: $("pCategoria").value,
      imagen: $("pImagen").value.trim(),
      descripcion: $("pDescripcion").value.trim(),
      activo: $("pActivo").checked
    };
    const error = validateProduct(p);
    if (error) return setMessage(error, "warn");

    if (editingIndex === null) {
      data.productos.push(p);
      setMessage("Producto agregado correctamente.", "ok");
    } else {
      data.productos[editingIndex] = p;
      setMessage("Producto actualizado correctamente.", "ok");
    }
    markDirty();
    resetProductForm();
  });

  $("cancelEdit").addEventListener("click", resetProductForm);

  $("pImagenFile").addEventListener("change", () => {
    const file = $("pImagenFile").files[0];
    if (!file) return;
    $("pImagen").value = "img/" + file.name.replace(/\\/g, "/").split("/").pop();
    setMessage("Se colocó la ruta de la imagen. Recuerda subir ese archivo a la carpeta img/ de GitHub.", "warn");
  });

  $("productList").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    const i = Number(b.dataset.i);
    const p = data.productos[i];
    if (!p) return;

    switch (b.dataset.action) {
      case "edit-product":
        editProduct(i);
        break;
      case "duplicate-product":
        data.productos.splice(i + 1, 0, {...p, nombre:p.nombre + " (copia)"});
        markDirty();
        setMessage("Producto duplicado. Puedes editar la copia.", "ok");
        break;
      case "toggle-product":
        p.activo = p.activo === false;
        markDirty();
        setMessage(p.activo ? "Producto visible en el catálogo." : "Producto ocultado del catálogo.", "ok");
        break;
      case "delete-product":
        if (!confirm(`¿Eliminar definitivamente "${p.nombre}"?`)) return;
        data.productos.splice(i, 1);
        markDirty();
        if (editingIndex === i) resetProductForm();
        setMessage("Producto eliminado.", "ok");
        break;
    }
  });

  $("download").addEventListener("click", downloadData);

  $("clearLocal").addEventListener("click", () => {
    if (!confirm("Esto borrará las modificaciones guardadas en este navegador y volverá a los datos originales de data.js. ¿Continuar?")) return;
    localStorage.removeItem(STORAGE_KEY);
    data = normalizeData(window.SITE_DATA || {});
    dirty = false;
    resetProductForm();
    renderAll();
    setMessage("Se restauraron los datos originales de data.js.", "ok");
  });

  window.addEventListener("beforeunload", e => {
    if (dirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  setInterval(() => {
    if (sessionValid()) {
      updateSessionInfo();
    } else if (!$("adminApp").hidden) {
      alert("La sesión administrativa ha expirado.");
      logout();
    }
  }, 30000);

  if (sessionValid()) showAdmin();
})();
