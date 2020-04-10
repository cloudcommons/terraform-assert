const assert = require('assert');

module.exports = function (plan) {
    var parser = require(`./format_version.${plan.format_version}`);
    return parser(plan);
}