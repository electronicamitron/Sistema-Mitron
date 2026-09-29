# Despliegue de Sistema Mitron (Vercel)

Actualmente, el sistema está desplegado en Vercel como un proyecto único. Con la nueva arquitectura monorepo basada en Turborepo, tendremos dos proyectos separados en Vercel que se alimentan del mismo repositorio de GitHub (`electronicamitron/Sistema-Mitron`).

## Proyecto 1: Aplicación Administrativa
- **Vercel Project Name:** `mitron-admin` (sugerido)
- **Framework Preset:** Vite
- **Root Directory:** `apps/admin`
- **Build Command:** `pnpm run build` (detectado automáticamente)
- **Output Directory:** `dist`
- **Dominio sugerido:** `app.electronicamitron.com`

*Nota importante:* La aplicación administrativa actual (MVP) puede seguir publicada en el apex/raíz de Vercel (sin Root Directory) temporalmente, hasta que llegue la fase oficial de despliegue donde conectaremos estos dos proyectos.

## Proyecto 2: Sitio Web Público
- **Vercel Project Name:** `mitron-web` (sugerido)
- **Framework Preset:** Next.js
- **Root Directory:** `apps/web`
- **Build Command:** `pnpm run build`
- **Output Directory:** `.next`
- **Dominio sugerido:** `electronicamitron.com` y `www.electronicamitron.com`

**ADVERTENCIA:** NO CAMBIAR la configuración actual de Vercel ni de los DNS hasta que el desarrollo esté completamente listo para producción.
