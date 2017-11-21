const webhookRouter = require('express').Router();
const crypto = require('crypto');
const config = require('../config/config');
const smartsheet = require('../controllers/smartsheetController');
const webhook = require('../controllers/webhookController');
const adHelper = require('../controllers/azureADHelper')
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var Email = require('email-templates');
var nodemailer = require('nodemailer');

// This will be called when the webhook is being subscribed
webhookRouter.post('/', function (req, res) {
  var headers = req.headers;
  var flag= false;
  if (Object.keys(headers).length !== 0){
      var op = [];
      Object.keys(headers).forEach(function(key) {
        op.push(key); 
      });
      for(var i=0; i< op.length; i++){
        if(op[i].toLowerCase() === config.SMARTSHEET_REQUEST_HEADER.toLowerCase())
        {
          res.setHeader(config.SMARTSHEET_RESPONSE_HEADER, req.headers[config.SMARTSHEET_REQUEST_HEADER.toLowerCase()])
          res.sendStatus(200);  
          return;                 
        }
        if(op[i].toLowerCase() === config.SMARTSHEET_CALLBACK_HEADER.toLowerCase())  
        {
          flag = webhook.VerifyRequestSignature(req,res);
          if(flag)
          {
            var body = req.body;
            res.sendStatus(200);
            var sheetId = body.scopeObjectId;
            var events = body.events;
            var arr = [];
            events.forEach(function(event) {
                if(event.objectType.toLowerCase() === "cell".toLowerCase() && event.eventType.toLowerCase() === "updated".toLowerCase()){
                    arr.push(event);
                }
            });
            
            executeAsyncTask (arr)                
          }
        }           
      }        
  }
})


async function executeAsyncTask (arr) {
  try {
    // Get required field columnIds
    const columDetails = await getColumnDetails();
    const [ firstNameId, lastNameId, licenseeId, countryId, requestTypeId, accountTypeId, subLicenseeId, emailAddressId ] = await Promise.all([
         getColumnId(columDetails, config.FIRSTNAME_COLUMN_NAME),
         getColumnId(columDetails, config.LASTNAME_COLUMN_NAME),
         getColumnId(columDetails, config.LICENSEE_COLUMN_NAME),
         getColumnId(columDetails, config.COUNTRY_COLUMN_NAME),
         getColumnId(columDetails, config.REQUESTTYPE_COLUMN_NAME),
         getColumnId(columDetails, config.ACCOUNTTYPE_COLUMN_NAME),
         getColumnId(columDetails, config.SUB_LICENSEE_COLUMN_NAME),
         getColumnId(columDetails, config.EMAIL_ADDRESS)
    ])

    // Get all columns that are updated -{"title": data.title, "columnId": columnId, "rowId": rowId}
    const updatedCells = await getUpdatedColumns(arr);
    // filter the list to get cells that are only status update
    const statusColumnCells = await updatedCells.filter((value) => value.title.toLowerCase() === config.STATUS_COLUMN_NAME.toLowerCase())
    // Get latest status update of the cells
    const cellHistory = await getCell(statusColumnCells);
    // filter the cells that are only APPROVED
    const approvedCellsList = await cellHistory.filter((value) => value.data.displayValue.toLowerCase() === config.STATUS_COLUMN_VALUE.toLowerCase())
    // Get the rows of filtered cells 
    const approvedStatusRows = await getRows(approvedCellsList); 
    // filter rows that are REQUEST_TYPE = NEW USER
    const filterNewUserRows = await filterRowsViaCells(approvedStatusRows, requestTypeId, config.REQUESTTYPE_COLUMN_VALUE);
    // filter rows that are ACCOUNT_TYPE = CORPORATE
    const filterCorporateRows = await filterRowsViaCells(filterNewUserRows, accountTypeId, config.ACCOUNTTYPE_COLUMN_VALUE);
    const tokenResponse = await adHelper.getToken();
    // Create AZURE AD accounts for filtered rows
    const valueG = await accountCreation(filterCorporateRows, firstNameId, lastNameId, licenseeId, countryId, subLicenseeId, emailAddressId, tokenResponse);
    console.log(filterCorporateRows)      
   } catch(err){
    console.error(err) 
  }
}

