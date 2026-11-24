/* Arranque de la aplicación y enrutador por hash (#/ruta). */
(function (App) {
  'use strict';

  const ROUTES = [
    { pattern: /^\/login$/, view: 'login' },
    { pattern: /^\/clientes$/, view: 'clients' },
    { pattern: /^\/clientes\/nuevo$/, view: 'clientForm' },
    { pattern: /^\/clientes\/([^/]+)\/editar$/, view: 'clientForm', keys: ['id'] },
    { pattern: /^\/clientes\/([^/]+)\/movimiento$/, view: 'movement', keys: ['id'] },
    { pattern: /^\/clientes\/([^/]+)$/, view: 'detail', keys: ['id'] },
    { pattern: /^\/resumen$/, view: 'summary' },
    { pattern: /^\/auditoria$/, view: 'audit' },
    { pattern: /^\/ajustes$/, view: 'settings' }
  ];

  const root = document.getElementById('app');

  function match(path) {
    for (const route of ROUTES) {
      const m = path.match(route.pattern);
      if (!m) continue;
      const params = {};
      (route.keys || []).forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
      return { view: App.views[route.view], params };
    }
    return null;
  }

  function notFound() {
    return App.ui.layout({
      title: 'NO ENCONTRADO',
      back: '#/clientes',
      nav: 'clientes',
      body: App.ui.emptyState('alert', 'Página no encontrada', 'El cliente o la página que buscas no existe.',
        '<a class="btn btn-primary" href="#/clientes">Ir a clientes</a>')
    });
  }

  function render() {
    const path = location.hash.replace(/^#/, '') || '/clientes';
    const found = match(path);
    const user = App.session.user();

    if (!found) { location.replace('#/clientes'); return; }
    if (!found.view.public && !user) { location.replace('#/login'); return; }
    if (found.view.public && user) { location.replace('#/clientes'); return; }

    App.ui.closeModal(false);
    App.ui.closeMenus();

    const html = found.view.render(found.params);
    root.classList.toggle('is-chromeless', !!found.view.chromeless);
    root.innerHTML = html == null ? notFound() : html;
    if (html != null && found.view.mount) found.view.mount(root, found.params);

    document.title = found.view.title + ' · GLP Control';
    const content = root.querySelector('.content');
    if (content) content.scrollTop = 0;
  }

  /* Actualiza cada 30 s los textos de antigüedad visibles. */
  function tick() {
    document.querySelectorAll('[data-since]').forEach((el) => {
      el.textContent = (el.dataset.prefix || '') + App.utils.formatAge(el.dataset.since);
    });
  }

  function start() {
    App.store.init();
    App.ui.initGlobalHandlers();
    window.addEventListener('hashchange', render);
    /* Si los datos cambian en otra pestaña, se recargan. */
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.indexOf('glp-control:') === 0) { App.store.init(); render(); }
    });
    setInterval(tick, 30000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
    render();
  }

  App.router = { render };
  start();
})(window.App);
