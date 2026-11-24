/*
 * Detalle del cliente: resumen compacto de la deuda actual y contratos en acordeones,
 * cada uno con su historial de movimientos.
 * Ver datos, Editar y Desactivar están en el menú kebab.
 */
(function (App) {
  'use strict';

  const U = App.utils;
  const D = App.domain;
  const ui = App.ui;
  const icon = App.icon;
  const esc = U.escapeHtml;
  App.views = App.views || {};

  function docLabel(client) {
    if (!client.docType || !client.docNumber) return '';
    const type = D.DOC_TYPES.find((t) => t.id === client.docType);
    return (type ? type.label : client.docType) + ' ' + client.docNumber;
  }

  /* ---------- Resumen compacto ---------- */

  function summaryCard(client) {
    const situation = D.clientSituation(client);
    const b = situation.balance;
    const inactive = client.status !== 'activo';
    const meta = [docLabel(client), client.phone].filter(Boolean).map((v) => `<span>${esc(v)}</span>`).join(' · ');
    const status = inactive
      ? ui.tag('Inactivo', 'muted')
      : ui.tag(situation.hasDebt ? 'Con deuda' : 'Sin deuda', situation.hasDebt ? 'dark' : '');

    return `
      <section class="debt-summary">
        <div class="summary-head">
          <div class="summary-title">
            <h2 class="summary-name">${esc(client.name)}</h2>
            ${meta ? `<p class="summary-meta">${meta}</p>` : ''}
          </div>
          ${status}
        </div>
        <div class="balance-strip${situation.hasDebt ? '' : ' is-zero'}">
          <div class="strip-item strip-money">
            <span class="strip-label">Saldo de dinero</span>
            <b>${U.formatMoney(b.money)}</b>
          </div>
          ${D.CYLINDERS.map((c) => `
            <div class="strip-item${b.cyl[c.id] === 0 ? ' is-zero' : ''}">
              <span class="strip-label">${c.label}</span>
              <b>${b.cyl[c.id]}</b>
            </div>`).join('')}
        </div>
        ${inactive
          ? `<p class="hint">${icon('power')}<span>Cliente desactivado: reactívalo desde el menú para registrar movimientos.</span></p>`
          : `<a class="btn btn-primary btn-block" href="#/clientes/${esc(client.id)}/movimiento">${icon('plus')}<span>Nuevo movimiento</span></a>`}
      </section>`;
  }

  /* ---------- Contratos (acordeones) ---------- */

  function detailLine(d) {
    const c = D.CONCEPTS[d.concept];
    const sign = c.sign > 0 ? '+' : '−';
    const value = c.kind === 'money' ? sign + ' ' + U.formatMoney(d.amount) : sign + ' ' + d.quantity + ' × ' + d.cylinder + ' kg';
    return `
      <li class="mov-line${c.sign < 0 ? ' is-out' : ''}">
        <span class="mov-ico">${icon(c.icon)}<i>${sign}</i></span>
        <span class="mov-concept">${c.label}</span>
        <b class="mov-value">${value}</b>
      </li>`;
  }

  function movementItem(m) {
    return `
      <li class="mov">
        <div class="mov-head">
          <span class="mov-date">${U.formatDateTime(m.date)}</span>
          <span class="mov-meta">${icon('user')}<span>${esc(m.responsible)}</span></span>
        </div>
        <ul class="mov-lines">${m.details.map(detailLine).join('')}</ul>
        ${m.notes ? `<p class="mov-notes">${icon('note')}<span>${esc(m.notes)}</span></p>` : ''}
      </li>`;
  }

  function contractItem(contract, open) {
    const active = contract.status === 'activo';
    /* Activo: antigüedad en vivo. Cancelado: tiempo que estuvo vigente. */
    const age = active ? ui.since(contract.createdAt) : `<span>${esc(U.formatDuration(contract.createdAt, contract.cancelledAt))}</span>`;
    const movements = contract.movements.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    const bodyId = 'contract-' + esc(contract.id);
    return `
      <li class="contract${open ? ' is-open' : ''}${active ? ' is-active' : ''}">
        <button class="contract-head" type="button" aria-expanded="${open}" aria-controls="${bodyId}">
          <span class="contract-code">${esc(contract.code)}</span>
          <span class="contract-age">${icon('clock')}${age}</span>
          ${ui.tag(active ? 'Activo' : 'Cancelado', active ? 'dark' : 'muted')}
          ${icon('chevronDown', 'accordion-chevron')}
        </button>
        <div class="contract-body" id="${bodyId}">
          <p class="contract-dates">
            Inicio ${U.formatDateTime(contract.createdAt)}${active ? '' : ' · Cancelado ' + U.formatDateTime(contract.cancelledAt)}
          </p>
          ${movements.length ? `<ol class="mov-list">${movements.map(movementItem).join('')}</ol>` : ui.emptyState('history', 'Sin movimientos', '')}
        </div>
      </li>`;
  }

  function contractsSection(client) {
    const contracts = client.contracts.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (!contracts.length) {
      return `
        <section class="block">
          ${ui.sectionHead('Contratos')}
          ${ui.emptyState('file', 'Sin contratos', 'Se creará un contrato automáticamente al registrar la primera deuda.')}
        </section>`;
    }
    /* Abierto por defecto: el contrato activo o, si no hay, el más reciente. */
    const openId = (D.getActiveContract(client) || contracts[0]).id;
    return `
      <section class="block">
        ${ui.sectionHead('Contratos', ui.countPill(contracts.length))}
        <ul class="contract-list">${contracts.map((c) => contractItem(c, c.id === openId)).join('')}</ul>
      </section>`;
  }

  /* ---------- Datos del cliente (modal) ---------- */

  function clientDataHtml(client) {
    const rows = [
      ['idcard', 'Documento', docLabel(client) || 'Sin documento'],
      ['phone', 'Teléfono', client.phone || 'Sin teléfono'],
      ['pin', 'Dirección', client.address || 'Sin dirección'],
      ['clock', 'Cliente desde', U.formatDate(client.createdAt)],
      ['power', 'Estado', client.status === 'activo' ? 'Activo' : 'Inactivo']
    ];
    return `
      <ul class="info-list">
        ${rows.map(([ic, label, value]) => `
          <li><span class="info-ico">${icon(ic)}</span><span class="info-label">${label}</span><span class="info-value">${esc(value)}</span></li>`).join('')}
      </ul>`;
  }

  function render(params) {
    const client = D.getClient(params.id);
    if (!client) return null;
    const inactive = client.status !== 'activo';
    return ui.layout({
      title: 'DETALLE',
      back: '#/clientes',
      nav: 'clientes',
      narrow: true,
      menuHeading: 'Cliente',
      menuItems: [
        { action: 'client-data', icon: 'idcard', label: 'Ver datos' },
        { href: '#/clientes/' + esc(client.id) + '/editar', icon: 'pencil', label: 'Editar' },
        { action: 'client-status', icon: 'power', label: inactive ? 'Reactivar' : 'Desactivar' }
      ],
      body: summaryCard(client) + contractsSection(client)
    });
  }

  function mount(root, params) {
    /* Se escucha en el encabezado (menú kebab) y en el contenido; ambos se recrean en cada render. */
    const onClick = (e) => {
      const head = e.target.closest('.contract-head');
      if (head) {
        const item = head.parentElement;
        const open = !item.classList.contains('is-open');
        item.classList.toggle('is-open', open);
        head.setAttribute('aria-expanded', String(open));
        return;
      }

      const client = D.getClient(params.id);

      if (e.target.closest('[data-action="client-data"]')) {
        ui.modal({ title: client.name, body: clientDataHtml(client), icon: 'idcard', alertOnly: true, confirmText: 'Cerrar' });
        return;
      }

      if (e.target.closest('[data-action="client-status"]')) {
        const deactivate = client.status === 'activo';
        ui.confirm({
          title: deactivate ? '¿Desactivar cliente?' : '¿Reactivar cliente?',
          message: deactivate
            ? 'El cliente no se elimina: se conservan sus contratos y movimientos, pero no podrá registrar nuevas operaciones.'
            : 'El cliente podrá volver a registrar movimientos.',
          confirmText: deactivate ? 'Desactivar' : 'Reactivar',
          icon: 'power'
        }).then((ok) => {
          if (!ok) return;
          const result = D.setClientStatus(params.id, deactivate ? 'inactivo' : 'activo');
          if (!result.ok) { ui.alert({ title: 'No se pudo desactivar', message: result.message }); return; }
          ui.toast(deactivate ? 'Cliente desactivado' : 'Cliente reactivado');
          App.router.render();
        });
      }
    };
    root.querySelector('.topbar').addEventListener('click', onClick);
    root.querySelector('#content').addEventListener('click', onClick);
  }

  App.views.detail = { title: 'Detalle', render, mount };
})(window.App);
