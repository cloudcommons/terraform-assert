const assert = require('assert');

module.exports = function (output_changes) {
    return function (name) {
        contains(name);
        var change = output_changes[name];
        return {
            /**
             * Checks if the output change action contains the given action
             * @param {*} action 
             */
            actionIs(action) {
                var actionIsPresent = change.actions.some(a => a === action);
                assert.ok(actionIsPresent, `Output ${name} actions are: ${change.actions}. Expected to find: ${action}`);
                return this;
            },
            /**
             * Checks if a change before is equal to the given value
             * @param {*} before 
             */
            beforeIs(before) {
                assert.equal(change.before, before, `Output before expected ${before}. Actual: ${change.before}`);
                return this;
            },
            /**
             * Checks if a change after is equal to the given value
             * @param {*} after 
             */
            afterIs(after) {
                assert.equal(change.after, after, `Output after expected ${after}. Actual: ${change.after}`);
                return this;
            },
            /**
             * Checks if a change after_unknown is equal to the given value
             * @param {*} after_unknown 
             */
            afterUnknownIs(after_unknown) {
                assert.equal(change.after_unknown, after_unknown, `Output after expected ${after_unknown}. Actual: ${change.after_unknown}`);
                return this;
            }
        }
    }

    function contains(name) {
        assert.ok(output_changes[name], `No output change named ${name} found`);
        return this;
    }
}