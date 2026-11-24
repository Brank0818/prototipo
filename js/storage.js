/* Persistencia local del prototipo (LocalStorage). No hay backend. */
(function (App) {
  'use strict';

  const DATA_KEY = 'glp-control:data:v1';
  const SESSION_KEY = 'glp-control:session:v1';
  const VERSION = 1;

  function read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('No se pudo guardar en LocalStorage', e);
      return false;
    }
  }

  function remove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* sin acceso */ }
  }

  const store = {
    VERSION,
    state: null,
    init() {
      const data = read(DATA_KEY);
      if (data && data.version === VERSION && Array.isArray(data.clients)) {
        this.state = data;
      } else {
        this.state = App.seed.build();
        this.save();
      }
    },
    save() {
      return write(DATA_KEY, this.state);
    },
    /* Vuelve a cargar los datos de demostración. */
    reset() {
      this.state = App.seed.build();
      this.save();
    },
    /* Deja el sistema vacío (solo el usuario de prueba). */
    clear() {
      this.state = App.seed.empty();
      this.save();
    }
  };

  const session = {
    get() { return read(SESSION_KEY); },
    set(value) { write(SESSION_KEY, value); },
    clear() { remove(SESSION_KEY); },
    user() {
      const s = this.get();
      if (!s || !store.state) return null;
      return store.state.users.find((u) => u.id === s.userId) || null;
    }
  };

  App.store = store;
  App.session = session;
})(window.App);
