# Paquete de Diseño Visual - Sistema Mitron

Este directorio contiene la exportación final y aislada del diseño visual del Sistema Mitron. Este paquete está pensado para ser entregado a ingeniería sin precondicionar tecnologías de servidor o bases de datos específicas.

## Contenido

### 1. `vista-previa/`
Contiene la maqueta visual funcional y de alta fidelidad. Actualmente está construida usando **React + Vite** de manera provisional para poder observar el comportamiento de los componentes, pestañas, modales y navegación interactiva.

**¿Cómo arrancar la vista previa?**
1. Abre tu terminal en la carpeta `vista-previa/`.
2. Ejecuta `pnpm install` para instalar las dependencias visuales.
3. Ejecuta `pnpm run dev` para levantar el servidor de desarrollo de Vite.
4. Abre `http://localhost:5173` en tu navegador.

*Aclaración:* La navegación, aperturas de modales (como la calculadora de precios) y los datos mostrados son **estados locales o ficticios** que solo sirven para revisión del diseño. No se incluye ningún backend ni base de datos.

### 2. `documentacion/`
Contiene los archivos fundacionales del Sistema de Diseño (Design System) y las especificaciones visuales.
- `DESIGN_SYSTEM.md`: Tokens de colores, sombras y tipografías base.
- `COMPONENTS.md`: Inventario de los componentes UI.
- `SCREENS.md`: Anatomía de cada sección de la plataforma.
- `INTERACTIONS.md`: Reglas sobre modales, paneles laterales y notificaciones.
- `DATA_CONTRACTS.md`: Interfaces propuestas (contratos) para desconectar esta UI y pegarla a cualquier backend en el futuro.
- `DESIGN_V1_FINAL.md`: Resumen del cierre de la fase de diseño.
- `RESUMEN_SISTEMA.md`: Guía de funcionalidades y reglas de negocio esperadas de la plataforma real.

### 3. `recursos/`
Carpeta destinada a futuras exportaciones de iconos SVG o ilustraciones a medida que evolucione el producto. La maqueta actual utiliza fuentes tipográficas y librerías de iconos estandarizadas integradas en el código.

## Notas para Ingeniería
* El diseño actual es la referencia aprobada para la versión de producción.
* Ningún componente dentro de `vista-previa` asume llamadas asíncronas HTTP, persistencia o tecnología de backend, eso queda a criterio de la futura arquitectura tecnológica.
