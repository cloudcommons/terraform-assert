const assert = require('assert');

module.exports = function (terraform_version) {
    var terraform_version = terraform_version;
    return {
        is: function (version) {
            assert.equal(terraform_version, version, `Expected terraform version: ${version}. Actual: ${terraform_version}`);
        }
    }
}
