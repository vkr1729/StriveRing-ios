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
      return;
    }
    if (stat && stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        results = results.concat(walkDir(fullPath));
      }
    } else {
      if (file === 'Package.swift' || file.endsWith('.swift') || file === 'RuntimeScheduler.h') {
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

    // 1. Fix Package.swift configurations to force Swift 6.0 mode
    if (path.basename(filePath) === 'Package.swift') {
      if (content.includes('swift-tools-version: 6.2') || content.includes('swift-tools-version:6.2')) {
        console.log(`Fixing Swift tools version in: ${filePath}`);
        content = content.replace(/swift-tools-version:\s*6\.2/g, 'swift-tools-version: 6.0');
        changed = true;
      }
      if (content.includes('swiftLanguageModes')) {
        if (content.includes('swiftLanguageModes: [.v5]')) {
          console.log(`Restoring swiftLanguageModes to v6 in: ${filePath}`);
          content = content.replace(/swiftLanguageModes:\s*\[\.v5\]/g, 'swiftLanguageModes: [.v6]');
          changed = true;
        }
      }
    }

    // 2. Fix Swift 6 compiler errors in Swift files
    if (filePath.endsWith('.swift')) {
      // weak let -> weak var (Swift 6 strict checking)
      if (content.includes('weak let')) {
        content = content.replace(/\bweak\s+let\b/g, 'weak var');
        changed = true;
      }

      // Fix trailing comma before closing paren in Swift typealias (Swift 6 rejects trailing comma after last param)
      if (content.includes('_ arguments: consuming JavaScriptValuesBuffer,')) {
        console.log(`Fixing trailing comma in typealias: ${filePath}`);
        content = content.replace('_ arguments: consuming JavaScriptValuesBuffer,\n  ) async throws -> JavaScriptValue', '_ arguments: consuming JavaScriptValuesBuffer\n  ) async throws -> JavaScriptValue');
        changed = true;
      }

      // Fix regex literal in Swift 5 compatibility mode
      if (content.includes('/^[a-zA-Z_$][a-zA-Z0-9_$]*$/')) {
        console.log(`Fixing Swift 5 regex literal in: ${filePath}`);
        content = content.replace('/^[a-zA-Z_$][a-zA-Z0-9_$]*$/', 'try! Regex("^[a-zA-Z_$][a-zA-Z0-9_$]*$")');
        changed = true;
      }

      // Add unchecked Sendable overrides for mutable weak properties in Sendable classes
      if (path.basename(filePath) === 'HostFunctionContext.swift' && content.includes('class HostFunctionContext: Sendable')) {
        console.log(`Fixing Sendable class in HostFunctionContext: ${filePath}`);
        content = content.replace('class HostFunctionContext: Sendable', 'class HostFunctionContext: @unchecked Sendable');
        changed = true;
      }
      if (path.basename(filePath) === 'HostObjectContext.swift' && content.includes('class HostObjectContext: Sendable')) {
        console.log(`Fixing Sendable class in HostObjectContext: ${filePath}`);
        content = content.replace('class HostObjectContext: Sendable', 'class HostObjectContext: @unchecked Sendable');
        changed = true;
      }
      if (path.basename(filePath) === 'JavaScriptPropNameID.swift' && content.includes('class JavaScriptPropNameID: JavaScriptType') && !content.includes('@unchecked Sendable')) {
        console.log(`Fixing Sendable class in JavaScriptPropNameID: ${filePath}`);
        content = content.replace('class JavaScriptPropNameID: JavaScriptType', 'class JavaScriptPropNameID: JavaScriptType, @unchecked Sendable');
        changed = true;
      }
      if (path.basename(filePath) === 'JavaScriptValue.swift' && content.includes('class JavaScriptValue: JavaScriptType, Equatable, Escapable, Error') && !content.includes('@unchecked Sendable')) {
        console.log(`Fixing Sendable class in JavaScriptValue: ${filePath}`);
        content = content.replace('class JavaScriptValue: JavaScriptType, Equatable, Escapable, Error', 'class JavaScriptValue: JavaScriptType, Equatable, Escapable, Error, @unchecked Sendable');
        changed = true;
      }

      // Fix Task+immediate.swift — Task(name:priority:operation:) was renamed to
      // Task(executorPreference:priority:operation:) in Swift 6.0.
      if (path.basename(filePath) === 'Task+immediate.swift' && content.includes('Task(name: name, priority: .high, operation: operation)')) {
        console.log(`Fixing Task initializer in: ${filePath}`);
        content = content.replace(
          'return Task(name: name, priority: .high, operation: operation)',
          'return Task(executorPreference: .global(qos: .userInitiated), priority: .high, operation: operation)'
        );
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
