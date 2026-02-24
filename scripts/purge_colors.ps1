$mappings = @{
    'text-zinc-500'    = 'text-white/40'
    'text-zinc-600'    = 'text-white/30'
    'text-zinc-700'    = 'text-white/20'
    'text-zinc-800'    = 'text-white/10'
    'text-zinc-900'    = 'text-white/5'
    'text-zinc-400'    = 'text-white/60'
    'text-zinc-300'    = 'text-white/70'
    'text-zinc-200'    = 'text-white/80'
    'text-zinc-100'    = 'text-white/90'
    'text-green-400'   = 'text-[#FF6200]'
    'text-green-500'   = 'text-[#FF6200]'
    'text-green-600'   = 'text-[#FF6200]'
    'text-red-400'     = 'text-[#FF6200]'
    'text-red-500'     = 'text-[#FF6200]'
    'text-red-600'     = 'text-[#FF6200]'
    'text-blue-400'    = 'text-[#FF6200]'
    'text-blue-500'    = 'text-[#FF6200]'
    'text-blue-600'    = 'text-[#FF6200]'
    'text-purple-500'  = 'text-[#FF6200]'
    'text-orange-500'  = 'text-[#FF6200]'
    'text-orange-600'  = 'text-[#FF6200]'
    'bg-green-500'     = 'bg-[#FF6200]'
    'bg-red-500'       = 'bg-[#FF6200]'
    'bg-blue-500'      = 'bg-[#FF6200]'
    'bg-orange-500'    = 'bg-[#FF6200]'
    'border-green-500' = 'border-[#FF6200]'
    'border-red-500'   = 'border-[#FF6200]'
    'border-blue-500'  = 'border-[#FF6200]'
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
