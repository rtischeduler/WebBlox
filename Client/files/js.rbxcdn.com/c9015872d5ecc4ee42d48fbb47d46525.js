;// bundle: page___1ff5cf0b660c4049151551ccfc463b80_m
;// files: common/deviceMeta.js

;// common/deviceMeta.js
var Roblox=Roblox||{};Roblox.DeviceMeta=(function(){var metaTag=document.querySelector('meta[name="device-meta"]');if(metaTag===null){console.debug("Error loading device information from meta tag - please check if meta tag is present");return;}
var keyMap=metaTag.dataset||{};var appTypes={android:"android",ios:"ios",xbox:"xbox",uwp:"uwp",amazon:"amazon",win32:"win32",universalapp:"universalApp",unknown:"unknown"};var deviceTypes={computer:"computer",tablet:"tablet",phone:"phone",console:"console"};return function(){return{deviceType:deviceTypes[keyMap.deviceType]||'',appType:appTypes[keyMap.appType]||'',isInApp:keyMap.isInApp==='true',isDesktop:keyMap.isDesktop==='true',isPhone:keyMap.isPhone==='true',isTablet:keyMap.isTablet==='true',isConsole:keyMap.isConsole==='true',isAndroidApp:keyMap.isAndroidApp==='true',isIosApp:keyMap.isIosApp==='true',isUWPApp:keyMap.isUwpApp==='true',isXboxApp:keyMap.isXboxApp==='true',isAmazonApp:keyMap.isAmazonApp==='true',isWin32App:keyMap.isWin32App==='true',isStudio:keyMap.isStudio==='true',isIosDevice:keyMap.isIosDevice==='true',isAndroidDevice:keyMap.isAndroidDevice==='true',isUniversalApp:keyMap.isUniversalApp==='true',isChromeOs:keyMap.isChromeOs==='true',isPcGdkApp:keyMap.isPcGdkApp==='true',isSamsungGalaxyStoreApp:keyMap.isSamsungGalaxyStoreApp==='true',}};})();

;//Bundle detector
Roblox && Roblox.BundleDetector && Roblox.BundleDetector.bundleDetected('page');