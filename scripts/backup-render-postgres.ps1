# Sauvegarde logique en lecture seule de PostgreSQL Render.
# Ce script ne modifie pas la base distante. Il crée un fichier .dump local.
# Prérequis : client PostgreSQL 18+ (pg_dump et pg_restore) et IP du PC autorisée
# dans Render > base PostgreSQL > Networking. Ne jamais partager l'URL de connexion.

$ErrorActionPreference = 'Stop'

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
$pgRestore = Get-Command pg_restore -ErrorAction SilentlyContinue
if (-not $pgDump -or -not $pgRestore) {
    throw "pg_dump/pg_restore introuvables. Installez les outils client PostgreSQL 18 ou plus récent, puis rouvrez PowerShell."
}

$versionText = (& $pgDump.Source --version | Out-String).Trim()
$versionMatch = [regex]::Match($versionText, '(\d+)')
if (-not $versionMatch.Success -or [int]$versionMatch.Groups[1].Value -lt 18) {
    throw "Version client insuffisante : $versionText. La base Render utilise PostgreSQL 18 ; utilisez un client pg_dump 18 ou plus récent."
}

$desktop = [Environment]::GetFolderPath('Desktop')
$backupPath = Join-Path $desktop ("nafa-finance-postgres-{0}.dump" -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
$secureUrl = Read-Host "Collez l'URL externe PostgreSQL depuis Render (ne la partagez pas)" -AsSecureString
$ptr = [IntPtr]::Zero
$connectionString = $null

try {
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureUrl)
    $connectionString = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    if ($connectionString -notmatch '^postgres(ql)?://') {
        throw "L'URL saisie ne ressemble pas à une URL PostgreSQL."
    }

    Write-Host "Sauvegarde en cours vers : $backupPath"
    $dumpArgs = @(
        "--dbname=$connectionString",
        '--format=custom',
        '--no-owner',
        '--no-privileges',
        "--file=$backupPath"
    )
    & $pgDump.Source @dumpArgs
    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump a échoué (code $LASTEXITCODE). Vérifiez l'IP autorisée dans Render et l'URL externe."
    }
    if (-not (Test-Path $backupPath) -or (Get-Item $backupPath).Length -le 0) {
        throw "Le fichier de sauvegarde est absent ou vide."
    }

    $archiveList = @(& $pgRestore.Source --list $backupPath)
    if ($LASTEXITCODE -ne 0 -or -not $archiveList -or $archiveList.Count -lt 2) {
        throw "Le fichier a été créé mais sa vérification a échoué. Ne le considérez pas comme une sauvegarde valide."
    }

    Write-Host ""
    Write-Host "VERIFICATION REUSSIE"
    Write-Host ("Fichier : {0}" -f $backupPath)
    Write-Host ("Taille : {0:N2} Mo" -f ((Get-Item $backupPath).Length / 1MB))
    Write-Host "Premières entrées de l'archive :"
    $archiveList | Select-Object -First 12 | ForEach-Object { Write-Host $_ }
    Write-Host ""
    Write-Host "Conservez ce fichier dans un emplacement privé et sécurisé. Il contient des données personnelles."
    Write-Host "Cette vérification confirme que l'archive est lisible ; elle ne remplace pas un test de restauration."
}
finally {
    $connectionString = $null
    if ($ptr -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
    if ($secureUrl) { $secureUrl.Dispose() }
}
