const assert = require('assert');
const provider = require('./provider');
const variable = require('./variable');

module.exports = function (configuration) {
    return {
        /**
         * Returns the provider assert helper
         * @param {*} name
         */
        provider: provider(configuration.provider_config),
        /**
         * Return the variable assert helper
         * @param {*} name
         */
        variable: variable(configuration.root_module.variables)
    }
}