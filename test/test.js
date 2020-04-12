const planAssert = require('../src/index');
const assert = require('assert');
const AssertionError = require('assert').AssertionError;

describe('terraform-assert - Basic tests', () => {
    const plan = planAssert(require('./samples/resource-group.json'));

    describe('Basic tests', () => {
        it('Validates a terraform plan version', () => {
            plan.terraformVersion.is('0.12.23');
        });
    });

    describe('Variable tests', () => {

        it('Validates an existing terraform variable', () => {
            plan.variables('APP');
        });

        it('Validates a variable value', () => {
            plan.variables('APP').is('cloudcommons');
        });

        it('Is able to perform nested variable validations', () => {
            plan.variables('APP').is('cloudcommons');
            plan.variables('CREATOR').is('cloudcommons');
            plan.variables('ENVIRONMENT').is('default');
            plan.variables('LOCATION').is('uksouth')
            plan.variables('RESOURCE_GROUP_NAME').is('cloudcommons-test');
        });

        it('Throws when a variable is not present', () => {
            assertThrows(() => {
                plan.variables('DONT_EXIST');
            });
        });

        it('Throws when a variable doesn\'t exist when equals', () => {
            assertThrows(() => {
                plan.variables('DONT_EXIST').is('invalid_value');
            });
        });

        it('Throws when a variable value is not equal', () => {
            assertThrows(() => {
                plan.variables('APP').is('invalid_value');
            });
        });
    });

    describe('Output tests', () => {

        it('Validates an existing output', () => {
            plan.planned_values.outputs('RESOURCE_GROUP_ID');
        });

        it('Validates an exising output sensitive kind', () => {
            plan.planned_values.outputs('RESOURCE_GROUP_ID').isNotSensitive();
        });

        it('Throws when an output sensitive is not correct', () => {
            assertThrows(() => {
                plan.planned_values.outputs('RESOURCE_GROUP_ID').isSensitive();
            });
        });

        it('Throws when an output is not present', () => {
            assertThrows(() => {
                plan.planned_values.outputs('DONT_EXIST');
            });
        });
    });

    describe('Planned root module resources', () => {
        it('Can find an existing resource', () => {
            plan.planned_values.root_module.resources('azurerm_resource_group.cloudcommons-test');
        });


        it('Fails when a resource is not found', () => {
            assertThrows(() => {
                plan.planned_values.root_module.resources('NOT_FOUND')
            });
        });

        it('Validates the mode of a resource', () => {
            plan.planned_values.root_module.resources('azurerm_resource_group.cloudcommons-test')
                .mode().is('managed')
                .name().is('cloudcommons-test')
                .providerName().is('azurerm')
                .type().is('azurerm_resource_group')
                .value('location').is('uksouth')
                .value('timeouts').is(null)
                .schemaVersion().is(0)
                .providerName().is('azurerm');
        });
    });

    describe('Resource changes', () => {
        it('Validates change properties', () => {
            var change = plan.resource_changes('azurerm_resource_group.cloudcommons-test');
            change
                .mode().is('managed')
                .action().is('create');
            change.before().isNull();
            change.after().is('location', 'uksouth');
            change.unknown()
                .is('id')
                .is('name')
                .is('tags');
        });
    });

    describe('Output changes', () => {
        it('Validates output changes', () => {
            plan.output_changes.contains('RESOURCE_GROUP_ID')
                .change('RESOURCE_GROUP_ID')
                .actionIs('create')
                .beforeIs(null)
                .afterUnknownIs(true);
        });
    });

    describe('Configuration', () => {
        describe('Providers', () => {
            it('Can validate providers', () => {
                var azurerm = plan.configuration.provider('azurerm');
                azurerm
                    .name().is('azurerm')
                    .versionConstraint().is('~> 2.0');
                var expressions = azurerm.get('expressions');
                assert.ok(expressions);

                var random = plan.configuration.provider('random');
                random.name().is('random').versionConstraint().is('~> 2.2')
            });
        });

        describe('Variables', () => {
            it('Can validate descriptions', () => {
                var app = plan.configuration.variable('APP');
                app.defaultIs('cloudcommons')
                    .hasDescription()
                    .descriptionIs('(Required) Application to which the resources belongs to');
            });

            it('Fails when a variable doesn\'t exist', () => {
                assertThrows(() => {
                    plan.configuration.variable('DONT_EXIST').containsDescription();
                });
            });
        });
    });
});

describe('terraform-assert - Child modules', () => {
    const plan = planAssert(require('./samples/aks.json'));
    it('Can access child_modules', () => {
        var children = plan.planned_values.root_module.child_modules;
        var aksResources = children('module.cloudcomons-aks-kubernetes').resources;
        aksResources('module.cloudcomons-aks-kubernetes.azurerm_kubernetes_cluster.cloudcommons');
        var vnetResources = children('module.cloudcomons-aks-kubernetes').child_modules('module.cloudcomons-aks-kubernetes.module.vnet').resources;
        var vnet = vnetResources('module.cloudcomons-aks-kubernetes.module.vnet.azurerm_virtual_network.cloudcommons[0]');
        vnet.value('address_space').is('172.0.0.0/22')
            .value('location').is('uksouth');
        var subnet = vnet.value("subnet").get();
        assert.equal(subnet[0].address_prefix, '172.0.0.0/23');
        assert.equal(subnet[0].name, 'Cluster');
    });
});


/**
 * Checks that a function throws an an exception of type AssertionError
 * @param {*} func 
 */
function assertThrows(func) {
    assert.throws(() => {
        func();
    }, (e) => {
        return (e instanceof AssertionError);
    });
}