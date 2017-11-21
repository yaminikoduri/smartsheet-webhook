const merge = require('lodash.merge');

const config = {
  dev: 'development',
  test: 'testing',
  prod: 'production',
  port: process.env.PORT || 3000,
};

process.env.NODE_ENV = process.env.NODE_ENV || config.dev;
config.env = process.env.NODE_ENV;

const smartSheetConfig = {
    CALLBACK_URL : process.env.CALLBACK_URL,
    SMARTSHEET_API_BASE : 'https://api.smartsheet.com/2.0',
    SMARTSHEET_API_VERSION : 1,
    SCOPE : "sheet",
    SCOPE_OBJECT_ID : process.env.SCOPE_OBJECT_ID,
    EVENTS : [ "*.*" ],
    AUTH_TOKEN : process.env.AUTH_TOKEN,
}

const smartSheetColumnConfig = {
// column names
 STATUS_COLUMN_NAME : "Status",
 REQUESTTYPE_COLUMN_NAME : "Request Type",
 FIRSTNAME_COLUMN_NAME : "First Name",
 LASTNAME_COLUMN_NAME : "Last Name",
 ACCOUNTTYPE_COLUMN_NAME : "Corporate or Store?",
 LICENSEE_COLUMN_NAME : "Please tell us your licensee name.",
 COUNTRY_COLUMN_NAME : "Country",
 SUB_LICENSEE_COLUMN_NAME : "MLA Licensee Name Test",
 EMAIL_ADDRESS : "Email Address",

// column values
 STATUS_COLUMN_VALUE : "Approved",
 REQUESTTYPE_COLUMN_VALUE : "New User",
 ACCOUNTTYPE_COLUMN_VALUE : "Corporate"
}

//smartsheet headers
const smartSheetHeaderConfig = {
 SMARTSHEET_REQUEST_HEADER : "Smartsheet-Hook-Challenge",
 SMARTSHEET_RESPONSE_HEADER : "Smartsheet-Hook-Response",
 SMARTSHEET_CALLBACK_HEADER : "Smartsheet-Hmac-Sha256",
}

// Azure AD 
const azureADConfig = {
 AUTHORITY_HOSTURL : 'https://login.microsoftonline.com/',
 TENANT : process.env.TENANT, // AAD Tenant name.
 APPLICATION_ID : process.env.APPLICATION_ID, // Application Id of app registered under AAD.
 CLIENT_SECRET : process.env.CLIENT_SECRET, // Secret generated for app. Read this environment variable.
 RESOURCE : 'https://graph.windows.net/', // URI that identifies the resource for which the token is valid.
 AD_PASSWORD : process.env.AD_PASSWORD,
 FROM_ADDRESS : process.env.FROM_ADDRESS
}

module.exports = merge(config, smartSheetConfig, smartSheetColumnConfig, smartSheetHeaderConfig, azureADConfig);