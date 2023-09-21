'use strict';

/**
 * @module scripts/jobs/rejectedOrders.js
 */

var Alerts = require('dw/alert/Alerts');
var OrderMgr = require('dw/order/OrderMgr');
var Status = require('dw/system/Status');
var Site = require('dw/system/Site');
var System = require('dw/system/System');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

var STATUS = {
    NO_DATA    : 'NO_DATA_TO_EXPORT'
};
var INSTANCES = {
    0: 'DEVELOPMENT',
    1: 'STAGING',
    2: 'PRODUCTION'
};

module.exports.execute = function (args) {
    var StepUtil = require('*/cartridge/scripts/util/StepUtil');
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');

    if (StepUtil.isDisabled(args)) {
        return new Status(Status.OK, 'OK', 'Step disabled, skip it...');
    }

    var alerts = Alerts.getAlertsForContextObject(Site.getCurrent().getID(), args.DescriptorID);
    if (alerts.length === 0) {
        return new Status(Status.OK, STATUS.NO_DATA, 'There is no alert. Abort...');
    }

    // Send email for the first alert, as alerts are tied to the site and not to a given order
    emailHelpers.send({
        to: args.EmailTo,
        from: args.EmailFrom,
        subject: args.EmailSubject.replace('{0}', INSTANCES[System.getInstanceType()])
    }, 'orderManagement/rejectedOrdersEmail', {
        alert: {
            displayMessage: alerts[0].getDisplayMessage(),
            remediationURL: alerts[0].getRemediationURL() || URLUtils.https('ViewOrderList_52-SimpleSearch', 'OrderSearchForm2_IntegrationState', 'Failed')
        }
    });

    if (args.DeleteAlerts !== true) {
        return;
    }

    Transaction.wrap(function () {
        // Remove all alerts from the descriptor ID, as we sent them all by email
        Alerts.removeAlert(args.DescriptorID, Site.getCurrent().getID());
    });
};
