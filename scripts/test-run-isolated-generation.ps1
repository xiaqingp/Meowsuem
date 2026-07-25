$ErrorActionPreference = 'Stop'

$runner = Join-Path $PSScriptRoot 'run-isolated-generation.ps1'
$testRoot = Join-Path ([IO.Path]::GetTempPath()) ('meowseum-runner-' + [guid]::NewGuid().ToString('N'))
$projectRoot = Split-Path -Parent $PSScriptRoot
$entryFixture = Join-Path $projectRoot ('research/pipeline-tests/runner-entry-' + [guid]::NewGuid().ToString('N'))

try {
    # The canonical command needs only -RunDirectory; ProjectRoot is inferred.
    [IO.Directory]::CreateDirectory($entryFixture) | Out-Null
    $entryInput = Join-Path $entryFixture 'input.md'
    [IO.File]::WriteAllText($entryInput, 'locked input', [Text.UTF8Encoding]::new($false))
    $entryRelative = $entryInput.Substring($projectRoot.Length).TrimStart('\', '/').Replace('\', '/')
    @{
        runId = 'runner-entry-self-test'
        stage = 'museum_scope'
        museumId = 'fixture'
        pipelineVersion = '2.4.9'
        instructionVersion = '2.0.2'
        executionProfile = @{ model = 'gpt-5.6-sol'; reasoningEffort = 'medium' }
        allowedInputs = @(@{
            path = $entryRelative
            role = 'fixture'
            sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $entryInput).Hash.ToLowerInvariant()
        })
        outputs = @('future.json')
    } | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $entryFixture 'run-header.json')
    & powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $runner -RunDirectory $entryFixture -ValidateOnly | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'canonical runner entry failed to infer ProjectRoot' }

    $stopwatch = [Diagnostics.Stopwatch]::StartNew()
    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    & powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $runner 2>$null | Out-Null
    $missingRunExit = $LASTEXITCODE
    $ErrorActionPreference = $oldPreference
    $stopwatch.Stop()
    if ($missingRunExit -eq 0 -or $stopwatch.Elapsed.TotalSeconds -ge 5) { throw 'missing RunDirectory did not fail fast' }

    [IO.Directory]::CreateDirectory($testRoot) | Out-Null
    [IO.File]::WriteAllText((Join-Path $testRoot 'input.md'), 'locked input', [Text.UTF8Encoding]::new($false))
    $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $testRoot 'input.md')).Hash.ToLowerInvariant()
    $header = @{
        runId = 'runner-self-test'
        stage = 'author'
        executionProfile = @{ model = 'gpt-5.6-sol'; reasoningEffort = 'medium' }
        allowedInputs = @(@{ path = 'input.md'; sha256 = $hash })
        outputs = @('draft.md')
    }
    $header | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $testRoot 'run-header.json')

    & $runner -ProjectRoot $testRoot -RunDirectory $testRoot -ValidateOnly | Out-Null

    [IO.File]::WriteAllText((Join-Path $testRoot 'draft.md'), 'stale output', [Text.UTF8Encoding]::new($false))
    & $runner -ProjectRoot $testRoot -RunDirectory $testRoot -RecordOutputsOnly | Out-Null
    $resultPath = Join-Path $testRoot 'author-result.json'
    if (-not [IO.File]::Exists($resultPath)) { throw 'runner did not record the author bundle' }
    $result = [IO.File]::ReadAllText($resultPath, [Text.Encoding]::UTF8) | ConvertFrom-Json
    $expectedOutputHash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $testRoot 'draft.md')).Hash.ToLowerInvariant()
    if ($result.outputs[0].sha256 -ne $expectedOutputHash) { throw 'runner recorded the wrong output hash' }
    try {
        & $runner -ProjectRoot $testRoot -RunDirectory $testRoot -ValidateOnly | Out-Null
        throw 'runner accepted a pre-existing output'
    }
    catch {
        if ($_.Exception.Message -eq 'runner accepted a pre-existing output') { throw }
    }
    [IO.File]::Delete((Join-Path $testRoot 'draft.md'))

    $header.allowedInputs[0].sha256 = ('0' * 64)
    $header | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $testRoot 'run-header.json')
    try {
        & $runner -ProjectRoot $testRoot -RunDirectory $testRoot -ValidateOnly | Out-Null
        throw 'runner accepted a mismatched input hash'
    }
    catch {
        if ($_.Exception.Message -eq 'runner accepted a mismatched input hash') { throw }
    }

    # A fake codex executable verifies real-run timing and token capture without a model call.
    $modelRoot = Join-Path $testRoot 'model-run'
    $mockBin = Join-Path $testRoot 'mock-bin'
    [IO.Directory]::CreateDirectory($modelRoot) | Out-Null
    [IO.Directory]::CreateDirectory($mockBin) | Out-Null
    [IO.File]::WriteAllText((Join-Path $modelRoot 'input.md'), 'locked input', [Text.UTF8Encoding]::new($false))
    $modelInputHash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $modelRoot 'input.md')).Hash.ToLowerInvariant()
    @{
        runId = 'runner-metrics-self-test'
        stage = 'museum_scope'
        museumId = 'fixture'
        pipelineVersion = '2.4.9'
        instructionVersion = '2.0.2'
        executionProfile = @{ model = 'gpt-5.6-sol'; reasoningEffort = 'medium' }
        allowedInputs = @(@{ path = 'model-run/input.md'; role = 'fixture'; sha256 = $modelInputHash })
        outputs = @('draft.md')
    } | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $modelRoot 'run-header.json')
    [IO.File]::WriteAllText((Join-Path $mockBin 'codex.cmd'), "@echo off`r`necho mock output>draft.md`r`necho tokens used`r`necho 1,234`r`nexit /b 0`r`n", [Text.Encoding]::ASCII)
    $oldPath = $env:PATH
    try {
        $env:PATH = "$mockBin;$oldPath"
        & $runner -ProjectRoot $testRoot -RunDirectory $modelRoot | Out-Null
    }
    finally {
        $env:PATH = $oldPath
    }
    $metrics = [IO.File]::ReadAllText((Join-Path $modelRoot 'museum_scope-result.json'), [Text.Encoding]::UTF8) | ConvertFrom-Json
    if ($metrics.tokenUsage.total -ne 1234) { throw 'runner did not capture token usage' }
    if (-not $metrics.runnerStartedAt -or -not $metrics.modelStartedAt -or -not $metrics.modelCompletedAt -or $metrics.modelDurationMs -lt 0) {
        throw 'runner did not capture timing metrics'
    }
    if (-not [IO.File]::Exists((Join-Path $modelRoot 'runner.log'))) { throw 'runner did not retain its log' }

    # Current releases enforce model routing and materialize stage views from one canonical instruction.
    $routingResearch = Join-Path $testRoot 'research'
    [IO.Directory]::CreateDirectory($routingResearch) | Out-Null
    $routingInstruction = Join-Path $routingResearch 'instruction.md'
    [IO.File]::WriteAllText(
        $routingInstruction,
        "# Canonical`n`n## 0. Common`nKEEP_COMMON`n`n## 1. Research`nDROP_RESEARCH`n`n## 2. Scope`nKEEP_SCOPE`n",
        [Text.UTF8Encoding]::new($false)
    )
    @{
        pipelineVersion = '2.7.0'
        canonicalInstruction = 'research/instruction.md'
        modelRouting = @{
            museum_scope = @{ model = 'gpt-5.6-terra'; reasoningEffort = 'medium' }
            museum_candidate_pool = @{ model = 'gpt-5.6-sol'; reasoningEffort = 'medium' }
            research = @{
                standard = @{ model = 'gpt-5.6-terra'; reasoningEffort = 'medium' }
                complex = @{ model = 'gpt-5.6-sol'; reasoningEffort = 'medium' }
            }
            museum_selection = @{ model = 'gpt-5.6-sol'; reasoningEffort = 'medium' }
            museum_structure = @{ model = 'gpt-5.6-sol'; reasoningEffort = 'medium' }
            author = @{ model = 'gpt-5.6-sol'; reasoningEffort = 'medium' }
        }
        stageInstructionViews = @{
            museum_scope = @('0', '2')
            museum_candidate_pool = @('0', '2')
            research = @('0', '1')
            museum_selection = @('0', '2')
            museum_structure = @('0', '2')
            author = @('0', '1')
        }
        stageInputContracts = @{
            research = @{
                complexityValues = @('standard', 'complex')
                maxWorksPerContext = 10
                riskFlags = @('rare_candidate')
            }
            author = @{
                version = 2
                requiredRoles = @('content_instruction', 'research_card', 'work_context')
                optionalRoles = @('research_supplement')
                maxInputsByRole = @{
                    content_instruction = 1
                    research_card = 1
                    work_context = 1
                    research_supplement = 1
                }
                maxTotalBytes = 4096
            }
        }
    } | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $routingResearch 'content-standard-manifest.json')
    $routingHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $routingInstruction).Hash.ToLowerInvariant()
    $scopeRouteRoot = Join-Path $testRoot 'scope-route'
    [IO.Directory]::CreateDirectory($scopeRouteRoot) | Out-Null
    @{
        runId = 'scope-route-test'
        stage = 'museum_scope'
        museumId = 'fixture'
        pipelineVersion = '2.7.0'
        instructionVersion = '2.1.0'
        executionProfile = @{ model = 'gpt-5.6-terra'; reasoningEffort = 'medium' }
        allowedInputs = @(@{ path = 'research/instruction.md'; role = 'content_instruction'; sha256 = $routingHash })
        outputs = @('scope.json')
    } | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $scopeRouteRoot 'run-header.json')
    [IO.File]::WriteAllText(
        (Join-Path $mockBin 'codex.cmd'),
        "@echo off`r`nmore > prompt.txt`r`necho {}>scope.json`r`necho tokens used`r`necho 321`r`nexit /b 0`r`n",
        [Text.Encoding]::ASCII
    )
    $oldPath = $env:PATH
    try {
        $env:PATH = "$mockBin;$oldPath"
        & $runner -ProjectRoot $testRoot -RunDirectory $scopeRouteRoot | Out-Null
    }
    finally {
        $env:PATH = $oldPath
    }
    $scopePrompt = [IO.File]::ReadAllText((Join-Path $scopeRouteRoot 'prompt.txt'), [Text.Encoding]::UTF8)
    if ($scopePrompt -notmatch 'KEEP_COMMON' -or $scopePrompt -notmatch 'KEEP_SCOPE' -or $scopePrompt -match 'DROP_RESEARCH') {
        throw 'stage instruction view did not retain exactly the requested sections'
    }
    $scopeResult = [IO.File]::ReadAllText((Join-Path $scopeRouteRoot 'museum_scope-result.json'), [Text.Encoding]::UTF8) | ConvertFrom-Json
    if (($scopeResult.instructionViewSections -join ',') -ne '0,2') { throw 'stage instruction view was not recorded' }

    $badRouteRoot = Join-Path $testRoot 'bad-route'
    [IO.Directory]::CreateDirectory($badRouteRoot) | Out-Null
    @{
        runId = 'bad-route-test'
        stage = 'museum_scope'
        museumId = 'fixture'
        pipelineVersion = '2.7.0'
        instructionVersion = '2.1.0'
        executionProfile = @{ model = 'gpt-5.6-sol'; reasoningEffort = 'medium' }
        allowedInputs = @(@{ path = 'research/instruction.md'; role = 'content_instruction'; sha256 = $routingHash })
        outputs = @('scope.json')
    } | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $badRouteRoot 'run-header.json')
    try {
        & $runner -ProjectRoot $testRoot -RunDirectory $badRouteRoot -ValidateOnly | Out-Null
        throw 'runner accepted the wrong scope model'
    }
    catch {
        if ($_.Exception.Message -eq 'runner accepted the wrong scope model') { throw }
    }

    foreach ($routeCase in @(
        @{ name = 'standard-route'; complexity = 'standard'; model = 'gpt-5.6-terra' },
        @{ name = 'complex-route'; complexity = 'complex'; model = 'gpt-5.6-sol' }
    )) {
        $routeRoot = Join-Path $testRoot $routeCase.name
        [IO.Directory]::CreateDirectory($routeRoot) | Out-Null
        $packetName = "$($routeCase.name)-candidate-packet.json"
        $packetPath = Join-Path $routingResearch $packetName
        $packetText = if ($routeCase.complexity -eq 'complex') {
            '{"works":[{"workId":"fixture","identityAnchor":"fixture-1","identitySourceUrl":"https://example.test/object/1","riskFlags":["rare_candidate"],"riskRationale":"fixture"}]}'
        } else {
            '{"works":[{"workId":"fixture","identityAnchor":"fixture-1","identitySourceUrl":"https://example.test/object/1","riskFlags":[],"riskRationale":"fixture"}]}'
        }
        [IO.File]::WriteAllText($packetPath, $packetText, [Text.UTF8Encoding]::new($false))
        @{
            runId = $routeCase.name
            stage = 'research'
            museumId = 'fixture'
            researchComplexity = $routeCase.complexity
            pipelineVersion = '2.7.0'
            instructionVersion = '2.1.0'
            executionProfile = @{ model = $routeCase.model; reasoningEffort = 'medium' }
            allowedInputs = @(
                @{ path = 'research/instruction.md'; role = 'content_instruction'; sha256 = $routingHash },
                @{
                    path = "research/$packetName"
                    role = 'candidate_packet'
                    sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $packetPath).Hash.ToLowerInvariant()
                }
            )
            outputs = @('research-card.md')
        } | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $routeRoot 'run-header.json')
        & $runner -ProjectRoot $testRoot -RunDirectory $routeRoot -ValidateOnly | Out-Null
    }

    foreach ($solStage in @('museum_candidate_pool', 'museum_selection', 'museum_structure')) {
        $routeRoot = Join-Path $testRoot "$solStage-route"
        [IO.Directory]::CreateDirectory($routeRoot) | Out-Null
        @{
            runId = "$solStage-route"
            stage = $solStage
            museumId = 'fixture'
            pipelineVersion = '2.7.0'
            instructionVersion = '2.1.0'
            executionProfile = @{ model = 'gpt-5.6-sol'; reasoningEffort = 'medium' }
            allowedInputs = @(@{ path = 'research/instruction.md'; role = 'content_instruction'; sha256 = $routingHash })
            outputs = @('stage.json')
        } | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $routeRoot 'run-header.json')
        & $runner -ProjectRoot $testRoot -RunDirectory $routeRoot -ValidateOnly | Out-Null
    }

    [IO.File]::WriteAllText((Join-Path $routingResearch 'research-card.md'), '[R01] locked research', [Text.UTF8Encoding]::new($false))
    [IO.File]::WriteAllText((Join-Path $routingResearch 'work-context.json'), '{"workId":"fixture"}', [Text.UTF8Encoding]::new($false))
    $authorRouteRoot = Join-Path $testRoot 'author-route'
    [IO.Directory]::CreateDirectory($authorRouteRoot) | Out-Null
    @{
        runId = 'author-route'
        stage = 'author'
        museumId = 'fixture'
        workId = 'fixture'
        inputContractVersion = 2
        pipelineVersion = '2.7.0'
        instructionVersion = '2.1.0'
        executionProfile = @{ model = 'gpt-5.6-sol'; reasoningEffort = 'medium' }
        allowedInputs = @(
            @{ path = 'research/instruction.md'; role = 'content_instruction'; sha256 = $routingHash },
            @{
                path = 'research/research-card.md'
                role = 'research_card'
                sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $routingResearch 'research-card.md')).Hash.ToLowerInvariant()
            },
            @{
                path = 'research/work-context.json'
                role = 'work_context'
                sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $routingResearch 'work-context.json')).Hash.ToLowerInvariant()
            }
        )
        outputs = @('writing-plan.json', 'card.txt', 'draft.md')
    } | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $authorRouteRoot 'run-header.json')
    & $runner -ProjectRoot $testRoot -RunDirectory $authorRouteRoot -ValidateOnly | Out-Null

    $researchRoot = Join-Path $testRoot 'research'
    [IO.Directory]::CreateDirectory($researchRoot) | Out-Null
    $contractFiles = @{
        'instruction.md' = 'canonical instruction'
        'research-card.md' = 'locked research'
        'work-context.json' = '{"workId":"fixture"}'
        'museum-plan.json' = '{"works":["unrelated"]}'
    }
    foreach ($entry in $contractFiles.GetEnumerator()) {
        [IO.File]::WriteAllText((Join-Path $researchRoot $entry.Key), $entry.Value, [Text.UTF8Encoding]::new($false))
    }
    @{
        canonicalInstruction = 'research/instruction.md'
        stageInputContracts = @{
            author = @{
                version = 1
                requiredRoles = @('content_instruction', 'research_card', 'work_context')
                optionalRoles = @('research_supplement')
                maxInputsByRole = @{
                    content_instruction = 1
                    research_card = 1
                    work_context = 1
                    research_supplement = 1
                }
                maxTotalBytes = 1024
            }
        }
    } | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $researchRoot 'content-standard-manifest.json')
    $makeInput = {
        param($name, $role)
        $relative = "research/$name"
        @{
            path = $relative
            role = $role
            sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $testRoot $relative)).Hash.ToLowerInvariant()
        }
    }
    $header = @{
        runId = 'runner-author-contract-self-test'
        stage = 'author'
        inputContractVersion = 1
        executionProfile = @{ model = 'gpt-5.6-sol'; reasoningEffort = 'medium' }
        allowedInputs = @(
            (& $makeInput 'instruction.md' 'content_instruction'),
            (& $makeInput 'research-card.md' 'research_card'),
            (& $makeInput 'work-context.json' 'work_context')
        )
        outputs = @('author-draft.md')
    }
    $header | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $testRoot 'run-header.json')
    & $runner -ProjectRoot $testRoot -RunDirectory $testRoot -ValidateOnly | Out-Null

    $header.allowedInputs += (& $makeInput 'museum-plan.json' 'museum_plan')
    $header | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath (Join-Path $testRoot 'run-header.json')
    try {
        & $runner -ProjectRoot $testRoot -RunDirectory $testRoot -ValidateOnly | Out-Null
        throw 'runner accepted an undeclared author input role'
    }
    catch {
        if ($_.Exception.Message -eq 'runner accepted an undeclared author input role') { throw }
    }

    'isolated generation runner self-test passed'
}
finally {
    if ([IO.Directory]::Exists($entryFixture)) {
        [IO.Directory]::Delete($entryFixture, $true)
    }
    if ([IO.Directory]::Exists($testRoot)) {
        [IO.Directory]::Delete($testRoot, $true)
    }
}
