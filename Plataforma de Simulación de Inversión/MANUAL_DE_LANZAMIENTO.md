# Manual de lanzamiento — InvestSim

| Campo | Valor |
| :--- | :--- |
| Producto | InvestSim — Plataforma de Simulación de Inversión |
| Versión del documento | 1.0 |
| Fecha | 14 de noviembre de 2026 |
| Tipo de lanzamiento | Aplicación web educativa |
| Audiencia | Equipo de desarrollo, despliegue y soporte |

## 1. Objetivo

Este manual describe los pasos necesarios para preparar, ejecutar, verificar y desplegar InvestSim en un entorno local o productivo. Incluye requisitos, configuración, variables de entorno, comandos de lanzamiento, pruebas de aceptación, operación y solución de problemas.

InvestSim es una plataforma educativa: todos los saldos, instrumentos y operaciones son simulados y no representan dinero real.

## 2. Alcance del lanzamiento

El lanzamiento incluye:

- Registro e inicio de sesión de usuarios con JWT.
- Saldo inicial ficticio para cada usuario.
- Catálogo de acciones y ETFs con cotizaciones e históricos.
- Creación de portafolios y posiciones.
- Compra y venta simulada.
- Cuentas de ahorro con interés compuesto.
- Escenarios de mercado (choques, volatilidad y duración).
- Análisis de rendimiento, volatilidad, drawdown y Sharpe.
- Contenido educativo.
- Panel de administración de usuarios, instrumentos, ingesta y contenido educativo.

No incluye:

- Dinero real ni integración con brokers.
- Pagos, facturación o suscripciones.
- Recuperación de contraseña por correo.
- Aplicación móvil nativa.

## 3. Arquitectura de la solución

```
Navegador
   │
   ▼
Frontend React + Vite  (http://localhost:5500)
   │  /api (proxy en desarrollo)
   ▼
Backend Spring Boot     (http://localhost:8082)
   │
   ├── PostgreSQL       (localhost:5432/investsim)
   │
   └── Proveedores de mercado
        Alpha Vantage → Twelve Data → Stooq → Synthetic
```

Componentes principales:

| Componente | Tecnología | Puerto por defecto |
| :--- | :--- | :--- |
| Frontend | React 18, Vite 5, Bootstrap 5, React Router | 5500 |
| Backend | Java 21, Spring Boot 4.1.1, Spring Security, JPA | 8082 |
| Base de datos | PostgreSQL | 5432 |
| Documentación API | Swagger UI | 8082 (`/swagger-ui.html`) |

El backend expone la API bajo el prefijo `/api`. El frontend usa `/api` como base y, en desarrollo, Vite redirige las peticiones al backend en el puerto 8082.

## 4. Requisitos previos

### 4.1 Software

| Requisito | Versión mínima | Verificación |
| :--- | :--- | :--- |
| Java JDK | 21 | `java -version` |
| Maven | 3.9+ (o usar el wrapper incluido) | `.\mvnw.cmd -v` / `./mvnw -v` |
| Node.js | 18+ (recomendado 20 LTS o superior) | `node -v` |
| npm | 9+ | `npm -v` |
| PostgreSQL | 14+ | `psql --version` |
| Git | 2.30+ | `git --version` |
| Navegador | Chrome, Edge o Firefox actualizado | — |

### 4.2 Recursos sugeridos

| Recurso | Mínimo | Recomendado |
| :--- | :--- | :--- |
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Disco | 10 GB libres | 20 GB libres |

### 4.3 Puertos

Verifique que estén libres antes de iniciar:

| Puerto | Uso |
| :--- | :--- |
| 5500 | Frontend (Vite, desarrollo o `preview`) |
| 8082 | Backend Spring Boot |
| 5432 | PostgreSQL |

En Windows:

```powershell
Get-NetTCPConnection -LocalPort 5500,8082,5432 -ErrorAction SilentlyContinue
```

En Linux/macOS:

```bash
ss -ltnp | grep -E ':(5500|8082|5432)\b'
```

