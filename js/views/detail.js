/* Detalle del cliente: situación actual, datos, contratos e historial de movimientos. */
(function (App) {
  'use strict';

  const U = App.utils;
  const D = App.domain;
  const ui = App.ui;
  const icon = App.icon;
  const esc = U.escapeHtml;
  App.views = App.views || {};

  /* Contrato elegido con las fichas mientras la pantalla está abierta. */
  const selected = {};

  function docLabel(client) {
    if (!client.docType || !client.docNumber) return '';
    const type = D.DOC_TYPES.find((t) => t.id === client.docType);
    return (type ? type.label : client.docType) + ' ' + client.docNumber;
  }

  function summaryCard(client) {
    const situation = D.clientSituation(client);
    const b = situation.balance;
    const meta = [docLabel(client), client.phone].filter(Boolean).map(esc).join(' · ');
    return `
      <section class="card summary-card">
        <div class="summary-head">
          <div>
            <h2 class="summary-name">${esc(client.name)}</h2>
            ${meta ? `<p class="summary-meta">${meta}</p>` : ''}
          </div>
          ${client.status === 'activo' ? ui.tag(situation.hasDebt ? 'Con deuda' : 'Sin deuda', situation.hasDebt ? 'dark' : '') : ui.tag('Inactivo', 'muted')}
        </div>
        <div class="balance-grid">
          <div class="money-card${b.money === 0 ? ' is-zero' : ''}">
            <span class="money-label">${icon('cash')}Saldo de dinero</span>
            <span class="money-value">${U.formatMoney(b.money)}</span>
            ${situation.active && situation.hasDebt ? `<span class="money-age">${icon('clock')}${ui.since(situation.active.createdAt)}</span>` : ''}
          </div>
          ${D.CYLINDERS.map((c) => `
            <div class="cyl-stat${b.cyl[c.id] === 0 ? ' is-zero' : ''}">
              <span class="cyl-stat-label">${c.label}</span>
              <span class="ring"><b>${b.cyl[c.id]}</b></span>
            </div>`).join('')}
        </div>
      </section>`;
  }

  function infoCard(client) {
    const rows = [
      ['idcard', 'Documento', docLabel(client) || 'Sin documento'],
      ['phone', 'Teléfono', client.phone || 'Sin teléfono'],
      ['pin', 'Dirección', client.address || 'Sin dirección'],
      ['clock', 'Cliente desde', U.formatDate(client.createdAt)]
    ];
    const inactive = client.status !== 'activo';
    return `
      <section class="card info-card">
        ${ui.sectionHead('Datos del cliente')}
        <ul class="info-list">
          ${rows.map(([ic, label, value]) => `
            <li><span class="info-ico">${icon(ic)}</span><span class="info-label">${label}</span><span class="info-value">${esc(value)}</span></li>`).join('')}
        </ul>
        <div class="action-row">
          ${inactive ? '' : `<a class="btn btn-primary" href="#/clientes/${esc(client.id)}/movimiento">${icon('plus')}<span>Movimiento</span></a>`}
          <a class="btn btn-secondary" href="#/clientes/${esc(client.id)}/editar">${icon('pencil')}<span>Editar</span></a>
          <button class="btn btn-secondary" type="button" data-action="toggle-status">${icon('power')}<span>${inactive ? 'Reactivar' : 'Desactivar'}</span></button>
        </div>
      </section>`;
  }

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
          <span class="mov-id">${esc(m.id)}</span>
        </div>
        <ul class="mov-lines">${m.details.map(detailLine).join('')}</ul>
        ${m.notes ? `<p class="mov-notes">${icon('note')}<span>${esc(m.notes)}</span></p>` : ''}
        <p class="mov-meta">${icon('user')}<span>${esc(m.responsible)}</span></p>
      </li>`;
  }

  function contractSection(client) {
    if (!client.contracts.length) {
      return `
        <section class="card">
          ${ui.sectionHead('Contratos')}
          ${ui.emptyState('file', 'Sin contratos', 'Se creará un contrato automáticamente al registrar la primera deuda.')}
        </section>`;
    }
    const contracts = client.contracts.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    let current = contracts.find((c) => c.id === selected[client.id]);
    if (!current) current = D.getActiveContract(client) || contracts[0];
    selected[client.id] = current.id;

    const balance = D.contractBalance(current);
    const zero = D.isZeroBalance(balance);
    const isActive = current.status === 'activo';
    const movements = current.movements.slice().sort((a, b) => new Date(b.date) - new Date(a.date));

    const facts = [
      ['Inicio', U.formatDateTime(current.createdAt)],
      isActive ? ['Antigüedad', ui.since(current.createdAt)] : ['Duración', esc(U.formatDuration(current.createdAt, current.cancelledAt))],
      isActive ? null : ['Cancelado', U.formatDateTime(current.cancelledAt) + ' · ' + esc(current.cancelledBy)],
      ['Movimientos', String(current.movements.length)],
      ['Creado por', esc(current.createdBy)]
    ].filter(Boolean);

    let cancelBlock = '';
    if (isActive) {
      cancelBlock = zero
        ? `<div class="contract-cancel">
             <p class="hint">${icon('check')}<span>Todos los saldos están en cero. Ya puedes cancelar este contrato.</span></p>
             <button class="btn btn-primary" type="button" data-action="cancel-contract" data-id="${esc(current.id)}">${icon('file')}<span>Cancelar contrato</span></button>
           </div>`
        : `<div class="contract-cancel">
             <p class="hint">${icon('lock')}<span>Para cancelar el contrato, todos los saldos deben estar en cero.</span></p>
             <button class="btn btn-disabled" type="button" disabled aria-disabled="true">${icon('file')}<span>Cancelar contrato</span></button>
           </div>`;
    } else {
      cancelBlock = `<p class="hint">${icon('lock')}<span>Contrato cancelado: no admite nuevos movimientos.</span></p>`;
    }

    return `
      <section class="card">
        ${ui.sectionHead('Contratos', ui.countPill(contracts.length))}
        <div class="contract-chips" role="tablist" aria-label="Contratos del cliente">
          ${contracts.map((c) => `
            <button type="button" class="day-chip wide${c.id === current.id ? ' is-selected' : ''}" role="tab" aria-selected="${c.id === current.id}" data-contract="${esc(c.id)}">
              <span>${c.status === 'activo' ? 'Activo' : 'Cancelado'}</span><b>${esc(c.code)}</b>
            </button>`).join('')}
        </div>

        <div class="contract-card">
          <div class="contract-top">
            <h3>${esc(current.code)}</h3>
            ${ui.tag(isActive ? 'Activo' : 'Cancelado', isActive ? 'dark' : 'muted')}
          </div>
          <dl class="facts">
            ${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
          </dl>
          ${cancelBlock}
        </div>

        <h3 class="sub-head">Historial de movimientos</h3>
        ${movements.length ? `<ol class="mov-list">${movements.map(movementItem).join('')}</ol>` : ui.emptyState('history', 'Sin movimientos', '')}
      </section>`;
  }

  function render(params) {
    const client = D.getClient(params.id);
    if (!client) return null;
    /* Al abrir la pantalla se muestra el contrato activo (o el más reciente). */
    delete selected[client.id];
    const body = `
      <div class="detail-layout">
        <div class="detail-col">
          ${summaryCard(client)}
          ${infoCard(client)}
        </div>
        <div class="detail-col" id="contracts">${contractSection(client)}</div>
      </div>`;
    return ui.layout({ title: 'DETALLE', back: '#/clientes', nav: 'clientes', body });
  }

  function mount(root, params) {
    const rerender = () => App.router.render();

    root.querySelector('#content').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-contract]');
      if (chip) {
        selected[params.id] = chip.dataset.contract;
        root.querySelector('#contracts').innerHTML = contractSection(D.getClient(params.id));
        return;
      }

      const cancelBtn = e.target.closest('[data-action="cancel-contract"]');
      if (cancelBtn) {
        const client = D.getClient(params.id);
        const contract = client.contracts.find((c) => c.id === cancelBtn.dataset.id);
        ui.confirm({
          title: '¿Cancelar contrato?',
          message: 'El contrato ' + contract.code + ' quedará cerrado y se conservará en el historial. Si el cliente vuelve a adquirir una deuda, se creará un contrato nuevo.',
          confirmText: 'Cancelar contrato',
          cancelText: 'Volver',
          icon: 'file'
        }).then((ok) => {
          if (!ok) return;
          const result = D.cancelContract(params.id, contract.id);
          if (!result.ok) { ui.alert({ title: 'No se pudo cancelar', message: result.message }); return; }
          ui.toast('Contrato ' + contract.code + ' cancelado');
          rerender();
        });
        return;
      }

      if (e.target.closest('[data-action="toggle-status"]')) {
        const client = D.getClient(params.id);
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
          rerender();
        });
      }
    });
  }

  App.views.detail = { title: 'Detalle', render, mount };
})(window.App);
