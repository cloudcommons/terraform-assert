const assert = require('assert');

module.exports = function (resources) {
    if (resources === undefined) {
        return undefined;
    } else return function (address) {
        var resource = getResource(address);
        return {
            /**
             * Returns the resource object. For advanced assertion
             */
            get() {
                return resource;
            },
            /**
             * Checks if the resource mode is the same
             * @param {*} mode 
             */
            mode() {
                var parent = this;
                return {
                    is(mode) {
                        resourcePropertyIs(address, resource.mode, mode, "mode");
                        return parent;
                    }
                }
            },
            /**
             * Checks if the resource name is the same
             * @param {*} name 
             */
            name() {
                var parent = this;
                return {
                    is(name) {
                        resourcePropertyIs(address, resource.name, name, "name");
                        return parent;
                    }
                }
            },
            /**
             * Checks if the resource type is the same
             * @param {*} type 
             */
            type() {
                var parent = this;
                return {
                    is(type) {
                        resourcePropertyIs(address, resource.type, type, "mode");
                        return parent;
                    }
                }
            },
            /**
             * Checks if the resource provider is the same
             * @param {*} provider 
             */
            providerName() {
                var parent = this;
                return {
                    is(provider) {
                        resourcePropertyIs(address, resource.provider_name, provider, "provider");
                        return parent;
                    }
                }
            },
            /**
             * Cheks if the resource schema version is the same
             * @param {*} schemaVersion 
             */
            schemaVersion() {
                var parent = this;
                return {
                    is(schemaVersion) {
                        resourcePropertyIs(address, resource.schema_version, schemaVersion, "schemaVersion");
                        return parent;
                    }
                }
            },
            value(key) {
                var parent = this;
                return {
                    /**
                     * Checks if the resource contains a value and is the same
                     */
                    is(value) {
                        var resourceValue = resource.values[key];
                        assert.ok(resourceValue !== undefined, `Resource ${address} don't contain a value named ${key}`);
                        assert.equal(resourceValue, value, `Resource ${address} value ${key} expect expected value was ${value}. Actual: ${resourceValue}`)
                        return parent;
                    },
                    get() {
                        var resourceValue = resource.values[key];
                        assert.ok(resourceValue !== undefined, `Resource ${address} don't contain a value named ${key}`);
                        return resourceValue;
                    }
                }
            }
        }
    }

    /**
     * Try get a resource 
     * @param {*} plan 
     * @param {*} address 
     */
    function getResource(address) {
        assert.ok(resources, "The plan contains no planned resources");
        var filteredResources = resources.filter(r => r.address === address);
        assert.ok(filteredResources.length === 1, `No resource addressed ${address} found in plan`);
        return filteredResources[0];
    }

    /**
     * This function checks if two values are equal and produce a customised message for resources
     * @param {*} address Resource address
     * @param {*} expected Expected value
     * @param {*} actual Current value
     * @param {*} resourcePropertyName Resource property 
     */
    function resourcePropertyIs(address, expected, actual, resourcePropertyName) {
        assert.equal(actual, expected, `Expected resource ${address} ${resourcePropertyName} value was ${expected}. Actual: ${actual}`);
    }
}
