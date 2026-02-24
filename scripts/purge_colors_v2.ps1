$mappings = @{
    'bg-orange-100'         = 'bg-[#FF6200]/10'
    'text-orange-800'       = 'text-[#FF6200]'
    'bg-green-100'          = 'bg-[#FF6200]/10'
    'text-green-800'        = 'text-[#FF6200]'
    'text-blue-300'         = 'text-white/70'
    'text-orange-400'       = 'text-[#FF6200]'
    'bg-emerald-500/10'     = 'bg-[#FF6200]/10'
    'text-emerald-500'      = 'text-[#FF6200]'
    'border-emerald-500/20' = 'border-[#FF6200]/20'
    'text-green-600'        = 'text-[#FF6200]'
    'text-orange-600'       = 'text-[#FF6200]'
    'bg-blue-100'           = 'bg-white/10'
    'text-blue-600'         = 'text-white/60'
    'bg-red-500/20'         = 'bg-[#FF6200]/20'
    'text-red-500'          = 'text-[#FF6200]'
    'border-red-500/50'     = 'border-[#FF6200]/50'
    'bg-green-950/30'       = 'bg-black'
    'border-green-900'      = 'border-white/10'
}

$files = Get-ChildItem -Path "app" -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        $modified = $false
        foreach ($old in $mappings.Keys) {
            if ($content.Contains($old)) {
                $content = $content.Replace($old, $mappings[$old])
                $modified = $true
            }
        }
        if ($modified) {
            [System.IO.File]::WriteAllText($file.FullName, $content)
            Write-Host "Updated $($file.FullName)"
        }
    }
    catch {
        Write-Warning "Failed to process $($file.FullName): $($_.Exception.Message)"
    }
}
