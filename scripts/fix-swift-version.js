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

      // Add unchecked Sendable overrides to fix Swift 6 mutable property warnings in Sendable classes
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

      // Fix Task.immediate polyfill by returning fallback Task directly (Task.immediate is not in standard library)
      if (path.basename(filePath) === 'Task+immediate.swift' && content.includes('Task.immediate')) {
        console.log(`Fixing Task.immediate polyfill in: ${filePath}`);
        const target = `    if #available(macOS 26.0, iOS 26.0, watchOS 26.0, tvOS 26.0, *) {
      return Task.immediate(name: name, priority: priority, operation: operation)
    } else {
      // In the polyfill always use the highest priority and hope it executes earlier.
      return Task(name: name, priority: .high, operation: operation)
    }`;
        const replacement = `    return Task(name: name, priority: .high, operation: operation)`;
        content = content.replace(target, replacement);
        changed = true;
      }

      // Fix deallocate C function pointer and Swift closure conversion in JavaScriptNativeState.swift
      if (path.basename(filePath) === 'JavaScriptNativeState.swift' && content.includes('func deallocate(context: UnsafeMutableRawPointer)')) {
        console.log(`Fixing deallocate closure in: ${filePath}`);
        const target = `    // Create a native state in C++ that stores an opaque pointer to \`self\`.
    self.pointee = expo.NativeState(ptr, deallocate)
  }`;
        const replacement = `    // Create a deallocate C function pointer
    let deallocate: @convention(c) (UnsafeMutableRawPointer) -> Void = { context in
      let unmanagedContext = Unmanaged<JavaScriptNativeState>.fromOpaque(context)
      let nativeState = unmanagedContext.takeUnretainedValue()

      // Call the deallocator closure from Swift.
      nativeState.deallocator.take()?(nativeState)

      // Release both C++ instance and unmanaged reference.
      nativeState.pointee = nil
      unmanagedContext.release()
    }

    // Create a native state in C++ that stores an opaque pointer to \`self\`.
    self.pointee = expo.NativeState(ptr, deallocate)
  }`;
        
        const originalFunc = `    func deallocate(context: UnsafeMutableRawPointer) {
      let unmanagedContext = Unmanaged<JavaScriptNativeState>.fromOpaque(context)
      let nativeState = unmanagedContext.takeUnretainedValue()

      // Call the deallocator closure from Swift.
      nativeState.deallocator.take()?(nativeState)

      // Release both C++ instance and unmanaged reference.
      nativeState.pointee = nil
      unmanagedContext.release()
    }`;
        
        content = content.replace(originalFunc, '');
        content = content.replace(target, replacement);
        changed = true;
      }

      // Fix C++ interop constructs in JavaScriptRuntime.swift
      if (path.basename(filePath) === 'JavaScriptRuntime.swift') {
        if (content.includes('self.scheduler = expo.RuntimeScheduler()')) {
          console.log(`Replacing expo.RuntimeScheduler() constructors in: ${filePath}`);
          content = content.replace(/self\.scheduler\s*=\s*expo\.RuntimeScheduler\(\)/g, 'self.scheduler = expo.createDefaultRuntimeScheduler()');
          changed = true;
        }
        if (content.includes('self.scheduler = expo.RuntimeScheduler(scheduler, fn)')) {
          console.log(`Replacing expo.RuntimeScheduler(scheduler, fn) constructor in: ${filePath}`);
          content = content.replace('self.scheduler = expo.RuntimeScheduler(scheduler, fn)', 'self.scheduler = expo.createRuntimeScheduler(scheduler, fn)');
          changed = true;
        }
        if (content.includes('vector.push_back(consuming: propNameId)')) {
          console.log(`Fixing push_back(consuming:) in: ${filePath}`);
          content = content.replace('vector.push_back(consuming: propNameId)', 'vector.push_back(propNameId)');
          changed = true;
        }
        if (content.includes('private func createFunctionClosure(runtime: JavaScriptRuntime, name: String? = nil, _ closure: @escaping JavaScriptRuntime.SyncFunctionClosure) -> expo.HostFunctionClosure')) {
          console.log(`Fixing createFunctionClosure in: ${filePath}`);
          const target = `private func createFunctionClosure(runtime: JavaScriptRuntime, name: String? = nil, _ closure: @escaping JavaScriptRuntime.SyncFunctionClosure) -> expo.HostFunctionClosure {
  let context = Unmanaged.passRetained(HostFunctionContext(runtime: runtime, name: name, closure)).toOpaque()

  func call(context: UnsafeMutableRawPointer, thisPtr: UnsafePointer<facebook.jsi.Value>, argumentsPtr: UnsafePointer<facebook.jsi.Value>, argumentsCount: Int) -> facebook.jsi.Value {
    let context = Unmanaged<HostFunctionContext>.fromOpaque(context).takeUnretainedValue()

    guard let runtime = context.runtime else {
      FatalError.runtimeLost()
    }
    let this = UnsafeMutablePointer(mutating: thisPtr).move()
    let argumentsRef = JavaScriptValuesBuffer(runtime, start: argumentsPtr, count: argumentsCount).ref()

    return JavaScriptActor.assumeIsolated {
      return forwardingSwiftErrorsToJS(runtime: runtime) {
        let thisValue = JavaScriptValue(runtime, this)
        return try context.call(thisValue, argumentsRef.take()).asJSIValue()
      }
    }
  }

  func deallocate(context: UnsafeMutableRawPointer) {
    Unmanaged<HostFunctionContext>.fromOpaque(context).release()
  }

  return expo.HostFunctionClosure(context, call, deallocate)
}`;
          const replacement = `private func createFunctionClosure(runtime: JavaScriptRuntime, name: String? = nil, _ closure: @escaping JavaScriptRuntime.SyncFunctionClosure) -> expo.HostFunctionClosure {
  let context = Unmanaged.passRetained(HostFunctionContext(runtime: runtime, name: name, closure)).toOpaque()

  let call: @convention(c) (UnsafeMutableRawPointer, UnsafePointer<facebook.jsi.Value>, UnsafePointer<facebook.jsi.Value>, Int) -> facebook.jsi.Value = { context, thisPtr, argumentsPtr, argumentsCount in
    let context = Unmanaged<HostFunctionContext>.fromOpaque(context).takeUnretainedValue()

    guard let runtime = context.runtime else {
      FatalError.runtimeLost()
    }
    let this = UnsafeMutablePointer(mutating: thisPtr).move()
    let argumentsRef = JavaScriptValuesBuffer(runtime, start: argumentsPtr, count: argumentsCount).ref()

    return JavaScriptActor.assumeIsolated {
      return forwardingSwiftErrorsToJS(runtime: runtime) {
        let thisValue = JavaScriptValue(runtime, this)
        return try context.call(thisValue, argumentsRef.take()).asJSIValue()
      }
    }
  }

  let deallocate: @convention(c) (UnsafeMutableRawPointer) -> Void = { context in
    Unmanaged<HostFunctionContext>.fromOpaque(context).release()
  }

  return expo.HostFunctionClosure(context, call, deallocate)
}`;
          content = content.replace(target, replacement);
          changed = true;
        }
      }
    }

    // 3. Fix RuntimeScheduler.h to expose factory functions to Swift
    if (path.basename(filePath) === 'RuntimeScheduler.h' && !content.includes('createDefaultRuntimeScheduler')) {
      console.log(`Adding factory functions in RuntimeScheduler.h: ${filePath}`);
      const target = '} SWIFT_SHARED_REFERENCE(retainRuntimeScheduler, releaseRuntimeScheduler);';
      const replacement = `} SWIFT_SHARED_REFERENCE(retainRuntimeScheduler, releaseRuntimeScheduler);

inline RuntimeScheduler* _Nonnull createDefaultRuntimeScheduler() {
  return new RuntimeScheduler();
}

inline RuntimeScheduler* _Nonnull createRuntimeScheduler(void* _Nonnull scheduler, RuntimeScheduler::ScheduleFn _Nonnull fn) {
  return new RuntimeScheduler(scheduler, fn);
}`;
      content = content.replace(target, replacement);
      changed = true;
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