### 4.4 Accesos y claves opcionales

- Clave de Alpha Vantage: `ALPHA_VANTAGE_API_KEY`.
- Clave de Twelve Data: `TWELVE_DATA_API_KEY`.
- Stooq no requiere clave.
- El proveedor `Synthetic` funciona sin red y sin claves; se usa como respaldo.

Si no se configura ninguna clave, la ingesta intenta Stooq y, si falla, genera datos deterministas con `Synthetic`.

## 5. Estructura del proyecto

```
proy_ing_soft/
├── plataforma_simulacion_inversion.md
├── proyecto_final_items_calificacion.md
└── Plataforma de Simulación de Inversión/
    ├── MANUAL_DE_LANZAMIENTO.md
    ├── backend/
    │   ├── mvnw
    │   ├── mvnw.cmd
    │   ├── pom.xml
    │   ├── README.md
    │   └── src/
    └── frontend/
        ├── package.json
        ├── vite.config.js
        ├── .env.example
        └── src/
```

> La ruta contiene espacios y caracteres acentuados. En todos los comandos use comillas dobles alrededor de la ruta.

## 6. Preparación de la base de datos

### 6.1 Crear la base de datos

Conéctese a PostgreSQL:

```bash
psql -U postgres
```

Ejecute:

```sql
CREATE DATABASE investsim;
```

Opcionalmente, cree un usuario dedicado:

```sql
CREATE USER investsim_app WITH PASSWORD 'cambie-esta-clave';
GRANT ALL PRIVILEGES ON DATABASE investsim TO investsim_app;
\c investsim
GRANT ALL ON SCHEMA public TO investsim_app;
```

### 6.2 Esquema

El esquema se crea y actualiza automáticamente con Hibernate según `JPA_DDL_AUTO`:

- Desarrollo: `update`.
- Producción: ejecutar una vez con `update` y luego cambiar a `validate` para evitar cambios automáticos.

No se requiere ejecutar scripts SQL manuales ni herramientas de migración.

### 6.3 Verificar la conexión

```bash
psql "postgresql://postgres:postgres@localhost:5432/investsim" -c "select current_database();"
```

## 7. Variables de entorno

### 7.1 Backend

Spring Boot lee variables de entorno del proceso; no carga archivos `.env` automáticamente.

| Variable | Valor por defecto | Obligatoria en producción | Descripción |
| :--- | :--- | :--- | :--- |
| `DB_URL` | `jdbc:postgresql://localhost:5432/investsim` | Sí | URL JDBC de PostgreSQL |
| `DB_USERNAME` | `postgres` | Sí | Usuario de base de datos |
| `DB_PASSWORD` | `postgres` | Sí | Contraseña de base de datos |
| `JPA_DDL_AUTO` | `update` | Sí | `update` en primer arranque; luego `validate` |
| `JWT_SECRET` | Clave de desarrollo | Sí | Secreto para firmar JWT, mínimo 32 caracteres |
| `JWT_EXPIRATION_HOURS` | `2` | No | Vigencia del token en horas |
| `ADMIN_EMAIL` | `admin@investsim.co` | Sí | Email del administrador inicial |
| `ADMIN_PASSWORD` | `Admin123!` | Sí | Contraseña del administrador inicial |
| `DEFAULT_INITIAL_BALANCE` | `100000` | No | Saldo ficticio inicial por usuario |
| `ALPHA_VANTAGE_API_KEY` | vacío | No | Clave de Alpha Vantage |
| `ALPHA_VANTAGE_BASE_URL` | `https://www.alphavantage.co` | No | URL base de Alpha Vantage |
| `TWELVE_DATA_API_KEY` | vacío | No | Clave de Twelve Data |
| `TWELVE_DATA_BASE_URL` | `https://api.twelvedata.com` | No | URL base de Twelve Data |
| `STOOQ_BASE_URL` | `https://stooq.com` | No | URL base de Stooq |
| `SYNTHETIC_MARKET_DATA_ENABLED` | `true` | No | Habilita el proveedor sintético |
| `SYNTHETIC_BASE_PRICE` | `100` | No | Precio base para datos sintéticos |
| `INGESTION_ENABLED` | `true` | No | Habilita la ingesta programada |
| `INGESTION_CRON` | `0 0 */6 * * *` | No | Cron de ingesta (cada 6 horas) |
| `INGESTION_HISTORY_DAYS` | `365` | No | Días de histórico a descargar |

