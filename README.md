# GLP Control · Prototipo de gestión de deudas

Prototipo web interactivo para controlar las deudas de dinero y de balones (5 kg, 10 kg y 45 kg) de los clientes de una distribuidora de GLP.

Es **solo frontend**: HTML5, CSS3 y JavaScript puro, sin frameworks, sin backend y sin base de datos real. Los datos se guardan en `localStorage` del navegador.

## Cómo abrirlo

Abre `index.html` directamente en el navegador, o sírvelo con cualquier servidor estático:

```bash
python3 -m http.server 8000
```

y entra en <http://localhost:8000>.

Usuario de prueba: **admin** / **1234** (aparece ya escrito en la pantalla de inicio de sesión).

## Pantallas

| Ruta | Pantalla |
| --- | --- |
| `#/login` | Inicio de sesión |
| `#/clientes` | Lista de clientes: con deuda primero y acordeón «Clientes sin deuda». La búsqueda (en el panel superior) muestra una sola lista de resultados y se limpia al salir de la pantalla. Botón (+) para registrar |
| `#/clientes/nuevo` · `#/clientes/:id/editar` | Registro y edición de clientes. Al registrar se abre directamente la pantalla de movimientos del nuevo cliente |
| `#/clientes/:id/movimiento` | Registro de movimientos con varios conceptos y confirmación |
| `#/clientes/:id` | Detalle: resumen compacto de la deuda y un acordeón por contrato con su historial. «Ver datos», «Editar» y «Desactivar» están en el menú kebab |
| `#/resumen` | Panel con totales, balones pendientes, semana y mayores deudas |
| `#/auditoria` | Historial de auditoría con búsqueda y filtros |
| `#/ajustes` | Usuario, datos de prueba y cierre de sesión |

## Reglas de negocio implementadas

- **Saldos calculados**, nunca almacenados: se suman los detalles de los movimientos del contrato activo (`+` deuda, `−` pago o entrega), por separado para dinero, 5 kg, 10 kg y 45 kg.
- Un **movimiento** (id, fecha y hora, responsable, observaciones) puede combinar varios conceptos: deuda de dinero, pago de dinero, deuda de balones y entrega de balones.
- No se puede pagar ni devolver más de lo adeudado: ningún saldo puede quedar negativo.
- **Contratos**: como máximo uno activo por cliente. Se **cancela automáticamente** en cuanto un movimiento deja todos los saldos en cero (la confirmación lo avisa). Un contrato cancelado no admite movimientos. Si el cliente vuelve a endeudarse, se crea automáticamente un contrato nuevo con su propio historial, y los anteriores se conservan para consulta.
- La **antigüedad** se cuenta desde la creación del contrato activo («3 días», «2 semanas», «1 mes y 5 días», «1 año y 2 meses») y se actualiza sola cada 30 s.
- Los **clientes** no se eliminan: se desactivan (solo si no tienen deuda pendiente) y pueden reactivarse.
- Cada acción queda registrada en la **auditoría** con el usuario responsable.

## Estructura

```
index.html            Punto de entrada
css/styles.css        Sistema visual completo (monocromático, píldoras, contornos punteados)
js/utils.js           Formato de dinero y fechas, antigüedad, búsqueda
js/icons.js           Iconos SVG lineales con el mismo trazo
js/domain.js          Modelo de datos y reglas de negocio (saldos, contratos, movimientos, clientes)
js/storage.js         Persistencia en LocalStorage y sesión
js/seed.js            Datos de demostración (generados en orden cronológico)
js/ui.js              Estructura de pantalla, barra inferior, menú, modales y notificaciones
js/views/*.js         Una pantalla por archivo
js/app.js             Arranque y enrutador por hash
```

Los scripts son clásicos (sin módulos ES) para que el prototipo funcione también al abrir el archivo directamente con `file://`.

En **Ajustes** puedes restablecer los datos de demostración o empezar con el sistema vacío.
