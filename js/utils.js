/* Utilidades generales: formato, fechas, texto. Sin dependencias. */
window.App = window.App || {};

(function (App) {
  'use strict';

  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const DAYS_SHORT = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ESC[c]);
  }

  function pad(n, len) {
    return String(n).padStart(len || 2, '0');
  }

  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  /* Texto sin tildes y en minúsculas, para búsquedas. */
  function normalize(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  function plural(n, one, many) {
    return n + ' ' + (n === 1 ? one : many);
  }

  /* ---------- Dinero (se trabaja en céntimos para evitar errores de coma flotante) ---------- */
  const moneyFormat = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function formatMoney(cents) {
    const sign = cents < 0 ? '− ' : '';
    return sign + 'S/ ' + moneyFormat.format(Math.abs(cents) / 100);
  }

  /* Convierte "50", "50.5" o "50,50" en céntimos. Devuelve NaN si no es válido. */
  function parseMoney(input) {
    const s = String(input == null ? '' : input).trim().replace(',', '.');
    if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
    return Math.round(parseFloat(s) * 100);
  }

  /* ---------- Fechas ---------- */
  function formatDate(iso) {
    const d = new Date(iso);
    return d.getDate() + ' ' + MONTHS_SHORT[d.getMonth()] + ' ' + d.getFullYear();
  }

  function formatTime(iso) {
    const d = new Date(iso);
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function formatDateTime(iso) {
    return formatDate(iso) + ' · ' + formatTime(iso);
  }

  function longDate(date) {
    const d = date || new Date();
    return capitalize(DAYS[d.getDay()]) + ', ' + d.getDate() + ' de ' + MONTHS[d.getMonth()];
  }

  function dayKey(date) {
    const d = new Date(date);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  /* Diferencia de calendario (años, meses, días) entre dos fechas. */
  function calendarDiff(from, to) {
    let years = to.getFullYear() - from.getFullYear();
    let months = to.getMonth() - from.getMonth();
    let days = to.getDate() - from.getDate();
    const fromTime = from.getHours() * 3600 + from.getMinutes() * 60 + from.getSeconds();
    const toTime = to.getHours() * 3600 + to.getMinutes() * 60 + to.getSeconds();
    if (toTime < fromTime) days -= 1;
    if (days < 0) {
      months -= 1;
      days += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return { years, months, days };
  }

  function joinParts(a, b) {
    return b ? a + ' y ' + b : a;
  }

  /* Antigüedad legible: "3 días", "2 semanas", "1 mes y 5 días", "1 año y 2 meses". */
  function formatAge(iso, now) {
    const from = new Date(iso);
    const to = now || new Date();
    const ms = Math.max(0, to - from);
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return 'Recién iniciado';
    if (minutes < 60) return plural(minutes, 'minuto', 'minutos');
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return plural(hours, 'hora', 'horas');

    const { years, months, days } = calendarDiff(from, to);
    if (years > 0) return joinParts(plural(years, 'año', 'años'), months ? plural(months, 'mes', 'meses') : '');
    if (months > 0) return joinParts(plural(months, 'mes', 'meses'), days ? plural(days, 'día', 'días') : '');
    const totalDays = Math.max(1, days);
    if (totalDays >= 7) {
      const weeks = Math.floor(totalDays / 7);
      const rest = totalDays % 7;
      return joinParts(plural(weeks, 'semana', 'semanas'), rest ? plural(rest, 'día', 'días') : '');
    }
    return plural(totalDays, 'día', 'días');
  }

  /* Duración entre dos fechas (para contratos cancelados). */
  function formatDuration(fromIso, toIso) {
    const text = formatAge(fromIso, new Date(toIso));
    return text === 'Recién iniciado' ? 'Menos de 1 minuto' : text;
  }

  App.utils = {
    MONTHS, MONTHS_SHORT, DAYS, DAYS_SHORT,
    escapeHtml, pad, capitalize, normalize, plural,
    formatMoney, parseMoney,
    formatDate, formatTime, formatDateTime, longDate, dayKey,
    formatAge, formatDuration
  };
})(window.App);
