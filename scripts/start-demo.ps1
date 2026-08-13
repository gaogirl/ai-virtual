$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$frontendDir = Join-Path $repoRoot 'frontend'
$backendDir = Join-Path $repoRoot 'backend'
$backendEnv = Join-Path $backendDir '.env'

if (-not (Test-Path $backendEnv)) {
    $secretBytes = New-Object byte[] 48
    $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $random.GetBytes($secretBytes) } finally { $random.Dispose() }
    $jwtSecret = -join ($secretBytes | ForEach-Object { $_.ToString('x2') })

    @"
PORT=5000
NODE_ENV=development
DEMO_EMBEDDED_DB=true
DEMO_SEED_DATA=true
MONGOMS_DOWNLOAD_DIR=.demo-mongodb-binaries
MONGO_URI=
JWT_SECRET=$jwtSecret
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
CLIENT_URL=http://localhost:5000
ZHIPU_API_KEY=
"@ | Set-Content -LiteralPath $backendEnv -Encoding utf8

    Write-Host 'Created backend/.env with an embedded demo database and random JWT secret.'
}

$envText = Get-Content -Raw -LiteralPath $backendEnv
if ($envText -notmatch '(?m)^DEMO_SEED_DATA=') {
    Add-Content -LiteralPath $backendEnv -Value 'DEMO_SEED_DATA=true' -Encoding utf8
}

$cloudflared = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
if (-not $cloudflared) {
    $cloudflared = Get-ChildItem -Path (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages') -Filter cloudflared.exe -Recurse -ErrorAction SilentlyContinue |
        Select-Object -First 1 -ExpandProperty FullName
}
if (-not $cloudflared) {
    throw 'cloudflared is not installed. Run: winget install --id Cloudflare.cloudflared --scope user'
}

if (-not (Test-Path (Join-Path $frontendDir 'node_modules'))) {
    Push-Location $frontendDir
    try { npm ci } finally { Pop-Location }
}

if (-not (Test-Path (Join-Path $backendDir 'node_modules'))) {
    Push-Location $backendDir
    try { npm ci } finally { Pop-Location }
}

Push-Location $frontendDir
try {
    $previousApiUrl = $env:VITE_API_URL
    $previousLocalAuth = $env:VITE_LOCAL_AUTH
    $env:VITE_API_URL = '/api'
    $env:VITE_LOCAL_AUTH = 'false'
    npm run build
} finally {
    $env:VITE_API_URL = $previousApiUrl
    $env:VITE_LOCAL_AUTH = $previousLocalAuth
    Pop-Location
}

$backendJob = Start-Job -ScriptBlock {
    param($workingDirectory)
    Set-Location $workingDirectory
    node server.js
} -ArgumentList $backendDir

try {
    $healthy = $false
    Write-Host 'Starting the embedded database. The first run may download its MongoDB runtime.'
    foreach ($attempt in 1..240) {
        Start-Sleep -Milliseconds 500
        try {
            $response = Invoke-RestMethod -Uri 'http://127.0.0.1:5000/api/health' -TimeoutSec 2
            if ($response.status -eq 'ok') {
                $healthy = $true
                break
            }
        } catch {
            if ($backendJob.State -ne 'Running') { break }
        }
    }

    if (-not $healthy) {
        Receive-Job $backendJob
        throw 'Backend did not become healthy on port 5000.'
    }

    Write-Host 'Local demo: http://127.0.0.1:5000/login'
    Write-Host 'Teacher account: teacher@demo.local / Demo123456'
    Write-Host 'Student account: student@demo.local / Demo123456'
    Write-Host 'Starting Cloudflare Tunnel. Share the https:// URL printed below.'
    $tunnelLog = Join-Path $repoRoot ".demo-cloudflared-$((Get-Date).ToString('yyyyMMdd-HHmmss')).log"
    Write-Host "Tunnel log: $tunnelLog"
    & $cloudflared tunnel --no-autoupdate --protocol http2 --logfile $tunnelLog --url http://127.0.0.1:5000
} finally {
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -Force -ErrorAction SilentlyContinue
}
