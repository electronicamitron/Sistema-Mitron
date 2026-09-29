# Resumen del Sistema Mitron

Este documento sintetiza la finalidad de cada sección de la aplicación y las funcionalidades previstas. El propósito de este archivo es guiar al equipo de ingeniería en la implementación final, independientemente del stack o tecnologías de backend y frontend que se seleccionen.

## Propósito General
El Sistema Mitron es una plataforma de gestión interna enfocada en la conciliación y el control operativo de una única entidad comercial (Evelin Valdovinos Leyva), trabajando con múltiples proveedores. El sistema no incluye capacidades de Punto de Venta (POS) ni módulos de Marketing. Su diseño es minimalista, enfocado en eficiencia, y operará en español utilizando la moneda MXN.

## 1. Importación como Motor Principal
El sistema funciona bajo el principio de "importar y calcular", reduciendo la captura manual:
*   **Compras:** Se importan desde archivos fiscales XML (CFDI 4.0).
*   **Ventas:** Se importan consolidadas desde archivos TXT generados por el sistema heredado o sistemas de terceros.
Ambas operaciones residen bajo la sección "Administración".

## 2. Descripción de Áreas (Pantallas)

### Dashboard
Panel de control de lectura rápida. Presentará cuatro indicadores clave de rendimiento (KPIs): Ingresos (TXT), Gastos (XML y manuales), Compras (Mercancía XML) y Estado del Inventario (número de productos críticos). Incluirá también una gráfica histórica financiera y una línea de tiempo de eventos y notificaciones.

### Administración
Es el núcleo transaccional. Contiene tres pestañas:
1.  **Ingresos:** Listado del histórico de archivos TXT procesados y las ventas correspondientes. 
2.  **Gastos:** Listado de facturas de compras (XML). En los detalles de las compras, se permite lanzar la calculadora para establecer precios.
3.  **Proveedores:** Catálogo generado automáticamente a partir de los XML, conteniendo información de contacto e histórico de transacciones.

*Nota:* La "Calculadora de Precios" no es un módulo independiente; es una herramienta emergente (Modal) que asiste al usuario desde las partidas de Ingresos o Gastos.

### Inventario
Gestión de stock físico, cuyas existencias se calculan cruzando las recepciones confirmadas (compras) frente a las ventas (TXT). Proporciona filtros rápidos, trazabilidad (entradas/salidas) y la posibilidad de definir límites de stock críticos individualizados por artículo.

### Catálogo
Directorio maestro de los productos o "SKUs" que comercializa la empresa. Funciona como punto de homologación entre los códigos que envían los distintos proveedores (ej. XML) y el SKU interno de venta (ej. TXT). 

### Calendario
Planificador mensual tradicional que comparte datos con el sistema global de notificaciones. Permite establecer recordatorios de pagos, fechas operativas o cierres fiscales, mostrándose visualmente como eventos en la cuadrícula y como alertas en la "campana" superior.

## 3. Próximos Pasos (Ingeniería)
La versión provista en esta carpeta contiene la maqueta interactiva (`vista-previa/`) que implementa la arquitectura de información visual.
Los pasos posteriores sugeridos son:
1. Selección de tecnologías (Ej: React/Vue/Svelte + Node/Go/Python).
2. Implementación de base de datos relacional y lógica de autenticación.
3. Construcción del backend transaccional y los parsers oficiales de XML/TXT.
4. Conexión de la maqueta a los endpoints reales.
