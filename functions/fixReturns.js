const fs = require('node:fs');
const path = require('node:path');

const routeFiles = [
  'src/routes/changeLogs.ts',
  'src/routes/classes.ts',
  'src/routes/levels.ts',
  'src/routes/potentialStudents.ts',
  'src/routes/studentRecords.ts',
  'src/routes/submissions.ts',
  'src/routes/users.ts',
];

routeFiles.forEach((file) => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // First, remove any double returns
    content = content.replace(/return return /g, 'return ');

    // Then fix res.json() calls that don't already have return
    content = content.replace(/([^r])es\.json\(/g, '$1return res.json(');
    content = content.replace(/([^r])es\.status\(/g, '$1return res.status(');

    // Fix any remaining res.json() at the start of lines
    content = content.replace(/^(\s*)res\.json\(/gm, '$1return res.json(');
    content = content.replace(/^(\s*)res\.status\(/gm, '$1return res.status(');

    fs.writeFileSync(filePath, content);
    console.log(`Fixed returns in ${file}`);
  }
});

console.log('All route files updated!');
