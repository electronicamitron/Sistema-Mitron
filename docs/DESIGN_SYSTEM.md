# Sistema de Diseño de Mitron

## Identidad Visual
El sistema de diseño de Mitron utiliza una paleta monocromática oscura para crear una interfaz minimalista, sobria y orientada a la eficiencia.

### Colores (Tokens)
- **Fondo Base (`--mt-bg`)**: `#111315` - Usado para el lienzo principal (aplicación, sidebar, header).
- **Superficie (`--mt-surface`)**: `#292C2D` - Usado para tarjetas, modales y áreas contenedoras.
- **Superficie Sutil (`--mt-surface-subtle`)**: `#1C1F20` - Fondos alternos para tablas y estados hover.
- **Bordes (`--mt-border`)**: `#383B3D` - Delimitadores principales de contenedores.
- **Bordes Sutiles (`--mt-border-subtle`)**: `#242728` - Delimitadores secundarios, líneas interiores.

### Tipografía
- **Familia principal**: `Inter, -apple-system, sans-serif`
- **Textos Primarios (`--mt-text-primary`)**: `#FFFFFF`
- **Textos Secundarios (`--mt-text-secondary`)**: `#676767`
- **Textos Deshabilitados/Sutiles (`--mt-text-muted`)**: `#AEAFB1`

### Estados y Semántica
El uso de color semántico se limita exclusivamente a estados críticos:
- **Éxito (Verde)**: `#7CE38B` (Fondo `#142818`)
- **Advertencia/Atención (Ámbar)**: `#E5A93C` (Fondo `#332512`)
- **Peligro/Error (Rojo)**: `#F87171` (Fondo `#2F1517`)

### Espaciado y Radios
- **Radios de Borde**: `6px` para controles pequeños (inputs, botones), `8px` para paneles y modales.
- **Padding estándar**: `16px` a `24px` para la separación interior de contenedores.

### Sombras
- **Modales y Drawers**: `0 10px 25px rgba(0,0,0,0.5)` para elevación máxima.
