# Paquete de Diseño Visual - Sistema Mitron

Este directorio contiene la exportación final y aislada del diseño visual del Sistema Mitron.

## Cómo probar esta vista previa visual interactiva

Para poder correr la maqueta visual sin necesidad de backend, asegúrate de tener [Node.js](https://nodejs.org) instalado.

1. Abre tu terminal en esta misma carpeta (`vista-previa/`).
2. Instala las dependencias ejecutando:
   ```bash
   pnpm install
   ```
3. Inicia el entorno visual de desarrollo:
   ```bash
   pnpm run dev
   ```
4. Abre `http://localhost:5173` en tu navegador.

## Importante sobre las interacciones
Esta maqueta muestra cómo fluirá la aplicación.
* Muchas acciones mostrarán un recuadro de aviso (alerta) `Acción de interfaz visual. Sin conexión a backend.` indicando que ese botón o filtro requerirá de lógica y de base de datos futura para funcionar.
* El estado visual y los datos de ejemplo incluidos aquí son ficticios y solo persiguen ilustrar el uso de los diferentes controles.
* Las tecnologías aquí contenidas (Vite, React, TypeScript) se usan solo como un vehículo para mostrar el diseño, **no representan una decisión técnica definitiva sobre el sistema en producción.**
