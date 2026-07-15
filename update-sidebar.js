const fs = require('fs');

const paths = [
  'frontend/src/app/simulations/page.tsx',
  'frontend/src/app/rfis/page.tsx',
  'frontend/src/app/reports/page.tsx',
  'frontend/src/app/procurement/page.tsx',
  'frontend/src/app/page.tsx',
  'frontend/src/app/agents/page.tsx'
];

for (const file of paths) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('const navigation = [') && !content.includes('href: \'/simulations\'')) {
      content = content.replace(
        "{ name: 'RFIs', href: '/rfis'", 
        "{ name: 'Simulations', href: '/simulations', icon: Activity },\n  { name: 'RFIs', href: '/rfis'"
      );
      
      if (content.includes("import {") && content.includes("lucide-react")) {
        if (!content.includes("Activity,")) {
          content = content.replace("import {", "import { Activity,");
        }
      }
      fs.writeFileSync(file, content);
      console.log('Updated ' + file);
    }
  }
}
