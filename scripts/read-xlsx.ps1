# قراءة ملف xlsx بلا تبعيات: الملف أرشيف يحتوي XML للأوراق ومخزن النصوص المشتركة.
param(
  [Parameter(Mandatory = $true)][string]$Path,
  [Parameter(Mandatory = $true)][string]$OutJson
)

$ErrorActionPreference = 'Stop'
$work = Join-Path $env:TEMP ('xlsxread_' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $work | Out-Null

try {
  $zip = Join-Path $work 'book.zip'
  Copy-Item -LiteralPath $Path -Destination $zip
  $expanded = Join-Path $work 'x'
  Expand-Archive -LiteralPath $zip -DestinationPath $expanded

  # مخزن النصوص المشتركة: خلايا النوع s تحمل فهرساً إليه
  $shared = @()
  $sharedPath = Join-Path $expanded 'xl\sharedStrings.xml'
  if (Test-Path $sharedPath) {
    [xml]$sx = Get-Content -LiteralPath $sharedPath -Encoding UTF8
    foreach ($si in $sx.sst.si) {
      if ($null -ne $si.t) {
        $shared += [string]$si.t.'#text'
      } elseif ($null -ne $si.r) {
        $shared += (($si.r | ForEach-Object { [string]$_.t.'#text' }) -join '')
      } else {
        $shared += ''
      }
    }
  }

  function Convert-ColumnRefToIndex([string]$ref) {
    $letters = ($ref -replace '[0-9]', '')
    $index = 0
    foreach ($ch in $letters.ToCharArray()) {
      $index = $index * 26 + ([int][char]::ToUpper($ch) - 64)
    }
    return $index - 1
  }

  [xml]$wb = Get-Content -LiteralPath (Join-Path $expanded 'xl\workbook.xml') -Encoding UTF8
  $sheetNames = @($wb.workbook.sheets.sheet | ForEach-Object { [string]$_.name })

  $result = [ordered]@{}
  $sheetFiles = Get-ChildItem -LiteralPath (Join-Path $expanded 'xl\worksheets') -Filter 'sheet*.xml' |
    Sort-Object { [int](($_.BaseName -replace '[^0-9]', '')) }

  for ($s = 0; $s -lt $sheetFiles.Count; $s++) {
    [xml]$sheet = Get-Content -LiteralPath $sheetFiles[$s].FullName -Encoding UTF8
    $rows = @()
    foreach ($row in $sheet.worksheet.sheetData.row) {
      $cells = @{}
      $maxIndex = -1
      foreach ($c in $row.c) {
        $idx = Convert-ColumnRefToIndex $c.r
        $value = ''
        if ($c.t -eq 's') {
          $i = [int]$c.v
          if ($i -lt $shared.Count) { $value = $shared[$i] }
        } elseif ($c.t -eq 'inlineStr') {
          $value = [string]$c.is.t
        } elseif ($null -ne $c.v) {
          $value = [string]$c.v
        }
        $cells[$idx] = ($value -replace "`r`n", ' ' -replace "`n", ' ').Trim()
        if ($idx -gt $maxIndex) { $maxIndex = $idx }
      }
      $line = @()
      for ($i = 0; $i -le $maxIndex; $i++) {
        $cell = ''
        if ($cells.ContainsKey($i)) { $cell = $cells[$i] }
        $line += $cell
      }
      $rows += , $line
    }
    $name = if ($s -lt $sheetNames.Count) { $sheetNames[$s] } else { $sheetFiles[$s].BaseName }
    $result[$name] = $rows
  }

  $result | ConvertTo-Json -Depth 6 -Compress | Set-Content -LiteralPath $OutJson -Encoding UTF8
  Write-Output ('sheets: ' + ($result.Keys -join ' | '))
  foreach ($k in $result.Keys) {
    Write-Output ("$k rows: " + $result[$k].Count)
  }
} finally {
  Remove-Item -Recurse -Force $work -ErrorAction SilentlyContinue
}
