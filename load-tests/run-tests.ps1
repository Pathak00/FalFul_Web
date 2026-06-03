<#
.SYNOPSIS
    Run FalFul load tests with k6 (Windows PowerShell).

.PARAMETER Scenario
    Which scenario to run: smoke | load | stress | spike | endurance | orders | all
    Default: all

.PARAMETER BaseUrl
    API base URL.  Default: http://localhost:5287

.PARAMETER TestEmail
    Email of a pre-created test user.  Default: loadtest01@falfulfresh.com

.PARAMETER TestPassword
    Password for TestEmail.  Default: LoadTest@123!

.PARAMETER OutputDir
    Directory for JSON report files.  Default: .\reports

.EXAMPLE
    .\run-tests.ps1 -Scenario smoke
    .\run-tests.ps1 -Scenario load -BaseUrl http://api.falfulfresh.com
    .\run-tests.ps1 -Scenario all
#>
param(
    [ValidateSet('smoke','load','stress','spike','endurance','orders','all')]
    [string]$Scenario   = 'all',
    [string]$BaseUrl    = 'http://localhost:5287',
    [string]$TestEmail  = 'loadtest01@falfulfresh.com',
    [string]$TestPassword = 'LoadTest@123!',
    [string]$OutputDir  = '.\reports'
)

# ── Verify k6 is installed ────────────────────────────────────────────────────
if (-not (Get-Command k6 -ErrorAction SilentlyContinue)) {
    Write-Error "k6 is not installed.  Install from https://k6.io/docs/get-started/installation/"
    exit 1
}

# ── Create reports dir if needed ─────────────────────────────────────────────
if (-not (Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir | Out-Null }

$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$envArgs   = @(
    "--env", "BASE_URL=$BaseUrl",
    "--env", "TEST_EMAIL=$TestEmail",
    "--env", "TEST_PASSWORD=$TestPassword"
)

$scenarioMap = @{
    smoke     = '01-smoke'
    load      = '02-load'
    stress    = '03-stress'
    spike     = '04-spike'
    endurance = '05-endurance'
    orders    = '06-order-flow'
}

function Run-Scenario($name, $file) {
    $outJson = Join-Path $OutputDir "${timestamp}_${name}.json"
    $outSumm = Join-Path $OutputDir "${timestamp}_${name}_summary.json"

    Write-Host ""
    Write-Host "══════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  Running: $name" -ForegroundColor Cyan
    Write-Host "══════════════════════════════════════════" -ForegroundColor Cyan

    $args = @('run') + $envArgs + @(
        '--out', "json=$outJson",
        '--summary-export', $outSumm,
        ".\scenarios\$file.js"
    )

    & k6 @args

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ $name PASSED" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $name FAILED (exit $LASTEXITCODE)" -ForegroundColor Red
    }
}

# ── Run selected scenarios ────────────────────────────────────────────────────
if ($Scenario -eq 'all') {
    foreach ($entry in $scenarioMap.GetEnumerator() | Sort-Object Name) {
        # Skip stress + endurance in 'all' by default (they take a long time)
        if ($entry.Key -in @('stress', 'endurance')) {
            Write-Host "  ⏭  Skipping $($entry.Key) in 'all' mode (run individually)" -ForegroundColor Yellow
            continue
        }
        Run-Scenario $entry.Key $entry.Value
    }
} else {
    $file = $scenarioMap[$Scenario]
    Run-Scenario $Scenario $file
}

Write-Host ""
Write-Host "Reports saved to: $OutputDir" -ForegroundColor Cyan
