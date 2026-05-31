const { withEntitlementsPlist, withInfoPlist, withXcodeProject } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to set up iOS App Groups, Live Activities, and copy Swift widgets.
 */
function withStriveRingWidgets(config) {
  // 1. Configure App Groups Entitlements for the main app
  config = withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.security.application-groups'] = [
      'group.com.strivering.app'
    ];
    return config;
  });

  // 2. Configure NSSupportsLiveActivities in main Info.plist
  config = withInfoPlist(config, (config) => {
    config.modResults['NSSupportsLiveActivities'] = true;
    return config;
  });

  // 3. Inject Swift extension files and native bridge source code into the Xcode project structure
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    const iosRoot = path.join(projectRoot, 'ios');
    const appName = config.modRequest.projectName;
    const mainTargetName = appName;
    
    // Create targets directory in ios build folder if not exists
    const widgetSourceDir = path.join(projectRoot, 'targets', 'widgets');
    const nativeBridgeDestDir = path.join(iosRoot, mainTargetName);
    
    if (!fs.existsSync(nativeBridgeDestDir)) {
      fs.mkdirSync(nativeBridgeDestDir, { recursive: true });
    }
    
    // Copy bridge files so they are part of the main application target
    const filesToCopy = [
      'StriveRingActivityBridge.swift',
      'StriveRingActivityBridge.m'
    ];
    
    filesToCopy.forEach((filename) => {
      const srcPath = path.join(widgetSourceDir, filename);
      const destPath = path.join(nativeBridgeDestDir, filename);
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        
        // Link to Xcode Project
        const fileRef = project.addFile(path.join(mainTargetName, filename), project.getFirstProject().firstProject.mainGroup);
        const uuid = project.getFirstTarget().uuid;
        project.addToPbxBuildFileSection(fileRef);
        project.addToPbxSourcesBuildPhase(fileRef);
      }
    });

    // Write bridging header to enable Swift inside the Objective-C project
    const bridgingHeaderName = `${appName}-Bridging-Header.h`;
    const bridgingHeaderPath = path.join(iosRoot, bridgingHeaderName);
    if (!fs.existsSync(bridgingHeaderPath)) {
      fs.writeFileSync(bridgingHeaderPath, `
// StriveRing Auto-Generated Bridging Header
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
      `);
      const mainGroup = project.getFirstProject().firstProject.mainGroup;
      project.addFile(bridgingHeaderName, mainGroup);
    }
    
    return config;
  });

  return config;
}

module.exports = withStriveRingWidgets;
