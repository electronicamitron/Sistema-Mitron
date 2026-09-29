# Sistema Mitron — Diseño Final V1

El proceso de refactorización visual y componentización ha sido concluido. La aplicación React en la carpeta `mitron-app/apps/web` sirve ahora como la maqueta interactiva central y la fuente de la verdad para el diseño de Sistema Mitron.

## 1. Estructura de Pantallas Terminadas

- **Dashboard:** Cuatro indicadores principales de nivel superior (Ingresos, Gastos, Compras, Inventario) y dos paneles estructurados para evolución (gráfica futura) y actividad reciente.
- **Administración:** Reducida a 3 pestañas principales (Ingresos, Gastos, Proveedores). Contiene la acción global de Importación y botones de estado.
- **Inventario:** Barra de filtros interactiva, tabla de existencias con saldo consolidado, estados (Disponible/Revisar) y botón para configurar límites individuales.
- **Catálogo:** Tabla maestra con correspondencia de SKU, costo, precio, categorización y estado de homologación.
- **Calendario:** Cuadrícula mensual tradicional generada dinámicamente, panel de navegación de meses y acceso rápido a modal de recordatorios operativos.

## 2. Componentización UI (Libre de Lógica de Negocio)

La interfaz ahora está ensamblada a partir de componentes estrictamente visuales importados desde `components/ui/` y `components/domain/`.
*   **Base (UI):** `Button`, `StatusBadge`, `StatCard`, `Modal`, `Drawer`, `DataTable`, `EmptyState`, Form inputs.
*   **Negocio (Domain):** `NotificationPanel`, `PriceCalculatorModal`, `StockConfigModal`, `SupplierDrawer`.

*Importante:* Ninguno de estos componentes realiza consultas a bases de datos ni llamadas de red HTTP de forma interna. Funcionan por medio de *props* (React Properties) siguiendo los contratos en `DATA_CONTRACTS.md`.

## 3. Comportamientos Interactivos Validados

Las siguientes interacciones ya están maquetadas en el frontend local:
1. **Campana de notificaciones:** Abre el desplegable con las alertas ordenadas por prioridad (uso de colores ámbar/rojo/verde según urgencia).
2. **Pestañas de Administración:** Cambio fluido sin recarga de página.
3. **Calculadora de Precios:** Se abre como modal centralizado desde las tablas de ingresos y gastos.
4. **Umbral de Stock:** El modal de configuración incluye un *stepper* (-/+) visual interactivo.
5. **Drawer de Proveedores:** Despliega desde el lado derecho con sombra proyectada e integración de `StatCard`.
6. **Calendario interactivo:** Avance y retroceso de mes (ejemplo visual), clic en días para programar recordatorios.

## 4. Estado de las Tecnologías de Backend

Los servidores locales Fastify y la base de datos SQLite con los parsers TXT y XML siguen existiendo en `mitron-app/apps/api`. No se han eliminado ni alterado, pero el desarrollo funcional y la conexión UI ↔ API quedan temporalmente **en pausa** a la espera de la decisión tecnológica final.

El sistema de diseño visual cumple con todas las especificaciones y lineamientos dictados para esta versión.
