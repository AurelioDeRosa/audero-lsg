# Audero LSG (Living Style Guide)

[Audero LSG (Living Style Guide)](https://github.com/AurelioDeRosa/audero-lsg) is a Node.js utility to create a living 
style guide from CSS files.

## Demo

You can see the library in action by taking a look at the following demos:

* [Audero.it style guide](http://htmlpreview.github.io/?https://github.com/AurelioDeRosa/audero-lsg/blob/master/demo/audero-style-guide.html)
* [Google.com style guide](http://htmlpreview.github.io/?https://github.com/AurelioDeRosa/audero-lsg/blob/master/demo/google-style-guide.html)
* [Yahoo.com style guide](http://htmlpreview.github.io/?https://github.com/AurelioDeRosa/audero-lsg/blob/master/demo/yahoo-style-guide.html)

## Installation

You can install Audero LSG by using [npm](https://www.npmjs.com):

```
npm install audero-lsg
```

## Usage

To use Audero LSG, you have to include it in your project. Then, you have to call its constructor and provide the
CSS file(s) you want to analyze. Finally, you can call any of the methods available.

An example of use is shown below:

```js
// Include Audero LSG
var StyleGuide = require('audero-lsg');

// Define the CSS file to analyze
var cssFile = 'style/main.css';

// Create an instance
var styleGuide = new StyleGuide(cssFile);

// Get all the used colors
var colors = styleGuide.getColors();
```

## Methods

Audero LSG provides the methods described in the following sections.

### `StyleGuide(file)`

Creates a new StyleGuide object. `file` is a string or an array of strings containing paths to CSS files.

### `StyleGuide.prototype.getBackgroundColors()`

Returns an array containing the colors defined in the CSS using the `background-color` property.

### `StyleGuide.prototype.getColorColors()`

Returns an array containing the colors defined in the CSS using the `color` property.

### `StyleGuide.prototype.getColors()`

Returns an array containing the colors colors defined in the CSS using either the `color` or the
`background-color` property.

### `StyleGuide.prototype.getFontSizes()`

Returns an array containing all the font sizes in use.

### `StyleGuide.prototype.getFontFamilies()`

Returns an array containing the font families specified.

### `StyleGuide.prototype.getFontsInUse()`

Returns an array containing all the fonts in use.

### `StyleGuide.prototype.getFontsNotInUse()`

Returns an array containing all the fonts declared but not in use.

### `StyleGuide.prototype.getFonts()`

Returns an array containing all the fonts, those in use and those declared but not in use.

### `StyleGuide.prototype.getFontUrls()`

Returns an object containing the font-url pairs for all the `@font-face` declarations found.

### `StyleGuide.prototype.getSpacings()`

Returns an array containing all the spacings in use.

### `StyleGuide.prototype.generateStyleGuide()`

Returns a string containing the complete HTML page showing the living style guide.

## Examples

In this section you can find some examples of use of Audero LSG.

### Retrieve all the unused fonts

A CSS file may include a declaration of a font via the `@font-face` declaration that is never used. To log on the 
console all of these fonts that are declared but not used, use the following code:

```js
var StyleGuide = require('audero-lsg');

var cssFile = 'YOUR-CSS-FILE.css';
var styleGuide = new StyleGuide(cssFile);
var unusedFonts = styleGuide.getFontsNotInUse();

unusedFonts.forEach(function(font) {
   console.log(font);
});
```

### Create a full living style guide page

To create a full HTML page showing all the relevant information of the CSS file(s) provided in Node.js, use the 
following code:

```js
var fs = require('fs');
var StyleGuide = require('audero-lsg');

var cssFiles = [
   'YOUR-CSS-FILE.css',
   'ANOTHER-CSS-FILE.css'
];
var styleGuide = new StyleGuide(cssFiles);
var htmlPage = styleGuide.generateStyleGuide();

fs.writeFile('style-guide.html', styleGuide.generateStyleGuide(), function(err) {
   if (err) {
      throw err;
   }
});
```

## License

[Audero LSG](https://github.com/AurelioDeRosa/audero-lsg) is dual licensed under
[MIT](http://www.opensource.org/licenses/MIT) and [GPL-3.0](http://opensource.org/licenses/GPL-3.0).

## Author

[Aurelio De Rosa](https://www.audero.it) ([@AurelioDeRosa](https://twitter.com/AurelioDeRosa))