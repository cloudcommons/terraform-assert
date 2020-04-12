const assert = require('assert');
const resources = require('./resources');

module.exports = tfModule;

function tfModule(module) {
    // If the module don't exist returns undefined
    if (!module) return undefined;

    var child_modules = getChildModules(module.child_modules);

    return {
        /**
         * Module address
         */
        address: module.address ? module.address : 'root',
        /**
         * Planned resources
         */
        resources: resources(module.resources),
        /**
         * Expands any child modules
         */
        child_modules: child_modules ? function (address) {
            var module = child_modules.find(m => m.address === address);
            assert.ok(module, `The module contains no child named ${address}`);
            return module;
        } : undefined
    };

    /**
     * Generate the nested modules for this module children.
     * If the are no child_modules this function returns undefined
     * @param {*} child_modules 
     */
    function getChildModules(child_modules) {
        if (!child_modules) return undefined;
        var modules = []
        if (child_modules) {
            for (var i = 0; i < child_modules.length; i++) {
                modules.push(tfModule(module.child_modules[i]))
            }
        }
        return modules;
    }
}