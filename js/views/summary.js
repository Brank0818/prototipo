/* Panel de resumen: totales, balones pendientes, semana y mayores deudas. */
(function (App) {
  'use strict';

  const U = App.utils;
  const D = App.domain;
  const ui = App.ui;
  const icon = App.icon;
  const esc = U.escapeHtml;
  App.views = App.views || {};

  function weekChart(days) {
    /* Cada punto se centra en su columna, igual que las etiquetas de los días. */
    const W = 320, H = 120, top = 14, bottom = 98;
    const left = W / (days.length * 2), right = W - left;
    const max = Math.max(1, ...days.map((d) => Math.max(d.debt, d.paid)));
    const x = (i) => left + (i * W) / days.length;
    const y = (v) => bottom - (v / max) * (bottom - top);
    const line = (key) => days.map((d, i) => x(i).toFixed(1) + ',' + y(d[key]).toFixed(1)).join(' ');
    const totalDebt = days.reduce((s, d) => s + d.debt, 0);
    const totalPaid = days.reduce((s, d) => s + d.paid, 0);
    return `
      <div class="chart-card">
        <div class="chart-head">
          <span class="chart-title">Semana ${icon('chevronDown')}</span>
          <span class="legend"><i class="legend-solid"></i>Deuda</span>
          <span class="legend"><i class="legend-dotted"></i>Pagos</span>
        </div>
        <svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img"
          aria-label="Últimos 7 días: deuda registrada ${U.formatMoney(totalDebt)}, pagos ${U.formatMoney(totalPaid)}">
          <line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" class="chart-base"/>
          <polyline points="${line('paid')}" class="chart-line dotted"/>
          <polyline points="${line('debt')}" class="chart-line"/>
          ${days.map((d, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(d.debt).toFixed(1)}" r="2.6" class="chart-dot"><title>${d.label}: ${U.formatMoney(d.debt)} deuda · ${U.formatMoney(d.paid)} pagos</title></circle>`).join('')}
        </svg>
        <div class="chart-days">${days.map((d) => `<span>${d.label}</span>`).join('')}</div>
        <div class="chart-totals">
          <div><span>Deuda registrada</span><b>${U.formatMoney(totalDebt)}</b></div>
          <div><span>Pagos recibidos</span><b>${U.formatMoney(totalPaid)}</b></div>
        </div>
      </div>`;
  }

  function segBar(value, max) {
    const SEGMENTS = 6;
    const on = value > 0 ? Math.max(1, Math.round((value / max) * SEGMENTS)) : 0;
    let html = '';
    for (let i = 0; i < SEGMENTS; i++) html += `<span class="seg${i < on ? ' on' : ''}"></span>`;
    return `<span class="seg-bar" aria-hidden="true">${html}</span>`;
  }

  function render() {
    const s = D.summary();
    const top = s.ranking.filter((r) => r.balance.money > 0).slice(0, 5);
    const maxMoney = top.length ? top[0].balance.money : 1;

    const body = `
      <p class="date-line">${U.longDate(new Date())}</p>
      <div class="summary-layout">
        <section class="card">
          ${ui.sectionHead('Estadísticas')}
          <div class="kpi-grid">
            <div class="money-card">
              <span class="money-label">${icon('cash')}Deuda total de dinero</span>
              <span class="money-value">${U.formatMoney(s.totals.money)}</span>
            </div>
            <div class="kpi"><b>${s.debtors}</b><span>Clientes con deuda</span></div>
            <div class="kpi"><b>${s.activeContracts}</b><span>Contratos activos</span></div>
            <div class="kpi"><b>${s.activeClients}</b><span>Clientes activos</span></div>
          </div>
          <h3 class="sub-head">Balones pendientes</h3>
          <div class="ring-grid">
            ${D.CYLINDERS.map((c) => {
              const share = s.debtors ? Math.round((s.owingByCylinder[c.id] / s.debtors) * 100) : 0;
              return `
                <div class="ring-stat">
                  <span class="cyl-stat-label">${c.label}</span>
                  <span class="ring big" style="--fill:${share}%"><b>${s.totals.cyl[c.id]}</b></span>
                  <span class="ring-caption">${U.plural(s.owingByCylinder[c.id], 'cliente', 'clientes')}</span>
                </div>`;
            }).join('')}
          </div>
        </section>

        <section class="card">
          ${ui.sectionHead('Movimientos de dinero')}
          ${weekChart(s.days)}
        </section>

        <section class="card">
          ${ui.sectionHead('Mayores deudas')}
          ${top.length ? `
            <ul class="rank-list">
              ${top.map((r) => `
                <li>
                  <a class="rank-row" href="#/clientes/${esc(r.client.id)}">
                    <span class="rank-name">${esc(r.client.name)}</span>
                    ${segBar(r.balance.money, maxMoney)}
                    <b class="rank-value">${U.formatMoney(r.balance.money)}</b>
                  </a>
                </li>`).join('')}
            </ul>` : ui.emptyState('check', 'Sin deudas de dinero', '')}
        </section>
      </div>`;
    return ui.layout({ title: 'RESUMEN', nav: 'resumen', body });
  }

  App.views.summary = { title: 'Resumen', render };
})(window.App);
