/*! Audero LSG 0.1.1 | Aurelio De Rosa (@AurelioDeRosa) | MIT/GPL-3.0 Licensed */
'use strict';

var fs = require('fs');
var path = require('path');
var CSSParser = require('css');
var cssstats = require('cssstats');
var Handlebars = require('Handlebars');

/**
 * The default font size of the root element (<code>html</code>)
 *
 * @type {string}
 */
var defaultFontSize = '16px';

/**
 * The values to exclude when retrieving the data
 *
 * @type {string[]}
 */
var excludedValues = [
   'auto',
   'inherit',
   'initial',
   'none'
];

/**
 * Creates an array of unique values
 *
 * @param {Array.<*>} array The array whose values will be processed
 *
 * @return {Array.<*>}
 */
function unique(array) {
   return array.filter(function(element, index) {
      return array.indexOf(element) === index;
   });
}
/**
 * Converts rem units into pixels
 *
 * @param {(string|number)} rootFontSize The font size of the root element
 * @param {(string|number)} fontSize The font size to convert
 *
 * @returns {string}
 */
function remToPx(rootFontSize, fontSize) {
   return parseFloat(rootFontSize) * parseFloat(fontSize) + 'px';
}

/**
 * Tests if a color contains hacks for older version of
 * Internet Explorer (e.g. #000\9)
 *
 * @param {string} color The color to test
 *
 * @return {boolean}
 */
function isHackyColor(color) {
   if (color.indexOf('#') !== 0) {
      return false;
   }

   return !/^#([\dA-F]{3}|[\dA-F]{6})$/i.test(color);
}

/**
 * Returns a function that sorts scalable font sizes (pixels and rems)
 * based on the font size of the root element (<code>html</code>) provided
 *
 * @param {number} rootFontSize The font size of the root element (<code>html</code>)
 *
 * @return {Function}
 */
function sortScalableFontSizes(rootFontSize) {
   return function(size1, size2) {
      size1 = parseFloat(size1) * (size1.indexOf('rem') >= 0 ? rootFontSize : 1);
      size2 = parseFloat(size2) * (size2.indexOf('rem') >= 0 ? rootFontSize : 1);

      return size1 - size2;
   };
}

/**
 * Sorts two font sizes based on their units (e.g. em) and values.
 * If the units are different, the sizes are sorted based on the
 * lexical order of the units. If the units are the same, the sizes
 * are sorted based on their values.
 *
 * @param {string} item1 The first font size
 * @param {string} item2 The second font size
 *
 * @return {number}
 */
function sortUnitValues(item1, item2) {
   var unit1 = item1.replace(/([-\d.]+).*/, '');
   var unit2 = item2.replace(/([-\d.]+).*/, '');

   if (unit1 !== unit2) {
      return unit1.localeCompare(unit2);
   }

   return parseFloat(item1) - parseFloat(item2);
}

/**
 * Returns a string representing the concatenation of the CSS
 * files provided.
 *
 * @param {string[]} files An array containing the paths to the CSS files
 *
 * @return {string}
 */
function getCSS(files) {
   return files
      .map(function(file) {
         return fs.readFileSync(file, 'utf8');
      })
      .join('');
}

/**
 * Calculates the font size of the root element (<code>html</code>) in pixels
 *
 * @param {StyleGuide} styleGuide An instance of <code>StyleGuide</code>
 *
 * @return {string}
 */
function getRootFontSize(styleGuide) {
   var fontSize = styleGuide.cssAst.stylesheet.rules
      .filter(function(declaration) {
         // Keep only the declarations about the HTML element
         return declaration.type === 'rule' &&
                declaration.selectors.length === 1 &&
                declaration.selectors[0] === 'html';
      })
      .reduce(
         function(previous, declarationBlock) {
            return previous.concat(declarationBlock.declarations);
         },
         []
      )
      .filter(function(declaration) {
         return declaration.type === 'declaration' &&
                declaration.property === 'font-size';
      })
      .pop();

   if (!fontSize) {
      fontSize = defaultFontSize;
   } else if (fontSize.value.indexOf('%') >= 0) {
      fontSize = parseFloat(defaultFontSize) * parseFloat(fontSize.value) / 100 + 'px';
   } else {
      fontSize = fontSize.value;
   }

   return fontSize;
}

