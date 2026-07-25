param(
  [int]$Port = 8094
)

$projectRoot = Split-Path -Parent $PSScriptRoot
$python = Get-Command python -ErrorAction Stop

Write-Host "Meowseum: http://127.0.0.1:$Port/"
Write-Host "Listening on 0.0.0.0:$Port"
& $python.Source -m http.server $Port --bind 0.0.0.0 --directory $projectRoot
