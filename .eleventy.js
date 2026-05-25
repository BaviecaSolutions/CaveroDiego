const htmlmin = require('html-minifier-terser');
const { EleventyI18nPlugin } = require("@11ty/eleventy");

// Cache translations at build startup (loaded only once)
const translationsCache = {
  es: require('./src/_data/i18n/es.json'),
  en: require('./src/_data/i18n/en.json')
};

module.exports = function (eleventyConfig) {
  // i18n Plugin
  eleventyConfig.addPlugin(EleventyI18nPlugin, {
    defaultLanguage: "es",
    errorMode: "allow-fallback"
  });

  // Translation filter (optimized with cached translations)
  eleventyConfig.addFilter("t", function(key, locale) {
    const lang = locale || this.ctx.lang || this.ctx.page?.lang || "es";

    const keys = key.split('.');
    let value = translationsCache[lang];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  });

  // Passthrough assets
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/_headers");
  eleventyConfig.addPassthroughCopy({"src/assets/data": "assets/data"});

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
