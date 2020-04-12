const assert = require('assert');

module.exports = function (plan) {
    var parser = require(`./${plan.format_version}`);
    return parser(plan);
}