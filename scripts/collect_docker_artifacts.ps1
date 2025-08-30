param(
    [string]$ContainerName = "open-deep-coder-ci",
    [string]$OutDir = "artifacts",
    [int]$Tail = 1000
)

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Error "docker CLI not found in PATH"; exit 1
}

New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

$logFile = Join-Path $OutDir "container.log"
Write-Host "Collecting last $Tail lines of logs from container '$ContainerName' -> $logFile"
docker logs --tail $Tail $ContainerName 2>&1 | Out-File -FilePath $logFile -Encoding utf8

$inspectFile = Join-Path $OutDir "container.inspect.json"
Write-Host "Collecting docker inspect -> $inspectFile"
docker inspect $ContainerName 2> $null | Out-File -FilePath $inspectFile -Encoding utf8

# Basic redaction using regex replacement for sensitive keys
(Get-Content $inspectFile) -replace '(?i)(PASSWORD|SECRET|API_KEY|TOKEN)"?:\s*"[^"\r\n]*', '$1":"[REDACTED]' | Set-Content $inspectFile -Encoding utf8

$psFile = Join-Path $OutDir "containers.txt"
docker ps -a 2>&1 | Out-File -FilePath $psFile -Encoding utf8

$imagesFile = Join-Path $OutDir "images.txt"
docker images 2>&1 | Out-File -FilePath $imagesFile -Encoding utf8

$zipFile = Join-Path $OutDir "docker-logs.zip"
if (Test-Path $zipFile) { Remove-Item $zipFile -Force }
Compress-Archive -Path (Join-Path $OutDir '*') -DestinationPath $zipFile -Force
Write-Host "Artifacts written to: $zipFile"

# If tar is available on Windows, also create a .tgz using gzip + tar
if (Get-Command tar -ErrorAction SilentlyContinue) {
    $tgz = Join-Path $OutDir "docker-logs.tgz"
    & tar -czf $tgz -C $OutDir container.inspect.json containers.txt images.txt container.log
    Write-Host "Also wrote: $tgz"
}
