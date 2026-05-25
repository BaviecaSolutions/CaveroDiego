const htmlmin = require('html-minifier-terser');

module.exports = function (eleventyConfig) {
  // Passthrough assets
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/_headers");

  // Global data: current language (default ES)
  eleventyConfig.addGlobalData("lang", "es");

  // Filter for translations
  eleventyConfig.addFilter("t", function(key, lang = "es") {
    const translations = require('./src/_data/translations.json');
    const keys = key.split('.');
    let value = translations[lang];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  });

  // HTML Minification (with enhanced options)
  eleventyConfig.addTransform("htmlmin", function(content, outputPath) {
    if( outputPath && outputPath.endsWith(".html") ) {
      return htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: true,
        removeAttributeQuotes: true,
        removeEmptyAttributes: true,
        removeRedundantAttributes: true,
        minifyURLs: true
      });
    }
    return content;
  });

  // Collections
  eleventyConfig.addCollection("campo", col =>
    col.getFilteredByGlob("src/cuaderno/*.njk")
       .filter(p => !p.fileSlug.startsWith("index"))
       .sort((a, b) => b.date - a.date)
  );
  eleventyConfig.addCollection("viaje", col =>
    col.getFilteredByGlob("src/cuaderno-de-viaje/*.njk")
       .filter(p => !p.fileSlug.startsWith("index"))
       .sort((a, b) => b.date - a.date)
  );

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
