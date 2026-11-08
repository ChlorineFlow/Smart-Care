@echo off
setlocal
cd /d "%~dp0"
rem Usage: smartcare-local.bat [dev|docker|stop]     (default: dev)
rem   dev    Postgres in Docker, API + Vite on your machine (hot reload) -> http://localhost:5173
rem   docker Postgres + API + nginx frontend from the repo Dockerfiles    -> http://localhost:8081
rem   stop   Stops/removes the containers (database data is kept in a volume)
set MODE=%1
if "%MODE%"=="" set MODE=dev
if /i "%MODE%"=="stop" goto stop

docker info >nul 2>&1 || (echo Docker Desktop is not running. Start it and retry. & exit /b 1)

if not exist .env (
  echo Creating .env for local use. Add SMTP_USER / SMTP_PASS to enable OTP emails.
  > .env echo DB_HOST=localhost
  >> .env echo DB_PORT=5432
  >> .env echo DB_NAME=smartcare
  >> .env echo DB_USER=postgres
  >> .env echo DB_PASSWORD=smartcare_local
  >> .env echo DB_SSL=false
  >> .env echo PORT=4000
  >> .env echo NODE_ENV=development
  >> .env echo CORS_ORIGIN=http://localhost:5173
  >> .env echo SMTP_HOST=smtp.gmail.com
  >> .env echo SMTP_PORT=587
  >> .env echo SMTP_USER=
  >> .env echo SMTP_PASS=
)

rem Use the password/port from .env so the DB container always matches what the API will use.
set DB_PASSWORD=smartcare_local
set DB_PORT=5432
for /f "tokens=1,* delims==" %%a in ('findstr /b "DB_PASSWORD= DB_PORT=" .env') do set %%a=%%b

docker network create smartcare >nul 2>&1
docker start smartcare-db >nul 2>&1 || docker run -d --name smartcare-db --network smartcare -p %DB_PORT%:5432 -e POSTGRES_PASSWORD=%DB_PASSWORD% -e POSTGRES_DB=smartcare -v "%cd%\server\schema.sql:/docker-entrypoint-initdb.d/schema.sql" -v smartcare-pgdata:/var/lib/postgresql/data postgres:16-alpine || exit /b 1

set /a N=0
:wait
set /a N+=1
if %N% gtr 30 (echo Database did not come up. See: docker logs smartcare-db & exit /b 1)
docker exec smartcare-db psql -U postgres -d smartcare -c "select 1 from admins" >nul 2>&1 || (timeout /t 2 /nobreak >nul & goto wait)

if /i "%MODE%"=="docker" goto docker

if not exist node_modules call npm ci
call npm run dev:full
exit /b

:docker
docker build -t smartcare-backend -f Dockerfile . || exit /b 1
docker build -t smartcare-frontend -f Dockerfile.frontend . || exit /b 1
docker rm -f smartcare-backend smartcare-frontend >nul 2>&1
rem nginx.conf proxies /api to the host name "smartcare-backend", hence the shared network and name.
docker run -d --name smartcare-backend --network smartcare -v "%cd%\.env:/app/.env:ro" -e DB_HOST=smartcare-db -e DB_PORT=5432 -p 4000:4000 smartcare-backend || exit /b 1
docker run -d --name smartcare-frontend --network smartcare -p 8081:80 smartcare-frontend || exit /b 1
echo.
echo App: http://localhost:8081
start http://localhost:8081
exit /b

:stop
docker rm -f smartcare-frontend smartcare-backend >nul 2>&1
docker stop smartcare-db
exit /b
