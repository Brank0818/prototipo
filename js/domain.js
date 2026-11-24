/*
 * Reglas de negocio.
 *
 * Estructura de datos:
 *   Cliente  { id, name, docType, docNumber, phone, address, status, createdAt, updatedAt, contracts[] }
 *   Contrato { id, code, status: 'activo' | 'cancelado', createdAt, createdBy, cancelledAt, cancelledBy, movements[] }
 *   Movimiento { id, date, responsible, responsibleId, notes, details[] }
 *   Detalle  { concept, amount }                 -> conceptos de dinero (amount en céntimos)
 *            { concept, cylinder, quantity }     -> conceptos de balones
 *
 * Los saldos NUNCA se guardan: se calculan sumando los detalles del historial.
 *   (+) deuda adquirida   (-) pago de dinero o entrega de balones
 */
(function (App) {
  'use strict';

  const U = App.utils;

  const CYLINDERS = [
    { id: '5', label: '5 kg' },
    { id: '10', label: '10 kg' },
    { id: '45', label: '45 kg' }
  ];
  const CYLINDER_IDS = CYLINDERS.map((c) => c.id);

  const CONCEPTS = {
    deuda_dinero: { id: 'deuda_dinero', label: 'Deuda de dinero', kind: 'money', sign: 1, icon: 'cash' },
    pago_dinero: { id: 'pago_dinero', label: 'Pago de dinero', kind: 'money', sign: -1, icon: 'cash' },
    deuda_balon: { id: 'deuda_balon', label: 'Deuda de balones', kind: 'cylinder', sign: 1, icon: 'cylinder' },
    entrega_balon: { id: 'entrega_balon', label: 'Entrega de balones', kind: 'cylinder', sign: -1, icon: 'cylinder' }
  };
  const CONCEPT_LIST = Object.keys(CONCEPTS).map((k) => CONCEPTS[k]);

  const DOC_TYPES = [
    { id: 'DNI', label: 'DNI', pattern: /^\d{8}$/, hint: '8 dígitos', inputmode: 'numeric' },
    { id: 'RUC', label: 'RUC', pattern: /^\d{11}$/, hint: '11 dígitos', inputmode: 'numeric' },
    { id: 'CE', label: 'C.E.', pattern: /^[A-Za-z0-9]{8,12}$/, hint: '8 a 12 caracteres', inputmode: 'text' },
    { id: 'PAS', label: 'Pasaporte', pattern: /^[A-Za-z0-9]{6,12}$/, hint: '6 a 12 caracteres', inputmode: 'text' }
  ];

  function state() { return App.store.state; }
  function currentUser() { return App.session.user(); }
  function nowIso() { return new Date().toISOString(); }

  function nextSeq(st, key) {
    st.seq[key] = (st.seq[key] || 0) + 1;
    return st.seq[key];
  }

  /* ======================= Saldos ======================= */

  function emptyBalance() {
    return { money: 0, cyl: { '5': 0, '10': 0, '45': 0 } };
  }

  function applyDetail(balance, detail) {
    const concept = CONCEPTS[detail.concept];
    if (!concept) return balance;
    if (concept.kind === 'money') balance.money += concept.sign * detail.amount;
    else balance.cyl[detail.cylinder] += concept.sign * detail.quantity;
    return balance;
  }

  function addDetails(balance, details) {
    details.forEach((d) => applyDetail(balance, d));
    return balance;
  }

  function contractBalance(contract) {
    const balance = emptyBalance();
    contract.movements.forEach((m) => addDetails(balance, m.details));
    return balance;
  }

  function cylinderTotal(balance) {
    return CYLINDER_IDS.reduce((sum, id) => sum + balance.cyl[id], 0);
  }

  function isZeroBalance(balance) {
    return balance.money === 0 && CYLINDER_IDS.every((id) => balance.cyl[id] === 0);
  }

  function getActiveContract(client) {
    return client.contracts.find((c) => c.status === 'activo') || null;
  }

  function clientBalance(client) {
    const active = getActiveContract(client);
    return active ? contractBalance(active) : emptyBalance();
  }

  /* Situación resumida de un cliente para listados. */
  function clientSituation(client) {
    const active = getActiveContract(client);
    const balance = active ? contractBalance(active) : emptyBalance();
    const hasDebt = !isZeroBalance(balance);
    return {
      active,
      balance,
      hasDebt,
      pendingClose: !!active && !hasDebt,
      inactive: client.status !== 'activo'
    };
  }

  /* ======================= Consultas ======================= */

  function getClient(id) {
    return state().clients.find((c) => c.id === id) || null;
  }

  function matchesQuery(client, query) {
    const q = U.normalize(query);
    if (!q) return true;
    const digits = q.replace(/\s+/g, '');
    return U.normalize(client.name).includes(q) || (!!client.docNumber && U.normalize(client.docNumber).includes(digits));
  }

  /* Clientes con deuda (más antigua primero) y clientes sin deuda (alfabético, inactivos al final). */
  function groupedClients(query) {
    const withDebt = [];
    const withoutDebt = [];
    state().clients.forEach((client) => {
      if (!matchesQuery(client, query)) return;
      const situation = clientSituation(client);
      (situation.hasDebt ? withDebt : withoutDebt).push({ client, situation });
    });
    withDebt.sort((a, b) => new Date(a.situation.active.createdAt) - new Date(b.situation.active.createdAt));
    withoutDebt.sort((a, b) => (a.situation.inactive - b.situation.inactive) || a.client.name.localeCompare(b.client.name, 'es'));
    return { withDebt, withoutDebt };
  }

  /* ======================= Auditoría ======================= */

  function buildAudit(st, entry) {
    const record = {
      id: 'A-' + U.pad(nextSeq(st, 'audit'), 5),
      date: entry.date || nowIso(),
      type: entry.type,
      action: entry.action,
      description: entry.description || '',
      userName: entry.user ? entry.user.name : 'Sistema',
      username: entry.user ? entry.user.username : '',
      clientId: entry.clientId || null
    };
    st.audit.push(record);
    return record;
  }

  function audit(entry) {
    return buildAudit(state(), Object.assign({ user: currentUser() }, entry));
  }

  /* ======================= Constructores (usados también por los datos de prueba) ======================= */

  function buildClient(st, data, user, date) {
    const client = {
      id: 'C-' + U.pad(nextSeq(st, 'client'), 4),
      name: data.name,
      docType: data.docType || '',
      docNumber: data.docNumber || '',
      phone: data.phone || '',
      address: data.address || '',
      status: 'activo',
      createdAt: date,
      updatedAt: date,
      contracts: []
    };
    st.clients.push(client);
    buildAudit(st, { type: 'cliente', action: 'Cliente registrado', description: client.name, user, date, clientId: client.id });
    return client;
  }

  function buildContract(st, client, user, date) {
    const n = nextSeq(st, 'contract');
    const contract = {
      id: 'K-' + U.pad(n, 4),
      code: 'CT-' + U.pad(n, 4),
      status: 'activo',
      createdAt: date,
      createdBy: user ? user.name : 'Sistema',
      cancelledAt: null,
      cancelledBy: null,
      movements: []
    };
    client.contracts.push(contract);
    buildAudit(st, { type: 'contrato', action: 'Contrato creado', description: contract.code + ' · ' + client.name, user, date, clientId: client.id });
    return contract;
  }

  /* Registra el movimiento en el contrato activo; si no existe, crea uno nuevo. */
  function applyMovement(st, client, input, user, date) {
    let contract = getActiveContract(client);
    let created = false;
    if (!contract) {
      contract = buildContract(st, client, user, date);
      created = true;
    }
    const movement = {
      id: 'M-' + U.pad(nextSeq(st, 'movement'), 6),
      date,
      responsible: user ? user.name : 'Sistema',
      responsibleId: user ? user.id : null,
      notes: input.notes || '',
      details: input.details.map((d) => Object.assign({}, d))
    };
    contract.movements.push(movement);
    buildAudit(st, {
      type: 'movimiento',
      action: 'Movimiento registrado',
      description: movement.id + ' · ' + contract.code + ' · ' + client.name + ' · ' + plural(movement.details.length, 'concepto', 'conceptos'),
      user, date, clientId: client.id
    });
    return { contract, movement, created };
  }

  function applyCancel(st, client, contract, user, date) {
    contract.status = 'cancelado';
    contract.cancelledAt = date;
    contract.cancelledBy = user ? user.name : 'Sistema';
    buildAudit(st, { type: 'contrato', action: 'Contrato cancelado', description: contract.code + ' · ' + client.name, user, date, clientId: client.id });
  }

  function applyClientStatus(st, client, status, user, date) {
    client.status = status;
    client.updatedAt = date;
    buildAudit(st, {
      type: 'cliente',
      action: status === 'activo' ? 'Cliente reactivado' : 'Cliente desactivado',
      description: client.name, user, date, clientId: client.id
    });
  }

  function plural(n, one, many) { return U.plural(n, one, many); }

  /* ======================= Clientes ======================= */

  function cleanClientData(data) {
    return {
      name: String(data.name || '').trim().replace(/\s+/g, ' '),
      docType: data.docType || '',
      docNumber: String(data.docNumber || '').trim().replace(/\s+/g, '').toUpperCase(),
      phone: String(data.phone || '').trim(),
      address: String(data.address || '').trim()
    };
  }

  function validateClient(data, clientId) {
    const errors = {};
    if (!data.name) errors.name = 'Ingresa el nombre del cliente.';
    else if (data.name.length < 3) errors.name = 'El nombre debe tener al menos 3 caracteres.';

    if (data.docNumber && !data.docType) errors.docType = 'Selecciona el tipo de documento.';
    if (data.docType && data.docNumber) {
      const type = DOC_TYPES.find((t) => t.id === data.docType);
      if (type && !type.pattern.test(data.docNumber)) errors.docNumber = 'Número no válido para ' + type.label + ' (' + type.hint + ').';
      const duplicate = state().clients.find((c) => c.id !== clientId && c.docType === data.docType && c.docNumber === data.docNumber);
      if (!errors.docNumber && duplicate) errors.docNumber = 'Este documento ya pertenece a ' + duplicate.name + '.';
    }

    if (data.phone) {
      const digits = data.phone.replace(/\D/g, '');
      if (!/^[+\d][\d\s-]*$/.test(data.phone) || digits.length < 6 || digits.length > 15) errors.phone = 'Ingresa un teléfono válido (6 a 15 dígitos).';
    }
    if (data.address && data.address.length > 160) errors.address = 'La dirección es demasiado larga.';
    return errors;
  }

  function saveClient(rawData, clientId) {
    const data = cleanClientData(rawData);
    if (!data.docType) data.docNumber = '';
    const errors = validateClient(data, clientId);
    if (Object.keys(errors).length) return { ok: false, errors };

    const st = state();
    let client;
    if (clientId) {
      client = getClient(clientId);
      if (!client) return { ok: false, errors: { general: 'El cliente no existe.' } };
      Object.assign(client, data, { updatedAt: nowIso() });
      audit({ type: 'cliente', action: 'Cliente editado', description: client.name, clientId: client.id });
    } else {
      client = buildClient(st, data, currentUser(), nowIso());
    }
    App.store.save();
    return { ok: true, client };
  }

  function setClientStatus(clientId, status) {
    const client = getClient(clientId);
    if (!client) return { ok: false, message: 'El cliente no existe.' };
    if (status === 'inactivo' && clientSituation(client).hasDebt) {
      return { ok: false, message: 'No se puede desactivar un cliente con deuda pendiente. Registra los pagos y entregas primero.' };
    }
    applyClientStatus(state(), client, status, currentUser(), nowIso());
    App.store.save();
    return { ok: true, client };
  }

  /* ======================= Movimientos ======================= */

  /* Valida las filas del formulario y las convierte en detalles. */
  function parseDetails(rows) {
    const rowErrors = rows.map(() => ({}));
    const details = [];
    rows.forEach((row, i) => {
      const concept = CONCEPTS[row.concept];
      if (!concept) { rowErrors[i].concept = 'Selecciona un concepto.'; return; }
      if (concept.kind === 'money') {
        const amount = U.parseMoney(row.amount);
        if (String(row.amount || '').trim() === '') rowErrors[i].amount = 'Ingresa el importe.';
        else if (isNaN(amount)) rowErrors[i].amount = 'Importe no válido (máximo 2 decimales).';
        else if (amount <= 0) rowErrors[i].amount = 'El importe debe ser mayor que cero.';
        else if (amount > 100000000) rowErrors[i].amount = 'El importe es demasiado alto.';
        else details.push({ concept: concept.id, amount });
      } else {
        const quantity = Number(row.quantity);
        if (CYLINDER_IDS.indexOf(row.cylinder) === -1) rowErrors[i].cylinder = 'Selecciona el tipo de balón.';
        if (!Number.isInteger(quantity) || quantity < 1) rowErrors[i].quantity = 'La cantidad debe ser un número entero mayor que cero.';
        else if (quantity > 999) rowErrors[i].quantity = 'La cantidad es demasiado alta.';
        if (!rowErrors[i].cylinder && !rowErrors[i].quantity) details.push({ concept: concept.id, cylinder: row.cylinder, quantity });
      }
    });
    const ok = rows.length > 0 && rowErrors.every((e) => Object.keys(e).length === 0);
    return { ok, details, rowErrors };
  }

  /* Comprueba si el movimiento puede registrarse (sin guardar nada). */
  function checkMovement(clientId, input) {
    const client = getClient(clientId);
    if (!client) return { ok: false, message: 'El cliente no existe.' };
    if (client.status !== 'activo') return { ok: false, message: 'El cliente está desactivado. Reactívalo para registrar movimientos.' };
    if (!input.rows.length) return { ok: false, message: 'Agrega al menos un concepto al movimiento.' };

    const parsed = parseDetails(input.rows);
    if (!parsed.ok) return { ok: false, message: 'Revisa los conceptos marcados.', rowErrors: parsed.rowErrors };
    if (String(input.notes || '').length > 300) return { ok: false, message: 'Las observaciones no pueden superar 300 caracteres.' };

    const active = getActiveContract(client);
    const includesDebt = parsed.details.some((d) => CONCEPTS[d.concept].sign > 0);
    if (!active && !includesDebt) {
      return { ok: false, message: 'El cliente no tiene un contrato activo. Solo puedes registrar pagos o entregas cuando existe una deuda.' };
    }

    /* Ningún saldo puede quedar negativo: no se puede pagar ni devolver más de lo adeudado. */
    const current = active ? contractBalance(active) : emptyBalance();
    const available = emptyBalance();
    const outgoing = emptyBalance();
    available.money = current.money;
    CYLINDER_IDS.forEach((id) => { available.cyl[id] = current.cyl[id]; });
    parsed.details.forEach((d) => {
      const c = CONCEPTS[d.concept];
      if (c.kind === 'money') { if (c.sign > 0) available.money += d.amount; else outgoing.money += d.amount; }
      else if (c.sign > 0) available.cyl[d.cylinder] += d.quantity;
      else outgoing.cyl[d.cylinder] += d.quantity;
    });
    if (outgoing.money > available.money) {
      return { ok: false, message: 'El pago (' + U.formatMoney(outgoing.money) + ') supera la deuda de dinero (' + U.formatMoney(available.money) + ').' };
    }
    for (const id of CYLINDER_IDS) {
      if (outgoing.cyl[id] > available.cyl[id]) {
        return { ok: false, message: 'La entrega de balones de ' + id + ' kg (' + outgoing.cyl[id] + ') supera los pendientes (' + available.cyl[id] + ').' };
      }
    }

    return { ok: true, client, details: parsed.details, notes: String(input.notes || '').trim(), active, willCreateContract: !active };
  }

  function registerMovement(clientId, input) {
    const check = checkMovement(clientId, input);
    if (!check.ok) return check;
    const result = applyMovement(state(), check.client, { details: check.details, notes: check.notes }, currentUser(), nowIso());
    App.store.save();
    return Object.assign({ ok: true }, result);
  }

  /* ======================= Contratos ======================= */

  function cancelContract(clientId, contractId) {
    const client = getClient(clientId);
    if (!client) return { ok: false, message: 'El cliente no existe.' };
    const contract = client.contracts.find((c) => c.id === contractId);
    if (!contract) return { ok: false, message: 'El contrato no existe.' };
    if (contract.status !== 'activo') return { ok: false, message: 'El contrato ya está cancelado.' };
    if (!isZeroBalance(contractBalance(contract))) {
      return { ok: false, message: 'No se puede cancelar: el contrato tiene saldos pendientes. Todos los saldos deben estar en cero.' };
    }
    applyCancel(state(), client, contract, currentUser(), nowIso());
    App.store.save();
    return { ok: true, contract };
  }

  /* ======================= Sesión ======================= */

  function login(username, password) {
    const user = state().users.find((u) => u.username.toLowerCase() === String(username || '').trim().toLowerCase());
    if (!user || user.password !== password) return { ok: false, message: 'Usuario o contraseña incorrectos.' };
    App.session.set({ userId: user.id, since: nowIso() });
    buildAudit(state(), { type: 'sesion', action: 'Inicio de sesión', description: '@' + user.username, user });
    App.store.save();
    return { ok: true, user };
  }

  function logout() {
    const user = currentUser();
    if (user) {
      buildAudit(state(), { type: 'sesion', action: 'Cierre de sesión', description: '@' + user.username, user });
      App.store.save();
    }
    App.session.clear();
  }

  /* ======================= Resumen general ======================= */

  function summary() {
    const totals = emptyBalance();
    const owingByCylinder = { '5': 0, '10': 0, '45': 0 };
    let debtors = 0;
    let activeContracts = 0;
    const ranking = [];

    state().clients.forEach((client) => {
      const s = clientSituation(client);
      if (s.active) activeContracts += 1;
      if (!s.hasDebt) return;
      debtors += 1;
      totals.money += s.balance.money;
      CYLINDER_IDS.forEach((id) => {
        totals.cyl[id] += s.balance.cyl[id];
        if (s.balance.cyl[id] > 0) owingByCylinder[id] += 1;
      });
      ranking.push({ client, balance: s.balance, since: s.active.createdAt });
    });
    ranking.sort((a, b) => b.balance.money - a.balance.money || cylinderTotal(b.balance) - cylinderTotal(a.balance));

    /* Serie de los últimos 7 días: deuda registrada vs. pagos recibidos (dinero). */
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      days.push({ key: U.dayKey(d), label: U.DAYS_SHORT[d.getDay()], debt: 0, paid: 0 });
    }
    const index = {};
    days.forEach((d, i) => { index[d.key] = i; });
    state().clients.forEach((client) => client.contracts.forEach((contract) => contract.movements.forEach((m) => {
      const i = index[U.dayKey(m.date)];
      if (i === undefined) return;
      m.details.forEach((d) => {
        if (d.concept === 'deuda_dinero') days[i].debt += d.amount;
        if (d.concept === 'pago_dinero') days[i].paid += d.amount;
      });
    })));

    return {
      totals, owingByCylinder, debtors, activeContracts, ranking, days,
      clients: state().clients.length,
      activeClients: state().clients.filter((c) => c.status === 'activo').length
    };
  }

  App.domain = {
    CYLINDERS, CYLINDER_IDS, CONCEPTS, CONCEPT_LIST, DOC_TYPES,
    emptyBalance, contractBalance, cylinderTotal, isZeroBalance, getActiveContract, clientBalance, clientSituation,
    getClient, groupedClients,
    buildClient, buildContract, applyMovement, applyCancel, applyClientStatus, buildAudit,
    saveClient, setClientStatus,
    parseDetails, checkMovement, registerMovement,
    cancelContract,
    login, logout, audit,
    summary
  };
})(window.App);
