/* Pantalla principal: lista de clientes (con deuda primero, "Clientes sin deuda" en acordeón). */
(function (App) {
  'use strict';

  const U = App.utils;
  const D = App.domain;
  const ui = App.ui;
  const icon = App.icon;
  const esc = U.escapeHtml;
  App.views = App.views || {};

  const FILTERS = [
    { id: 'todos', label: 'Todos' },
    { id: 'dinero', label: 'Dinero' },
    { id: 'balones', label: 'Balones' }
  ];

  /* Estado de la pantalla (se conserva al volver). */
  const view = { query: '', filter: 'todos', accordionOpen: false };

  function passesFilter(balance) {
    if (view.filter === 'dinero') return balance.money > 0;
    if (view.filter === 'balones') return D.cylinderTotal(balance) > 0;
    return true;
  }

  function debtCard(item) {
    const { client, situation } = item;
    const b = situation.balance;
    return `
      <li>
        <a class="client-card" href="#/clientes/${esc(client.id)}/movimiento">
          <div class="cc-top">
            <span class="cc-name">${esc(client.name)}</span>
            <span class="cc-money${b.money === 0 ? ' is-zero' : ''}">${U.formatMoney(b.money)}</span>
          </div>
          <div class="cc-bottom">
            <div class="cyl-chips">${ui.cylinderChips(b)}</div>
            <span class="cc-age">${icon('clock')}${ui.since(situation.active.createdAt)}</span>
          </div>
        </a>
      </li>`;
  }

  function noDebtRow(item) {
    const { client, situation } = item;
    let right = `<span class="row-check">${icon('check')}</span>`;
    if (situation.inactive) right = ui.tag('Inactivo', 'muted');
    else if (situation.pendingClose) right = ui.tag('Por cancelar', 'dotted');
    return `
      <li>
        <a class="row-pill${situation.inactive ? ' is-inactive' : ''}" href="#/clientes/${esc(client.id)}/movimiento">
          <span class="row-name">${esc(client.name)}</span>
          ${right}
        </a>
      </li>`;
  }

  function results() {
    const groups = D.groupedClients(view.query);
    const debtors = groups.withDebt.filter((i) => passesFilter(i.situation.balance));
    const searching = !!view.query.trim();
    const open = view.accordionOpen || (searching && groups.withoutDebt.length > 0);

    const debtBlock = debtors.length
      ? `<ul class="client-grid">${debtors.map(debtCard).join('')}</ul>`
      : ui.emptyState(searching ? 'search' : 'check',
        searching ? 'Sin resultados con deuda' : 'Ningún cliente con deuda',
        searching ? 'No hay clientes con deuda que coincidan con “' + view.query.trim() + '”.' : 'Las deudas registradas aparecerán aquí.');

    return `
      <section class="block">
        ${ui.sectionHead('Con deuda', ui.countPill(debtors.length))}
        ${debtBlock}
      </section>
      <section class="accordion${open ? ' is-open' : ''}">
        <button class="accordion-head" type="button" aria-expanded="${open}" aria-controls="no-debt-list">
          <span>Clientes sin deuda</span>
          <span class="accordion-count">${groups.withoutDebt.length}</span>
          ${icon('chevronDown', 'accordion-chevron')}
        </button>
        <div class="accordion-body" id="no-debt-list">
          ${groups.withoutDebt.length
            ? `<ul class="row-list">${groups.withoutDebt.map(noDebtRow).join('')}</ul>`
            : `<p class="muted-note">${searching ? 'Sin coincidencias.' : 'Todos los clientes tienen deuda pendiente.'}</p>`}
        </div>
      </section>`;
  }

  function render() {
    const body = `
      <div class="search">
        ${icon('search')}
        <input id="client-search" class="input search-input" type="search" placeholder="Buscar por nombre o documento"
          value="${esc(view.query)}" autocomplete="off" aria-label="Buscar clientes por nombre o documento">
        <button class="search-clear" type="button" aria-label="Limpiar búsqueda"${view.query ? '' : ' hidden'}>${icon('close')}</button>
      </div>
      <div class="chips" role="group" aria-label="Filtrar clientes con deuda">
        ${FILTERS.map((f) => `<button class="chip${f.id === view.filter ? ' is-selected' : ''}" type="button" data-filter="${f.id}" aria-pressed="${f.id === view.filter}">${f.label}</button>`).join('')}
      </div>
      <div id="client-results">${results()}</div>`;

    return ui.layout({
      title: 'GLP CONTROL',
      nav: 'clientes',
      body,
      fab: `<a class="fab" href="#/clientes/nuevo" aria-label="Registrar nuevo cliente">${icon('plus')}</a>`
    });
  }

  function mount(root) {
    const box = root.querySelector('#client-results');
    const input = root.querySelector('#client-search');
    const clear = root.querySelector('.search-clear');
    const refresh = () => { box.innerHTML = results(); };

    input.addEventListener('input', () => {
      view.query = input.value;
      clear.hidden = !view.query;
      refresh();
    });
    clear.addEventListener('click', () => {
      view.query = '';
      input.value = '';
      clear.hidden = true;
      input.focus();
      refresh();
    });
    root.querySelector('.chips').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-filter]');
      if (!chip) return;
      view.filter = chip.dataset.filter;
      root.querySelectorAll('[data-filter]').forEach((c) => {
        const on = c.dataset.filter === view.filter;
        c.classList.toggle('is-selected', on);
        c.setAttribute('aria-pressed', String(on));
      });
      refresh();
    });
    box.addEventListener('click', (e) => {
      if (!e.target.closest('.accordion-head')) return;
      const section = box.querySelector('.accordion');
      view.accordionOpen = !section.classList.contains('is-open');
      section.classList.toggle('is-open', view.accordionOpen);
      section.querySelector('.accordion-head').setAttribute('aria-expanded', String(view.accordionOpen));
    });
  }

  App.views.clients = { title: 'Clientes', render, mount };
})(window.App);
