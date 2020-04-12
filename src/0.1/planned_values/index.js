const outputs = require('./outputs');
const tfModule = require('./module');

module.exports = function (planned_values) {
    return {
        outputs: outputs(planned_values.outputs),
        root_module: tfModule(planned_values.root_module)
    }
}
