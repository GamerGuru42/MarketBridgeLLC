const fs = require('fs');
const path = require('path');

function applyLightMode(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log('File not found: ' + filePath);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');

    // Auth Wall Removal & Redirect Fix
    content = content.replace(/\/listings/g, '/marketplace');

    // Aggressive Light Mode Regex Replacements (Chowdeck Style)
    content = content.replace(/bg-black/g, 'bg-[#FAFAFA]');
    content = content.replace(/bg-\[#000000\]/g, 'bg-[#FAFAFA]');
    content = content.replace(/bg-zinc-950/g, 'bg-zinc-50');
    content = content.replace(/bg-zinc-900/g, 'bg-zinc-100');
    content = content.replace(/bg-zinc-800/g, 'bg-zinc-200');
    content = content.replace(/bg-white\/5/g, 'bg-white');
    content = content.replace(/bg-white\/10/g, 'border-zinc-200');

    content = content.replace(/text-white\/30/g, 'text-zinc-400');
    content = content.replace(/text-white\/40/g, 'text-zinc-500');
    content = content.replace(/text-white\/50/g, 'text-zinc-500');
    content = content.replace(/text-white\/60/g, 'text-zinc-600');
    content = content.replace(/text-white\/70/g, 'text-zinc-700');
    content = content.replace(/text-zinc-400/g, 'text-zinc-500');
    content = content.replace(/text-zinc-300/g, 'text-zinc-700');
    content = content.replace(/text-white/g, 'text-zinc-900');

    content = content.replace(/border-white\/10/g, 'border-zinc-200');
    content = content.replace(/border-white\/20/g, 'border-zinc-200');
    content = content.replace(/border-white\/5/g, 'border-zinc-100');
    content = content.replace(/border-zinc-800/g, 'border-zinc-200');
    content = content.replace(/border-zinc-700/g, 'border-zinc-300');

    // Change placeholder text colors
    content = content.replace(/placeholder:text-white\/30/g, 'placeholder:text-zinc-400');

    content = content.replace(/glass-card/g, 'bg-white border border-zinc-200 rounded-[2rem] shadow-sm');

    // Add Export to CSV button to the User table header if missing
    if (filePath.includes('users/page.tsx') && !content.includes('Export CSV')) {
        const btnHtml = `<Button onClick={() => { const csvContent = "data:text/csv;charset=utf-8,ID,Name,Email,Role,Status\\n" + users.map(u => \`\${u.id},\${u.display_name},\${u.email},\${u.role},\${u.is_verified}\`).join("\\n"); const link = document.createElement("a"); link.href = encodeURI(csvContent); link.download = "users_export.csv"; link.click(); }} className="ml-4 bg-[#FF6200] text-black hover:bg-[#FF7A29] rounded-xl uppercase tracking-widest text-[10px] font-black h-10 px-4">Export CSV</Button>`;
        content = content.replace(/(<h1[^>]*>\s*User <span[^>]*>Directory<\/span>\s*<\/h1>)/i, `$1\n${btnHtml}`);

        // Also add the Button import if missing
        if (!content.includes('import { Button }')) {
            content = content.replace(/import {([^}]+)} from 'lucide-react';/, "import { Button } from '@/components/ui/button';\nimport {$1} from 'lucide-react';");
        }
    }

    fs.writeFileSync(filePath, content);
    console.log('Successfully updated ' + filePath);
}

// 3. Apply changes
applyLightMode('app/admin/users/page.tsx');
applyLightMode('app/admin/disputes/page.tsx');
