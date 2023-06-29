const Sentry = require('./config/sentry');

exports.buildRes = function(data) {
    data.success = data.success ?? false;
    return data;
}

exports.errLogger = function (err){
    Sentry.captureException(err);
}