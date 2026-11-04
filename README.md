# Smart Planner (Gestión Inteligente del Tiempo Estudiantil)

> **Evaluación 3: Ejecución del Proceso de Programación y Desarrollo del Prototipo**  
> **Carrera:** Ingeniería en Informática — **Asignatura:** Ingeniería de Software (INACAP)  
> **Docente:** Oscarina Sanabria  
> **Integrantes:** Eduardo Sánchez, Cristopher Toloza, Tomás Palma, Benjamín Leiva  

---

## 1. Resumen del Proyecto

**Smart Planner** es una aplicación orientada al bienestar y la organización activa del tiempo para estudiantes de educación superior y secundaria en Chile.

A diferencia de agendas pasivas tradicionales (que registran más del 60% de abandono en las primeras 3 semanas por fatiga de reorganización manual), Smart Planner incorpora **empujones digitales (*digital nudges*)**:
* Detecta automáticamente espacios libres entre actividades superiores a 30 minutos.
* Sugiere micro-acciones de bienestar: pausas activas (caminata/estiramiento), descanso visual e hidratación (regla 20-20-20), colaciones saludables y desconexión breve.
* **Regla estricta de protección del sueño (SOCHIMES):** Bloqueo automático de notificaciones y sugerencias entre las **23:00 y las 07:00 hrs**.
* **Alerta sonora y notificación web nativa:** Funcionalidad crítica de aviso inmediato con opción de incorporar la sugerencia a la agenda con un solo clic.

---

## 2. Puesta en Marcha Rápida (1 Comando)

### Prerrequisitos
* Node.js v18+ instalado.

### Instalación y Ejecución
```bash
# 1. Instalar dependencias
npm install

# 2. Levantar la aplicación completa (Frontend Vite + Backend API)
npm start
# o alternativamente:
npm run dev:all
```

* **Frontend:** [http://localhost:5173](http://localhost:5173)
* **Backend API (Telemetría y Auditoría):** [http://localhost:3001](http://localhost:3001)

### Credenciales de Demostración Rápida
Para la evaluación y demostración oral docente, puedes ingresar con:
* **Email:** `estudiante@inacap.cl`
* **Contraseña:** `Password123`
* *(O hacer clic directo en el botón "**⚡ Usar estudiante@inacap.cl**" en la pantalla de inicio)*.

---

## 3. Arquitectura y Tecnologías Emergentes

```
[ Cliente Web / Móvil PWA ] (React 19 + Vite)
       │
       ├───► Supabase Cloud (SaaS): PostgreSQL 15 + Supabase Auth + Row Level Security (RLS)
       │
       └───► Backend Node.js API (localhost:3001)
                  │
                  └───► MongoDB Atlas (SaaS): Logs de auditoría de Nudges y telemetría
```

* **SaaS (Software as a Service):** Supabase (gestión de identidades OAuth/JWT y base de datos relacional PostgreSQL sin servidor) y MongoDB Atlas (colección NoSQL documental `nudge_logs` para telemetría ágil).
* **IaaS (Infrastructure as a Service):** La arquitectura cloud subyacente se apoya en instancias contenerizadas y clústeres elásticos con réplicas y cifrado gestionado en centros de datos regionales (AWS / GCP).
* **Modo Demostración / Resiliencia:** Si la aplicación se ejecuta sin variables de entorno configuradas (`VITE_SUPABASE_URL`, `MONGODB_URI`), activa de forma transparente un almacenamiento local seguro (`localStorage` con aislamiento y log de auditoría local en disco `logs/nudge_audit.jsonl`), garantizando que la presentación en vivo **nunca falle por problemas de red o cuotas**.

---

## 4. Marco Normativo y Ético (Contexto Chileno)

1. **Ley N° 21.719 (Protección de Datos Personales):**
   * Consentimiento expreso, informado e inequívoco al momento del registro.
   * Cumplimiento del principio de finalidad: los datos se utilizan estrictamente para calendarización y bienestar.
   * Implementación de los **Derechos ARCO** (Acceso/Portabilidad mediante descarga de datos en JSON, y Cancelación/Derecho al Olvido con eliminación total de cuenta).
2. **Ley N° 21.459 (Delitos Informáticos):**
   * Políticas RLS (*Row Level Security*) en base de datos para impedir accesos ilícitos o entre estudiantes.
   * Auditoría y trazabilidad inmutable de eventos.
3. **Código Ético (ACM & Colegio de Ingenieros de Chile):**
   * Priorización de la salud mental frente a la sobreproductividad académica.
   * **Disclaimer no clínico (IEEE 2021):** Advertencia visible de que el sistema no sustituye evaluación médica o psicológica.

---

## 5. Buenas Prácticas de Seguridad (OWASP Mobile Top 10)

* **M1 (Improper Platform Usage):** Uso riguroso de RLS en base de datos PostgreSQL.
* **M2 (Insecure Data Storage):** Almacenamiento cifrado en reposo (AES-256) en la nube y contraseñas salteadas/hasheadas con bcrypt/Argon2 por Supabase Auth.
* **M3 (Insecure Communication):** Encriptación en tránsito con TLS 1.3 / HTTPS.
* **M4 (Insecure Authentication):** Validación estricta de complejidad de contraseñas (mínimo 8 caracteres, mayúscula y número).
* **M5 (Insufficient Cryptography / Secrets Leak):** Separación estricta de variables de servidor (`MONGODB_URI` en `server.js`) sin exponer credenciales en el bundle público del navegador (Vite).

---

## 6. Estructura de Sprints (SCRUM)

* **Sprint 1:** Definición de historias de usuario, modelo de datos relacional (`schema.sql`), autenticación y consentimiento según Ley 21.719.
* **Sprint 2:** Agenda y calendario categorizado, motor de detección de espacios libres (`nudgeEngine.js`), regla de sueño y API de auditoría.
* **Sprint 3 (Evaluación Actual):** Alerta sonora y notificación web interactiva, panel de estadísticas semanales, interfaz responsive mobile-first, ejercicios de derechos ARCO y resiliencia offline/cloud.
