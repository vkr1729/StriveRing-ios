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
      if (file === 'Package.swift' || file.endsWith('.swift') || file === 'RuntimeScheduler.h' ||
          file === 'NativeState.h' || file === 'HostFunctionClosure.h' ||
          file === 'HostObjectCallbacks.h' || file === 'HostObject.h' ||
          file === 'precompiled_modules.rb' || file.endsWith('.podspec')) {
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

    // 0. Fix swift_version in .podspec files to compile in Swift 5 mode
    if (filePath.endsWith('.podspec')) {
      if (content.includes("swift_version  = '6.0'") || content.includes("swift_version = '6.0'") || content.includes('swift_version = "6.0"')) {
        console.log(`Fixing Swift version to 5.9 in podspec: ${filePath}`);
        content = content.replace(/swift_version\s*=\s*['"]6\.0['"]/g, "swift_version  = '5.9'");
        changed = true;
      }
    }

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

      // Fix trailing comma before closing paren in Swift typealiases (Swift 6 rejects trailing comma after last param)
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

      // Fix invalid @MainActor conformance syntax in SwiftUI classes/extensions
      if (path.basename(filePath) === 'SwiftUIHostingView.swift') {
        const target = 'public final class HostingView<Props: ViewProps, ContentView: View<Props>>: ExpoView, @MainActor AnyExpoSwiftUIHostingView {';
        const replacement = '@MainActor\n  public final class HostingView<Props: ViewProps, ContentView: View<Props>>: ExpoView, AnyExpoSwiftUIHostingView {';
        if (content.includes(target)) {
          console.log(`Fixing @MainActor on class HostingView in: ${filePath}`);
          content = content.replace(target, replacement);
          changed = true;
        }
      }

      if (path.basename(filePath) === 'SwiftUIVirtualView.swift') {
        // 1. final class SwiftUIVirtualView
        const target1 = 'final class SwiftUIVirtualView<Props: ViewProps, ContentView: View<Props>>: SwiftUIVirtualViewObjC, @MainActor ExpoSwiftUIView {';
        const replacement1 = '@MainActor\n  final class SwiftUIVirtualView<Props: ViewProps, ContentView: View<Props>>: SwiftUIVirtualViewObjC, ExpoSwiftUIView {';
        if (content.includes(target1)) {
          console.log(`Fixing @MainActor on class SwiftUIVirtualView in: ${filePath}`);
          content = content.replace(target1, replacement1);
          changed = true;
        }

        // 2. extension ExpoSwiftUI.SwiftUIVirtualView: @MainActor
        const target2 = 'extension ExpoSwiftUI.SwiftUIVirtualView: @MainActor ExpoSwiftUI.ViewWrapper {';
        const replacement2 = '@MainActor\nextension ExpoSwiftUI.SwiftUIVirtualView: ExpoSwiftUI.ViewWrapper {';
        if (content.includes(target2)) {
          console.log(`Fixing @MainActor on extension SwiftUIVirtualView in: ${filePath}`);
          content = content.replace(target2, replacement2);
          changed = true;
        }

        // 3. final class SwiftUIVirtualViewDev
        const target3 = 'final class SwiftUIVirtualViewDev<Props: ViewProps, ContentView: View<Props>>: SwiftUIVirtualViewObjCDev, @MainActor ExpoSwiftUIView {';
        const replacement3 = '@MainActor\n  final class SwiftUIVirtualViewDev<Props: ViewProps, ContentView: View<Props>>: SwiftUIVirtualViewObjCDev, ExpoSwiftUIView {';
        if (content.includes(target3)) {
          console.log(`Fixing @MainActor on class SwiftUIVirtualViewDev in: ${filePath}`);
          content = content.replace(target3, replacement3);
          changed = true;
        }

        // 4. extension ExpoSwiftUI.SwiftUIVirtualViewDev: @MainActor
        const target4 = 'extension ExpoSwiftUI.SwiftUIVirtualViewDev: @MainActor ExpoSwiftUI.ViewWrapper {';
        const replacement4 = '@MainActor\nextension ExpoSwiftUI.SwiftUIVirtualViewDev: ExpoSwiftUI.ViewWrapper {';
        if (content.includes(target4)) {
          console.log(`Fixing @MainActor on extension SwiftUIVirtualViewDev in: ${filePath}`);
          content = content.replace(target4, replacement4);
          changed = true;
        }
      }

      if (path.basename(filePath) === 'ViewDefinition.swift') {
        const target = 'extension UIView: @MainActor AnyArgument {';
        const replacement = '@MainActor\nextension UIView: AnyArgument {';
        if (content.includes(target)) {
          console.log(`Fixing @MainActor on extension UIView in: ${filePath}`);
          content = content.replace(target, replacement);
          changed = true;
        }
      }

      // Fix Task+immediate.swift — Swift 6.0 does not have Task.immediate or
      // Task(executorPreference:), so replace with plain Task(priority:operation:).
      if (path.basename(filePath) === 'Task+immediate.swift' && content.includes('Task.immediate')) {
        console.log(`Fixing Task+immediate polyfill in: ${filePath}`);
        // Replace the entire `if #available / else` block with a simple fallback
        const target = `    if #available(macOS 26.0, iOS 26.0, watchOS 26.0, tvOS 26.0, *) {
      return Task.immediate(name: name, priority: priority, operation: operation)
    } else {
      // In the polyfill always use the highest priority and hope it executes earlier.
      return Task(name: name, priority: .high, operation: operation)
    }`;
        const replacement = `    // Task.immediate is not available on this OS version; use plain Task as a fallback.
    return Task(priority: priority ?? .high, operation: operation)`;
        if (content.includes(target)) {
          content = content.replace(target, replacement);
          changed = true;
        } else {
          // Might already be patched differently, try a broader replace
          if (content.includes('Task(name: name, priority: .high, operation: operation)')) {
            content = content.replace(
              /return Task\(name: name, priority: \.high, operation: operation\)/g,
              'return Task(priority: priority ?? .high, operation: operation)'
            );
            // Also remove the #available branch if present
            content = content.replace(
              /if #available\(macOS 26\.0, iOS 26\.0, watchOS 26\.0, tvOS 26\.0, \*\) \{\s*return Task\.immediate\(name: name, priority: priority, operation: operation\)\s*\} else \{\s*/g,
              '// Task.immediate is not available on this OS version; use plain Task as a fallback.\n    '
            );
            if (content.includes('return Task.immediate')) {
              // Strip the entire #available block, keep only the fallback
              const funcStart = content.indexOf('public static func immediate_polyfill(');
              const firstBrace = content.indexOf('{', funcStart);
              const returnStmt = content.indexOf('return Task(priority:', firstBrace);
              if (returnStmt > 0) {
                const afterReturn = content.indexOf('\n', returnStmt);
                const closingBrace = content.indexOf('}', afterReturn);
                content = content.substring(0, firstBrace + 1) + '\n    return Task(priority: priority ?? .high, operation: operation)\n  }';
                console.log('Replaced entire Task+immediate function body');
              }
            }
            changed = true;
          }
        }
      }

      // Fix push_back(consuming:) and type conversion to avoid move-only PropNameID vector in Swift
      if (path.basename(filePath) === 'JavaScriptRuntime.swift') {
        const targetStr = 'let propNameId = facebook.jsi.PropNameID.forUtf8(runtime.pointee, std.string(propertyName))';
        if (content.includes(targetStr)) {
          console.log(`Fixing PropNameID loop via string replacement in: ${filePath}`);
          content = content.replace(targetStr, '');
          content = content.replace('vector.push_back(consuming: propNameId)', 'vector.push_back(std.string(propertyName))');
          content = content.replace('vector.push_back(consume propNameId)', 'vector.push_back(std.string(propertyName))');
          content = content.replace('vector.push_back(propNameId)', 'vector.push_back(std.string(propertyName))');
          changed = true;
        }
      }

      // Fix C++ constructor visibility — Swift 6.0 on Xcode 16.4 cannot see
      // C++ constructors on SWIFT_SHARED_REFERENCE types. Use factory functions.
      if (path.basename(filePath) === 'JavaScriptRuntime.swift') {
        // expo.RuntimeScheduler() -> expo.createDefaultRuntimeScheduler()
        if (content.includes('self.scheduler = expo.RuntimeScheduler()')) {
          console.log(`Replacing expo.RuntimeScheduler() constructors in: ${filePath}`);
          content = content.replace(/self\.scheduler\s*=\s*expo\.RuntimeScheduler\(\)/g, 'self.scheduler = expo.createDefaultRuntimeScheduler()');
          changed = true;
        }
        // expo.RuntimeScheduler(scheduler, fn) -> expo.createRuntimeScheduler(scheduler, fn)
        if (content.includes('self.scheduler = expo.RuntimeScheduler(scheduler, fn)')) {
          console.log(`Replacing expo.RuntimeScheduler(scheduler, fn) in: ${filePath}`);
          content = content.replace('self.scheduler = expo.RuntimeScheduler(scheduler, fn)', 'self.scheduler = expo.createRuntimeScheduler(scheduler, fn)');
          changed = true;
        }
        // expo.HostFunctionClosure(context, call, deallocate) -> expo.createHostFunctionClosure(...)
        if (content.includes('return expo.HostFunctionClosure(context, call, deallocate)')) {
          console.log(`Replacing expo.HostFunctionClosure constructor in: ${filePath}`);
          content = content.replace(
            'return expo.HostFunctionClosure(context, call, deallocate)',
            'return expo.createHostFunctionClosure(context, call, deallocate)'
          );
          changed = true;
        }
      }

      // expo.NativeState(ptr, deallocate) -> expo.createNativeState(ptr, deallocate)
      if (path.basename(filePath) === 'JavaScriptNativeState.swift' && content.includes('self.pointee = expo.NativeState(ptr, deallocate)')) {
        console.log(`Replacing expo.NativeState constructor in: ${filePath}`);
        content = content.replace(
          'self.pointee = expo.NativeState(ptr, deallocate)',
          'self.pointee = expo.createNativeState(ptr, deallocate)'
        );
        changed = true;
      }
    }

    // 3. Add factory functions to C++ headers so Swift can construct these types
    if (path.basename(filePath) === 'NativeState.h' && !content.includes('createNativeState')) {
      console.log(`Adding createNativeState factory to NativeState.h: ${filePath}`);
      const target = '} SWIFT_IMMORTAL_REFERENCE; // class NativeState';
      const replacement = `} SWIFT_IMMORTAL_REFERENCE; // class NativeState
 
inline NativeState *_Nonnull createNativeState(NativeState::Context context, NativeState::Deallocator *_Nonnull deallocator) {
  return new NativeState(context, deallocator);
}`;
      content = content.replace(target, replacement);
      changed = true;
    }
    if (path.basename(filePath) === 'HostFunctionClosure.h' && !content.includes('createHostFunctionClosure')) {
      console.log(`Adding createHostFunctionClosure factory to HostFunctionClosure.h: ${filePath}`);
      const target = '} SWIFT_IMMORTAL_REFERENCE; // class HostFunctionClosure';
      const replacement = `} SWIFT_IMMORTAL_REFERENCE; // class HostFunctionClosure
 
inline HostFunctionClosure *_Nonnull createHostFunctionClosure(HostFunctionClosure::Context context, HostFunctionClosure::Closure *_Nonnull closure, HostFunctionClosure::Deallocator *_Nonnull deallocator) {
  return new HostFunctionClosure(context, closure, deallocator);
}`;
      content = content.replace(target, replacement);
      changed = true;
    }
    if (path.basename(filePath) === 'RuntimeScheduler.h' && !content.includes('createDefaultRuntimeScheduler')) {
      console.log(`Adding factory functions in RuntimeScheduler.h: ${filePath}`);
      const target = '} SWIFT_SHARED_REFERENCE(retainRuntimeScheduler, releaseRuntimeScheduler);';
      const replacement = `} SWIFT_SHARED_REFERENCE(retainRuntimeScheduler, releaseRuntimeScheduler);
 
inline RuntimeScheduler* _Nonnull createDefaultRuntimeScheduler() {
  return new RuntimeScheduler();
}
 
inline RuntimeScheduler* _Nonnull createRuntimeScheduler(void* _Nullable scheduler, RuntimeScheduler::ScheduleFn _Nonnull fn) {
  return new RuntimeScheduler(scheduler, fn);
}`;
      content = content.replace(target, replacement);
      changed = true;
    }
    if (path.basename(filePath) === 'HostObjectCallbacks.h' && !content.includes('using PropNameIds = std::vector<std::string>;')) {
      console.log(`Patching HostObjectCallbacks.h: ${filePath}`);
      content = content.replace('#include <jsi/jsi.h>', '#include <jsi/jsi.h>\n#include <string>');
      content = content.replace('using PropNameIds = std::vector<facebook::jsi::PropNameID>;', 'using PropNameIds = std::vector<std::string>;');
      changed = true;
    }
    if (path.basename(filePath) === 'HostObject.h' && !content.includes('auto names = _callbacks.getPropertyNames();')) {
      console.log(`Patching HostObject.h: ${filePath}`);
      const target = `  inline std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &runtime) override {\n    return _callbacks.getPropertyNames();\n  }`;
      const replacement = `  inline std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime &runtime) override {\n    auto names = _callbacks.getPropertyNames();\n    std::vector<jsi::PropNameID> result;\n    result.reserve(names.size());\n    for (const auto &name : names) {\n      result.push_back(jsi::PropNameID::forUtf8(runtime, name));\n    }\n    return result;\n  }`;
      content = content.replace(target, replacement);
      changed = true;
    }
    if (path.basename(filePath) === 'precompiled_modules.rb' && !content.includes('return false\n        return false unless') && !content.includes('return false\r\n        return false unless')) {
      console.log(`Disabling precompiled modules in: ${filePath}`);
      if (content.includes('\r\n')) {
        content = content.replace('def enabled?', 'def enabled?\r\n        return false');
      } else {
        content = content.replace('def enabled?', 'def enabled?\n        return false');
      }
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
