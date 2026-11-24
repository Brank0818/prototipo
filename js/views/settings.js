/* Ajustes: usuario de prueba y gestión de los datos locales. */
(function (App) {
  'use strict';

  const U = App.utils;
  const ui = App.ui;
  const icon = App.icon;
  const esc = U.escapeHtml;
  App.views = App.views || {};

  function render() {
    const user = App.session.user();
    const st = App.store.state;
    const session = App.session.get();
    const movements = st.clients.reduce((n, c) => n + c.contracts.reduce((m, k) => m + k.movements.length, 0), 0);
    const contracts = st.clients.reduce((n, c) => n + c.contracts.length, 0);

    const body = `
      <section class="card user-card">
        <span class="deco-ring" aria-hidden="true"></span>
        <span class="avatar big">${icon('user')}</span>
        <div>
          <h2 class="summary-name">${esc(user.name)}</h2>
          <p class="summary-meta">@${esc(user.username)}</p>
          ${ui.tag(user.role, 'dark')}
        </div>
        ${session && session.since ? `<p class="user-since">${icon('clock')}<span>Sesión iniciada el ${U.formatDateTime(session.since)}</span></p>` : ''}
      </section>

      <section class="card">
        ${ui.sectionHead('Datos de prueba')}
        <p class="muted-note">Este prototipo no usa servidor ni base de datos: toda la información se guarda en LocalStorage, solo en este navegador.</p>
        <ul class="stat-rows">
          <li><span>Clientes</span><b>${st.clients.length}</b></li>
          <li><span>Contratos</span><b>${contracts}</b></li>
          <li><span>Movimientos</span><b>${movements}</b></li>
          <li><span>Registros de auditoría</span><b>${st.audit.length}</b></li>
        </ul>
        <div class="stack">
          <button class="btn btn-secondary btn-block" type="button" data-action="reset">${icon('refresh')}<span>Restablecer datos de demostración</span></button>
          <button class="btn btn-secondary btn-block" type="button" data-action="clear">${icon('trash')}<span>Empezar sin datos</span></button>
        </div>
      </section>

      <section class="card">
        ${ui.sectionHead('Sesión')}
        <button class="btn btn-primary btn-block" type="button" data-action="logout">${icon('logout')}<span>Cerrar sesión</span></button>
        <p class="app-version">GLP Control · prototipo v1.0 · HTML, CSS y JavaScript</p>
      </section>`;
    return ui.layout({ title: 'AJUSTES', nav: 'ajustes', body, narrow: true });
  }

  function mount(root) {
    root.querySelector('#content').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="reset"], [data-action="clear"]');
      if (!btn) return;
      const reset = btn.dataset.action === 'reset';
      ui.confirm({
        title: reset ? '¿Restablecer datos?' : '¿Empezar sin datos?',
        message: reset
          ? 'Se reemplazarán los datos actuales por los clientes y movimientos de demostración.'
          : 'Se eliminarán todos los clientes, contratos, movimientos y registros de auditoría de este navegador.',
        confirmText: reset ? 'Restablecer' : 'Borrar datos',
        icon: reset ? 'refresh' : 'trash'
      }).then((ok) => {
        if (!ok) return;
        if (reset) App.store.reset(); else App.store.clear();
        App.domain.audit({ type: 'sistema', action: reset ? 'Datos restablecidos' : 'Datos borrados', description: 'Acción desde Ajustes' });
        App.store.save();
        ui.toast(reset ? 'Datos de demostración restablecidos' : 'Datos borrados');
        App.router.render();
      });
    });
  }

  App.views.settings = { title: 'Ajustes', render, mount };
})(window.App);