/**
 * Creates an array containing only fonts that can be represented in their
 * pixels scaled version. In this context, a font is considered scalable if,
 * using the information provided, it can be represented in pixels at the same
 * size it's showed on the page. The array is made of pixels-original font
 * pairs (e.g. [16px, 1rem])
 *
 * @param {string[]} fontSizes An array containing font sizes in any unit
 * @param {string} rootSize The font size of the root element (<code>html</code>) in pixels
 *
 * @return {Array[]}
 */
function scaleFontSizes(fontSizes, rootSize) {
   var unitlessRootSize = parseFloat(rootSize);

   return fontSizes
      .filter(function(size) {
         return size.indexOf('rem') >= 0 || size.indexOf('px') >= 0;
      })
      .sort(sortScalableFontSizes(unitlessRootSize))
      .reverse()
      .map(function(size) {
         return size.indexOf('rem') >= 0 ? [remToPx(unitlessRootSize, size), size] : [size, size];
      });
}

function filterScalableFontSizes(fontSizes) {
   return fontSizes
      .filter(function(size) {
         return size.indexOf('rem') < 0 && size.indexOf('px') < 0;
      })
      .sort(sortUnitValues)
      .reverse();
}

/**
 * Creates a new StyleGuide object
 *
 * @param {(string|string[])} file A string or an array of strings
 * containing paths to CSS files
 *
 * @constructor
 */
function StyleGuide(file) {
   if (typeof file === 'string') {
      file = [file];
   }

   var css = getCSS(file);

   this.cssAst = CSSParser.parse(css);
   this.statistics = cssstats(css);
}

/**
 * Returns an array containing the colors defined in the CSS
 * using the <code>background-color</code> property
 *
 * @return {string[]}
 */
StyleGuide.prototype.getBackgroundColors = function() {
   var properties = this.statistics.declarations.properties;
   var colors = (properties['background-color'] || []).filter(Boolean);

   if (colors.length === 0) {
      return colors;
   }

   colors = colors.filter(function(color) {
      return !isHackyColor(color);
   });

   return unique(colors)
      .filter(function(item) {
         return excludedValues.indexOf(item) < 0;
      })
      .sort();
};

/**
 * Returns an array containing the colors defined in the CSS
 * using the <code>color</code> property
 *
 * @return {string[]}
 */
StyleGuide.prototype.getColorColors = function() {
   var properties = this.statistics.declarations.properties;
   var colors = (properties.color || []).filter(Boolean);

   if (colors.length === 0) {
      return colors;
   }

   colors = colors.filter(function(color) {
      return !isHackyColor(color);
   });

   return unique(colors)
      .filter(function(item) {
         return excludedValues.indexOf(item) < 0;
      })
      .sort();
};

/**
 * Returns an array containing the colors defined in the CSS using eithe
 * the <code>color</code> or the <code>background-color</code> property
 *
 * @return {string[]}
 */
StyleGuide.prototype.getColors = function() {
   var colors = this.getColorColors()
      .concat(this.getBackgroundColors());

   return unique(colors)
      .sort();
};

/**
 * Returns an array containing all the font sizes in use
 *
 * @return {string[]}
 */
StyleGuide.prototype.getFontSizes = function() {
   var fontsSizes = this.statistics.declarations.getAllFontSizes();

   return unique(fontsSizes)
      .filter(function(item) {
         return excludedValues.indexOf(item) < 0;
      });
};

/**
 * Returns an array containing the font families specified
 *
 * @return {string[]}
 */
StyleGuide.prototype.getFontFamilies = function() {
   return this.statistics.declarations.getAllFontFamilies();
};

/**
 * Returns an array containing all the fonts in use
 *
 * @return {string[]}
 */
StyleGuide.prototype.getFontsInUse = function() {
   var fontsFamilies = this.getFontFamilies()
      .reduce(
         function(previous, fontFamily) {
            var fonts = fontFamily
               .split(',')
               .map(function(string) {
                  return string.trim();
               });

            return previous.concat(fonts);
         },
         []
      );

   return unique(fontsFamilies)
      .sort();
};

/**
 * Returns an array containing all the fonts declared but not in use
 *
 * @return {string[]}
 */
StyleGuide.prototype.getFontsNotInUse = function() {
   var fontUrls = this.getFontUrls();
   var declaredFonts = this.getFontsInUse()
      .reduce(
         function(fonts, fontFamily) {
            var currentFonts = fontFamily
               .split(',')
               .map(function(font) {
                  return font.trim();
               });

            return fonts.concat(currentFonts);
         },
         []
      );

   declaredFonts = unique(declaredFonts);

   return Object
      .keys(fontUrls)
      .filter(function(font) {
         return declaredFonts.indexOf(font) < 0;
      });
};

