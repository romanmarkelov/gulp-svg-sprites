var svgutil  = require("./lib/svgutil");
var cssutil  = require("./lib/cssutil");
var utils    = require("./lib/utils");
var _        = require("lodash");
var gutil    = require("gulp-util");
var path     = require("path");
var through2 = require("through2");
var File     = require("vinyl");
var svg2png  = require("svg2png");

var PLUGIN_NAME = "gulp-svg-sprites";

var defaults = {
    prefix: "",
    cssSuffix: "css",
    classNameSuffix: "icon",
    refSize: 26,
    unit: 13,
    cssPath: "css/sprites.css",
    svgImg:  "sprites/svg-sprite.svg",
    svgPath: "../sprites/svg-sprite.svg",
    pngPath: "../sprites/png-sprite.png"
};

/**
 * Helper for correct plugin errors
 * @param context
 * @param msg
 */
function error(context, msg) {
    context.emit("error", new gutil.PluginError(PLUGIN_NAME, msg));
}

/**
 * @returns {*}
 */
module.exports.svgStream = function (config) {

    var tasks = [];
    config = _.assign(defaults, config);

    return through2.obj(function (file, enc, cb) {
        var contents = file.contents.toString();
        svgutil.addSvgFile(contents, file, tasks, function () {
            cb();
        }.bind(this));
    }, function (cb) {
        var combined = svgutil.buildSVGSprite("shane", tasks, config);
        var cssData  = cssutil.render(combined.spriteData, config);
        this.push(new File({
            cwd:  "./",
            base: "./",
            path: config.svgImg,
            contents: new Buffer(combined.content)
        }));
        this.push(new File({
            cwd:  "./",
            base: "./",
            path: config.cssPath,
            contents: new Buffer(cssData)
        }));
        cb(null);
    });
};

/**
 * Create the PNG Fallback
 */
module.exports.createPng = function () {
    return through2.obj(function (file, enc, cb) {
        var stream = this;
        if (path.extname(file.path) === ".svg") {
            var svgPath = path.resolve(file.path);
            var pngPath = path.resolve(utils.swapFileName(file.path));
            svg2png(svgPath, pngPath, function (err) {
                if (err) {
                    error(stream, "Could not create the PNG format");
                }
                return cb();
            });
        } else {
            return cb();
        }
    });
};