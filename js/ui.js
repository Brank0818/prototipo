/* Componentes de interfaz compartidos: estructura de pantalla, navegación, modales, notificaciones. */
(function (App) {
  'use strict';

  const U = App.utils;
  const icon = App.icon;
  const esc = U.escapeHtml;

  const NAV = [
    { id: 'clientes', label: 'Clientes', href: '#/clientes', icon: 'users' },
    { id: 'resumen', label: 'Resumen', href: '#/resumen', icon: 'chart' },
    { id: 'auditoria', label: 'Auditoría', href: '#/auditoria', icon: 'audit' },
    { id: 'ajustes', label: 'Ajustes', href: '#/ajustes', icon: 'sliders' }
  ];

  /* ---------- Estructura de pantalla ---------- */

  /*
   * Menú kebab. Siempre muestra el usuario; cada pantalla puede añadir sus propias
   * opciones (items: [{ label, icon, action | href }]) que aparecen primero.
   */
  function menuItem(item) {
    return item.href
      ? `<a class="menu-item" role="menuitem" href="${item.href}">${icon(item.icon)}<span>${esc(item.label)}</span></a>`
      : `<button class="menu-item" role="menuitem" type="button" data-action="${item.action}">${icon(item.icon)}<span>${esc(item.label)}</span></button>`;
  }

  function userMenu(items, heading) {
    const user = App.session.user();
    if (!user) return '';
    const own = items && items.length;
    return `
      <div class="menu" role="menu" hidden>
        ${own ? `${heading ? `<p class="menu-heading">${esc(heading)}</p>` : ''}${items.map(menuItem).join('')}<div class="menu-sep"></div>` : ''}
        <div class="menu-user${own ? ' compact' : ''}">
          <span class="avatar">${icon('user')}</span>
          <div>
            <p class="menu-name">${esc(user.name)}</p>
            <p class="menu-meta">@${esc(user.username)} · ${esc(user.role)}</p>
          </div>
        </div>
        <div class="menu-sep"></div>
        ${own ? '' : menuItem({ href: '#/ajustes', icon: 'sliders', label: 'Ajustes' }) + menuItem({ href: '#/auditoria', icon: 'audit', label: 'Historial de auditoría' })}
        ${menuItem({ action: 'logout', icon: 'logout', label: 'Cerrar sesión' })}
      </div>`;
  }

  /* opts: { title, back, menuItems, menuHeading, headerExtra } */
  function topbar(opts) {
    const left = opts.back
      ? `<a class="icon-btn round" href="${opts.back}" aria-label="Volver">${icon('back')}</a>`
      : '<span class="topbar-spacer" aria-hidden="true"></span>';
    return `
      <header class="topbar${opts.headerExtra ? ' has-extra' : ''}">
        <div class="topbar-row">
          ${left}
          <h1 class="pill-title">${esc(opts.title)}</h1>
          <div class="kebab">
            <button class="icon-btn" type="button" data-kebab aria-label="Menú" aria-haspopup="true" aria-expanded="false">${icon('kebab')}</button>
            ${userMenu(opts.menuItems, opts.menuHeading)}
          </div>
        </div>
        ${opts.headerExtra ? `<div class="topbar-extra">${opts.headerExtra}</div>` : ''}
      </header>`;
  }

  function bottomNav(active) {
    return `
      <nav class="bottom-nav" aria-label="Navegación principal">
        ${NAV.map((item) => `
          <a class="nav-item${item.id === active ? ' is-active' : ''}" href="${item.href}"${item.id === active ? ' aria-current="page"' : ''}>
            ${icon(item.icon)}<span>${item.label}</span>
          </a>`).join('')}
      </nav>`;
  }

  /* opts: { title, back, nav, body, fab, narrow, menuItems, menuHeading, headerExtra } */
  function layout(opts) {
    return `
      ${topbar(opts)}
      <main class="content${opts.nav ? '' : ' no-nav'}" id="content">
        <div class="content-inner${opts.narrow ? ' narrow' : ''}">${opts.body}</div>
      </main>
      ${opts.fab || ''}
      ${opts.nav ? bottomNav(opts.nav) : ''}`;
  }

  /* ---------- Piezas reutilizables ---------- */

  function sectionHead(title, extra) {
    return `<div class="section-head"><h2>${esc(title)}</h2>${extra || ''}</div>`;
  }

  function countPill(n) {
    return `<span class="count-pill">${n}</span>`;
  }

  function tag(text, variant) {
    return `<span class="tag${variant ? ' tag-' + variant : ''}">${esc(text)}</span>`;
  }

  function emptyState(iconName, title, text, action) {
    return `
      <div class="empty">
        <span class="empty-ico">${icon(iconName)}</span>
        <p class="empty-title">${esc(title)}</p>
        ${text ? `<p class="empty-text">${esc(text)}</p>` : ''}
        ${action || ''}
      </div>`;
  }

  /* Fichas de balones pendientes: solo los tipos con saldo distinto de cero. */
  function cylinderChips(balance) {
    return App.domain.CYLINDERS
      .filter((c) => balance.cyl[c.id] !== 0)
      .map((c) => `<span class="cyl-chip"><span>${c.label}</span><b>${balance.cyl[c.id]}</b></span>`)
      .join('');
  }

  /* Texto de antigüedad que se actualiza solo (ver App.tick en app.js). */
  function since(iso, prefix) {
    return `<span class="since" data-since="${esc(iso)}"${prefix ? ` data-prefix="${esc(prefix)}"` : ''}>${esc((prefix || '') + U.formatAge(iso))}</span>`;
  }

  function fieldError(message) {
    return `<p class="field-error"${message ? '' : ' hidden'}>${icon('alert')}<span>${esc(message || '')}</span></p>`;
  }

  /* ---------- Notificaciones ---------- */

  function toast(message, iconName) {
    const root = document.getElementById('toast-root');
    root.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.innerHTML = `<span class="toast-ico">${icon(iconName || 'check')}</span><span>${esc(message)}</span>`;
    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-visible'));
    setTimeout(() => {
      el.classList.remove('is-visible');
      setTimeout(() => el.remove(), 300);
    }, 2800);
  }

  /* ---------- Modales ---------- */

  let modalResolve = null;
  let lastFocus = null;

  function closeModal(result) {
    const root = document.getElementById('modal-root');
    if (!root.firstChild) return;
    root.innerHTML = '';
    document.body.classList.remove('has-modal');
    if (modalResolve) { const r = modalResolve; modalResolve = null; r(!!result); }
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }

  /* opts: { title, message, body (HTML ya escapado), confirmText, cancelText, icon, alertOnly } -> Promise<boolean> */
  function modal(opts) {
    closeModal(false);
    lastFocus = document.activeElement;
    const root = document.getElementById('modal-root');
    root.innerHTML = `
      <div class="modal-backdrop" data-modal-close>
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <span class="modal-ico">${icon(opts.icon || 'info')}</span>
          <h2 class="modal-title" id="modal-title">${esc(opts.title)}</h2>
          ${opts.message ? `<p class="modal-text">${esc(opts.message)}</p>` : ''}
          ${opts.body ? `<div class="modal-body">${opts.body}</div>` : ''}
          <div class="modal-actions${opts.alertOnly ? ' single' : ''}">
            ${opts.alertOnly ? '' : `<button class="btn btn-secondary" type="button" data-modal-cancel>${esc(opts.cancelText || 'Cancelar')}</button>`}
            <button class="btn btn-primary" type="button" data-modal-ok>${esc(opts.confirmText || 'Aceptar')}</button>
          </div>
        </div>
      </div>`;
    document.body.classList.add('has-modal');
    const backdrop = root.querySelector('.modal-backdrop');
    backdrop.addEventListener('click', (e) => {
      if (e.target.closest('[data-modal-ok]')) closeModal(true);
      else if (e.target.closest('[data-modal-cancel]') || e.target === backdrop) closeModal(false);
    });
    requestAnimationFrame(() => {
      backdrop.classList.add('is-visible');
      root.querySelector('[data-modal-ok]').focus();
    });
    return new Promise((resolve) => { modalResolve = resolve; });
  }

  function confirm(opts) { return modal(opts); }
  function alert(opts) { return modal(Object.assign({ alertOnly: true, icon: 'alert', confirmText: 'Entendido' }, opts)); }

  /* ---------- Menú kebab (delegación global, se configura una vez) ---------- */

  function closeMenus() {
    document.querySelectorAll('.kebab .menu').forEach((m) => { m.hidden = true; });
    document.querySelectorAll('[data-kebab]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  }

  function initGlobalHandlers() {
    document.addEventListener('click', (e) => {
      const toggle = e.target.closest('[data-kebab]');
      if (toggle) {
        const menu = toggle.parentElement.querySelector('.menu');
        const open = menu.hidden;
        closeMenus();
        menu.hidden = !open;
        toggle.setAttribute('aria-expanded', String(open));
        return;
      }
      if (!e.target.closest('.menu')) closeMenus();
      if (e.target.closest('.menu-item')) closeMenus();

      if (e.target.closest('[data-action="logout"]')) {
        confirm({ title: '¿Cerrar sesión?', message: 'Los datos de prueba se mantendrán guardados en este navegador.', confirmText: 'Cerrar sesión', icon: 'logout' })
          .then((ok) => {
            if (!ok) return;
            App.domain.logout();
            location.hash = '#/login';
          });
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeMenus(); closeModal(false); }
    });
  }

  App.ui = {
    layout, topbar, bottomNav, sectionHead, countPill, tag, emptyState, cylinderChips, since, fieldError,
    toast, modal, confirm, alert, closeModal, closeMenus, initGlobalHandlers
  };
})(window.App);
