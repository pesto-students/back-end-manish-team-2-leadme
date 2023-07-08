const Sentry = require('./config/sentry');

exports.buildRes = function(data) {
    data.success = data.success ?? false;
    return data;
}

exports.errLogger = function (err){
    Sentry.captureException(err);
}

exports.round = (num, precision = 2) => {
    return Number(parseFloat(num).toFixed(precision));
}