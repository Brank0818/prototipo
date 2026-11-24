/* Historial de auditoría: todas las acciones registradas, con búsqueda y filtros. */
(function (App) {
  'use strict';

  const U = App.utils;
  const ui = App.ui;
  const icon = App.icon;
  const esc = U.escapeHtml;
  App.views = App.views || {};

  const TYPES = [
    { id: 'todos', label: 'Todos' },
    { id: 'movimiento', label: 'Movimientos', icon: 'cash' },
    { id: 'contrato', label: 'Contratos', icon: 'file' },
    { id: 'cliente', label: 'Clientes', icon: 'users' },
    { id: 'sesion', label: 'Sesión', icon: 'login' },
    { id: 'sistema', label: 'Sistema', icon: 'database' }
  ];
  const PAGE = 60;
  const view = { query: '', type: 'todos', limit: PAGE };

  function entries() {
    const q = U.normalize(view.query);
    return App.store.state.audit
      .filter((a) => view.type === 'todos' || a.type === view.type)
      .filter((a) => !q || U.normalize(a.action + ' ' + a.description + ' ' + a.userName + ' ' + a.id).includes(q))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function list() {
    const all = entries();
    if (!all.length) return ui.emptyState('audit', 'Sin registros', 'No hay acciones que coincidan con la búsqueda.');
    const shown = all.slice(0, view.limit);
    let lastDay = '';
    let html = '';
    shown.forEach((a) => {
      const day = U.formatDate(a.date);
      if (day !== lastDay) {
        html += `${lastDay ? '</ol>' : ''}<p class="audit-day">${esc(day)}</p><ol class="audit-list">`;
        lastDay = day;
      }
      const type = TYPES.find((t) => t.id === a.type) || TYPES[0];
      const link = a.clientId && App.domain.getClient(a.clientId) ? `#/clientes/${esc(a.clientId)}` : '';
      html += `
        <li class="audit-item">
          <span class="audit-ico">${icon(type.icon || 'info')}</span>
          <div class="audit-body">
            <p class="audit-action">${esc(a.action)}</p>
            <p class="audit-desc">${link ? `<a href="${link}">${esc(a.description)}</a>` : esc(a.description)}</p>
            <p class="audit-meta">${U.formatTime(a.date)} · ${esc(a.userName)} · ${esc(a.id)}</p>
          </div>
        </li>`;
    });
    html += '</ol>';
    if (all.length > shown.length) {
      html += `<button class="btn btn-secondary btn-block" type="button" data-more>Ver más (${all.length - shown.length})</button>`;
    }
    return `<p class="result-count">${U.plural(all.length, 'registro', 'registros')}</p>` + html;
  }

  function render() {
    const body = `
      <div class="search">
        ${icon('search')}
        <input id="audit-search" class="input search-input" type="search" placeholder="Buscar acción, cliente o usuario" value="${esc(view.query)}" autocomplete="off" aria-label="Buscar en auditoría">
      </div>
      <div class="chips chips-scroll" role="group" aria-label="Filtrar por tipo">
        ${TYPES.map((t) => `<button class="chip${t.id === view.type ? ' is-selected' : ''}" type="button" data-type="${t.id}" aria-pressed="${t.id === view.type}">${t.label}</button>`).join('')}
      </div>
      <section class="card" id="audit-list">${list()}</section>`;
    return ui.layout({ title: 'AUDITORÍA', nav: 'auditoria', body, narrow: true });
  }

  function mount(root) {
    const box = root.querySelector('#audit-list');
    const refresh = () => { box.innerHTML = list(); };
    root.querySelector('#audit-search').addEventListener('input', (e) => {
      view.query = e.target.value;
      view.limit = PAGE;
      refresh();
    });
    root.querySelector('.chips').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-type]');
      if (!chip) return;
      view.type = chip.dataset.type;
      view.limit = PAGE;
      root.querySelectorAll('[data-type]').forEach((c) => {
        const on = c.dataset.type === view.type;
        c.classList.toggle('is-selected', on);
        c.setAttribute('aria-pressed', String(on));
      });
      refresh();
    });
    box.addEventListener('click', (e) => {
      if (!e.target.closest('[data-more]')) return;
      view.limit += PAGE;
      refresh();
    });
  }

  App.views.audit = { title: 'Auditoría', render, mount };
})(window.App);
