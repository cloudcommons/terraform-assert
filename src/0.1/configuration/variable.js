const assert = require('assert');

module.exports = function (variables) {
    return function (name) {
        var variable = variables[name];
        assert.ok(variable, `The plan doesn't include any variable called ${name}`);
        return {
            /**
             * Checks if the variable default is the same
             * @param {*} defaultValue
             */
            defaultIs(defaultValue) {
                assert.equal(variable.default, defaultValue, `Configuration output ${name} default value was ${variable.default}. Expected: ${defaultValue}`);
                return this;
            },
            /**
             * Checks if the variable description is the same
             * @param {*} description
             */
            descriptionIs(description) {
                this.hasDescription();
                assert.equal(variable.description, description, `Variable ${name} description expected was '${variable.description}'. Expected '${description}'`);
                return this;
            },
            /**
             * Checks if the variable contains a description
             */
            hasDescription() {
                assert.ok(variable.description, `Variable ${name} doesn't contain any description`);
                return this;
            }
        }
    }
}