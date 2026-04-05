@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo npm est introuvable. Installe Node.js puis reessaie.
  pause
  exit /b 1
)

if not defined PORT (
  for %%P in (3000 3001 3002 3003 3101 3102) do (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$port=%%P; $busy=[System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() | Where-Object { $_.Port -eq $port }; if ($busy) { exit 1 } else { exit 0 }" >nul 2>nul
    if not errorlevel 1 (
      set "PORT=%%P"
      goto :port_found
    )
  )

  echo Aucun port libre preconfigure n'a ete trouve.
  echo Definis manuellement la variable PORT puis relance le script.
  pause
  exit /b 1
)

:port_found
echo Demarrage de l'application sur le port !PORT!...
echo URL: http://localhost:!PORT!
echo.

call npm start
set EXIT_CODE=%ERRORLEVEL%

if not "%EXIT_CODE%"=="0" (
  echo.
  echo Le lancement s'est termine avec le code %EXIT_CODE%.
)

pause
exit /b %EXIT_CODE%
