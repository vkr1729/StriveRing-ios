const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch (e) {
      return; // Skip broken symlinks or unreadable files
    }
    if (stat && stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        results = results.concat(walkDir(fullPath));
      }
    } else {
      if (file === 'Package.swift') {
        results.push(fullPath);
      }
    }
  });
  return results;
}

console.log('=== Running Swift Tools Version Fixer ===');
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  const packageSwiftFiles = walkDir(nodeModulesPath);
  console.log(`Found ${packageSwiftFiles.length} Package.swift files.`);
  packageSwiftFiles.forEach((filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('swift-tools-version: 6.2') || content.includes('swift-tools-version:6.2')) {
      console.log(`Fixing Swift tools version in: ${filePath}`);
      content = content.replace(/swift-tools-version:\s*6\.2/g, 'swift-tools-version: 6.0');
      fs.writeFileSync(filePath, content, 'utf8');
    }
  });
  console.log('=== Swift Tools Version Fixer Completed ===');
} else {
  console.log('node_modules folder not found. Skipping.');
}
