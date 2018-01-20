exports.resourceName = (input) => {
    if (!input) return "Required";
    if (input.indexOf(' ') > -1) return "No Spaces";
    return true;
}
exports.resourceDescription = (input) => {
    return true;
}
exports.url = (input) => {
    if (!input) return "Required";
    if (input.indexOf(' ') > -1) return "No Spaces";
    return true;
}
exports.containerImage = (input) => {
    if (!input) return "Required";
    if (input.indexOf(' ') > -1) return "No Spaces";
    return true;
}
exports.cpu = (input) => {
    if (isNaN(input)) return "Must be a number";
    let num = parseFloat(input);
    if (num < 0) return "Must be a positive number";
    if (num > 32) return "Valid range: 0.1 - 32.0"
    return true;
}
exports.memory = (input) => {
    if (isNaN(input)) return "Must be a number";
    let num = parseFloat(input);
    if (!Number.isInteger(num)) return "Must be a positive integer";
    if (num < 1) return "Must be a positive integer";
    return true;
}
exports.containerNumInstances = (input) => {
    if (isNaN(input)) return "Must be a number";
    let num = parseFloat(input);
    if (!Number.isInteger(num)) return "Must be a positive integer";
    if (num < 0) return "Must be non-negative";
    return true;
}
exports.lambdaTimeout = nonNegativeNumber

exports.lambdaHandler = (input) => {
    if (!input) return "Required";
    if (input.indexOf(' ') > -1) return "No Spaces";
    return true;
}

function nonNegativeNumber(input) {
    if (isNaN(input)) return "Must be a number";
    let num = parseFloat(input);
    if (num < 0) return "Must be non-negative";
    return true;
}
