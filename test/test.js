const planAssert = require('../src/index');
const planJson = require('./samples/resource-group.json');
const plan = planAssert(planJson);
const assert = require('assert');

describe("terraform-assert", () => {
    describe("Basic tests", () => {
        it("Validates a terraform plan version", () => {
            plan.terraformVersion.equals("0.12.23");
        });
    });

    describe("Variable tests", () => {

        it("Validates an existing terraform variable", () => {
            plan.variables.contains("APP");
        });

        it("Validates a variable value", () => {
            plan.variables.equals("APP", "cloudcommons");
        });

        it("Is able to perform nested variable validations", () => {
            plan.variables
                .contains("APP").equals("APP", "cloudcommons")
                .contains("CREATOR").equals("CREATOR", "cloudcommons")
                .contains("ENVIRONMENT").equals("ENVIRONMENT", "default")
                .contains("LOCATION").equals("LOCATION", "uksouth")
                .contains("RESOURCE_GROUP_NAME").equals("RESOURCE_GROUP_NAME", "cloudcommons-test");
        });

        it("Throws when a variable is not present", () => {
            assert.throws(() => {
                plan.variables.contains("DONT_EXIST");
            });
        });

        it("Throws when a variable don't exist when equals", () => {
            assert.throws(() => {
                plan.variables.equals("DONT_EXIST", "invalid_value")
            });
        });

        it("Throws when a variable value is not equal", () => {
            assert.throws(() => {
                plan.variables.equals("APP", "invalid_value")
            });
        });
    });

    describe("Output tests", () => {

        it("Validates an existing output", () => {
            plan.plannedValues.outputs.contains("RESOURCE_GROUP_ID");
        });

        it("Validates an exising output sensitive kind", () => {
            plan.plannedValues.outputs.isNotSensitive("RESOURCE_GROUP_ID");
        });

        it("Throws when an output sensitive is not correct", () => {
            assert.throws(() => {
                plan.plannedValues.outputs.isSensitive("RESOURCE_GROUP_ID");
            });
        });

        it("Throws when an output is not present", () => {
            assert.throws(() => {
                plan.plannedValues.outputs.contains("DONT_EXIST");
            });
        });
    });

    describe("Planned root module resources", () => {
        it("Can find an existing resource", () => {
            plan.plannedValues.resources.contains("azurerm_resource_group.cloudcommons-test");
        });


        it("Fails when a resource is not found", () => {
            assert.throws(() => {
                plan.plannedValues.resources.contains("NOT_FOUND")
            });
        });

        it("Validates the mode of a resource", () => {
            plan.plannedValues.resources.resource("azurerm_resource_group.cloudcommons-test")
                .modeIs("managed")
                .nameIs("cloudcommons-test")
                .providerNameIs("azurerm")
                .schemaVersionIs(0)
                .typeIs("azurerm_resource_group")
                .valueIs("location", "uksouth")
                .valueIs("timeouts", null);
        });
    });

    describe("Resource changes", () => {
        it("Validates change properties", () => {
            var change = plan.resourceChange("azurerm_resource_group.cloudcommons-test");
            change
                .modeIs("managed")
                .actionIs("create");
            change.before.isNull();
            change.after.is("location", "uksouth");
            change.unknown.is("id")
                .is("name")
                .is("tags");
        });
    });

    describe("Output changes", () => {
        it("Validates output changes", () => {
            var change = plan.outputChange("RESOURCE_GROUP_ID");
            change.actionIs("create");
            assert.equal(change.before, null);
            assert.ok(change.afterUnknown);
        });
    });

    describe("Configuration", () => {
        describe("Providers", () => {
            it("Can validate providers", () => {
                var azurerm = plan.configuration.provider("azurerm");
                azurerm
                    .nameIs("azurerm")
                    .versionConstraintIs("~> 2.0");
                var expressions = azurerm.get("expressions");
                assert.ok(expressions);

                var random = plan.configuration.provider("random");
                random.nameIs("random").versionConstraintIs("~> 2.2")
            });
        });

        describe("Variables", () => {
            it("Can validate descriptions", () => {
                var app = plan.configuration.variable("APP");
                app.defaultIs("cloudcommons")
                    .containsDescription()
                    .descriptionIs("(Required) Application to which the resources belongs to");
            });

            it("Fails when a variable doesn't exist", () => {
                assert.throws(() => {
                    plan.configuration.variable("DONT_EXIST").containsDescription();
                });
            });
        });
    });
});