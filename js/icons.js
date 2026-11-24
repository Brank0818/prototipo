/* Iconos lineales (outline) en SVG, todos con el mismo trazo de 1.8. */
(function (App) {
  'use strict';

  const DOT = 'fill="currentColor" stroke="none"';

  const PATHS = {
    user: '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="10" r="3.2"/><path d="M6.3 18.3c1.3-2.1 3.3-3.2 5.7-3.2s4.4 1.1 5.7 3.2"/>',
    kebab: `<circle cx="12" cy="5.5" r="1.8" ${DOT}/><circle cx="12" cy="12" r="1.8" ${DOT}/><circle cx="12" cy="18.5" r="1.8" ${DOT}/>`,
    back: '<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>',
    arrowRight: '<path d="M4 12h16"/><path d="M14 6l6 6-6 6"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    close: '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
    check: '<path d="M4.5 12.5l4.8 4.8L19.5 7"/>',
    chevronDown: '<path d="M6 9l6 6 6-6"/>',
    chevronRight: '<path d="M9 6l6 6-6 6"/>',
    users: '<circle cx="9" cy="8" r="3.4"/><path d="M2.8 19.5c.8-3.2 3.3-5 6.2-5s5.4 1.8 6.2 5"/><path d="M15.6 4.8a3.4 3.4 0 010 6.4"/><path d="M18 14.6c1.7.7 2.8 2.3 3.2 4.9"/>',
    chart: '<path d="M4 20h16"/><path d="M7 16.5v-5"/><path d="M12 16.5V6"/><path d="M17 16.5v-8"/>',
    audit: '<rect x="5" y="4.5" width="14" height="16.5" rx="2.5"/><path d="M9 3h6v3H9z"/><path d="M8.8 11h6.4"/><path d="M8.8 14.5h6.4"/><path d="M8.8 18h3.6"/>',
    sliders: '<path d="M6 4v5"/><path d="M6 13v7"/><path d="M12 4v11"/><path d="M12 19v1"/><path d="M18 4v2"/><path d="M18 10v10"/><path d="M4 11h4"/><path d="M10 17h4"/><path d="M16 8h4"/>',
    pencil: '<path d="M4 20h4.2L19 9.2 14.8 5 4 15.8z"/><path d="M12.8 7l4.2 4.2"/>',
    cylinder: '<path d="M9 5.5V3.8c0-.7.5-1.3 1.2-1.3h3.6c.7 0 1.2.6 1.2 1.3v1.7"/><rect x="5.5" y="5.5" width="13" height="15.5" rx="5"/><path d="M5.5 11h13"/><path d="M5.5 15.5h13"/>',
    cash: '<rect x="2.5" y="6" width="19" height="12" rx="3"/><circle cx="12" cy="12" r="2.7"/><path d="M6 9.5v.01"/><path d="M18 14.5v.01"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    trash: '<path d="M4.5 7h15"/><path d="M10 3.8h4"/><path d="M6.8 7l.9 12.2c.1.8.7 1.3 1.5 1.3h5.6c.8 0 1.4-.5 1.5-1.3L17.2 7"/><path d="M10.2 11v5.5"/><path d="M13.8 11v5.5"/>',
    logout: '<path d="M10 4H7a2.5 2.5 0 00-2.5 2.5v11A2.5 2.5 0 007 20h3"/><path d="M15 8l4 4-4 4"/><path d="M19 12H9.5"/>',
    power: '<path d="M12 3.5v7.5"/><path d="M7.2 6.6a7.5 7.5 0 109.6 0"/>',
    history: '<path d="M3.8 12a8.2 8.2 0 102.4-5.8"/><path d="M3.5 3.8v4h4"/><path d="M12 8v4l2.8 1.8"/>',
    file: '<path d="M7 2.8h7l5 5v11.7c0 .9-.7 1.6-1.6 1.6H7c-.9 0-1.6-.7-1.6-1.6V4.4c0-.9.7-1.6 1.6-1.6z"/><path d="M14 2.8v5h5"/><path d="M9 13h6"/><path d="M9 16.5h4"/>',
    alert: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.6v5.2"/><path d="M12 16.2v.01"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5"/><path d="M12 7.8v.01"/>',
    refresh: '<path d="M4.5 12a7.5 7.5 0 0113-5.1L19.5 9"/><path d="M19.5 4.5V9H15"/><path d="M19.5 12a7.5 7.5 0 01-13 5.1L4.5 15"/><path d="M4.5 19.5V15H9"/>',
    phone: '<path d="M5.5 3.5h3l1.7 4.4-2.1 1.4a10.5 10.5 0 006.6 6.6l1.4-2.1 4.4 1.7v3c0 1-.8 1.8-1.8 1.8A15.9 15.9 0 013.7 5.3c0-1 .8-1.8 1.8-1.8z"/>',
    pin: '<path d="M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 0113 0c0 5.2-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    idcard: '<rect x="2.8" y="5" width="18.4" height="14" rx="2.6"/><circle cx="8.8" cy="11" r="2"/><path d="M5.8 16c.6-1.3 1.6-2 3-2s2.4.7 3 2"/><path d="M14.5 10h3.6"/><path d="M14.5 13.5h3.6"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.6"/><path d="M8 10.5V8a4 4 0 018 0v2.5"/>',
    note: '<path d="M5 4.5h14v10l-5 5H5z"/><path d="M14 19.5v-5h5"/><path d="M8.5 9h7"/><path d="M8.5 12.5h4"/>',
    database: '<ellipse cx="12" cy="6" rx="7" ry="2.8"/><path d="M5 6v12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6"/><path d="M5 12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8"/>',
    login: '<path d="M14 4h3a2.5 2.5 0 012.5 2.5v11A2.5 2.5 0 0117 20h-3"/><path d="M9 8l4 4-4 4"/><path d="M13 12H3.5"/>'
  };

  function icon(name, extraClass) {
    return '<svg class="ico' + (extraClass ? ' ' + extraClass : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      (PATHS[name] || '') + '</svg>';
  }

  App.icon = icon;
})(window.App);