Ejemplo en PowerShell:

```powershell
$env:DB_URL = "jdbc:postgresql://localhost:5432/investsim"
$env:DB_USERNAME = "postgres"
$env:DB_PASSWORD = "postgres"
$env:JPA_DDL_AUTO = "update"
$env:JWT_SECRET = "cambie-este-secreto-por-uno-de-mas-de-32-caracteres"
$env:ADMIN_EMAIL = "admin@investsim.co"
$env:ADMIN_PASSWORD = "Admin123!"
```

Ejemplo en Linux/macOS:

```bash
export DB_URL="jdbc:postgresql://localhost:5432/investsim"
export DB_USERNAME="postgres"
export DB_PASSWORD="postgres"
export JPA_DDL_AUTO="update"
export JWT_SECRET="cambie-este-secreto-por-uno-de-mas-de-32-caracteres"
export ADMIN_EMAIL="admin@investsim.co"
export ADMIN_PASSWORD="Admin123!"
```

> Las variables definidas en una terminal solo aplican a ese proceso. Si el backend se ejecuta como servicio, configúrelas en el archivo de entorno del servicio o en el IDE.

### 7.2 Frontend

| Variable | Valor por defecto | Descripción |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `/api` | Ruta base de la API |

En desarrollo se recomienda dejar `/api` y usar el proxy de Vite. Si el frontend llama directamente al backend, use:

```env
VITE_API_BASE_URL=http://localhost:8082/api
```

Las variables `VITE_*` se incorporan en tiempo de compilación. Después de cambiarlas, reconstruya el frontend.

## 8. Lanzamiento local (desarrollo)

### 8.1 Paso 1 — Iniciar PostgreSQL

Confirme que el servicio esté activo:

```powershell
Get-Service postgresql*
```

En Linux:

```bash
sudo systemctl status postgresql
```

### 8.2 Paso 2 — Compilar y ejecutar el backend

```powershell
cd "C:\ruta\proy_ing_soft\Plataforma de Simulación de Inversión\backend"
.\mvnw.cmd clean package
.\mvnw.cmd spring-boot:run
```

En Linux/macOS:

```bash
cd "/ruta/proy_ing_soft/Plataforma de Simulación de Inversión/backend"
chmod +x mvnw
./mvnw clean package
./mvnw spring-boot:run
```

Alternativa con JAR:

```powershell
java -jar target\investsim-0.0.1-SNAPSHOT.jar
```

En Linux/macOS:

```bash
java -jar target/investsim-0.0.1-SNAPSHOT.jar
```

Señales de que el backend arrancó correctamente:

- El log muestra `Started ...` y el puerto `8082`.
- Swagger UI responde en `http://localhost:8082/swagger-ui.html`.
- El endpoint público de instrumentos responde.

Verificación rápida:

```powershell
Invoke-RestMethod -Uri "http://localhost:8082/api/market/instruments" | ConvertTo-Json -Depth 4
```

### 8.3 Paso 3 — Ejecutar pruebas del backend (opcional recomendado)

Las pruebas usan H2 en memoria en modo PostgreSQL y no requieren PostgreSQL:

```powershell
.\mvnw.cmd test
```

Resultado esperado: `BUILD SUCCESS` y cero fallos.

### 8.4 Paso 4 — Instalar y ejecutar el frontend

En otra terminal:

```powershell
cd "C:\ruta\proy_ing_soft\Plataforma de Simulación de Inversión\frontend"
Copy-Item .env.example .env
npm install
npm run dev
```

En Linux/macOS:

```bash
cd "/ruta/proy_ing_soft/Plataforma de Simulación de Inversión/frontend"
cp .env.example .env
npm install
npm run dev
```

