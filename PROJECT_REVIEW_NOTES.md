# Stayfinder Project Review Notes

Date: 2026-06-11

Scope: Static review only. No source code was modified during the original inspection, and build/test commands were not run because they can create or update generated files. At the time of inspection, `src/main/resources/` was untracked.

## Project Shape

- Gradle multi-module project: `api`, `corp`, `batch`.
- Root `src/` also exists, but the root application class is commented out.
- `application.properties` exists under root `src/main/resources`, not under `api/corp/batch/src/main/resources`.
- Main domains:
  - `api`: user signup, phone certification, terms, login/token, payment callback.
  - `corp`: business approval/request, corporation user, room/room unit, search, reservation.
  - `batch`: Quartz-style room stock generation job.

## Critical Findings

1. Login password validation is broken.
   - File: `api/src/main/java/com/vacation/platform/api/login/service/impl/LoginServiceImpl.java`
   - `passwordValidate()` hashes the incoming password and compares the raw password against that newly created hash. This means any password can pass as long as the email exists.
   - The corporation login flow reuses the same method.

2. Corporation user passwords are stored in plain text.
   - File: `corp/src/main/java/com/vacation/platform/corp/corperation/service/impl/CorporationServiceImpl.java`
   - `createCorporationUser()` saves `corpUserDTO.getPassword()` directly.

3. Refresh/access token handling has multiple logic errors.
   - File: `api/src/main/java/com/vacation/platform/api/login/service/impl/LoginServiceImpl.java`
   - Token lifetimes are millisecond values, but Redis is called with `TimeUnit.DAYS`.
   - File: `api/src/main/java/com/vacation/platform/api/common/jwt/filter/LoginFilter.java`
   - Refresh exclusion uses `||`, making the condition effectively always true.

4. Reservation and room stock allocation can throw null pointer exceptions.
   - File: `corp/src/main/java/com/vacation/platform/corp/reservation/service/impl/ReservationServiceImpl.java`
   - `mapping.getReservation()` and `mapping.getRoomStock()` are accessed before being initialized.
   - File: `corp/src/main/java/com/vacation/platform/corp/corperation/service/impl/RoomStockServiceImpl.java`
   - Code fetches stocks where `reservation_id IS NULL`, then calls methods on `stock.getReservation()`.

5. JPA mappings likely break application startup.
   - File: `api/src/main/java/com/vacation/platform/api/user/entity/User.java`
   - File: `api/src/main/java/com/vacation/platform/api/terms/entity/Terms.java`
   - `@OneToMany(mappedBy = "userId")` and `mappedBy = "termsId"` point to scalar ID fields instead of relationship fields.

## High Priority Findings

1. Module dependencies are not declared even though modules import each other.
   - File: `build.gradle`
   - `corp` imports `api` classes.
   - `batch` imports `corp` services.
   - There are no visible `implementation project(':api')` or `implementation project(':corp')` declarations.

2. Batch module uses Quartz APIs without a visible Quartz dependency.
   - File: `batch/src/main/java/com/vacation/platform/batch/room_produce/config/RoomStockConfig.java`
   - File: `build.gradle`
   - `org.quartz.*` and `SchedulerFactoryBean` are used, but `spring-boot-starter-quartz` is not present.

3. Module jars may not receive required application properties.
   - File: `src/main/resources/application.properties`
   - `api/corp/batch/src/main/resources` directories do not exist.
   - Required values such as `secret.key`, `aes256.*`, `nurigo.*`, datasource, and Redis settings may not be packaged into module jars.

4. Secrets are hardcoded in local files.
   - File: `src/main/resources/application.properties`
   - File: `docker-compose.yml`
   - Includes DB password, SMS API credentials, AES key/IV, and JWT secret.

5. Corporation user and approved corporation are not linked.
   - File: `corp/src/main/java/com/vacation/platform/corp/corperation/service/impl/CorporationServiceImpl.java`
   - File: `corp/src/main/java/com/vacation/platform/corp/corperation/service/impl/RoomServiceImpl.java`
   - `createCorporationUser()` checks the business license but does not attach the approved `Corporation` to `CorporateUser`.
   - Room creation later uses `corporateUser.getCorporation()`, which can be null.

6. Security matcher ordering exposes corporation APIs.
   - File: `api/src/main/java/com/vacation/platform/api/config/SecurityConfig.java`
   - `/api/v1/corp/**` is permitted before more specific corporation user matchers, so protected corp endpoints may be unintentionally public.

7. Deployment starts three services without explicit port separation.
   - File: `start.sh`
   - File: `docker-compose.yml`
   - `api.jar`, `corp.jar`, and `batch.jar` are started together, but no per-service `server.port` is set in the script.
   - `docker-compose.yml` exposes only `8080:8080`.

## Medium Priority Findings

1. Search SQL does not match the current entity model.
   - File: `corp/src/main/java/com/vacation/platform/corp/serch/repository/support/SearchRepositorySupport.java`
   - SQL references `corp_user`, `products`, and `r.name`.
   - Current entities use tables like `corporation`, `room`, and `room_stock`; `Room` has `room_type`, not `name`.

2. Terms registration has fragile update/version logic.
   - File: `api/src/main/java/com/vacation/platform/api/terms/service/serviceImpl/TermsServiceImpl.java`
   - Existing terms are updated and then a new `Terms` is saved again.
   - `Objects.requireNonNull(terms)` inside exception handling can mask the original error.
   - `TermsSub.version` is globally unique, but version is set from `termsId`, which is not a real per-terms version sequence.

3. GET endpoint expects a request body.
   - File: `api/src/main/java/com/vacation/platform/api/terms/controller/TermsController.java`
   - `/api/v1/terms/sub` is a `GET` endpoint using `@RequestBody`, which many clients/proxies handle poorly.

4. Payment flow has incomplete status handling.
   - File: `api/src/main/java/com/vacation/platform/api/payment/service/impl/PaymentServiceImpl.java`
   - On `SUCCESS`, it only checks whether a detail row exists.
   - On non-success, it creates a detail row.
   - `attemptNumber` is incremented without null initialization.

5. Repository `@Param` imports are inconsistent.
   - Several repositories import `io.lettuce.core.dynamic.annotation.Param` instead of Spring Data `org.springframework.data.repository.query.Param`.

6. Tests are effectively absent.
   - Files under `src/test/java/com/vacation/platform/stayfinder` are commented out.
   - No module-level test sources were found under `api`, `corp`, or `batch`.

## Suggested Fix Order

1. Fix authentication and token flow first.
2. Fix Gradle module dependencies and per-module resources.
3. Fix JPA relationship mappings so the app can start reliably.
4. Fix corporation account linkage and room ownership.
5. Rework reservation/room-stock allocation around a real `Reservation` entity lifecycle.
6. Reconcile search SQL with the current schema.
7. Add minimal integration tests for login, signup/certification, room creation, reservation, and app context startup.

