# Despliegue futuro: MISMO dominio, DOS proyectos independientes

**No ejecutar cambios de despliegue hasta aprobar los resultados locales y hacer el commit.**

## Destino
- `electronicamitron.com` y opcional `www.electronicamitron.com`: proyecto **web comercial**, Root Directory `apps/web`.
- `app.electronicamitron.com`: proyecto **administrador**, Root Directory `apps/admin`.

Vercel admite varios proyectos del mismo monorepositorio, cada uno con su Root Directory y dominio.

## Secuencia posterior de despliegue
1. Conservar y fotografiar la configuración actual de Vercel: repo vinculado, Root Directory, comandos, framework, dominios y variables de entorno. No adivinar valores.
2. Tras las pruebas locales y revisión del commit, ajustar o recrear el proyecto admin con Root Directory `apps/admin`; comprobar rutas SPA mediante acceso directo a `/login` y `/dashboard`, y corregir rewrites si fuese necesario.
3. Asociar `app.electronicamitron.com` al proyecto admin en Vercel, que mostrará el CNAME o proceso de verificación **específico de ese proyecto**. Configurar DNS `app` únicamente donde estén actualmente los nameservers autoritativos (Cloudflare si corresponde) y validar HTTPS. No utilizar destinos CNAME supuestos.
4. Crear proyecto separado para `apps/web` y revisar preview con dominio temporal de Vercel. No asignar el apex mientras la página no esté aprobada.
5. Solo tras probar ambos proyectos, trasladar `electronicamitron.com` al proyecto web y ajustar redirecciones `www` si procede. El subdominio administrativo permanece aislado.
6. Confirmar que los datos de prueba almacenados por origen en `localStorage` no aparecen automáticamente en el nuevo subdominio. Conservar o exportar únicamente los datos DEMO que realmente interese migrar.

Ningún subdominio exige registrar un nuevo dominio; sí exige configurar el DNS y verificar su asignación en Vercel.

Fuentes: https://vercel.com/docs/monorepos ; https://vercel.com/docs/domains/set-up-custom-domain