Abra `http://localhost:5500`.

El proxy de Vite redirige `/api` a `http://localhost:8082`. Si el backend no está activo, el frontend mostrará un mensaje de error de conexión.

### 8.5 Paso 5 — Datos iniciales

En el primer arranque con una base vacía, los seeders crean:

- Usuario administrador (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).
- Catálogo de instrumentos: AAPL, MSFT, GOOGL, AMZN, NVDA, TSLA, SPY, QQQ, VOO, VTI.
- Contenido educativo básico.
- Secuencias internas para generar identificadores.

Credenciales iniciales de administración:

| Campo | Valor |
| :--- | :--- |
| Email | `admin@investsim.co` |
| Contraseña | `Admin123!` |
| Rol | `ADMIN` |

> Cambie estas credenciales antes de un despliegue productivo.

Roles del sistema:

- `ADMIN`: acceso al panel de administración.
- `CLIENTE`: acceso a los módulos de simulación.

### 8.6 Verificación de autenticación

```powershell
$body = @{ email = "admin@investsim.co"; password = "Admin123!" } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri "http://localhost:8082/api/auth/login" -ContentType "application/json" -Body $body
$token = $login.data.token
$token.Substring(0, 20) + "..."
```

Prueba de una operación administrativa:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8082/api/market/ingest" -Headers @{ Authorization = "Bearer $token" }
```

## 9. Lista de verificación del lanzamiento

Ejecute esta lista en un entorno limpio antes de declarar el lanzamiento como exitoso.

| ID | Paso | Resultado esperado |
| :--- | :--- | :--- |
| L-01 | Abrir `/swagger-ui.html` | Swagger carga y lista los controladores |
| L-02 | Iniciar sesión como administrador | Se recibe JWT y se accede al panel |
| L-03 | Consultar `/api/market/instruments` | Se listan los 10 instrumentos iniciales |
| L-04 | Ejecutar ingesta desde Administración → Mercado | Logs con estado `SUCCESS` o respaldo sintético |
| L-05 | Registrar un usuario nuevo | Saldo inicial de 100000 y acceso al dashboard |
| L-06 | Crear un portafolio | Aparece con estado activo y sin posiciones |
| L-07 | Comprar un instrumento | Se descuenta saldo y se crea la posición |
| L-08 | Vender parte de la posición | Se abona saldo y se actualiza la posición |
| L-09 | Abrir análisis del portafolio | Gráfica y métricas sin errores |
| L-10 | Simular y abrir una cuenta de ahorro | Se descuenta capital y se muestra proyección |
| L-11 | Cerrar la cuenta de ahorro | Se devuelve capital más intereses al saldo |
| L-12 | Simular y guardar un escenario | Se muestra impacto y queda en el historial |
| L-13 | Abrir una guía educativa | El contenido completo se muestra en el modal |
| L-14 | Actualizar perfil y contraseña | Cambios persistentes y nueva sesión válida |
| L-15 | Como admin, desactivar un usuario de prueba | El usuario deja de aparecer como activo |
| L-16 | Crear/editar/desactivar contenido educativo | Los cambios se reflejan en Aprendizaje |
| L-17 | Recargar una ruta interna del frontend | El servidor devuelve `index.html` sin 404 |
| L-18 | Ejecutar `npm run build` | Build exitoso en `frontend/dist` |

## 10. Lanzamiento productivo

### 10.1 Backend

1. Compile el JAR:

```bash
./mvnw clean package
```

2. Copie `target/investsim-0.0.1-SNAPSHOT.jar` al servidor, por ejemplo `/opt/investsim/investsim.jar`.

3. Defina las variables de entorno en `/etc/investsim/investsim.env`:

```env
DB_URL=jdbc:postgresql://localhost:5432/investsim
DB_USERNAME=investsim_app
DB_PASSWORD=cambie-esta-clave
JPA_DDL_AUTO=validate
JWT_SECRET=cambie-este-secreto-por-uno-de-mas-de-32-caracteres
JWT_EXPIRATION_HOURS=2
ADMIN_EMAIL=admin@investsim.co
ADMIN_PASSWORD=cambie-esta-clave
DEFAULT_INITIAL_BALANCE=100000
SYNTHETIC_MARKET_DATA_ENABLED=true
INGESTION_ENABLED=true
INGESTION_CRON=0 0 */6 * * *
INGESTION_HISTORY_DAYS=365
```

> En el primer arranque de una base nueva use `JPA_DDL_AUTO=update`; una vez creado el esquema, cambie a `validate`.

4. Ejecute:

```bash
java -jar /opt/investsim/investsim.jar
```

5. Servicio systemd de ejemplo:

```ini
[Unit]
Description=InvestSim backend
After=network.target postgresql.service

