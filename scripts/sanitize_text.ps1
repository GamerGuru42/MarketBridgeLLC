$mappings = @{
    'Signal Lost'           = 'Page Not Found'
    'Signal Transmitted'    = 'Code Sent'
    'Signal Dropped'        = 'Error Occurred'
    'Signal Jammed'         = 'Service Unavailable'
    'Initializing Terminal' = 'Loading Dashboard'
    'Merchant Terminal'     = 'Seller Dashboard'
    'Protocol Secure'       = 'System Secure'
    'Security Protocol'     = 'Security System'
    'Verification Protocol' = 'Verification Process'
    'New Asset Protocol'    = 'New Listing Process'
    'Discard Protocol'      = 'Cancel Process'
    'Foundry'               = 'Platform'
    'Encoded signal'        = 'Verification code'
    'intercepted'           = 'received'
    'Terminal'              = 'Dashboard'
    'Node'                  = 'Campus'
    'Decommissioned'        = 'Removed'
    'Diagnostics'           = 'Status'
    'Broadcast Active'      = 'Public Access Enabled'
    'Broadcast Disabled'    = 'Public Access Disabled'
    'Resend Signal'         = 'Resend Code'
    'Signal'                = 'Notice'
}

$files = Get-ChildItem -Path "app" -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        $modified = $false
        foreach ($old in $mappings.Keys) {
            # Case-insensitive replacement for standalone words or specific phrases
            if ($content -match $old) {
                # Use regex for more precise swapping if needed, but for now literal is okay
                # We use regex to handle case sensitivity and Word Boundaries for some
                $pattern = [regex]::Escape($old)
                if ($content -match $pattern) {
                    $content = [regex]::Replace($content, $pattern, $mappings[$old], [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
                    $modified = $true
                }
            }
        }
        if ($modified) {
            [System.IO.File]::WriteAllText($file.FullName, $content)
            Write-Host "Sanitized $($file.FullName)"
        }
    }
    catch {
        Write-Warning "Failed to sanitize $($file.FullName): $($_.Exception.Message)"
    }
}
