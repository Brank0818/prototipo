/* Formulario para registrar y editar clientes. */
(function (App) {
  'use strict';

  const D = App.domain;
  const ui = App.ui;
  const icon = App.icon;
  const esc = App.utils.escapeHtml;
  App.views = App.views || {};

  function field(name, label, inputHtml, optional) {
    return `
      <label class="field" data-field="${name}">
        <span class="field-label">${label}${optional ? ' <em>Opcional</em>' : ''}</span>
        ${inputHtml}
        ${ui.fieldError('')}
      </label>`;
  }

  function render(params) {
    const client = params.id ? D.getClient(params.id) : null;
    if (params.id && !client) return null;
    const c = client || { name: '', docType: '', docNumber: '', phone: '', address: '' };
    const docType = D.DOC_TYPES.find((t) => t.id === c.docType);

    const body = `
      <form class="card form-card" id="client-form" novalidate>
        <div class="form-intro">
          <span class="deco-ring" aria-hidden="true"></span>
          <h2 class="form-title">${client ? 'Editar datos' : 'Datos del cliente'}</h2>
          <p class="form-sub">${client ? esc(client.id) + ' · registrado el ' + App.utils.formatDate(client.createdAt) : 'Solo el nombre es obligatorio.'}</p>
        </div>

        ${field('name', 'Nombre', `<input class="input" name="name" value="${esc(c.name)}" maxlength="80" autocomplete="off" placeholder="Nombre o razón social">`)}

        <div class="field" data-field="docType">
          <span class="field-label">Tipo de documento <em>Opcional</em></span>
          <div class="chips chips-doc" role="radiogroup" aria-label="Tipo de documento">
            ${D.DOC_TYPES.map((t) => `<button type="button" class="chip${t.id === c.docType ? ' is-selected' : ''}" role="radio" aria-checked="${t.id === c.docType}" data-doc="${t.id}">${t.label}</button>`).join('')}
          </div>
          ${ui.fieldError('')}
        </div>

        ${field('docNumber', 'Número de documento',
          `<input class="input" name="docNumber" value="${esc(c.docNumber)}" maxlength="12" autocomplete="off"
            inputmode="${docType ? docType.inputmode : 'text'}" placeholder="${docType ? docType.hint : 'Elige primero el tipo de documento'}"${docType ? '' : ' disabled'}>`, true)}

        <div class="form-row">
          ${field('phone', 'Teléfono', `<span class="input-wrap">${icon('phone')}<input class="input has-icon" name="phone" type="tel" value="${esc(c.phone)}" maxlength="20" inputmode="tel" placeholder="987 654 321"></span>`, true)}
          ${field('address', 'Dirección', `<span class="input-wrap">${icon('pin')}<input class="input has-icon" name="address" value="${esc(c.address)}" maxlength="160" placeholder="Av., Jr., Calle, Mz. Lt."></span>`, true)}
        </div>

        ${ui.fieldError('')}

        <div class="form-actions">
          <a class="btn btn-secondary" href="${client ? '#/clientes/' + esc(client.id) : '#/clientes'}">Cancelar</a>
          <button class="btn btn-primary" type="submit">${icon('check')}<span>${client ? 'Guardar cambios' : 'Registrar cliente'}</span></button>
        </div>
      </form>`;

    return ui.layout({
      title: client ? 'EDITAR CLIENTE' : 'NUEVO CLIENTE',
      back: client ? '#/clientes/' + client.id : '#/clientes',
      body,
      narrow: true
    });
  }

  function mount(root, params) {
    const form = root.querySelector('#client-form');
    let docType = (params.id && D.getClient(params.id).docType) || '';
    const docInput = form.docNumber;

    function setError(name, message) {
      const wrap = form.querySelector(`[data-field="${name}"]`);
      if (!wrap) return;
      const err = wrap.querySelector('.field-error');
      err.hidden = !message;
      err.querySelector('span').textContent = message || '';
      const input = wrap.querySelector('input');
      if (input) input.classList.toggle('is-invalid', !!message);
    }

    form.querySelector('.chips-doc').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-doc]');
      if (!chip) return;
      /* Pulsar de nuevo el tipo seleccionado lo deselecciona (el documento es opcional). */
      docType = chip.dataset.doc === docType ? '' : chip.dataset.doc;
      form.querySelectorAll('[data-doc]').forEach((c) => {
        const on = c.dataset.doc === docType;
        c.classList.toggle('is-selected', on);
        c.setAttribute('aria-checked', String(on));
      });
      const type = D.DOC_TYPES.find((t) => t.id === docType);
      docInput.disabled = !type;
      docInput.placeholder = type ? type.hint : 'Elige primero el tipo de documento';
      docInput.inputMode = type ? type.inputmode : 'text';
      if (!type) docInput.value = '';
      else docInput.focus();
      setError('docType', '');
      setError('docNumber', '');
    });

    form.addEventListener('input', (e) => {
      if (e.target.name) setError(e.target.name, '');
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      ['name', 'docType', 'docNumber', 'phone', 'address'].forEach((n) => setError(n, ''));
      const result = D.saveClient({
        name: form.name.value,
        docType,
        docNumber: docInput.value,
        phone: form.phone.value,
        address: form.address.value
      }, params.id);

      if (!result.ok) {
        Object.keys(result.errors).forEach((k) => setError(k, result.errors[k]));
        const general = form.querySelector(':scope > .field-error');
        general.hidden = !result.errors.general;
        general.querySelector('span').textContent = result.errors.general || '';
        const first = form.querySelector('.is-invalid') || form.querySelector('[data-field] .field-error:not([hidden])');
        if (first) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (first && first.focus) first.focus();
        return;
      }
      ui.toast(params.id ? 'Cliente actualizado' : 'Cliente registrado');
      location.hash = '#/clientes';
    });

    if (!params.id) form.name.focus();
  }

  App.views.clientForm = { title: 'Cliente', render, mount };
})(window.App);