[Service]
User=investsim
WorkingDirectory=/opt/investsim
EnvironmentFile=/etc/investsim/investsim.env
ExecStart=/usr/bin/java -jar /opt/investsim/investsim.jar
Restart=on-failure
SuccessExitStatus=143

[Install]
WantedBy=multi-user.target
```

Active el servicio:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now investsim
sudo systemctl status investsim
```

En Windows puede usar NSSM, WinSW o el Programador de tareas para ejecutar el JAR como servicio.

### 10.2 Frontend

1. Genere el build de producción:

```bash
cd frontend
npm ci
npm run build
```

2. El resultado queda en `frontend/dist`.

3. Publique `dist` con un servidor web. Ejemplo con Nginx:

```nginx
server {
    listen 80;
    server_name investsim.example.com;

    root /var/www/investsim;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

La regla `try_files ... /index.html` es obligatoria para que las rutas del frontend (`/dashboard`, `/portafolios`, etc.) funcionen al recargar la página.

4. Si frontend y backend están en el mismo dominio mediante el proxy `/api`, no se requiere cambiar `VITE_API_BASE_URL`.

### 10.3 CORS

El backend permite por defecto orígenes locales:

- `http://localhost:*`
- `http://127.0.0.1:*`

Para producción se recomienda servir frontend y backend bajo el mismo dominio mediante un proxy inverso. Si se usan dominios separados, actualice `SecurityConfig.corsConfigurationSource()` con el dominio real y recompile el backend.

### 10.4 HTTPS

Configure TLS en el proxy inverso (por ejemplo, Certbot con Nginx) y redirija HTTP a HTTPS. No exponga PostgreSQL a Internet.

### 10.5 Ingesta de datos

- La ingesta programada se ejecuta según `INGESTION_CRON` (por defecto cada 6 horas).
- La ingesta manual está disponible en Administración → Mercado o en `POST /api/market/ingest` (solo ADMIN).
- Si los proveedores externos fallan, el proveedor `Synthetic` mantiene el flujo operativo.
- Para datos reales configure `ALPHA_VANTAGE_API_KEY` o `TWELVE_DATA_API_KEY`.

## 11. Operación y mantenimiento

### 11.1 Respaldo de base de datos

Crear respaldo:

```bash
pg_dump -U postgres -Fc investsim > investsim_$(date +%Y%m%d_%H%M).dump
```

Restaurar:

```bash
pg_restore -U postgres -d investsim --clean --if-exists investsim_20261114_1200.dump
```

Programe respaldos diarios y conserve al menos los últimos 7 días.

### 11.2 Actualización de la aplicación

1. Realice respaldo de la base de datos.
2. Detenga el backend.
3. Reemplace el JAR anterior por el nuevo.
4. Ejecute el arranque con `JPA_DDL_AUTO=update` si hay cambios de esquema; luego vuelva a `validate`.
5. Publique el nuevo `dist` del frontend.
6. Ejecute la lista de verificación del lanzamiento.

### 11.3 Logs

El backend escribe en la salida estándar. Si se ejecuta con systemd:

```bash
journalctl -u investsim -f
```

Nivel de log configurable en `application.yaml`:

```yaml
logging:
  level:
    co.uis.investsim: INFO
```

