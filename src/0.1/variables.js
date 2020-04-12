const assert = require('assert');

module.exports = function (variables) {
    var variables = variables;
    return {
        variable(name) {
            this.contains(name);
            var variable = variables[name];
            return {
                /**
                 * Checks if the variable value is the same
                 * @param {*} value 
                 */
                is: function (value) {
                    assert.equal(variable.value, value, `Expecting plan variable ${variable} to be ${value}. Actual: ${variable.value}`);
                    return this;
                }
            }
        },
        /**
         * Checks if the plan variables contains 
         * @param {*} name 
         */
        contains(name) {
            assert.ok(variables, "The plan contains no variables");
            assert.ok(variables[name], `There is no variable named ${name}`);
        }
    }
}