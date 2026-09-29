# Arquitectura técnica objetivo de Electrónica Mitron

Fecha de propuesta: 2026-09-29. Es una **arquitectura objetivo** para organizar el código. Los archivos actuales deben inspeccionarse antes de cualquier movimiento.

## Decisión de frontend
- `apps/admin`: conservar el sistema existente **React + TypeScript + Vite + React Router**, con su estado `DataContext` y demo local. Migrar el diseño **gradualmente** a Tailwind CSS v4 + shadcn/ui con **Base UI**, manteniendo los iconos Lucide. TanStack Table, TanStack Query, Zod y React Hook Form se incorporan solo donde exista un caso concreto, no todos de golpe.
- `apps/web`: nueva página pública **Next.js App Router + TypeScript**, inicialmente estática, con contenido de muestra explícito hasta aprobar textos, marca y catálogo público. React permite compartir componentes de interfaz con el administrador; Next.js ofrece metadatos, rutas públicas, Open Graph y futuras páginas de catálogo indexables. No trasladar funcionalidades privadas al sitio comercial.
- `packages/ui`: componentes React verdaderamente compartidos **presentacionales**, tokens oficiales, controles accesibles y estilos; evitar acoplamiento a React Router, Next router, DataContext o navegador dentro de componentes universales. Next.js podría necesitar `"use client"` en controles interactivos compartidos.
- `packages/shared`: solo utilidades y contratos de tipos puros compartibles sin código servidor, cuando tengan consumidores reales. **No exponer modelos que incluyan secretos o información fiscal de prueba**.
- `pnpm-workspace.yaml` + **Turborepo**: monorepositorio administrado desde la raíz para compilar, lint y ejecutar apps de forma independiente. Mantener un único archivo `pnpm-lock.yaml` en la raíz después de una migración comprobada.
- `documentacion` histórica: migrar a `docs/` **conservar todas las especificaciones y registrar discrepancias de alcance**. No cambiar navegación funcional durante una reorganización técnica.

## Árbol de carpetas propuesto
```
Sistema-Mitron/  (en tu escritorio: Demo Sistema Mitron; solo UNA carpeta Git)
├── apps/
│   ├── admin/                   # actual vista-previa: código y recursos conservados
│   │   ├── public/              # solo archivos verdaderamente públicos: marca/iconos
│   │   ├── src/
│   │   │   ├── app/              # opcional: proveedores, routing y composición; no forzar
│   │   │   ├── components/       # módulos propios y adaptadores de UI
│   │   │   ├── features/         # introducir gradualmente por dominio funcional
│   │   │   ├── layouts/
│   │   │   ├── pages/            # preservar páginas actuales, migrar solo si justificado
│   │   │   ├── context/          # DataContext actual durante la demo
│   │   │   ├── lib/              # parseo/formatos/helpers verificados
│   │   │   └── styles/
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── web/                     # Next.js App Router (nuevo)
│       ├── src/app/
│       ├── public/
│       └── package.json
├── packages/
│   ├── ui/                      # Tailwind/tokens/shadcn Base UI compartidos
│   └── shared/                  # SOLO SI EXISTEN usos compartidos reales
├── backend/
│   └── README.md                # Tecnología y proveedor PENDIENTES
├── docs/
│   ├── architecture/
│   ├── design/
│   └── decisions/
├── pnpm-workspace.yaml
├── package.json
├── turbo.json
├── pnpm-lock.yaml
├── .gitignore
└── README.md
```

## Responsabilidades en el administrador
Mantener las cinco secciones **actualmente visibles**: Dashboard, Administración (Ingresos/Gastos/Proveedores), Inventario, Catálogo y Calendario. No cambiar el alcance sin nueva instrucción: existe una especificación histórica del MVP que propone otra navegación; es material a conciliar, **no una orden para modificar la demo actual**.

Para crecer de forma ordenada, separar por funcionalidades cuando resulte útil:
```
features/
  administration/   # UI de importaciones, listados, proveedores; NO parser acoplado a JSX
  inventory/        # filtros, stock, reconciliación
  catalog/          # productos, referencias externas
  calendar/         # eventos y recordatorios
  dashboard/        # agregaciones y visualización
```
No construir carpetas vacías, duplicar tipos ni mover todos los archivos antes de conseguir compilación estable.

## Reglas transversales
- Estado de **demostración** y almacenamiento `localStorage` son temporales; separar adaptadores de datos de la presentación para permitir futuro backend sin reescribir pantallas. Aún no conectarse a Supabase.
- Cifras, periodo documental y `createdAt` deben permanecer diferenciados. Archivos TXT/XML inválidos no deben producir montos ficticios; respetar confirmación de importación.
- Importar XML no equivale a recepción física ni confirma stock. No inventar fechas de vencimiento ni mezclar datos DEMO con cifras reales.
- Mantener los originales XML/TXT en `Mitron-Datos-Locales` **fuera de este repositorio**; nunca dentro de `public`.
- Evitar duplicar global CSS o añadir `@import tailwindcss` indiscriminadamente. Una fuente de verdad para tokens y estilos compartidos; migrar controles gradualmente.
- No forzar el mismo layout entre sitio público y administrador: comparten marca y componentes reutilizables, pero tienen objetivos distintos.

## Bibliografía de implementación (oficial)
- shadcn monorepo: https://ui.shadcn.com/docs/monorepo
- shadcn proyecto Vite existente: https://ui.shadcn.com/docs/installation/vite
- shadcn Next: https://ui.shadcn.com/docs/installation/next
- shadcn Base UI: https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default
- Tailwind v4 Vite: https://tailwindcss.com/docs/installation/using-vite
- Vercel monorepos: https://vercel.com/docs/monorepos
- Vercel dominios: https://vercel.com/docs/domains/set-up-custom-domain
- Next metadata: https://nextjs.org/docs/app/getting-started/metadata-and-og-images
- Supabase: https://supabase.com/docs/guides/getting-started/architecture
