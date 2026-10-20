param(
  [Parameter(Mandatory=$true)][string]$Installer,
  [Parameter(Mandatory=$true)][string]$InstallDirectory
)
$ErrorActionPreference = 'Stop'
# NSIS requires /D to be the last argument, without quotes, even with spaces.
$process = Start-Process -FilePath (Resolve-Path $Installer).Path -ArgumentList "/S /D=$InstallDirectory" -PassThru -Wait
if ($process.ExitCode -ne 0) { throw "Falló el instalador: $($process.ExitCode)" }
if (-not (Test-Path "$InstallDirectory\arriendos.exe")) { throw 'No se instaló arriendos.exe' }
$desktop = [Environment]::GetFolderPath('Desktop')
if (-not (Test-Path "$desktop\Arriendos.lnk")) { throw 'No se creó el acceso directo del escritorio' }
