# Migration Guide: Java to TypeScript Backend

This guide helps you migrate from the Java Spring Boot backend to the new TypeScript Fastify backend.

## Quick Migration Path

### 1. Backup Current State

```bash
# From quickstart root
make capture-logs
docker compose ps > services-snapshot.txt
```

### 2. Stop Java Backend

```bash
docker compose stop backend-service
```

### 3. Build TypeScript Backend

```bash
cd backend-ts
pnpm install
cd ..

# Build Docker image
docker compose -f docker/backend-service-ts/compose.yaml build
```

### 4. Start TypeScript Backend

```bash
docker compose -f docker/backend-service-ts/compose.yaml up -d
```

### 5. Verify

```bash
# Check health
curl http://localhost:8080/health

# Check readiness
curl http://localhost:8080/ready

# View logs
docker logs -f backend-service-ts
```

## Update Makefile

To integrate the TypeScript backend into your existing Makefile, replace references to `backend-service` with `backend-service-ts`.

### Example Changes

```makefile
# Before
SERVICES = canton postgres keycloak pqs backend-service frontend

# After
SERVICES = canton postgres keycloak pqs backend-service-ts frontend

# Add TypeScript-specific targets
.PHONY: backend-ts-logs
backend-ts-logs:
	docker logs -f backend-service-ts

.PHONY: backend-ts-shell
backend-ts-shell:
	docker exec -it backend-service-ts sh

.PHONY: backend-ts-restart
backend-ts-restart:
	docker compose -f docker/backend-service-ts/compose.yaml restart
```

## Configuration Mapping

The TypeScript backend uses the same environment variables as the Java backend with some additions:

### Unchanged Variables

- `LEDGER_HOST`, `LEDGER_PORT`
- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DATABASE`
- `POSTGRES_USERNAME`, `POSTGRES_PASSWORD`
- `AUTH_MODE`
- `OAUTH2_ISSUER_URL`, `OAUTH2_CLIENT_ID`, `OAUTH2_CLIENT_SECRET`
- `SHARED_SECRET`

### New Variables

- `LOG_LEVEL` - Controls logging verbosity (fatal, error, warn, info, debug, trace)
- `NODE_ENV` - Environment mode (development, production, test)

### Removed Variables

Java-specific variables like `JAVA_OPTS`, `SPRING_PROFILES_ACTIVE` are not needed.

## API Compatibility

The TypeScript backend maintains full API compatibility with the Java backend:

### Endpoints (Unchanged)

```
POST   /api/licenses
GET    /api/licenses/:contractId
GET    /api/licenses/user/:userId
POST   /api/licenses/:licenseId/renew
GET    /health
GET    /ready
```

### Request/Response Formats (Unchanged)

All request and response schemas remain the same, ensuring frontend compatibility.

### Authentication (Unchanged)

Both OAuth2 and shared secret modes work identically.

## Rollback Plan

If you need to rollback to the Java backend:

```bash
# Stop TypeScript backend
docker compose -f docker/backend-service-ts/compose.yaml down

# Start Java backend
docker compose -f docker/backend-service/compose.yaml up -d
```

To preserve the option to rollback, keep the Java backend Docker configuration:

```bash
# Rename instead of deleting
mv docker/backend-service docker/backend-service-java-backup
```

## Performance Tuning

### Memory Limits

The TypeScript backend uses significantly less memory. Update Docker Compose:

```yaml
services:
  backend-service-ts:
    mem_limit: 512m  # vs 2g for Java
```

### Connection Pools

Database connection pool sizes can be reduced:

```typescript
// src/config/database.ts
const client = postgres(connectionString, {
  max: 10,  // vs 20 for Java
  idle_timeout: 20,
  connect_timeout: 10,
});
```

## Monitoring & Observability

### Logs

TypeScript backend uses structured JSON logging (Pino):

```bash
# View structured logs
docker logs backend-service-ts | jq

# Filter by level
docker logs backend-service-ts | jq 'select(.level >= 40)'  # errors and above
```

### Health Checks

Enhanced readiness check provides dependency status:

```bash
curl http://localhost:8080/ready
# {
#   "status": "ready",
#   "checks": {
#     "database": "ok",
#     "ledger": "ok"
#   }
# }
```

### Metrics (Optional)

To add Prometheus metrics:

```bash
cd backend-ts
pnpm add prom-client
# Follow implementation guide in docs
```

## Testing Migration

### 1. Parallel Testing

Run both backends simultaneously on different ports:

```yaml
# Java backend on 8080
# TypeScript backend on 8081

services:
  backend-service-ts:
    ports:
      - "8081:8080"
```

### 2. Load Testing

Compare performance:

```bash
# Install k6 or artillery
npm install -g artillery

# Run load test against both
artillery quick --count 100 --num 10 http://localhost:8080/health
artillery quick --count 100 --num 10 http://localhost:8081/health
```

### 3. Functional Testing

Ensure all API endpoints work identically:

```bash
# Use your existing test suite
# Or create simple smoke tests
npm test
```

## Common Issues

### Issue: APP_PROVIDER_PARTY not found

**Solution**: Ensure onboarding volume is mounted and onboarding service completed successfully.

```bash
# Check volume
docker volume inspect quickstart_onboarding

# Check onboarding logs
docker logs splice-onboarding
```

### Issue: Cannot connect to PostgreSQL

**Solution**: Verify PQS is running and database exists.

```bash
# Check PQS logs
docker logs pqs-app-provider

# Test connection
docker exec -it postgres psql -U cnadmin -d pqs-app-provider -c '\dt'
```

### Issue: Port 8080 already in use

**Solution**: Stop the Java backend or change the TypeScript backend port.

```bash
# Stop Java backend
docker compose stop backend-service

# OR change TypeScript port in docker-compose.yaml
ports:
  - "8081:8080"
```

## Next Steps

After successful migration:

1. **Remove Java Backend** (optional)
   ```bash
   rm -rf docker/backend-service-java-backup
   ```

2. **Update CI/CD** pipelines to build TypeScript backend

3. **Monitor Performance** for 1-2 weeks

4. **Optimize** based on production metrics

5. **Document** any project-specific changes

## Support

For issues or questions:

- Check logs: `docker logs -f backend-service-ts`
- Review README: `backend-ts/README.md`
- File issue on project repository
