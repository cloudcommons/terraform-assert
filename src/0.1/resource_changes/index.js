const assert = require('assert');

module.exports = function (resource_changes) {
    return function (address) {
        assert.ok(resource_changes, "The plan contains no resource changes");
        var resource = resource_changes.filter(c => c.address === address);
        assert.ok(resource.length === 1, `No change to resource ${address} found in plan`);
        resource = resource[0];
        return {
            /**
             * Checks if a property value is the same
             * @param {*} propertyName
             * @param {*} value
             */
            property: function (propertyName) {
                var parent = this;
                return {
                    is: function (value) {
                        changePropertyIs(address, value, resource[propertyName], propertyName);
                        return parent;
                    }
                }
            },
            /**
             * Checks if the change mode is the same
             * @param {*} mode
             */
            mode() {
                var parent = this;
                return {
                    is: function (mode) {
                        return parent.property("mode").is(mode);
                    }
                }
            }
            ,
            /**
             * Checks if the change type is the same
             * @param {*} type
             */
            type() {
                var parent = this;
                return {
                    is(type) {
                        return parent.property("type").is(type);
                    }
                }
            },
            /**
             * Checks if the change name is the same
             * @param {*} name
             */
            name() {
                var parent = this;
                return {
                    is(name) {
                        return parent.property("name").is(name);
                    }
                }
            },
            /**
             * Checks if the provider is the same
             */
            providerName() {
                var parent = this;
                return {
                    is(provider) {
                        return parent.provider("provider_name").is(provider);
                    }
                }
            },
            /**
             * Checks if the action array contains the given value
             * @param {*} action
             */
            action() {
                var parent = this;
                return {
                    is(action) {
                        var actionIsPresent = resource.change.actions.some(a => a === action);
                        assert.ok(actionIsPresent, `Actions for resource ${address} are: ${resource.change.actions}. Expected to find: ${action}`);
                        return parent;
                    }
                }
            },
            /**
             * Returns an assert helper for the before property
             */
            before() {
                return {
                    /**
                     * Returns the entire before object. For advanced assertion
                     */
                    get() { return resource.change.before; },
                    /**
                     * Checks if a property in the before object is the same
                     * @param {*} key property name in the before object
                     * @param {*} value property value
                     */
                    is(key, value) {
                        changeIs(resource, "before", key, value);
                        return this;
                    },
                    /**
                     * Checks if the before object is null
                     */
                    isNull() {
                        assert.equal(resource.change.before, null);
                    }
                }
            },
            /**
             * Returns and assert helper for the after property
             */
            after() {
                return {
                    /**
                     * Returns the entire after object. For advanced assertion
                     */
                    get() { return resource.change.after; },
                    /**
                     * Checks if a property in the after object is the same
                     * @param {*} key
                     * @param {*} value
                     */
                    is(key, value) {
                        changeIs(resource, "after", key, value);
                        return this;
                    },
                    /**
                     * Checks if the after object is null
                     */
                    isNull() {
                        assert.equal(resource.change.after, null);
                    }
                }
            },
            /**
             * Returns and assert helper for the after_unknown property
             */
            unknown() {
                return {
                    /**
                     * Returns the entire after_unknown object. For advanced assertion
                     */
                    get() { return resource.change.after_unknown; },
                    /**
                     * Checks if a property in the after_unknown object is the same
                     * @param {*} key
                     * @param {*} value Defaults to true
                     */
                    is(key, value = true) {
                        changeIs(resource, "after_unknown", key, value);
                        return this;
                    },
                    /**
                     * Checks if the after_unknown object is null
                     */
                    isNull() {
                        assert.equal(resource.change.after_unknown, null);
                    }
                }
            }
        }

        /**
         * This function checks if two values are equal and produce a customised message for resources
         * @param {*} address Resource address
         * @param {*} expected Expected value
         * @param {*} actual Current value
         * @param {*} resourcePropertyName Resource property
         */
        function changePropertyIs(address, expected, actual, resourcePropertyName) {
            assert.equal(actual, expected, `Change ${address} ${resourcePropertyName} expected value was ${expected}. Actual: ${actual}`);
        }

        /**
         * Evaluates if a change type contains certain value
         * @param {*} resource
         * @param {*} type
         * @param {*} key
         * @param {*} value
         */
        function changeIs(resource, type, key, value) {
            var address = resource.address;
            assert.ok(resource.change[type], `No ${type} changes planned for resource ${address}`);
            var actual = resource.change[type][key];
            assert.ok(actual, `No property named ${key} found for ${address} in ${type} `);
            assert.equal(actual, value, `Unexpected resource ${address} change ${key} value ${actual} in ${type}. Expected ${value}`);
        }
    }
}