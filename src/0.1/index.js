const assert = require('assert');
const variables = require('./variables');
const terraformVersion = require('./terraformVersion');
const outputChanges = require('./output_changes');
const plannedValues = require('./planned_values');
const resourceChanges = require('./resource_changes');
const configuration = require('./configuration')
/**
 * This functions returns an assert helper for the given terraform plan
 * Support format_version 0.1
 * For more information: https://www.terraform.io/docs/internals/json-format.html
 */
module.exports = function (plan) {
    assert.equal(plan.format_version, "0.1", `Unsupported format version. Expected: 0.1. Actual: ${plan.format_version}`);
    return {
        terraformVersion: terraformVersion(plan.terraform_version),
        variables: variables(plan.variables),
        planned_values: plannedValues(plan.planned_values),
        resource_changes: resourceChanges(plan.resource_changes),
        output_changes: outputChanges(plan.output_changes),
        configuration: configuration(plan.configuration)
    }
}