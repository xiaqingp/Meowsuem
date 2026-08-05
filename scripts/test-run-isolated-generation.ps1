$ErrorActionPreference = 'Stop'

$runner = Join-Path $PSScriptRoot 'run-isolated-generation.ps1'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$testRoot = Join-Path ([IO.Path]::GetTempPath()) ('meowseum-runner-' + [guid]::NewGuid().ToString('N'))
$counter = 10

function Write-Utf8 {
    param([string]$Path, [string]$Text)
    [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($Path)) | Out-Null
    [IO.File]::WriteAllText($Path, $Text, [Text.UTF8Encoding]::new($false))
}

function New-ContractRun {
    param([string]$CaseId, [string]$Status = 'running')
    $script:counter += 1
    $runId = "20260725T1515$($script:counter.ToString('00'))Z-p2.9.0"
    $root = Join-Path $testRoot "research/runs/regression/$CaseId/$runId"
    $stage = Join-Path $root 'works/work-one/author'
    [IO.Directory]::CreateDirectory($stage) | Out-Null
    [IO.Directory]::CreateDirectory((Join-Path $root 'candidate')) | Out-Null
    [IO.Directory]::CreateDirectory((Join-Path $root 'reports')) | Out-Null
    $descriptorJson = @{
        schemaVersion = 1
        filesystemContractVersion = 1
        runKind = 'regression'
        runId = $runId
        caseId = $CaseId
        pipelineVersion = '2.9.0'
        instructionVersion = '2.2.0'
        status = $Status
        createdAt = '2026-07-25T15:15:00.000Z'
        createdBy = 'fixture'
        layoutVersion = 1
        immutable = @('accepted', 'published', 'superseded') -contains $Status
    } | ConvertTo-Json -Depth 8
    Write-Utf8 (Join-Path $root 'run.json') $descriptorJson
    return [pscustomobject]@{ Root = $root; Stage = $stage; RunId = $runId; CaseId = $CaseId }
}

function Write-AuthorHeader {
    param($Run, [string]$InputHash, [string]$ExtraRole = '', [string]$Output = 'draft.md')
    $inputs = @(
        @{
            path = 'research/meowseum-content-instruction.md'
            role = 'content_instruction'
            sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $testRoot 'research/meowseum-content-instruction.md')).Hash.ToLowerInvariant()
        },
        @{ path = 'research/research-card.md'; role = 'research_card'; sha256 = $InputHash },
        @{
            path = 'research/work-context.json'
            role = 'work_context'
            sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $testRoot 'research/work-context.json')).Hash.ToLowerInvariant()
        }
    )
    if ($ExtraRole) {
        $inputs += @{ path = 'research/extra.json'; role = $ExtraRole; sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $testRoot 'research/extra.json')).Hash.ToLowerInvariant() }
    }
    $headerJson = @{
        runId = $Run.RunId
        stage = 'author'
        caseId = $Run.CaseId
        workId = 'work-one'
        inputContractVersion = 2
        pipelineVersion = '2.9.0'
        instructionVersion = '2.2.0'
        executionProfile = @{ model = 'gpt-5.6-sol'; reasoningEffort = 'medium' }
        allowedInputs = $inputs
        outputs = @($Output)
    } | ConvertTo-Json -Depth 8
    Write-Utf8 (Join-Path $Run.Stage 'run-header.json') $headerJson
}

