const assert = require('assert');
module.exports = function (provider_config) {
    return function (name) {
        var provider = provider_config[name];
        assert.ok(provider, `Provider not found: {$name}`);
        return {
            /**
             * Returns a provider property
             * @param {*} property
             */
            get(property) {
                return provider[property];
            },
            /**
             * Checks if a provider property is the same
             * @param {*} property
             * @param {*} value
             */
            property(property) {
                var parent = this;
                return {                    
                    is(value) {
                        providerPropertyIs(provider, property, value);
                        return parent;
                    }
                }
            },
            /**
             * Checks if the provider name is the same
             * @param {*} name
             */
            name() {
                var parent = this;
                return {
                    is(name) {
                        return parent.property("name").is(name)
                    }
                }
            },
            /**
             * Checks if the provider version_constraint is the same
             * @param {*} version
             */
            versionConstraint() {
                var parent = this;
                return {
                    is(version) {
                        return parent.property("version_constraint").is(version);
                    }
                }
            }
        }

        /**
         * Checks if a provider property is equal to the given value
         * @param {*} provider
         * @param {*} name
         * @param {*} actual
         */
        function providerPropertyIs(provider, name, actual) {
            expected = provider[name];
            assert.equal(provider[name], actual, `Expected provider ${provider.name} property ${name} value was ${expected}. Actual: ${actual}`);
        }
    }
}