const htmlmin = require('html-minifier-terser');

module.exports = function (eleventyConfig) {
  // Passthrough assets
  eleventyConfig.addPassthroughCopy("src/assets");

  // HTML Minification
  eleventyConfig.addTransform("htmlmin", function(content, outputPath) {
    if( outputPath && outputPath.endsWith(".html") ) {
      return htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: true
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
