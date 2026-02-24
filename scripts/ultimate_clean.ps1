$mappings = @{
    'Signal'    = 'Notice'
    'Protocol'  = 'System'
    'Terminal'  = 'Dashboard'
    'slate-300' = 'white/70'
    'slate-400' = 'white/60'
    'slate-500' = 'white/40'
    'slate-600' = 'white/30'
    'slate-700' = 'white/20'
    'slate-800' = 'white/10'
    'slate-900' = 'black'
    'slate-950' = 'black'
}

$files = Get-ChildItem -Path "app" -Include "*.tsx", "*.ts" -Recurse

foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        $modified = $false
        foreach ($old in $mappings.Keys) {
            # Regex for case-insensitive replacement with word boundaries
            if ($old -match 'Signal|Protocol|Terminal') {
                $pattern = "\b" + [regex]::Escape($old) + "\b"
                if ([regex]::IsMatch($content, $pattern, "IgnoreCase")) {
                    $content = [regex]::Replace($content, $pattern, $mappings[$old], "IgnoreCase")
                    $modified = $true
                }
            }
            else {
                # Literal replacement for tailwind classes
                if ($content.Contains($old)) {
                    $content = $content.Replace($old, $mappings[$old])
                    $modified = $true
                }
            }
        }
        if ($modified) {
            [System.IO.File]::WriteAllText($file.FullName, $content)
            Write-Host "Absolutely Finalized $($file.FullName)"
        }
    }
    catch {
        Write-Warning "Failed to finalize $($file.FullName): $($_.Exception.Message)"
    }
}
