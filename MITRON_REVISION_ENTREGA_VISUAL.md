# Sistema Mitron — Revisión del paquete de diseño visual

**Archivo revisado:** `MITRON-DISENO-VISUAL.zip` (copia entregada por el usuario).

## Resultado

El ZIP es íntegro y contiene la estructura principal para compartir el diseño: `vista-previa/`, `documentacion/` (siete documentos) y `README.md`. Incorpora las cinco vistas previstas y componentes comunes/de dominio. No contiene el backend, una base de datos ni los XML/TXT originales.

**Estado:** útil como material de diseño para el ingeniero, pero **pendiente de limpieza y prueba independiente** antes de calificar la vista previa como ejecutable o presentar todos sus controles como terminados.

## Incidencias que deben corregirse

1. **Archivo legado sin dependencia.** `vista-previa/src/MitronComponents.tsx` importa `./MitronData.tsx`, que no está incluido. Al no estar integrado en `App.tsx`, separarlo en un directorio de referencias externo a la compilación (o excluirlo del proyecto) y hacer lo mismo con `MitronTheme.tsx` si solo es duplicación del CSS activo. No agregar lógica de negocio faltante solo para mantener el legado.
2. **Datos identificables dentro de la maqueta.** Hay una razón social/nombre de usuario, RFC de proveedor, montos comerciales y un correo de contacto no acreditado integrados directamente en los componentes. Sustituir por muestras genéricas etiquetadas de manera que no se confundan con datos reales. No alterar documentación funcional que describe el alcance del negocio, salvo si el paquete se distribuirá más allá del colaborador autorizado.
3. **Interacciones ilustrativas incompletas.** El botón «Importar archivo» no hace nada (adecuado si se señala como elemento visual). «Guardar límite» cierra el modal sin emitir un valor; los filtros de Inventario no tienen opciones reales ni efecto visible. «Guardar recordatorio» solo cierra el modal; el calendario tiene 30 días fijos y navegación de meses predeterminados. «Nuevo Producto» y el filtro del Dashboard carecen de acción. Si se quiere demostrar interacción visual, implementar estado local temporal sin backend, o identificar inequívocamente estos controles como no operativos.
4. **Contenido visual incompleto.** Dashboard todavía tiene marcadores de posición en lugar de una gráfica y una actividad reciente representativas. La campana incluye un supuesto vencimiento de factura no sustentado por una fecha comprobada. Cambiarlo por una notificación completamente ficticia y claramente ilustrativa o un estado vacío.
5. **Documentación y presentación.** `DATA_CONTRACTS.md` mezcla el método fiscal PPD/PUE con el estado de pago y no contempla «Revisar existencias», límites todavía no configurados y proveedor(es) múltiples por producto. El README dentro de `vista-previa/` es el genérico de Vite y `index.html` todavía tiene título `web` y `lang="en"`. Documentar que el sistema definitivo y sus tecnologías aún no se han decidido. La carpeta vacía `recursos/` no aparece en el ZIP; incluir un README si se mantiene.
6. **Validación de ejecución pendiente.** El ZIP pasó prueba de integridad y no se hallaron patrones comunes de claves ni archivos fiscales originales; sin embargo, no se pudo instalar las dependencias desde este entorno (falta de acceso al registro npm). Pedir a Antigravity, en Windows, ejecutar `npm ci` y `npm run build` dentro de una **extracción nueva del ZIP final**, e iniciar su vista previa sin backend.

## Criterios de aceptación de la entrega

- [ ] El ZIP recién creado se extrae y `vista-previa/` compila de forma independiente.
- [ ] Las cinco pantallas se abren sin iniciar Fastify ni SQLite.
- [ ] No hay importaciones locales rotas ni componentes legados inútiles en `src/`.
- [ ] No contiene documentos fiscales, credenciales, datos empresariales reales innecesarios ni notificaciones que parezcan compromisos auténticos.
- [ ] La documentación distingue interacciones simuladas de funcionalidad por construir, sin imponer ningún stack definitivo.
- [ ] Se revisan los estados visuales Disponible, Stock bajo, Sin existencias y Revisar existencias.
- [ ] El proyecto original `mitron-app/` permanece intacto.

**Nota:** Esta revisión es estática del código y del ZIP entregado. No sustituye la revisión visual en un navegador ni certifica compilación hasta que se instalen sus dependencias en un entorno con acceso a npm.
