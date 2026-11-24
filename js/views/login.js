/* Pantalla de inicio de sesión (usuario de prueba predefinido). */
(function (App) {
  'use strict';

  const icon = App.icon;
  const esc = App.utils.escapeHtml;
  App.views = App.views || {};

  /* Ilustración lineal: tres balones de GLP con casillas punteadas y checks, como la referencia. */
  const ILLUSTRATION = `
    <svg class="login-art" viewBox="0 0 320 250" role="img" aria-label="Ilustración de balones de gas">
      <g fill="none" stroke="#1f1f1f" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
        <!-- casillas punteadas con check -->
        <rect x="14" y="40" width="40" height="40" stroke="#9b9b9b" stroke-width="1.6" stroke-dasharray="2 4"/>
        <path d="M22 58l10 12 22-34" stroke-width="4"/>
        <rect x="262" y="22" width="36" height="36" stroke="#9b9b9b" stroke-width="1.6" stroke-dasharray="2 4"/>
        <path d="M269 39l9 10 19-28" stroke-width="4"/>
        <rect x="276" y="150" width="28" height="28" stroke="#9b9b9b" stroke-width="1.6" stroke-dasharray="2 4"/>
        <path d="M281 163l7 8 14-20" stroke-width="3.4"/>

        <!-- balón 45 kg -->
        <g>
          <rect x="146" y="22" width="44" height="30" rx="9" fill="#fff"/>
          <rect x="157" y="30" width="22" height="10" rx="5" fill="#fff"/>
          <rect x="124" y="50" width="88" height="168" rx="34" fill="#fff"/>
          <rect x="124" y="104" width="88" height="16" fill="#1f1f1f"/>
          <path d="M124 160h88" stroke-dasharray="3 6"/>
          <rect x="134" y="216" width="68" height="14" rx="4" fill="#1f1f1f"/>
          <text x="168" y="185" text-anchor="middle" font-family="Nunito Sans, sans-serif" font-weight="800" font-size="20" fill="#1f1f1f" stroke="none">45</text>
        </g>
        <!-- balón 10 kg -->
        <g>
          <rect x="72" y="92" width="30" height="22" rx="7" fill="#fff"/>
          <rect x="58" y="110" width="58" height="108" rx="24" fill="#fff"/>
          <rect x="58" y="140" width="58" height="12" fill="#1f1f1f"/>
          <rect x="65" y="216" width="44" height="12" rx="4" fill="#1f1f1f"/>
          <text x="87" y="192" text-anchor="middle" font-family="Nunito Sans, sans-serif" font-weight="800" font-size="16" fill="#1f1f1f" stroke="none">10</text>
        </g>
        <!-- balón 5 kg -->
        <g>
          <rect x="235" y="134" width="22" height="18" rx="6" fill="#fff"/>
          <rect x="224" y="150" width="44" height="68" rx="18" fill="#fff"/>
          <rect x="224" y="168" width="44" height="10" fill="#1f1f1f"/>
          <rect x="230" y="216" width="32" height="12" rx="4" fill="#1f1f1f"/>
          <text x="246" y="204" text-anchor="middle" font-family="Nunito Sans, sans-serif" font-weight="800" font-size="14" fill="#1f1f1f" stroke="none">5</text>
        </g>
        <path d="M26 232h268" stroke-width="2"/>
      </g>
    </svg>`;

  function render() {
    const user = App.seed.TEST_USER;
    return `
      <div class="login">
        <div class="login-rings" aria-hidden="true"></div>
        <div class="login-inner">
          <p class="pill-title login-pill">GLP CONTROL</p>
          <h1 class="login-hello">¡Hola!</h1>
          <p class="login-sub">Control de deudas de dinero y balones</p>
          ${ILLUSTRATION}
          <form class="login-form" id="login-form" novalidate>
            <label class="field">
              <span class="field-label">Usuario</span>
              <span class="input-wrap">${icon('user')}<input class="input has-icon" name="username" autocomplete="username" value="${esc(user.username)}" required></span>
            </label>
            <label class="field">
              <span class="field-label">Contraseña</span>
              <span class="input-wrap">${icon('lock')}<input class="input has-icon" name="password" type="password" autocomplete="current-password" value="${esc(user.password)}" required></span>
            </label>
            ${App.ui.fieldError('')}
            <div class="login-foot">
              <p class="login-hint">Usuario de prueba<br><b>${esc(user.username)}</b> · <b>${esc(user.password)}</b></p>
              <button class="arrow-btn" type="submit" aria-label="Ingresar">${icon('arrowRight')}</button>
            </div>
          </form>
        </div>
      </div>`;
  }

  function mount(root) {
    const form = root.querySelector('#login-form');
    const error = form.querySelector('.field-error');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const result = App.domain.login(form.username.value, form.password.value);
      if (!result.ok) {
        error.hidden = false;
        error.querySelector('span').textContent = result.message;
        form.password.classList.add('is-invalid');
        return;
      }
      App.ui.toast('Bienvenido, ' + result.user.name.split(' ')[0]);
      location.hash = '#/clientes';
    });
    form.addEventListener('input', () => {
      error.hidden = true;
      form.password.classList.remove('is-invalid');
    });
  }

  App.views.login = { public: true, chromeless: true, title: 'Ingresar', render, mount };
})(window.App);