### 11.4 Detener la aplicación

- Backend en primer plano: `Ctrl+C`.
- Backend como servicio: `sudo systemctl stop investsim`.
- Frontend de desarrollo: `Ctrl+C` en la terminal de Vite.

## 12. Seguridad

Antes de un lanzamiento productivo:

- Cambie `ADMIN_PASSWORD` y `JWT_SECRET`.
- Use un usuario de PostgreSQL dedicado con permisos mínimos.
- No versione secretos ni archivos `.env` reales.
- Sirva la aplicación por HTTPS.
- Restrinja el acceso a Swagger en producción si no es necesario.
- Mantenga las claves de proveedores en variables de entorno.
- Use `JPA_DDL_AUTO=validate` después del primer arranque.
- Los JWT vencen según `JWT_EXPIRATION_HOURS` (2 horas por defecto); no hay refresh token.
- Las contraseñas se almacenan con BCrypt.
- Realice respaldos y pruebe la restauración periódicamente.

## 13. Solución de problemas

| Síntoma | Causa probable | Acción |
| :--- | :--- | :--- |
| `Connection refused` a PostgreSQL | Servicio detenido o `DB_URL` incorrecto | Inicie PostgreSQL y valide host, puerto y base |
| `password authentication failed` | Credenciales incorrectas | Corrija `DB_USERNAME` y `DB_PASSWORD` |
| Backend no inicia y muestra error de esquema | `JPA_DDL_AUTO=validate` con base vacía | Use `update` en el primer arranque |
| `Port 8082 already in use` | Otro proceso usa el puerto | Identifique el proceso y deténgalo o cambie el puerto |
| `Port 5500 already in use` | Vite estricto con puerto ocupado | Libere el puerto o ajuste `vite.config.js` |
| Frontend muestra error de conexión | Backend detenido o proxy incorrecto | Inicie el backend en 8082 y revise `vite.config.js` |
| `401 Unauthorized` | Token vencido, inválido o secreto cambiado | Inicie sesión nuevamente |
| `Invalid CORS request` | Origen no permitido | Use mismo dominio/proxy o actualice CORS |
| Swagger devuelve 404 | Ruta incorrecta o backend detenido | Use `/swagger-ui.html` y verifique el puerto |
| `java -version` no es 21 | JDK incorrecto | Configure `JAVA_HOME` y el PATH |
| `./mvnw: Permission denied` | Falta permiso de ejecución | `chmod +x mvnw` |
| `npm run build` falla por esbuild | Instalación incompleta | `npm rebuild esbuild` o reinstale `node_modules` |
| No aparecen datos iniciales | Base no vacía o perfil de pruebas | Use una base limpia y revise los logs de seeders |
| Ingesta falla con proveedores externos | Sin API keys o límite de solicitudes | Verifique claves o mantenga activo el proveedor sintético |
| Las rutas internas dan 404 en producción | Falta fallback SPA | Configure `try_files $uri $uri/ /index.html` |

## 14. Plan de reversa (rollback)

Si el lanzamiento presenta fallos críticos:

1. Detenga el backend y el frontend.
2. Restaure el JAR y el `dist` de la versión anterior.
3. Si hubo cambios de datos o esquema, restaure el respaldo de PostgreSQL.
4. Inicie los servicios.
5. Ejecute la lista de verificación mínima: L-01, L-02, L-03, L-05, L-06, L-07 y L-09.
6. Documente la causa y las acciones correctivas.

## 15. Anexos

### 15.1 Endpoints principales

