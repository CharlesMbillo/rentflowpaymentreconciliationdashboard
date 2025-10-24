Write-Host "Stopping node processes (if any) ..."
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Verifying npm cache ..."
npm cache verify

Write-Host "Backing up package-lock.json if present ..."
if (Test-Path package-lock.json) { Copy-Item package-lock.json package-lock.json.bak -Force }

Write-Host "Removing node_modules and package-lock.json ..."
if (Test-Path node_modules) { Remove-Item -Recurse -Force node_modules }
if (Test-Path package-lock.json) { Remove-Item -Force package-lock.json }

Write-Host "Cleaning npm cache (force) ..."
npm cache clean --force

Write-Host "Installing dependencies ..."
npm install

Write-Host "Installing prisma and @prisma/client explicitly ..."
npm install --save-dev prisma
npm install @prisma/client

Write-Host "Generating Prisma client ..."
npx prisma generate

Write-Host "Done. If you still see errors, please open the npm debug log shown in the error message."
