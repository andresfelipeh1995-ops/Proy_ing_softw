# InvestSim - Backend API

Backend de la **Plataforma de Simulación de Inversión**, construido con Java 21 y Spring Boot. Permite registrar usuarios con saldo ficticio, crear portafolios, comprar y vender acciones/ETFs, simular cuentas de ahorro con interés compuesto, ejecutar escenarios de mercado y consultar análisis de rendimiento.

## Tecnologías

- **Java 21**
- **Spring Boot 4.1.1** (Web MVC, Spring Data JPA, Security, Validation, Cache, Scheduling)
- **PostgreSQL** (H2 en modo PostgreSQL para pruebas)
- **JWT** (`io.jsonwebtoken`)
- **WebClient** (consumo de APIs de mercado)
- **Lombok**
- **Springdoc OpenAPI / Swagger UI**

## Arquitectura

Estructura modular bajo `co.uis.investsim`:

```
config/       Seguridad, WebClient, cache, scheduler y seeders
common/       ApiResponse, excepciones, secuencias JPA y utilidades
marketdata/   Proveedores externos, ingesta, entidades, repositorios y consulta
user/         Registro, autenticación, perfil y saldo
portfolio/    Portafolios y posiciones
trading/      Compra/venta simulada y transacciones
savings/      Cuentas de ahorro e interés compuesto
scenario/     Simulación de escenarios (crisis, tasas, volatilidad)
analytics/    Rendimiento, volatilidad, drawdown y estadísticas
education/    Contenido educativo
```

Cada módulo separa entidades (`entity`), repositorios (`repository`), DTOs (`dto`), mappers (`mapper`), servicios (`service`) y controladores (`controller`). Los datos de mercado se obtienen mediante `MarketDataProvider` y son enrutados por `ProviderRouter` (Alpha Vantage → Twelve Data → Stooq → Synthetic).

## Datos de mercado

El sistema soporta cuatro proveedores, configurables con variables de entorno:

| Proveedor | Variable | Uso |
| :--- | :--- | :--- |
| Alpha Vantage | `ALPHA_VANTAGE_API_KEY` | Cotizaciones e históricos |
| Twelve Data | `TWELVE_DATA_API_KEY` | Cotizaciones e históricos |
| Stooq | — | Respaldo sin API key |
| Synthetic | `SYNTHETIC_MARKET_DATA_ENABLED` | Datos deterministas generados para probar el flujo sin red ni API keys |

Si no se configura ninguna API key, Stooq se intenta primero y, si falla, el proveedor `Synthetic` garantiza cotizaciones e históricos para acciones y ETFs. La ingesta se ejecuta con `IngestionScheduler` según el cron `INGESTION_CRON` y también puede lanzarse manualmente desde `/api/market/ingest`.

## Configuración

Se requiere una base de datos PostgreSQL y el esquema se crea/actualiza automáticamente con `JPA_DDL_AUTO=update`.

Variables principales:

```bash
DB_URL=jdbc:postgresql://localhost:5432/investsim
DB_USERNAME=postgres
DB_PASSWORD=postgres
JPA_DDL_AUTO=update
JWT_SECRET=una-clave-secreta-de-al-menos-32-caracteres
ADMIN_EMAIL=admin@investsim.co
ADMIN_PASSWORD=Admin123!
DEFAULT_INITIAL_BALANCE=100000
ALPHA_VANTAGE_API_KEY=
TWELVE_DATA_API_KEY=
SYNTHETIC_MARKET_DATA_ENABLED=true
INGESTION_ENABLED=true
INGESTION_CRON=0 0 */6 * * *
```

## Ejecución

```bash
./mvnw spring-boot:run
```

La API queda disponible en `http://localhost:8082` y Swagger UI en `http://localhost:8082/swagger-ui.html`.

Las pruebas usan H2 en memoria con `MODE=PostgreSQL`, por lo que no requieren una instancia de PostgreSQL:

```bash
./mvnw test
```

## Endpoints principales

### Autenticación y usuarios

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| POST | `/api/users` | Registro (saldo inicial ficticio) |
| POST | `/api/auth/login` | Inicio de sesión y emisión de JWT |
| GET | `/api/users/me` | Perfil del usuario autenticado |
| PUT | `/api/users/me` | Actualizar perfil |
| PATCH | `/api/users/me/password` | Cambiar contraseña |
| POST | `/api/users/me/balance` | Agregar saldo ficticio a la cuenta |

### Mercado

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| GET | `/api/market/instruments` | Listar instrumentos (`?type=STOCK` o `ETF`) |
| GET | `/api/market/instruments/{symbol}/quote` | Cotización actual |
| GET | `/api/market/instruments/{symbol}/history?days=180` | Histórico de precios |
| POST | `/api/market/ingest` | Ingesta manual (ADMIN) |
| GET | `/api/market/logs` | Bitácora de ingesta (ADMIN) |

### Portafolios y trading

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| POST/GET | `/api/portfolios` | Crear / listar portafolios |
| GET | `/api/portfolios/{id}` | Detalle con posiciones y resumen |
| POST | `/api/trading/buy` | Compra simulada |
| POST | `/api/trading/sell` | Venta simulada |
| GET | `/api/trading/transactions` | Historial de transacciones |

### Ahorro, escenarios y analítica

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| POST/GET | `/api/savings` | Abrir / listar cuentas de ahorro |
| POST | `/api/savings/simulate` | Proyección de interés compuesto |
| POST | `/api/scenarios/simulate` | Simular crisis o choque de mercado |
| GET | `/api/analytics/portfolios/{id}?days=180` | Rendimiento, volatilidad y drawdown |
| GET | `/api/analytics/instruments/{symbol}` | Estadísticas por instrumento |
| GET | `/api/education` | Contenido educativo |

## Seguridad

- Autenticación **JWT stateless**.
- Roles `CLIENTE` y `ADMIN`.
- Registro público, Swagger, catálogo de mercado y contenido educativo de lectura pública.
- Operaciones de administración protegidas con `@PreAuthorize("hasRole('ADMIN')")`.
- Contraseñas cifradas con BCrypt.

## Seeder inicial

Al iniciar con una base vacía se crean:

- Usuario administrador (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).
- Catálogo de acciones y ETFs de demostración.
- Contenido educativo básico sobre inversión, diversificación, ETFs, interés compuesto, volatilidad y escenarios.

Los seeders se desactivan con el perfil `test`.