| Método | Ruta | Descripción | Rol |
| :--- | :--- | :--- | :--- |
| POST | `/api/auth/login` | Inicio de sesión | Público |
| POST | `/api/users` | Registro | Público |
| GET | `/api/users/me` | Perfil propio | Autenticado |
| PUT | `/api/users/me` | Actualizar perfil | Autenticado |
| PATCH | `/api/users/me/password` | Cambiar contraseña | Autenticado |
| PATCH | `/api/users/me` | Desactivar cuenta propia | Autenticado |
| GET | `/api/users` | Listar usuarios | ADMIN |
| GET | `/api/users/{id}` | Consultar usuario | ADMIN |
| PATCH | `/api/users/{id}` | Desactivar usuario | ADMIN |
| GET | `/api/market/instruments` | Listar instrumentos | Público |
| GET | `/api/market/instruments/{symbol}` | Detalle | Público |
| GET | `/api/market/instruments/{symbol}/quote` | Cotización | Público |
| GET | `/api/market/instruments/{symbol}/history?days=180` | Histórico | Público |
| POST | `/api/market/instruments` | Crear instrumento | ADMIN |
| POST | `/api/market/instruments/{symbol}/ingest` | Ingesta por instrumento | ADMIN |
| POST | `/api/market/ingest` | Ingesta general | ADMIN |
| GET | `/api/market/logs` | Logs de ingesta | ADMIN |
| GET | `/api/market/providers` | Proveedor activo | Público |
| GET | `/api/portfolios` | Listar portafolios | Autenticado |
| POST | `/api/portfolios` | Crear portafolio | Autenticado |
| GET | `/api/portfolios/{id}` | Detalle | Autenticado |
| GET | `/api/portfolios/{id}/summary` | Resumen y saldo disponible | Autenticado |
| PUT | `/api/portfolios/{id}` | Actualizar | Autenticado |
| PATCH | `/api/portfolios/{id}` | Desactivar | Autenticado |
| POST | `/api/trading/buy` | Comprar | Autenticado |
| POST | `/api/trading/sell` | Vender | Autenticado |
| GET | `/api/trading/transactions` | Historial | Autenticado |
| GET | `/api/trading/transactions/portfolio/{id}` | Historial por portafolio | Autenticado |
| GET | `/api/savings` | Listar cuentas | Autenticado |
| GET | `/api/savings/{id}` | Consultar cuenta | Autenticado |
| POST | `/api/savings` | Abrir cuenta | Autenticado |
| POST | `/api/savings/simulate` | Simular proyección | Autenticado |
| PATCH | `/api/savings/{id}/close` | Cerrar cuenta | Autenticado |
| POST | `/api/scenarios/simulate` | Simular escenario | Autenticado |
| GET | `/api/scenarios` | Escenarios guardados | Autenticado |
| DELETE | `/api/scenarios/{id}` | Eliminar escenario | Autenticado |
| GET | `/api/analytics/portfolios/{id}?days=180` | Analítica de portafolio | Autenticado |
| GET | `/api/analytics/instruments/{symbol}?days=180` | Analítica de instrumento | Autenticado |
| GET | `/api/education?category=` | Contenido educativo | Público |
| GET | `/api/education/{slug}` | Detalle educativo | Público |
| POST | `/api/education` | Crear contenido | ADMIN |
| PUT | `/api/education/{id}` | Actualizar contenido | ADMIN |
| PATCH | `/api/education/{id}` | Desactivar contenido | ADMIN |

### 15.2 Datos de referencia

| Dato | Valor |
| :--- | :--- |
| URL frontend desarrollo | `http://localhost:5500` |
| URL backend | `http://localhost:8082` |
| Swagger UI | `http://localhost:8082/swagger-ui.html` |
| Usuario admin inicial | `admin@investsim.co` |
| Contraseña admin inicial | `Admin123!` |
| Saldo inicial por usuario | 100000 USD ficticios |
| Vigencia JWT | 2 horas |
| Instrumentos iniciales | AAPL, MSFT, GOOGL, AMZN, NVDA, TSLA, SPY, QQQ, VOO, VTI |

### 15.3 Acta de lanzamiento

| Campo | Responsable | Fecha | Resultado |
| :--- | :--- | :--- | :--- |
| Preparación de infraestructura | | | |
| Configuración de base de datos | | | |
| Despliegue de backend | | | |
| Despliegue de frontend | | | |
| Lista de verificación L-01 a L-18 | | | |
| Aprobación del lanzamiento | | | |

---

**Fin del manual.**