async function getUpdatedColumns (arr) {
  return await Promise.all(arr.map(async (value) => await smartsheet.getColumn(value.rowId, value.columnId)))
}

async function getCell (arr) {
  return await Promise.all(arr.map(async (value) => await smartsheet.getCellHistory(value.rowId, value.columnId)))
}

async function getRows(arr) {
  return await Promise.all(arr.map(async (value) => await smartsheet.getRow(value.rowId)))
}

async function getColumnDetails(){
  var columnList = await smartsheet.listColumns();
  return await Promise.all(columnList.data.map(async (value) => await Promise.resolve({"columnId" : value.id, "columnName": value.title})))                          
}

async function getColumnId(columnDetails, columnName){
  var list = await columnDetails.filter((value) => value.columnName.toLowerCase() === columnName.toLowerCase());
  if(list.length > 0){
      return Promise.resolve(list[0].columnId);
  }
  else return Promise.reject(new Error( columnName + ' column not exist'));
}

async function filterRowsViaCells(arr, columnId, columValue) {
  if(columnId === 0) return 
  return arr.filter((obj) => {
    for (let i = 0, length = obj.cells.length; i < length; i++) {
      if (obj.cells[i].displayValue != undefined && obj.cells[i].columnId === columnId && obj.cells[i].displayValue.toLowerCase() === columValue.toLowerCase()) {
        return true;
      }
    }
    return false;
  });
}

async function getColumnDisplayValue(arr, columnId){
  return await arr.filter((value) => value.columnId === columnId)[0].displayValue;
}

async function accountCreation(rowsList, firstNameId, lastNameId, licenseeId, countryId, subLicenseeId, emailAddressId, tokenResponse) {
  for(let row of rowsList){
    var arr = row.cells;
    const [ firstNameValue, lastNameValue, licenseeValue, countryValue, subLicenseeValue, emailAddress ] = await Promise.all([
      getColumnDisplayValue(arr, firstNameId),
      getColumnDisplayValue(arr, lastNameId),
      getColumnDisplayValue(arr, licenseeId),
      getColumnDisplayValue(arr, countryId),
      getColumnDisplayValue(arr, subLicenseeId),
      getColumnDisplayValue(arr, emailAddressId)])

      var nickName = firstNameValue.charAt(0) + lastNameValue;
      var upn = nickName + "@" + config.TENANT;

      var body = {
        "accountEnabled": true,
        "displayName": firstNameValue + " " + lastNameValue,
        "mailNickname": nickName,
        "userPrincipalName": upn,
        "passwordProfile" : {
            //"ForceChangePasswordNextLogin": false,
            "password": config.AD_PASSWORD
        }
      }
      var response = await adHelper.CreateUser(tokenResponse.accessToken, body);
      if(response.StatusCode === 201){
        await sendWelcomeEmail(upn, firstNameValue, emailAddress);
        await sendPasswordEmail(emailAddress, firstNameValue)
      }
  }
}

async function sendWelcomeEmail(upn, firstName, emailAddress){
  const email = new Email({
    message: {
    from: config.FROM_ADDRESS
    },
    // uncomment below to send emails in development/test env:
    //send: true,
    transport: nodemailer.createTransport({
    jsonTransport: true
    })
  });

  await email.send({
    template: 'welcome',
    message: {
      to: emailAddress, 
      attachments : []
    },
    locals: {
      name: firstName,
      emailAddress: upn
    }
  }).then(console.log).catch(console.error);
}

async function sendPasswordEmail(emailAddress, firstName){
  const email = new Email({
    message: {
    from: config.FROM_ADDRESS
    },
    // uncomment below to send emails in development/test env:
    //send: true,
    transport: nodemailer.createTransport({
    jsonTransport: true
    })
  });

  await email.send({
    template: 'password',
    message: {
      to: emailAddress, 
      attachments : []
    },
    locals: {
      name: firstName,
      password : config.AD_PASSWORD
    }
  }).then(console.log).catch(console.error);
}
 

module.exports = webhookRouter;