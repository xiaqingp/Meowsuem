param(
    [string]$ProjectRoot,
    [string]$RunDirectory,
    [switch]$ValidateOnly,
    [switch]$RecordOutputsOnly,
    [string]$LogPath
)

$ErrorActionPreference = 'Stop'
$runnerStartedAt = [DateTimeOffset]::Now
$modelStartedAt = $null
$modelCompletedAt = $null
$totalTokens = $null
$resolvedLog = $null
if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    $ProjectRoot = Split-Path -Parent $PSScriptRoot
}
if ([string]::IsNullOrWhiteSpace($RunDirectory)) {
    throw 'RunDirectory is required'
}
$project = [IO.Path]::GetFullPath($ProjectRoot).TrimEnd('\', '/')
$run = [IO.Path]::GetFullPath($RunDirectory).TrimEnd('\', '/')
$headerPath = Join-Path $run 'run-header.json'

if (-not [IO.File]::Exists($headerPath)) { throw "missing run header: $headerPath" }
$validator = Join-Path $project 'scripts/validate-run-directory.mjs'
$validatorArgs = @(
    $validator,
    "--project-root=$project",
    "--run-directory=$run",
    '--mode=read-write'
)
if ($LogPath) { $validatorArgs += "--log-path=$([IO.Path]::GetFullPath($LogPath))" }
$validationJson = & node @validatorArgs
if ($LASTEXITCODE -ne 0) { throw 'filesystem contract validation failed' }
$runContract = $validationJson | ConvertFrom-Json

$headerText = [IO.File]::ReadAllText($headerPath, [Text.Encoding]::UTF8)
$header = $headerText | ConvertFrom-Json
if ([string]$header.runId -ne [string]$runContract.runId) { throw 'run header runId drifted from run.json' }
if ([string]$header.pipelineVersion -ne [string]$runContract.pipelineVersion) { throw 'run header pipelineVersion drifted from run.json' }
if ($runContract.museumId -and [string]$header.museumId -ne [string]$runContract.museumId) { throw 'run header museumId drifted from run.json' }
if ($runContract.caseId -and [string]$header.caseId -ne [string]$runContract.caseId) { throw 'run header caseId drifted from run.json' }
if ($header.executionProfile.reasoningEffort -ne 'medium') { throw 'reasoning effort must be medium' }
if (-not $header.executionProfile.model) { throw 'model is required' }
if (-not $header.allowedInputs -or -not $header.outputs) { throw 'allowedInputs and outputs are required' }
if ($ValidateOnly -and $RecordOutputsOnly) { throw 'ValidateOnly and RecordOutputsOnly are mutually exclusive' }
if ([string]$header.stage -notmatch '^[a-z][a-z0-9_-]*$') { throw 'stage is required and must be filename-safe' }

$manifestPath = Join-Path $project 'research/content-standard-manifest.json'
$manifest = $null
$inputContract = $null
if ([IO.File]::Exists($manifestPath)) {
    $manifest = [IO.File]::ReadAllText($manifestPath, [Text.Encoding]::UTF8) | ConvertFrom-Json
}
if ($manifest -and $manifest.modelRouting -and [string]$header.pipelineVersion -eq [string]$manifest.pipelineVersion) {
    $route = $manifest.modelRouting.PSObject.Properties[[string]$header.stage].Value
    if ([string]$header.stage -eq 'research') {
        $complexity = [string]$header.researchComplexity
        if (@($manifest.stageInputContracts.research.complexityValues) -notcontains $complexity) {
            throw 'researchComplexity must be standard or complex'
        }
        $route = $route.PSObject.Properties[$complexity].Value
    }
    if ($route) {
        if ([string]$header.executionProfile.model -ne [string]$route.model) {
            throw "model route mismatch for $($header.stage): expected $($route.model)"
        }
        if ([string]$header.executionProfile.reasoningEffort -ne [string]$route.reasoningEffort) {
            throw "reasoning route mismatch for $($header.stage)"
        }
    }
}
if ($manifest -and [string]$header.stage -eq 'author') {
    $inputContract = $manifest.stageInputContracts.author
    if (-not $inputContract) { throw 'manifest is missing the author input contract' }
    if ([int]$header.inputContractVersion -ne [int]$inputContract.version) { throw 'author input contract version mismatch' }

    $allowedRoles = @($inputContract.requiredRoles) + @($inputContract.optionalRoles)
    $roleCounts = @{}
    foreach ($input in $header.allowedInputs) {
        $role = [string]$input.role
        if (-not $role -or $allowedRoles -notcontains $role) { throw "undeclared author input role: $role" }
        $roleCounts[$role] = 1 + [int]$roleCounts[$role]
    }
    foreach ($role in @($inputContract.requiredRoles)) {
        if ([int]$roleCounts[$role] -lt 1) { throw "missing required author input role: $role" }
    }
    foreach ($property in $inputContract.maxInputsByRole.PSObject.Properties) {
        if ([int]$roleCounts[$property.Name] -gt [int]$property.Value) { throw "too many author inputs for role: $($property.Name)" }
    }
    $instructionInput = @($header.allowedInputs | Where-Object { $_.role -eq 'content_instruction' })
    if ($instructionInput.Count -ne 1 -or ([string]$instructionInput[0].path).Replace('\', '/') -ne ([string]$manifest.canonicalInstruction).Replace('\', '/')) {
        throw 'author content_instruction must be the canonical instruction'
    }
}
if ($manifest -and [string]$header.stage -eq 'image_disambiguation') {
    $inputContract = $manifest.stageInputContracts.imageDisambiguation
    if (-not $inputContract) { throw 'manifest is missing the image disambiguation input contract' }
    $roles = @($header.allowedInputs | ForEach-Object { [string]$_.role })
    foreach ($required in @($inputContract.requiredRoles)) {
        if (@($roles | Where-Object { $_ -eq $required }).Count -ne 1) { throw "image disambiguation requires exactly one $required input" }
    }
    foreach ($role in $roles) {
        if (@($inputContract.requiredRoles) -notcontains $role) { throw "undeclared image disambiguation input role: $role" }
    }
}

function Select-MarkdownSections {
    param([string]$Text, [string[]]$SectionIds)
    $firstSection = [Text.RegularExpressions.Regex]::Match($Text, '(?m)^##\s+')
    if (-not $firstSection.Success) { throw 'canonical instruction has no numbered sections' }
    $parts = @($Text.Substring(0, $firstSection.Index).TrimEnd())
    foreach ($sectionId in $SectionIds) {
        $escaped = [Text.RegularExpressions.Regex]::Escape([string]$sectionId)
        $match = [Text.RegularExpressions.Regex]::Match(
            $Text,
            "(?ms)^##\s+$escaped\.\s.*?(?=^##\s+|\z)"
        )
        if (-not $match.Success) { throw "missing canonical instruction section: $sectionId" }
        $parts += $match.Value.TrimEnd()
    }
    return ($parts -join "`n`n") + "`n"
}

$totalInputBytes = 0
$appliedInstructionSections = @()
$researchCandidatePacketText = $null
$imageCandidatePacketText = $null
$blocks = foreach ($input in $header.allowedInputs) {
    $full = [IO.Path]::GetFullPath((Join-Path $project $input.path))
    if (-not [IO.File]::Exists($full)) { throw "missing input: $($input.path)" }
    $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $full).Hash.ToLowerInvariant()
    if ($actual -ne $input.sha256) { throw "input hash mismatch: $($input.path)" }
    $inputText = [IO.File]::ReadAllText($full, [Text.Encoding]::UTF8)
    if ([string]$header.pipelineVersion -eq [string]$manifest.pipelineVersion -and [string]$header.stage -eq 'research' -and [string]$input.role -eq 'candidate_packet') {
        if ($null -ne $researchCandidatePacketText) { throw 'research requires exactly one candidate_packet input' }
        $researchCandidatePacketText = $inputText
    }
    if ([string]$header.pipelineVersion -eq [string]$manifest.pipelineVersion -and [string]$header.stage -eq 'image_disambiguation' -and [string]$input.role -eq 'image_candidate_packet') {
        $imageCandidatePacketText = $inputText
    }
    $viewAttribute = ''
    if (
        $manifest -and
        $manifest.stageInstructionViews -and
        ([string]$input.path).Replace('\', '/') -eq ([string]$manifest.canonicalInstruction).Replace('\', '/')
    ) {
        $sections = @($manifest.stageInstructionViews.PSObject.Properties[[string]$header.stage].Value)
        if ($sections.Count -lt 1) { throw "missing stage instruction view: $($header.stage)" }
        $inputText = Select-MarkdownSections -Text $inputText -SectionIds $sections
        $appliedInstructionSections = @($sections)
        $viewAttribute = " view-sections=`"$($sections -join ',')`""
    }
    $totalInputBytes += [Text.Encoding]::UTF8.GetByteCount($inputText)
    "<locked-input path=`"$($input.path)`" role=`"$($input.role)`" sha256=`"$actual`"$viewAttribute>`n$inputText`n</locked-input>"
}
if ($manifest -and [string]$header.pipelineVersion -eq [string]$manifest.pipelineVersion -and [string]$header.stage -eq 'research') {
    if ($null -eq $researchCandidatePacketText) { throw 'research requires exactly one candidate_packet input' }
    try {
        $candidatePacket = $researchCandidatePacketText | ConvertFrom-Json
    }
    catch {
        throw 'candidate_packet must be valid JSON'
    }
    $candidateWorks = @($candidatePacket.works)
    if ($candidateWorks.Count -lt 1 -or $candidateWorks.Count -gt [int]$manifest.stageInputContracts.research.maxWorksPerContext) {
        throw 'candidate_packet work count is outside the research batch limit'
    }
    $allowedRiskFlags = @($manifest.stageInputContracts.research.riskFlags)
    $derivedComplexities = @()
    foreach ($candidateWork in $candidateWorks) {
        if ([string]::IsNullOrWhiteSpace([string]$candidateWork.identityAnchor)) { throw 'candidate work is missing identityAnchor' }
        if ([string]$candidateWork.identitySourceUrl -notmatch '^https?://') { throw 'candidate work is missing a valid identitySourceUrl' }
        if ($null -eq $candidateWork.riskFlags) { throw 'candidate work is missing riskFlags' }
        $workRiskFlags = @($candidateWork.riskFlags)
        foreach ($riskFlag in $workRiskFlags) {
            if ($allowedRiskFlags -notcontains [string]$riskFlag) { throw "candidate work has invalid riskFlag: $riskFlag" }
        }
        $derivedComplexities += if ($workRiskFlags.Count) { 'complex' } else { 'standard' }
    }
    if (@($derivedComplexities | Select-Object -Unique).Count -ne 1) { throw 'research batch mixes standard and complex works' }
    if ([string]$header.researchComplexity -ne [string]$derivedComplexities[0]) {
        throw "researchComplexity does not match candidate riskFlags: expected $($derivedComplexities[0])"
    }
}
if ($manifest -and [string]$header.pipelineVersion -eq [string]$manifest.pipelineVersion -and [string]$header.stage -eq 'image_disambiguation') {
    if ($null -eq $imageCandidatePacketText) { throw 'image disambiguation requires exactly one image_candidate_packet input' }
    try {
        $imagePacket = $imageCandidatePacketText | ConvertFrom-Json
    }
    catch {
        throw 'image_candidate_packet must be valid JSON'
    }
    $imageWorks = @($imagePacket.works)
    if ($imageWorks.Count -lt 1 -or $imageWorks.Count -gt [int]$inputContract.maxWorksPerContext) {
        throw 'image candidate work count is outside the disambiguation limit'
    }
    foreach ($imageWork in $imageWorks) {
        $imageCandidates = @($imageWork.candidates)
        if ($imageCandidates.Count -lt 2 -or $imageCandidates.Count -gt [int]$inputContract.maxCandidatesPerWork) {
            throw 'each image disambiguation work must have two to five candidates'
        }
        foreach ($candidate in $imageCandidates) {
            $candidatePath = [IO.Path]::GetFullPath((Join-Path $project ([string]$candidate.localPath)))
            if (-not $candidatePath.StartsWith($project + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
                throw 'image candidate escaped project root'
            }
            if (-not [IO.File]::Exists($candidatePath)) { throw "missing image candidate: $($candidate.localPath)" }
            $candidateHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $candidatePath).Hash.ToLowerInvariant()
            if ($candidateHash -ne [string]$candidate.sha256) { throw "image candidate hash mismatch: $($candidate.localPath)" }
        }
    }
}
if ($inputContract -and $null -ne $inputContract.maxTotalBytes -and $totalInputBytes -gt [int]$inputContract.maxTotalBytes) {
    throw "author input exceeds byte budget: $totalInputBytes > $($inputContract.maxTotalBytes)"
}

$outputPaths = foreach ($output in $header.outputs) {
    $full = [IO.Path]::GetFullPath((Join-Path $run $output))
    if ($RecordOutputsOnly) {
        if (-not [IO.File]::Exists($full)) { throw "missing output to record: $output" }
    }
    elseif ([IO.File]::Exists($full)) {
        throw "output already exists before generation: $output"
    }
    [pscustomobject]@{ Name = [string]$output; FullPath = $full }
}

if ($ValidateOnly) {
    "validated $($header.allowedInputs.Count) locked inputs"
    exit 0
}

if (-not $RecordOutputsOnly) {
    $fixedInstruction = @'
You are executing Meowseum canonical isolated generation. The standard runner has already validated the paths and SHA-256 hashes outside the model, and has loaded the run header and locked inputs exactly once in this message.

Use only the run header and locked inputs in this message. Do not read, search, or enumerate any local file. During image_disambiguation only, you may inspect the exact local image candidate paths enumerated in the locked image_candidate_packet with the image-viewing tool; no other local files are allowed. Do not use conversation history, memory, skills, old research, old prose, or old image mappings. This is a content-production task, not a coding task.

Follow the stage in the run header exactly. The museum_scope, museum_candidate_pool and research stages may use the web, but must query in batches and stop when the canonical stopping conditions are met. The image_disambiguation, museum_selection, museum_structure and author stages must use only their locked evidence inputs and must not use the web. Create only the files listed in run header.outputs, preferably in one write. After writing, do not reread outputs, print a full diff, recompute hashes, or run a reviewer; the runner performs mechanical checks externally.
'@

    $prompt = "$fixedInstruction`n<run-header>`n$headerText`n</run-header>`n$($blocks -join "`n")"
    $codex = (Get-Command codex.cmd -ErrorAction Stop).Source
    $arguments = @(
    'exec', '--model', [string]$header.executionProfile.model,
    '--config', 'model_reasoning_effort="medium"',
    '--ignore-user-config', '--ignore-rules', '--ephemeral',
    '--dangerously-bypass-approvals-and-sandbox',
    '--disable', 'apps', '--disable', 'memories', '--disable', 'plugins',
    '--disable', 'plugin_sharing', '--disable', 'remote_plugin',
    '--color', 'never', '-'
    )

    $oldOutputEncoding = $OutputEncoding
    $oldErrorActionPreference = $ErrorActionPreference
    $OutputEncoding = [Text.UTF8Encoding]::new($false)
    $resolvedLog = [string]$runContract.logPath
    if ([IO.File]::Exists($resolvedLog)) { throw "runner log already exists: $resolvedLog" }
    $modelStartedAt = [DateTimeOffset]::Now
    try {
        Push-Location $run
        # Windows PowerShell wraps native stderr (including harmless CLI warnings)
        # as ErrorRecord objects. Let the native process finish, then trust its exit code.
        $ErrorActionPreference = 'Continue'
        $prompt | & $codex @arguments 2>&1 | Tee-Object -FilePath $resolvedLog
        $codexExitCode = $LASTEXITCODE
        $modelCompletedAt = [DateTimeOffset]::Now
        $ErrorActionPreference = $oldErrorActionPreference
        if ($codexExitCode -ne 0) { throw "codex exited with code $codexExitCode" }
    }
    finally {
        Pop-Location
        $OutputEncoding = $oldOutputEncoding
        $ErrorActionPreference = $oldErrorActionPreference
    }

    $logText = [IO.File]::ReadAllText($resolvedLog, [Text.Encoding]::UTF8)
    $tokenMatches = [Text.RegularExpressions.Regex]::Matches($logText, 'tokens used\s*(?:\r?\n)+\s*([\d,]+)', [Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if ($tokenMatches.Count -lt 1) { throw 'runner log is missing token usage' }
    $totalTokens = [int64](($tokenMatches[$tokenMatches.Count - 1].Groups[1].Value -replace ',', ''))
}

$recordedOutputs = foreach ($output in $outputPaths) {
    if (-not [IO.File]::Exists($output.FullPath)) { throw "missing output after generation: $($output.Name)" }
    [ordered]@{
        path = $output.Name
        sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $output.FullPath).Hash.ToLowerInvariant()
        bytes = (Get-Item -LiteralPath $output.FullPath).Length
    }
}

$resultPath = Join-Path $run "$($header.stage)-result.json"
if ([IO.File]::Exists($resultPath)) { throw "stage result already exists: $resultPath" }
$completedAt = [DateTimeOffset]::Now
$result = [ordered]@{
    runId = [string]$header.runId
    stage = [string]$header.stage
    museumId = [string]$header.museumId
    caseId = [string]$header.caseId
    workId = [string]$header.workId
    pipelineVersion = [string]$header.pipelineVersion
    instructionVersion = [string]$header.instructionVersion
    model = [string]$header.executionProfile.model
    reasoningEffort = [string]$header.executionProfile.reasoningEffort
    runnerStartedAt = $runnerStartedAt.ToString('o')
    modelStartedAt = if ($modelStartedAt) { $modelStartedAt.ToString('o') } else { $null }
    modelCompletedAt = if ($modelCompletedAt) { $modelCompletedAt.ToString('o') } else { $null }
    completedAt = $completedAt.ToString('o')
    runnerDurationMs = [math]::Round(($completedAt - $runnerStartedAt).TotalMilliseconds)
    modelDurationMs = if ($modelStartedAt -and $modelCompletedAt) { [math]::Round(($modelCompletedAt - $modelStartedAt).TotalMilliseconds) } else { $null }
    tokenUsage = if ($null -ne $totalTokens) { [ordered]@{ total = $totalTokens; source = 'codex_cli_log' } } else { $null }
    instructionViewSections = @($appliedInstructionSections)
    logPath = if ($resolvedLog -and $resolvedLog.StartsWith($project + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        $resolvedLog.Substring($project.Length).TrimStart('\', '/').Replace('\', '/')
    } else { $resolvedLog }
    inputs = @($header.allowedInputs)
    outputs = @($recordedOutputs)
}
[IO.File]::WriteAllText($resultPath, ($result | ConvertTo-Json -Depth 8), [Text.UTF8Encoding]::new($false))
"recorded $($recordedOutputs.Count) outputs in $([IO.Path]::GetFileName($resultPath))"
