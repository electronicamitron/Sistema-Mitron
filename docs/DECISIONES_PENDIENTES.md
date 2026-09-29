# Decisiones reservadas — NO implementar en esta fase

1. **Backend con el ingeniero:** elegir entre Supabase (PostgreSQL/Auth/Storage/Edge Functions) y una API independiente con PostgreSQL, o una combinación; no instalar ni configurar credenciales todavía. Supabase es una plataforma que incluye PostgreSQL, no una alternativa a elegir **además** de PostgreSQL.
2. **Documentos**: si se elige Supabase Storage, definir buckets privados, referencias en base de datos, ciclo de validación CFDI y respaldo de archivos. Los backups de la base no sustituyen los backups del almacenamiento de objetos.
3. **Alcance de módulos:** la demo actual conserva Dashboard, Administración con tres pestañas, Inventario, Catálogo y Calendario; una especificación histórica del MVP propone una navegación distinta. Solicitar decisión empresarial **más adelante**, no modificar por esta migración.
4. **Autenticación real**: el login actual es exclusivamente demo; no debe usarse para proteger información real en producción.
5. **Dominio**: migrar administrador a subdominio y sitio público al dominio raíz **después** de verificar previews y Vercel. No tocar DNS hoy.
6. **Herramientas adicionales**: TanStack Table, TanStack Query, Zod, React Hook Form, Recharts, Playwright: introducir en etapas con pruebas, no mediante instalación masiva.
7. **Contenido comercial**: catálogo público, textos comerciales, medios de contacto, condiciones, política de privacidad; no inventar información ni publicarla antes de aprobación.