/**
 * Returns an array containing all the fonts, those in use and
 * those declared but not in use
 *
 * @return {string[]}
 */
StyleGuide.prototype.getFonts = function() {
   return this.getFontsInUse()
      .concat(this.getFontsNotInUse());
};

/**
 * Returns an object containing the font-url pairs for all
 * the <code>@font-face</code> declarations found
 *
 * @return {Object}
 */
StyleGuide.prototype.getFontUrls = function() {
   var urlRegex = /url\s*\(['"]?(.*?)(?:\?.*)?['"]?\)/i;
   var hash = {};

   this.cssAst.stylesheet.rules
      .filter(function(item) {
         return item.type === 'font-face';
      })
      .forEach(function(declarationBlock) {
         var fontFamily = declarationBlock.declarations
            .filter(function(declaration) {
               return declaration.type === 'declaration' &&
                      declaration.property === 'font-family';
            })
            .map(function(fontFamily) {
               return fontFamily.value;
            })
            .pop();
         var url = declarationBlock.declarations
            .filter(function(declaration) {
               return declaration.type === 'declaration' &&
                      declaration.property === 'src';
            })
            .map(function(fontSrc) {
               return fontSrc.value;
            })
            .pop();

         try {
            hash[fontFamily] = url.match(urlRegex)[1];
         } catch(ex) {
            hash[fontFamily] = '';
         }
      });

   return hash;
};

/**
 * Returns an array containing all the spacings in use
 *
 * @return {string[]}
 */
StyleGuide.prototype.getSpacings = function() {
   var properties = this.statistics.declarations.properties;
   var spacings = (properties.margin || [])
      .concat(properties.padding)
      .filter(Boolean);

   if (spacings.length === 0) {
      return spacings;
   }

   spacings = spacings.reduce(
      function(previous, value) {
         return previous.concat(value.split(' '));
      },
      []
   );

   return unique(spacings)
      .filter(function(item) {
         return excludedValues.indexOf(item) < 0;
      })
      .sort(sortUnitValues)
      .reverse();
};

/**
 * Returns a string containing the complete HTML page
 * showing the living style guide
 *
 * @return {string}
 */
StyleGuide.prototype.generateStyleGuide = function() {
   var styleGuideTemplate = Handlebars.compile(
      fs.readFileSync(path.resolve(__dirname, '../templates/index.hbs'), 'utf8')
   );
   var colorsTemplate = Handlebars.compile(
      fs.readFileSync(path.resolve(__dirname, '../templates/colors.hbs'), 'utf8')
   );
   var fontSizesTemplate = Handlebars.compile(
      fs.readFileSync(path.resolve(__dirname, '../templates/font-sizes.hbs'), 'utf8')
   );
   var fontFamiliesTemplate = Handlebars.compile(
      fs.readFileSync(path.resolve(__dirname, '../templates/fonts.hbs'), 'utf8')
   );
   var spacingsTemplate = Handlebars.compile(
      fs.readFileSync(path.resolve(__dirname, '../templates/spacings.hbs'), 'utf8')
   );

   var fontUrls = this.getFontUrls();
   var fontsMap = {
      fontsInUse: this.getFontsInUse().map(function(font) {
         var textToShow = font;

         if (fontUrls[font]) {
            textToShow = '<a href="' + fontUrls[font.trim()] + '" target="_blank">' + font + '</a>';
         }

         return [font, textToShow];
      }),
      fontsNotInUse: this.getFontsNotInUse().map(function(font) {
         return [font, '<a href="' + fontUrls[font] + '" target="_blank">' + font + '</a>'];
      })
   };
   var rootSize = getRootFontSize(this);
   var fontSizes = this.getFontSizes();
   var fontSizesMap = {
      nonScaledFontSizes: filterScalableFontSizes(fontSizes).map(function(size) {
         return [size, size];
      }),
      scaledFontSizes: scaleFontSizes(fontSizes, rootSize)
   };

   var body = colorsTemplate(this.getColors()) +
      fontSizesTemplate(fontSizesMap) +
      fontFamiliesTemplate(fontsMap) +
      spacingsTemplate(this.getSpacings());

   return styleGuideTemplate({
      body: body
   });
};

module.exports = StyleGuide;