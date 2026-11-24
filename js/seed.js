/*
 * Datos de demostración. Se generan con fechas relativas al momento de carga
 * y pasan por los mismos constructores del dominio, en orden cronológico,
 * para que contratos, movimientos y auditoría sean coherentes.
 */
(function (App) {
  'use strict';

  const D = App.domain;

  const TEST_USER = { id: 'U-0001', username: 'admin', password: '1234', name: 'Carlos Ramírez', role: 'Administrador' };

  function empty() {
    return {
      version: App.store ? App.store.VERSION : 1,
      users: [Object.assign({}, TEST_USER)],
      clients: [],
      audit: [],
      seq: { client: 0, contract: 0, movement: 0, audit: 0 }
    };
  }

  /* Atajos para escribir los detalles. Importes en soles. */
  const debt = (soles) => ({ concept: 'deuda_dinero', amount: Math.round(soles * 100) });
  const pay = (soles) => ({ concept: 'pago_dinero', amount: Math.round(soles * 100) });
  const lend = (cylinder, quantity) => ({ concept: 'deuda_balon', cylinder, quantity });
  const back = (cylinder, quantity) => ({ concept: 'entrega_balon', cylinder, quantity });

  function build() {
    const st = empty();
    const user = st.users[0];
    const now = Date.now();

    /* Fecha relativa: ago({ y, mo, d }, hora, minuto). Nunca en el futuro. */
    function ago(spec, hh, mm) {
      const s = spec || {};
      const dt = new Date(now);
      dt.setFullYear(dt.getFullYear() - (s.y || 0), dt.getMonth() - (s.mo || 0), dt.getDate() - (s.d || 0));
      dt.setHours(hh == null ? 9 : hh, mm || 0, 0, 0);
      if (dt.getTime() > now) dt.setTime(now - 12 * 60000);
      return dt.toISOString();
    }

    const scripts = [
      {
        data: { name: 'Rosa María Quispe Huamán', docType: 'DNI', docNumber: '45781236', phone: '987 654 321', address: 'Av. Los Olivos 245, San Martín de Porres' },
        createdAt: ago({ mo: 1, d: 12 }, 8, 40),
        steps: [
          ['mov', ago({ mo: 1, d: 5 }, 8, 15), [debt(120), lend('10', 2)], 'Pedido para la bodega'],
          ['mov', ago({ d: 20 }, 17, 40), [pay(40)], ''],
          ['mov', ago({ d: 2 }, 11, 5), [lend('45', 1)], 'Entrega a domicilio'],
          ['mov', ago({ d: 1 }, 16, 20), [debt(45), lend('10', 1), back('10', 1)], 'Cambio de balón']
        ]
      },
      {
        data: { name: 'Restaurante El Buen Sabor S.A.C.', docType: 'RUC', docNumber: '20512345678', phone: '01 456 7890', address: 'Jr. Huallaga 512, Cercado de Lima' },
        createdAt: ago({ y: 1, mo: 2, d: 3 }, 9, 0),
        steps: [
          ['mov', ago({ y: 1, mo: 2 }, 7, 30), [debt(850), lend('45', 3)], 'Instalación inicial de cocina'],
          ['mov', ago({ mo: 11 }, 15, 30), [pay(300)], ''],
          ['mov', ago({ mo: 6 }, 12, 0), [back('45', 1)], ''],
          ['mov', ago({ mo: 2 }, 9, 45), [debt(420), lend('45', 1)], ''],
          ['mov', ago({ d: 4 }, 13, 10), [pay(250)], 'Pago parcial en efectivo'],
          ['mov', ago({ d: 0 }, 8, 30), [debt(180)], 'Recarga de 2 balones de 45 kg']
        ]
      },
      {
        data: { name: 'Juan Carlos Mendoza Ríos', docType: 'DNI', docNumber: '70125489', phone: '945 112 380', address: 'Calle Las Begonias 118, Comas' },
        createdAt: ago({ d: 3 }, 8, 0),
        steps: [
          ['mov', ago({ d: 3 }, 8, 20), [debt(38), lend('5', 1)], '']
        ]
      },
      {
        data: { name: 'Pollería Don Lucho', docType: 'RUC', docNumber: '10412365478', phone: '956 332 140', address: 'Av. Universitaria 1820, Los Olivos' },
        createdAt: ago({ mo: 3, d: 2 }, 10, 0),
        steps: [
          ['mov', ago({ mo: 3 }, 9, 0), [lend('10', 2)], ''],
          ['mov', ago({ mo: 2, d: 10 }, 17, 0), [back('10', 2)], 'Devolvió los envases'],
          ['mov', ago({ d: 14 }, 7, 0), [lend('10', 4)], 'Pedido semanal'],
          ['mov', ago({ d: 6 }, 16, 0), [back('10', 1)], '']
        ]
      },
      {
        data: { name: 'Ana Lucía Torres Vega', docType: 'DNI', docNumber: '41236587', phone: '912 345 678', address: 'Mz. B Lt. 7, Urb. Santa Rosa, Callao' },
        createdAt: ago({ mo: 5 }, 11, 0),
        steps: [
          ['mov', ago({ mo: 4 }, 10, 0), [debt(60), lend('10', 1)], ''],
          ['mov', ago({ mo: 3, d: 2 }, 18, 30), [pay(60), back('10', 1)], 'Saldó toda la deuda']
        ]
      },
      {
        data: { name: 'Miguel Ángel Flores Paredes', docType: 'DNI', docNumber: '46985213', phone: '998 776 554', address: 'Av. Túpac Amaru 3401, Carabayllo' },
        createdAt: ago({ mo: 2 }, 9, 30),
        steps: [
          ['mov', ago({ d: 25 }, 9, 0), [debt(95)], ''],
          ['mov', ago({ d: 5 }, 18, 0), [pay(95)], 'Canceló el total']
        ]
      },
      {
        data: { name: 'Carmen Rosa Huamán Soto', docType: 'DNI', docNumber: '09874512', phone: '', address: 'Jr. Las Flores 77, Independencia' },
        createdAt: ago({ mo: 8 }, 10, 0),
        steps: [
          ['mov', ago({ mo: 7 }, 10, 15), [debt(30)], ''],
          ['mov', ago({ mo: 6, d: 15 }, 12, 0), [pay(30)], ''],
          ['status', ago({ mo: 6 }, 9, 0), 'inactivo']
        ]
      },
      {
        data: { name: 'Panadería San José', docType: 'RUC', docNumber: '20601234567', phone: '963 258 741', address: 'Av. Naranjal 455, Independencia' },
        createdAt: ago({ mo: 4 }, 8, 0),
        steps: [
          ['mov', ago({ d: 9 }, 7, 30), [debt(260)], 'Consumo de 4 balones de 45 kg'],
          ['mov', ago({ d: 3 }, 12, 0), [debt(65)], ''],
          ['mov', ago({ d: 2 }, 18, 0), [pay(80)], 'Yape']
        ]
      },
      {
        data: { name: 'Bodega Sofía', docType: '', docNumber: '', phone: '921 456 789', address: 'Calle 5 Mz. H Lt. 12, Puente Piedra' },
        createdAt: ago({ d: 40 }, 9, 0),
        steps: [
          ['mov', ago({ d: 1 }, 10, 15), [debt(20), lend('5', 2), lend('10', 1)], '']
        ]
      },
      {
        data: { name: 'Luis Alberto Rojas', docType: '', docNumber: '', phone: '934 567 210', address: '' },
        createdAt: ago({ d: 1 }, 15, 0),
        steps: []
      }
    ];

    /* Se convierten los guiones en eventos y se ejecutan en orden cronológico. */
    const events = [];
    scripts.forEach((script) => {
      const ref = { client: null };
      events.push({ date: script.createdAt, run: () => { ref.client = D.buildClient(st, script.data, user, script.createdAt); } });
      script.steps.forEach((step) => {
        const [type, date] = step;
        events.push({
          date,
          run: () => {
            if (type === 'mov') D.applyMovement(st, ref.client, { details: step[2], notes: step[3] }, user, date);
            if (type === 'status') D.applyClientStatus(st, ref.client, step[2], user, date);
          }
        });
      });
    });
    events
      .map((e, i) => Object.assign(e, { i }))
      .sort((a, b) => (new Date(a.date) - new Date(b.date)) || a.i - b.i)
      .forEach((e) => e.run());

    D.buildAudit(st, { type: 'sistema', action: 'Datos de demostración cargados', description: st.clients.length + ' clientes de prueba', date: new Date(now).toISOString() });
    return st;
  }

  App.seed = { build, empty, TEST_USER };
})(window.App);
