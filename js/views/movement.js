/* Registro de movimientos: varios conceptos (dinero y balones) en una sola operación. */
(function (App) {
  'use strict';

  const U = App.utils;
  const D = App.domain;
  const ui = App.ui;
  const icon = App.icon;
  const esc = U.escapeHtml;
  App.views = App.views || {};

  let rows = [];
  let keySeq = 0;

  function newRow(concept) {
    keySeq += 1;
    return { key: 'r' + keySeq, concept, amount: '', cylinder: '', quantity: '1' };
  }

  function conceptTile(row, concept) {
    const on = row.concept === concept.id;
    return `
      <button type="button" class="tile${on ? ' is-selected' : ''}" role="radio" aria-checked="${on}" data-concept="${concept.id}">
        <span class="tile-ico">${icon(concept.icon)}<i>${concept.sign > 0 ? '+' : '−'}</i></span>
        <span class="tile-label">${concept.label}</span>
      </button>`;
  }

  function fields(row) {
    const concept = D.CONCEPTS[row.concept];
    if (!concept) return '';
    if (concept.kind === 'money') {
      return `
        <label class="field" data-err="amount">
          <span class="field-label">Importe</span>
          <span class="input-wrap prefix"><span class="prefix-text">S/</span>
            <input class="input has-prefix" data-input="amount" inputmode="decimal" autocomplete="off" placeholder="0.00" value="${esc(row.amount)}">
          </span>
          ${ui.fieldError('')}
        </label>`;
    }
    return `
      <div class="field-pair">
        <div class="field" data-err="cylinder">
          <span class="field-label">Tipo de balón</span>
          <div class="cyl-select" role="radiogroup" aria-label="Tipo de balón">
            ${D.CYLINDERS.map((c) => `
              <button type="button" class="day-chip${row.cylinder === c.id ? ' is-selected' : ''}" role="radio" aria-checked="${row.cylinder === c.id}" data-cyl="${c.id}">
                <span>Balón</span><b>${c.id}<small>kg</small></b>
              </button>`).join('')}
          </div>
          ${ui.fieldError('')}
        </div>
        <div class="field" data-err="quantity">
          <span class="field-label">Cantidad</span>
          <div class="stepper">
            <button type="button" class="step-btn" data-step="-1" aria-label="Restar uno">${icon('minus')}</button>
            <input class="step-input" data-input="quantity" inputmode="numeric" autocomplete="off" value="${esc(row.quantity)}" aria-label="Cantidad de balones">
            <button type="button" class="step-btn" data-step="1" aria-label="Sumar uno">${icon('plus')}</button>
          </div>
          ${ui.fieldError('')}
        </div>
      </div>`;
  }

  function rowCard(row, i) {
    return `
      <div class="detail-card" data-key="${row.key}">
        <div class="detail-head">
          <span class="detail-num">${U.pad(i + 1)}</span>
          <span class="detail-title">Concepto</span>
          ${rows.length > 1 ? `<button type="button" class="icon-btn small" data-remove aria-label="Eliminar concepto ${i + 1}">${icon('trash')}</button>` : ''}
        </div>
        <div class="concept-grid" role="radiogroup" aria-label="Concepto ${i + 1}">
          ${D.CONCEPT_LIST.map((c) => conceptTile(row, c)).join('')}
        </div>
        <div class="detail-fields">${fields(row)}</div>
      </div>`;
  }

  function banner(client) {
    const active = D.getActiveContract(client);
    let sub = 'Sin contrato activo · se creará uno al registrar una deuda';
    if (active) sub = 'Contrato ' + active.code + ' · desde ' + U.formatDate(active.createdAt);
    if (client.status !== 'activo') sub = 'Cliente desactivado';
    return `
      <section class="client-banner">
        <span class="deco-ring light" aria-hidden="true"></span>
        <div class="banner-text">
          <h2 class="banner-name">${esc(client.name)}</h2>
          <p class="banner-sub">${esc(sub)}</p>
        </div>
        <a class="btn btn-ghost-light" href="#/clientes/${esc(client.id)}">${icon('history')}<span>Historial</span></a>
      </section>`;
  }

  function render(params) {
    const client = D.getClient(params.id);
    if (!client) return null;

    let body;
    if (client.status !== 'activo') {
      body = banner(client) + ui.emptyState('power', 'Cliente desactivado',
        'No se pueden registrar movimientos para clientes desactivados. Puedes reactivarlo desde su detalle.',
        `<a class="btn btn-primary" href="#/clientes/${esc(client.id)}">Ver detalle</a>`);
    } else {
      body = `
        ${banner(client)}
        <form id="movement-form" novalidate>
          ${ui.sectionHead('Nuevo movimiento')}
          <div id="detail-list" class="detail-list"></div>
          <button type="button" class="btn btn-dashed" data-add>${icon('plus')}<span>Agregar concepto</span></button>

          <label class="field notes-field">
            <span class="field-label">Observaciones <em>Opcional</em></span>
            <textarea class="input textarea" name="notes" rows="3" maxlength="300"></textarea>
          </label>

          <div class="form-alert" role="alert" hidden>${icon('alert')}<span></span></div>

          <div class="form-actions">
            <a class="btn btn-secondary" href="#/clientes">Cancelar</a>
            <button class="btn btn-primary" type="submit">${icon('check')}<span>Guardar movimiento</span></button>
          </div>
        </form>`;
    }

    return ui.layout({ title: 'MOVIMIENTO', back: '#/clientes', body, narrow: true });
  }

  function mount(root, params) {
    const form = root.querySelector('#movement-form');
    if (!form) return;
    const list = form.querySelector('#detail-list');
    const alertBox = form.querySelector('.form-alert');
    rows = [newRow('deuda_dinero')];

    const draw = () => { list.innerHTML = rows.map(rowCard).join(''); };
    const findRow = (el) => {
      const card = el.closest('.detail-card');
      return card ? rows.find((r) => r.key === card.dataset.key) : null;
    };
    const hideAlert = () => { alertBox.hidden = true; };
    const showAlert = (message) => {
      alertBox.hidden = false;
      alertBox.querySelector('span').textContent = message;
    };

    function showRowErrors(rowErrors) {
      list.querySelectorAll('.detail-card').forEach((card, i) => {
        const errs = (rowErrors && rowErrors[i]) || {};
        card.querySelectorAll('[data-err]').forEach((wrap) => {
          const msg = errs[wrap.dataset.err];
          const err = wrap.querySelector('.field-error');
          err.hidden = !msg;
          err.querySelector('span').textContent = msg || '';
          wrap.classList.toggle('has-error', !!msg);
        });
      });
    }

    draw();

    list.addEventListener('click', (e) => {
      const row = findRow(e.target);
      if (!row) return;
      hideAlert();
      const conceptBtn = e.target.closest('[data-concept]');
      if (conceptBtn) { row.concept = conceptBtn.dataset.concept; draw(); return; }
      const cylBtn = e.target.closest('[data-cyl]');
      if (cylBtn) { row.cylinder = cylBtn.dataset.cyl; draw(); return; }
      const stepBtn = e.target.closest('[data-step]');
      if (stepBtn) {
        const current = parseInt(row.quantity, 10) || 0;
        row.quantity = String(Math.max(1, Math.min(999, current + Number(stepBtn.dataset.step))));
        stepBtn.parentElement.querySelector('input').value = row.quantity;
        return;
      }
      if (e.target.closest('[data-remove]')) {
        rows = rows.filter((r) => r !== row);
        draw();
      }
    });

    list.addEventListener('input', (e) => {
      const row = findRow(e.target);
      const key = e.target.dataset.input;
      if (!row || !key) return;
      row[key] = e.target.value;
      const wrap = e.target.closest('[data-err]');
      if (wrap) { wrap.classList.remove('has-error'); wrap.querySelector('.field-error').hidden = true; }
      hideAlert();
    });

    form.querySelector('[data-add]').addEventListener('click', () => {
      rows.push(newRow('deuda_balon'));
      draw();
      hideAlert();
      const last = list.lastElementChild;
      if (last) last.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = { rows: rows.map((r) => ({ concept: r.concept, amount: r.amount, cylinder: r.cylinder, quantity: r.quantity })), notes: form.notes.value };
      const check = D.checkMovement(params.id, input);
      showRowErrors(check.rowErrors);
      if (!check.ok) {
        showAlert(check.message);
        const target = list.querySelector('.has-error') || alertBox;
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
      }
      hideAlert();
      ui.confirm({
        title: '¿Registrar movimiento?',
        message: (check.willCreateContract
          ? 'Se creará un nuevo contrato de deuda para ' + check.client.name + '.'
          : 'Se registrará en el contrato ' + check.active.code + ' de ' + check.client.name + '.') +
          (check.willClose ? ' Todos los saldos quedarán en cero y el contrato se cancelará automáticamente.' : ''),
        confirmText: 'Confirmar',
        icon: 'note'
      }).then((ok) => {
        if (!ok) return;
        const result = D.registerMovement(params.id, input);
        if (!result.ok) { showAlert(result.message); return; }
        let message = 'Movimiento registrado';
        if (result.closed) message += ' · contrato ' + result.contract.code + ' cancelado';
        else if (result.created) message += ' · nuevo contrato ' + result.contract.code;
        ui.toast(message);
        location.hash = '#/clientes';
      });
    });
  }

  App.views.movement = { title: 'Movimiento', render, mount };
})(window.App);
