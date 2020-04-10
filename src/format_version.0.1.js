const assert = require('assert');

/**
 * This functions returns an assert helper for the given terraform plan
 * Support format_version 0.1
 * For more information: https://www.terraform.io/docs/internals/json-format.html
 */
module.exports = function (plan) {
    assert.equal(plan.format_version, "0.1", `Unsupported format version. Expected: 0.1. Actual: ${plan.format_version}`);
    return {
        /**
         * Checks if the terraform version is equal to the given version
         * @param {*} version 
         */
        terraformVersion: {
            is: function (version) {
                assert.equal(plan.terraform_version, version, `Expected Terraform plan version to be ${version} but ${plan.terraform_version} found`);
            }
        },

        /**
         * Gets a plan variable
         */
        variable(name) {
            assert.ok(plan.variables, "The plan contains no variables");
            var variable = plan.variables[name];
            assert.ok(variable !== undefined, `Variable ${variable} is not present in the Terraform plan`);
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
         * Planned values
         */
        plannedValues: {
            /**
             * Outputs
             */
            output(name) {
                assert.ok(plan.planned_values, "The plan contains no planned values");
                assert.ok(plan.planned_values.outputs, "The plan contains no planned outputs");
                var output = plan.planned_values.outputs[name];
                assert.ok(output != undefined, `The plan contains no planned output named ${name}`);
                return {
                    /**
                     * Checks if the output is sensitive
                     * @param {*} output 
                     */
                    isSensitive: function () {
                        assert.ok(output.sensitive === true, `Output ${name} should be sensitive`);
                        return this;
                    },
                    /**
                     * Checks if the output is not sensitive
                     * @param {*} output 
                     */
                    isNotSensitive: function () {
                        assert.ok(output.sensitive === false, `Output ${name} should not be sensitive`);
                        return this;
                    }
                }
            },
            /**
             * Planned resources
             */
            resources: {
                /**
                 * Finds a resource by its address
                 * @param {*} address 
                 */
                resource: function (address) {
                    var resource = getResource(plan, address);
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
                        modeIs(mode) {
                            resourcePropertyIs(address, resource.mode, mode, "mode");
                            return this;
                        },
                        /**
                         * Checks if the resource name is the same
                         * @param {*} name 
                         */
                        nameIs(name) {
                            resourcePropertyIs(address, resource.name, name, "name");
                            return this;
                        },
                        /**
                         * Checks if the resource type is the same
                         * @param {*} type 
                         */
                        typeIs(type) {
                            resourcePropertyIs(address, resource.type, type, "mode");
                            return this;
                        },
                        /**
                         * Checks if the resource provider is the same
                         * @param {*} provider 
                         */
                        providerNameIs(provider) {
                            resourcePropertyIs(address, resource.provider_name, provider, "provider");
                            return this;
                        },
                        /**
                         * Cheks if the resource schema version is the same
                         * @param {*} schemaVersion 
                         */
                        schemaVersionIs(schemaVersion) {
                            resourcePropertyIs(address, resource.schema_version, schemaVersion, "schemaVersion");
                            return this;
                        },
                        /**
                         * Checks if the resource contains a value and is the same
                         */
                        valueIs(key, value) {
                            var resourceValue = resource.values[key];
                            assert.ok(resourceValue !== undefined, `Resource ${address} don't contain a value named ${key}`);
                            assert.equal(resourceValue, value, `Resource ${address} value ${key} expect expected value was ${value}. Actual: ${resourceValue}`)
                            return this;
                        }
                    }
                },
                /**
                 * Checks if a resource is present in the root module
                 * @param {*} address 
                 */
                contains: function (address) {
                    assert.ok(plan.planned_values, "The plan contains no planned values");
                    assert.ok(plan.planned_values.root_module, "The plan contains no root module");
                    assert.ok(plan.planned_values.root_module.resources, "The plan contains no planned resources");
                    var resources = plan.planned_values.root_module.resources;
                    var found = resources.some(r => r.address === address);
                    assert.ok(found, `The plan contains no resource addressed ${address}`);
                },
            }
        },
        /**
         * Gets a resource change
         * @param {*} address 
         */
        resourceChange(address) {
            assert.ok(plan.resource_changes, "The plan contains no resource changes");
            var resource = plan.resource_changes.filter(c => c.address === address);
            assert.ok(resource.length === 1, `No change to resource ${address} found in plan`);
            resource = resource[0];
            return {
                /**
                 * Checks if a property value is the same
                 * @param {*} propertyName 
                 * @param {*} value 
                 */
                propertyIs(propertyName, value) {
                    changePropertyIs(address, value, resource[propertyName], propertyName);
                    return this;
                },
                /**
                 * Checks if the change mode is the same
                 * @param {*} mode 
                 */
                modeIs(mode) {
                    return this.propertyIs("mode", mode);
                },
                /**
                 * Checks if the change type is the same
                 * @param {*} type 
                 */
                typeIs(type) {
                    return this.propertyIs("type", type);
                },
                /**
                 * Checks if the change name is the same
                 * @param {*} name 
                 */
                nameIs(name) {
                    return this.propertyIs("name", name);
                },
                /**
                 * Checks if the provider is the same
                 */
                providerNameIs(provider) {
                    return this.propertyIs("provider_name", provider);
                },
                /**
                 * Checks if the action array contains the given value
                 * @param {*} action 
                 */
                actionIs(action) {
                    var actionIsPresent = resource.change.actions.some(a => a === action);
                    assert.ok(actionIsPresent, `Actions for resource ${address} are: ${resource.change.actions}. Expected to find: ${action}`);
                    return this;
                },
                /**
                 * Returns an assert helper for the before property
                 */
                before: {
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
                },
                /**
                 * Returns and assert helper for the after property
                 */
                after: {
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
                },
                /**
                 * Returns and assert helper for the after_unknown property
                 */
                unknown: {
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
        },
        /**
         * Returns the output_change assert helper
         * @param {*} name 
         */
        outputChange(name) {
            var change = plan.output_changes[name];
            assert.ok(change, `No output change named ${name} found`);

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
                 * Change before
                 */
                before: change.before,
                /**
                 * Change after
                 */
                after: change.after,
                /**
                 * Change after_unknown
                 */
                afterUnknown: change.after_unknown
            }
        },

        /**
         * Returns the configuration assert helper
         */
        configuration: {
            /**
             * Returns the provider assert helper
             * @param {*} name 
             */
            provider(name) {
                var provider = plan.configuration.provider_config[name];
                assert.ok(provider);
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
                    propertyIs(property, value) {
                        providerPropertyIs(provider, property, value);
                        return this;
                    },
                    /**
                     * Checks if the provider name is the same
                     * @param {*} name 
                     */
                    nameIs(name) {
                        return this.propertyIs("name", name)
                    },
                    /**
                     * Checks if the provider version_constraint is the same
                     * @param {*} version 
                     */
                    versionConstraintIs(version) {
                        return this.propertyIs("version_constraint", version);
                    }
                }
            },
            /**
             * Return the variable assert helper
             * @param {*} name 
             */
            variable(name) {
                var variable = plan.configuration.root_module.variables[name];
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
                        this.containsDescription();
                        assert.equal(variable.description, description, `Variable ${name} description expected was '${variable.description}'. Expected '${description}'`);
                        return this;
                    },
                    /**
                     * Checks if the variable contains a description
                     */
                    containsDescription() {
                        assert.ok(variable.description, `Variable ${name} doesn't contain any description`);
                        return this;
                    }
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
function getResource(plan, address) {
    assert.ok(plan.planned_values, "The plan contains no planned values");
    assert.ok(plan.planned_values.root_module, "The plan contains no root module");
    assert.ok(plan.planned_values.root_module.resources, "The plan contains no planned resources");
    var resources = plan.planned_values.root_module.resources;
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