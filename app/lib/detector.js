'use strict';

var size = require('windowsill').resizer;
var ua = navigator.userAgent;

/*
 * CONST
 */

var BREAKPOINTS = {
  // Matches with breakpoints defined in main.styl
  XS: {
    width: 667
  },
  SM: {
    width: 768
  },
  MD: {
    width: 992
  },
  IPAD: {
    width: 1024,
    height: 768
  },
  IPHONE: {
    width: 568,
    height: 320
  },
  NEXUS4: {
    width: 640,
    height: 384
  },
  NEXUS7: {
    width: 960,
    height: 600
  }
};

/*
  FEATURES
 */

var isTouchDevice = !!('ontouchstart' in window) || !!('onmsgesturechange' in window);
var isHiDPI = window.devicePixelRatio > 1;

var hasPointerEvents = (function() {
  if (navigator.appName === 'Microsoft Internet Explorer') {
    var agent = navigator.userAgent;
    if (agent.match(/MSIE ([0-9]{1,}[\.0-9]{0,})/) != null) {
      var version = parseFloat(RegExp.$1);
      if (version < 11)
        return false;
    }
  }
  return true;
}());

var webgl = (function() {
  var c = document.createElement('canvas');
  try {
    return !!window.WebGLRenderingContext
      && (!!c.getContext('experimental-webgl')
      || !!c.getContext('webgl'));
  } catch (e) {
    return false;
  }
}());

/*
  SIZES
 */

var isLandscape = function() {
  return size.width > size.height;
};

var isDesktopSize = isLandscape()
  && size.width > BREAKPOINTS.IPAD.width;

var isTabletSize = size.width <= BREAKPOINTS.IPAD.width
  && size.height <= BREAKPOINTS.IPAD.height
  && size.width > BREAKPOINTS.NEXUS4.width
  && size.height > BREAKPOINTS.NEXUS4.height;

var isMobileSize = size.width <= BREAKPOINTS.IPHONE.width
  && size.height >= BREAKPOINTS.IPHONE.height;

var isWiderThan = function(width) {
  return size.width >= width;
};


/*
  BROWSERS
 */

var isChromeOs = /cros/.test(ua.toLowerCase());
var isMozilla = !!~ua.indexOf('Gecko') && !~ua.indexOf('KHTML');
// Additional tests for IE11+

// ----------------------------------------------------------
// If you're not in IE (or IE version is less than 5) then:
// ie === undefined
// If you're in IE (>=5) then you can determine which version:
// ie === 7; // IE7
// Thus, to detect IE:
// if (ie) {}
// And to detect the version:
// ie === 6 // IE6
// ie > 7 // IE8, IE9, IE10 ...
// ie < 9 // Anything less than IE9
// ----------------------------------------------------------
// see: http://stackoverflow.com/a/16657946/207885
var isIE = function() {
  var undef;
  var rv = -1; // Return value assumes failure.
  // var ua = window.navigator.userAgent;
  var msie = ua.indexOf('MSIE ');
  var trident = ua.indexOf('Trident/');

  if (msie > 0) {
    // IE 10 or older => return version number
    rv = parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
  } else if (trident > 0) {
    // IE 11 (or newer) => return version number
    var rvNum = ua.indexOf('rv:');
    rv = parseInt(ua.substring(rvNum + 3, ua.indexOf('.', rvNum)), 10);
  }

  return ((rv > -1) ? rv : undef);
};

/*
  OS
 */

var isiOS = (/ip(hone|od|ad)/i).test(ua);
var isDroid = (/android/i).test(ua);

var getAndroidVersion = function() {
  var _ua = ua.toLowerCase();
  var match = _ua.match(/android\s([0-9\.]*)/);
  return match ? match[1] : false;
};

var getOsVersion = function() {
  var start = ua.indexOf('OS ');
  if (isiOS && start > -1) {
    return window.Number(ua.substr(start + 3, 3).replace('_', '.'));
  } else {
    return 0;
  }
};

/*
  DEVICES
 */

var isNexusPhone = (/nexus\s4|galaxy\snexus/i).test(ua);
var isNexusTablet = (/nexus\s7|nexus\s10/i).test(ua);
// var isMobile = (/android|webos|ip(hone|ad|od)|blackberry|iemobile|windows (ce|phone)|opera mini/i).test(ua.toLowerCase());
// var isTablet = isMobile && (window.innerWidth > TABLET_BREAKPOINT.width || window.innerHeight > TABLET_BREAKPOINT.height);
// var isDesktop = !isMobile && !isTablet;

/**
 * Expose data.
 */

var detector = module.exports = {
  BREAKPOINTS: BREAKPOINTS,
  features: {
    touch: isTouchDevice,
    pointerEvents: hasPointerEvents,
    webgl: webgl,
    hidpi: isHiDPI,
    canvas: null
  },
  sizes: {
    desktop: isDesktopSize,
    tablet: isTabletSize,
    phone: isMobileSize,
    isWiderThanMobile: function() {
      return isWiderThan(BREAKPOINTS.IPHONE.width);
    },
    isWiderThanTablet: function() {
      return isWiderThan(BREAKPOINTS.MD.width);
    },
    isWiderThan: isWiderThan,
    breakpoints: BREAKPOINTS,
    isLandscape: isLandscape,
    isMultiColumn: function() {
      return isLandscape() || isWiderThan(700);
    }
  },
  browsers: {
    mozilla: isMozilla,
    chrome: isChromeOs,
    ie: isIE,
    lowPerformance: function() {
      return (detector.os.ios && detector.sizes.isWiderThan(BREAKPOINTS.IPHONE.width + 1)
        || detector.os.android && detector.sizes.isWiderThan(600))
        && !detector.sizes.isWiderThan(BREAKPOINTS.IPAD.width + 1);
    },
    forceCanvas: function() {
      return isIE() || detector.browsers.lowPerformance();
    }
  },
  os: {
    ios: isiOS,
    android: isDroid,
    getAndroidVersion: getAndroidVersion,
    getOsVersion: getOsVersion
  },
  devices: {
    nexusPhone: isNexusPhone,
    nexusTablet: isNexusTablet,
    ipad: isiOS && isTabletSize
  }
};
