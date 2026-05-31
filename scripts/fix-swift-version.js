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
      if (file === 'Package.swift' || file.endsWith('.swift')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

console.log('=== Running Swift Tools & Syntax Fixer ===');
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  const swiftFiles = walkDir(nodeModulesPath);
  console.log(`Found ${swiftFiles.length} Swift-related files.`);
  swiftFiles.forEach((filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // 1. Fix Package.swift configurations to force Swift 5 mode
    if (path.basename(filePath) === 'Package.swift') {
      if (content.includes('swift-tools-version: 6.2') || content.includes('swift-tools-version:6.2')) {
        console.log(`Fixing Swift tools version in: ${filePath}`);
        content = content.replace(/swift-tools-version:\s*6\.2/g, 'swift-tools-version: 6.0');
        changed = true;
      }
      if (content.includes('swiftLanguageModes')) {
        console.log(`Downgrading swiftLanguageModes to v5 in: ${filePath}`);
        content = content.replace(/swiftLanguageModes:\s*\[\.v6\]/g, 'swiftLanguageModes: [.v5]');
        changed = true;
      }
    }

    // 2. Fix Swift 6 compiler errors & Swift 5 compat issues in Swift files
    if (filePath.endsWith('.swift')) {
      if (content.includes('weak let')) {
        content = content.replace(/\bweak\s+let\b/g, 'weak var');
        changed = true;
      }
      if (content.includes('JavaScriptValuesBuffer,')) {
        // Fix trailing comma in JavaScriptRuntime.swift
        const original = content;
        content = content.replace(/(_ arguments:\s*consuming\s*JavaScriptValuesBuffer),\s*\)/g, '$1\n  )');
        if (content !== original) {
          changed = true;
        }
      }
      if (content.includes('/^[a-zA-Z_$][a-zA-Z0-9_$]*$/')) {
        // Fix regex literal in Swift 5 mode (JavaScriptRuntime.swift:299)
        console.log(`Fixing Swift 5 regex literal in: ${filePath}`);
        content = content.replace('/^[a-zA-Z_$][a-zA-Z0-9_$]*$/', 'try! Regex("^[a-zA-Z_$][a-zA-Z0-9_$]*$")');
        changed = true;
      }
    }

    if (changed) {
      console.log(`Patching file: ${filePath}`);
      fs.writeFileSync(filePath, content, 'utf8');
    }
  });
  console.log('=== Swift Tools & Syntax Fixer Completed ===');
} else {
  console.log('node_modules folder not found. Skipping.');
}
