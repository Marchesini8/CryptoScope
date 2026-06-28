Set-Location -LiteralPath $PSScriptRoot
Write-Host "Iniciando CryptoRadar..."
if (-not (Test-Path "node_modules")) {
  Write-Host "Instalando dependencias. Isso pode levar alguns minutos..."
  npm install
  if ($LASTEXITCODE -ne 0) { throw "Falha ao instalar dependencias." }
}
Write-Host "Abrindo em http://localhost:3000"
node server.js
