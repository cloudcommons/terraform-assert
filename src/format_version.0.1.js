const assert = require('assert');

module.exports = function (plan) {
    return {
        /**
         * Checks if the terraform version is equal to the given version
         * @param {*} version 
         */
        terraformVersion: {
            equals: function (version) {
                assert.equal(plan.terraform_version, version, `Expected Terraform plan version to be ${version} but ${plan.terraform_version} found`);
            }
        },

        variables: {
            contains: function (variable) {
                assert.ok(plan.variables, "The plan contains no variables");
                assert.ok(plan.variables[variable] !== undefined, `Variable ${variable} is not present in the Terraform plan`);
                return this;
            },
            equals: function (variable, value) {
                var actual = plan.variables[variable];
                assert.ok(actual !== undefined, `Variable ${variable} is not present in the Terraform plan`);
                assert.equal(actual.value, value, `Expecting plan variable ${variable} to be ${value}. Actual: ${actual}`);
                return this;
            }
        },

        plannedValues: {
            outputs: {
                /**
                 * Checks if the planned values outputs contains the given output name
                 * @param {*} output 
                 */
                contains: function (output) {
                    assert.ok(plan.planned_values, "The plan contains no planned values");
                    assert.ok(plan.planned_values.outputs, "The plan contains no planned outputs");
                    assert.ok(plan.planned_values.outputs[output] != undefined, `The plan contains no planned output named ${output}`);
                    return this;
                },
                isSensitive: function (output) {
                    assert.ok(plan.planned_values, "The plan contains no planned values");
                    assert.ok(plan.planned_values.outputs, "The plan contains no planned outputs");
                    assert.ok(plan.planned_values.outputs[output].sensitive === true, `Output ${output} should be sensitive`);
                    return this;
                },
                isNotSensitive: function (output) {
                    assert.ok(plan.planned_values, "The plan contains no planned values");
                    assert.ok(plan.planned_values.outputs, "The plan contains no planned outputs");
                    assert.ok(plan.planned_values.outputs[output].sensitive === false, `Output ${output} should not be sensitive`);
                    return this;
                }
            },

            resources: {
                resource: function (address) {
                    var resource = getResource(plan, address);
                    return {
                        get() {
                            return resource;
                        },
                        modeIs(mode) {
                            resourcePropertyEquals(address, resource.mode, mode, "mode");
                            return this;
                        },
                        nameIs(name) {
                            resourcePropertyEquals(address, resource.name, name, "name");
                            return this;
                        },
                        typeIs(type) {
                            resourcePropertyEquals(address, resource.type, type, "mode");
                            return this;
                        },
                        providerNameIs(provider) {
                            resourcePropertyEquals(address, resource.provider_name, provider, "provider");
                            return this;
                        },
                        schemaVersionIs(schemaVersion) {
                            resourcePropertyEquals(address, resource.schema_version, schemaVersion, "schemaVersion");
                            return this;
                        },
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
        resourceChange(address) {
            assert.ok(plan.resource_changes, "The plan contains no resource changes");
            var resource = plan.resource_changes.filter(c => c.address === address);
            assert.ok(resource.length === 1, `No change to resource ${address} found in plan`);
            resource = resource[0];
            return {
                propertyIs(propertyName, value) {
                    changePropertyEquals(address, value, resource[propertyName], propertyName);
                    return this;
                },
                modeIs(mode) {
                    return this.propertyIs("mode", mode);
                },
                typeIs(type) {
                    return this.propertyIs("type", type);
                },
                nameIs(name) {
                    return this.propertyIs("name", name);
                },
                providerNameIs(provider) {
                    return this.propertyIs("provider_name", provider);
                },
                actionIs(action) {
                    var actionIsPresent = resource.change.actions.some(a => a === action);
                    assert.ok(actionIsPresent, `Actions for resource ${address} are: ${resource.change.actions}. Expected to find: ${action}`);
                    return this;
                },
                before: {
                    get() { return resource.change.before; },
                    is(key, value) {
                        changeIs(resource, "before", key, value);
                        return this;
                    },
                    isNull() {
                        assert.equal(resource.change.before, null);
                    }
                },
                after: {
                    get() { return resource.change.after; },
                    is(key, value) {
                        changeIs(resource, "after", key, value);
                        return this;
                    },
                    isNull() {
                        assert.equal(resource.change.after, null);
                    }
                },
                unknown: {
                    get() { return resource.change.after_unknown; },
                    is(key, value = true) {
                        changeIs(resource, "after_unknown", key, value);
                        return this;
                    },
                    isNull() {
                        assert.equal(resource.change.after_unknown, null);
                    }
                }
            }
        },
        outputChange(name) {
            var change = plan.output_changes[name];
            assert.ok(change, `No output change named ${name} found`);

            return {
                actionIs(action) {
                    var actionIsPresent = change.actions.some(a => a === action);
                    assert.ok(actionIsPresent, `Output ${name} actions are: ${change.actions}. Expected to find: ${action}`);
                    return this;
                },

                before: change.before,
                after: change.after,
                afterUnknown: change.after_unknown
            }
        },

        configuration: {
            provider(name) {
                var provider = plan.configuration.provider_config[name];
                assert.ok(provider);
                return {
                    get(property) {
                        return provider[property];
                    },
                    propertyIs(property, value) {
                        providerPropertyEquals(provider, property, value);
                        return this;
                    },
                    nameIs(name) {
                        return this.propertyIs("name", name)
                    },
                    versionConstraintIs(version) {
                        return this.propertyIs("version_constraint", version);
                    }
                }
            },
            variable(name) {
                var variable = plan.configuration.root_module.variables[name];
                assert.ok(variable, `The plan doesn't include any variable called ${name}`);
                return {
                    defaultIs(defaultValue) {
                        assert.equal(variable.default, defaultValue, `Configuration output ${name} default value was ${variable.default}. Expected: ${defaultValue}`);
                        return this;
                    },
                    descriptionIs(description) {
                        this.containsDescription();
                        assert.equal(variable.description, description, `Variable ${name} description expected was '${variable.description}'. Expected '${description}'`);
                        return this;
                    },
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
function resourcePropertyEquals(address, expected, actual, resourcePropertyName) {
    assert.equal(actual, expected, `Expected resource ${address} ${resourcePropertyName} value was ${expected}. Actual: ${actual}`);
}

/**
 * Checks if a provider property is equal to the given value
 * @param {*} provider 
 * @param {*} name 
 * @param {*} actual 
 */
function providerPropertyEquals(provider, name, actual) {
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
function changePropertyEquals(address, expected, actual, resourcePropertyName) {
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