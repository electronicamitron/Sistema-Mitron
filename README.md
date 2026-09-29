# Sistema Mitron

Repositorio principal del Sistema Mitron. Este proyecto se compone de una demostración visual en el frontend y una estructura preparada para el futuro desarrollo del backend.

## Estructura del Proyecto

El proyecto está organizado en las siguientes carpetas principales:

- `vista-previa/`: Contiene la aplicación frontend (demostración visual) construida con React y Vite.
- `backend/`: Ubicación prevista para el futuro desarrollo del backend y procesamiento de datos.
- `documentacion/`: Documentación centralizada del proyecto, sistema de diseño, componentes y especificaciones.

### Organización de la Vista Previa

Dentro de `vista-previa/src`, los archivos están organizados en:
- `components/ui/`: Componentes visuales genéricos y reutilizables.
- `components/domain/`: Componentes específicos del dominio de negocio de Mitron.
- `pages/`: Pantallas principales de la aplicación.
- `layouts/`: Estructuras de diseño para las diferentes vistas.
- `context/`: Contextos globales de la aplicación (ej. AuthContext).
- `data/`: Datos locales para la demostración.
- `styles/`: Estilos globales y tokens de diseño.
- `assets/`: Recursos gráficos y multimedia.

## Diferencia entre Demostración Visual y Funciones Futuras

Actualmente, el proyecto es **únicamente una demostración visual (frontend)**. La navegación, la carga de datos (facturas XML, reportes TXT), la autenticación de usuarios y las modificaciones en inventario operan con **datos locales ilustrativos o lectura de archivos locales seleccionados manualmente en el navegador**.

No existe procesamiento del lado del servidor, base de datos ni persistencia real. Estas responsabilidades están asignadas a la futura implementación del backend.

## Instrucciones de Ejecución

Para iniciar la vista previa del frontend localmente:

1. Asegúrate de tener Node.js y `pnpm` instalados.
2. Abre la terminal y dirígete a la carpeta `vista-previa`:
   ```bash
   cd vista-previa
   ```
3. Instala las dependencias:
   ```bash
   pnpm install
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   pnpm run dev
   ```
5. Abre la URL indicada en la terminal (por defecto `http://localhost:5173`).
