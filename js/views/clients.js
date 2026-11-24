/*
 * Pantalla principal: lista de clientes.
 * Sin búsqueda: clientes con deuda primero y "Clientes sin deuda" en acordeón.
 * Con búsqueda: una sola lista de resultados, en orden alfabético.
 */
(function (App) {
  'use strict';

  const U = App.utils;
  const D = App.domain;
  const ui = App.ui;
  const icon = App.icon;
  const esc = U.escapeHtml;
  App.views = App.views || {};

  const view = { query: '', accordionOpen: false };

  function href(client) {
    return '#/clientes/' + esc(client.id) + '/movimiento';
  }

  function settledMark(situation) {
    return situation.inactive ? ui.tag('Inactivo', 'muted') : `<span class="row-check">${icon('check')}</span>`;
  }

  function debtCard(item) {
    const { client, situation } = item;
    const b = situation.balance;
    return `
      <li>
        <a class="client-card" href="${href(client)}">
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

  /* Tarjeta de resultado de búsqueda: misma tarjeta para clientes con y sin deuda. */
  function resultCard(item) {
    if (item.situation.hasDebt) return debtCard(item);
    return `
      <li>
        <a class="client-card is-settled${item.situation.inactive ? ' is-inactive' : ''}" href="${href(item.client)}">
          <div class="cc-top">
            <span class="cc-name">${esc(item.client.name)}</span>
            ${settledMark(item.situation)}
          </div>
        </a>
      </li>`;
  }

  function noDebtRow(item) {
    return `
      <li>
        <a class="row-pill${item.situation.inactive ? ' is-inactive' : ''}" href="${href(item.client)}">
          <span class="row-name">${esc(item.client.name)}</span>
          ${settledMark(item.situation)}
        </a>
      </li>`;
  }

  function searchResults(query) {
    const found = D.searchClients(query);
    return `
      <section class="block">
        ${ui.sectionHead('Resultados', ui.countPill(found.length))}
        ${found.length
          ? `<ul class="client-grid">${found.map(resultCard).join('')}</ul>`
          : ui.emptyState('search', 'Sin resultados', 'Ningún cliente coincide con “' + query + '”.')}
      </section>`;
  }

  function groupedList() {
    const groups = D.groupedClients('');
    const open = view.accordionOpen;
    return `
      <section class="block">
        ${ui.sectionHead('Con deuda', ui.countPill(groups.withDebt.length))}
        ${groups.withDebt.length
          ? `<ul class="client-grid">${groups.withDebt.map(debtCard).join('')}</ul>`
          : ui.emptyState('check', 'Ningún cliente con deuda', 'Las deudas registradas aparecerán aquí.')}
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
            : '<p class="muted-note">Todos los clientes tienen deuda pendiente.</p>'}
        </div>
      </section>`;
  }

  function results() {
    const query = view.query.trim();
    return query ? searchResults(query) : groupedList();
  }

  function render() {
    /* La búsqueda no se conserva: al volver a esta pantalla empieza vacía. */
    view.query = '';
    const search = `
      <div class="search">
        ${icon('search')}
        <input id="client-search" class="input search-input" type="search" placeholder="Buscar por nombre o documento"
          autocomplete="off" aria-label="Buscar clientes por nombre o documento">
        <button class="search-clear" type="button" aria-label="Limpiar búsqueda" hidden>${icon('close')}</button>
      </div>`;

    return ui.layout({
      title: 'GLP CONTROL',
      nav: 'clientes',
      headerExtra: search,
      body: `<div id="client-results">${results()}</div>`,
      fab: `<a class="fab" href="#/clientes/nuevo" aria-label="Registrar nuevo cliente">${icon('plus')}</a>`
    });
  }

  function mount(root) {
    const box = root.querySelector('#client-results');
    const input = root.querySelector('#client-search');
    const clear = root.querySelector('.search-clear');
    const refresh = () => { box.innerHTML = results(); };
    const setQuery = (value) => {
      view.query = value;
      input.value = value;
      clear.hidden = !value;
      refresh();
    };

    input.addEventListener('input', () => setQuery(input.value));
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') setQuery(''); });
    clear.addEventListener('click', () => { setQuery(''); input.focus(); });

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
