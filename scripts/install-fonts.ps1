# Install licensed Thmanyah fonts locally without committing binaries to GitHub.
# Put the two ZIP archives in Downloads, or provide their paths as arguments.
param(
 [string]$SansZip = "$env:USERPROFILE\Downloads\arfonts-thmanyah-sans_all.zip",
 [string]$SerifZip = "$env:USERPROFILE\Downloads\arfonts-thmanyah-serif-display_all.zip"
)
$ErrorActionPreference='Stop'
$root = Split-Path -Parent $PSScriptRoot
$destination = Join-Path $root 'public\fonts'
New-Item -ItemType Directory -Force -Path $destination | Out-Null
foreach($archive in @($SansZip,$SerifZip)){
 if(!(Test-Path -LiteralPath $archive)){ throw "Font archive not found: $archive" }
 $temp=Join-Path $env:TEMP ("sas-font-install-"+[guid]::NewGuid().ToString('N'))
 New-Item -ItemType Directory -Path $temp | Out-Null
 try{
  Expand-Archive -LiteralPath $archive -DestinationPath $temp -Force
  $files=Get-ChildItem -Path $temp -Filter '*.otf' -Recurse
  if(!$files){throw "No OTF files in $archive"}
  foreach($file in $files){Copy-Item -LiteralPath $file.FullName -Destination (Join-Path $destination $file.Name) -Force}
 }finally{Remove-Item -LiteralPath $temp -Recurse -Force -ErrorAction SilentlyContinue}
}
$required=@('thmanyah-sans-regular.otf','thmanyah-sans-medium.otf','thmanyah-sans-bold.otf','thmanyah-serif-display-regular.otf','thmanyah-serif-display-medium.otf','thmanyah-serif-display-bold.otf')
foreach($name in $required){if(!(Test-Path -LiteralPath (Join-Path $destination $name))){throw "Missing font: $name"}}
Write-Host 'Thmanyah fonts installed locally. Do not commit font binaries.' -ForegroundColor Green