try {
    [IO.Directory]::CreateDirectory((Join-Path $testRoot 'scripts/lib')) | Out-Null
    Copy-Item -LiteralPath (Join-Path $repositoryRoot 'scripts/validate-run-directory.mjs') -Destination (Join-Path $testRoot 'scripts/validate-run-directory.mjs')
    Copy-Item -LiteralPath (Join-Path $repositoryRoot 'scripts/lib/filesystem-contract.mjs') -Destination (Join-Path $testRoot 'scripts/lib/filesystem-contract.mjs')
    Write-Utf8 (Join-Path $testRoot 'research/meowseum-content-instruction.md') "# Canonical`n`n## 0. Common`nKEEP_COMMON`n`n## 1. Author`nKEEP_AUTHOR`n`n## 2. Scope`nDROP_SCOPE`n"
    Write-Utf8 (Join-Path $testRoot 'research/research-card.md') '[R01] locked research'
    Write-Utf8 (Join-Path $testRoot 'research/work-context.json') '{"workId":"work-one"}'
    Write-Utf8 (Join-Path $testRoot 'research/extra.json') '{}'
    $contract = @{
        version = 1
        activeContentRoot = 'research/content'
        evidenceRoot = 'research/evidence'
        productionRunRoot = 'research/runs/production'
        regressionRunRoot = 'research/runs/regression'
        experimentRunRoot = 'research/runs/experiment'
        pipelineRoot = 'research/pipeline'
        archiveRoot = 'research/archive'
        migrationRoot = 'research/migrations'
        allowedRunKinds = @('production', 'regression', 'experiment')
        runIdPattern = '^[0-9]{8}T[0-9]{6}Z-p[0-9]+\.[0-9]+\.[0-9]+$'
        activeContentPattern = '^research/content/[a-z][a-z0-9-]*\.md$'
        generatedFilesForbiddenInResearchRoot = $true
        runDescriptor = 'run.json'
        currentLayoutVersion = 1
        immutableStatuses = @('accepted', 'published', 'superseded')
    }
    $manifestJson = @{
        pipelineVersion = '2.9.0'
        currentVersion = '2.2.0'
        canonicalInstruction = 'research/meowseum-content-instruction.md'
        filesystemContract = $contract
        modelRouting = @{ author = @{ model = 'gpt-5.6-sol'; reasoningEffort = 'medium' } }
        stageInstructionViews = @{ author = @('0', '1') }
        stageInputContracts = @{
            author = @{
                version = 2
                requiredRoles = @('content_instruction', 'research_card', 'work_context')
                optionalRoles = @('research_supplement')
                maxInputsByRole = @{ content_instruction = 1; research_card = 1; work_context = 1; research_supplement = 1 }
                maxTotalBytes = 4096
            }
        }
    } | ConvertTo-Json -Depth 10
    Write-Utf8 (Join-Path $testRoot 'research/content-standard-manifest.json') $manifestJson

    $researchHash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $testRoot 'research/research-card.md')).Hash.ToLowerInvariant()
    $record = New-ContractRun 'record-output'
    Write-AuthorHeader $record $researchHash
    & $runner -ProjectRoot $testRoot -RunDirectory $record.Stage -ValidateOnly | Out-Null
    Write-Utf8 (Join-Path $record.Stage 'draft.md') 'recorded output'
    & $runner -ProjectRoot $testRoot -RunDirectory $record.Stage -RecordOutputsOnly | Out-Null
    $result = [IO.File]::ReadAllText((Join-Path $record.Stage 'author-result.json'), [Text.Encoding]::UTF8) | ConvertFrom-Json
    if (-not $result.outputs[0].sha256 -or $result.runId -ne $record.RunId) { throw 'runner did not record output identity and hash' }

    $badHash = New-ContractRun 'bad-hash'
    Write-AuthorHeader $badHash ('0' * 64)
    try {
        & $runner -ProjectRoot $testRoot -RunDirectory $badHash.Stage -ValidateOnly | Out-Null
        throw 'runner accepted an input hash mismatch'
    } catch { if ($_.Exception.Message -eq 'runner accepted an input hash mismatch') { throw } }

    $badRole = New-ContractRun 'bad-role'
    Write-AuthorHeader $badRole $researchHash 'museum_plan'
    try {
        & $runner -ProjectRoot $testRoot -RunDirectory $badRole.Stage -ValidateOnly | Out-Null
        throw 'runner accepted an undeclared input role'
    } catch { if ($_.Exception.Message -eq 'runner accepted an undeclared input role') { throw } }

    Write-Utf8 (Join-Path $testRoot 'research/research-card.md') ('x' * 5000)
    $largeHash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $testRoot 'research/research-card.md')).Hash.ToLowerInvariant()
    $tooLarge = New-ContractRun 'too-large'
    Write-AuthorHeader $tooLarge $largeHash
    try {
        & $runner -ProjectRoot $testRoot -RunDirectory $tooLarge.Stage -ValidateOnly | Out-Null
        throw 'runner accepted an input over the byte budget'
    } catch { if ($_.Exception.Message -eq 'runner accepted an input over the byte budget') { throw } }
    Write-Utf8 (Join-Path $testRoot 'research/research-card.md') '[R01] locked research'
    $researchHash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $testRoot 'research/research-card.md')).Hash.ToLowerInvariant()

    $immutable = New-ContractRun 'immutable' 'accepted'
    Write-AuthorHeader $immutable $researchHash
    try {
        & $runner -ProjectRoot $testRoot -RunDirectory $immutable.Stage -ValidateOnly | Out-Null
        throw 'runner accepted an immutable run'
    } catch { if ($_.Exception.Message -eq 'runner accepted an immutable run') { throw } }

    $outsideLog = New-ContractRun 'outside-log'
    Write-AuthorHeader $outsideLog $researchHash
    try {
        & $runner -ProjectRoot $testRoot -RunDirectory $outsideLog.Stage -LogPath (Join-Path $testRoot 'outside.log') -ValidateOnly | Out-Null
        throw 'runner accepted a log outside the stage directory'
    } catch { if ($_.Exception.Message -eq 'runner accepted a log outside the stage directory') { throw } }

    $model = New-ContractRun 'model-metrics'
    Write-AuthorHeader $model $researchHash
    $jsonBetweenMarkerAndCount = "tokens used`r`n{`"schemaVersion`":2,`"works`":[]}`r`n1,234`r`n"
    $tokenMatches = [Text.RegularExpressions.Regex]::Matches($jsonBetweenMarkerAndCount, '^tokens used\s*$[\s\S]*?^\s*([\d,]+)\s*$', [Text.RegularExpressions.RegexOptions]::IgnoreCase -bor [Text.RegularExpressions.RegexOptions]::Multiline)
    if ($tokenMatches.Count -ne 1 -or $tokenMatches[0].Groups[1].Value -ne '1,234') { throw 'runner token parser rejected JSON before count' }
    $mockBin = Join-Path $testRoot 'mock-bin'
    [IO.Directory]::CreateDirectory($mockBin) | Out-Null
    Write-Utf8 (Join-Path $mockBin 'codex.cmd') "@echo off`r`necho generated>draft.md`r`necho tokens used`r`necho 1,234`r`nexit /b 0`r`n"
    $oldPath = $env:PATH
    try {
        $env:PATH = "$mockBin;$oldPath"
        & $runner -ProjectRoot $testRoot -RunDirectory $model.Stage | Out-Null
    } finally {
        $env:PATH = $oldPath
    }
    $metrics = [IO.File]::ReadAllText((Join-Path $model.Stage 'author-result.json'), [Text.Encoding]::UTF8) | ConvertFrom-Json
    if ($metrics.tokenUsage.total -ne 1234 -or -not $metrics.modelStartedAt -or -not $metrics.modelCompletedAt) {
        throw 'runner did not retain token and timing metrics'
    }
    if (-not [IO.File]::Exists((Join-Path $model.Stage 'runner.log'))) { throw 'runner did not retain its stage-local log' }

    'isolated generation runner contract tests passed'
}
finally {
    if ([IO.Directory]::Exists($testRoot)) { [IO.Directory]::Delete($testRoot, $true) }
}
