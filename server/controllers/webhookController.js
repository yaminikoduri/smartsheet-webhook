const rp = require('request-promise-native');
const config = require('../config/config');
const crypto = require('crypto');
var APP_SECRET = undefined;

// Create webhook
exports.CreateWebhook = function() {
  const body = {
    "name": "Test Webhook",
    "callbackUrl": config.CALLBACK_URL, 
    "scope": config.SCOPE,
    "scopeObjectId": config.SCOPE_OBJECT_ID, 
    "version": config.SMARTSHEET_API_VERSION,
    "events": config.EVENTS
  };

  var options = {
    method: 'POST',
    uri: config.SMARTSHEET_API_BASE + '/webhooks',
    auth: {'bearer': config.AUTH_TOKEN},
    body: body,
    json: true 
  };

  const promise = new Promise((resolve, reject) => { 
    ListWebhooks().then(function(list) {
      if(list.totalCount == 1){
        APP_SECRET = list.data[0].sharedSecret;
        UpdateWebhook(list.data[0].id)
      }
      else{
        if(list.totalCount == 0){  
          rp(options)
          .then(body => {
            APP_SECRET = body.result.sharedSecret;
            UpdateWebhook(body.result.id)
          })    
          .catch(function (err) {
            logger.error(error);
          });         
        }
      }
    })
  })
  return promise;
}

// Update webhook
function UpdateWebhook(webhookId) {   
   var options = {
    method: 'PUT',
    uri: config.SMARTSHEET_API_BASE + '/webhooks/' + webhookId,
    auth: {'bearer': config.AUTH_TOKEN},
    body: {enabled : true},
    json: true 
  };
  const promise = new Promise((resolve, reject) => { 
    rp(options)
      .then(function(result){
        console.log('UpdateWebhook', result)
      })    
      .catch(function (err) {
          console.error(err);
      });
  })
  return promise;
}

//List Webhooks
function ListWebhooks(){
  var options = {
    method: 'GET',
    uri: config.SMARTSHEET_API_BASE + '/webhooks',
    auth: {'bearer': config.AUTH_TOKEN},
    json: true 
  };
 const promise = new Promise((resolve, reject) => {   
  rp(options)
    .then(result => resolve(result))
    .catch(function (err) {
        reject(err);
    });  
 })
 return promise;
}

// Delete webhook
exports.DeleteWebhooks = function(list) {  
  const promise = new Promise((resolve, reject) => {   
    list.data.forEach(item => {
      var options = {
      method: 'DELETE',
      uri: config.SMARTSHEET_API_BASE + '/webhooks/' + item.id,
      auth: {'bearer': config.AUTH_TOKEN},
      json: true 
    }
      rp(options)
        .then(function(result){
          console.log('DeleteWebhooks')
        })    
        .catch(function (err) {
            console.error(err);
        });
    })
  })
  return promise;
}


exports.VerifyRequestSignature = function  (req, res) {
  var signature = req.headers[config.SMARTSHEET_CALLBACK_HEADER.toLowerCase()];

  if (!signature) {
    console.error("Couldn't validate the signature.");
  } else {
    var signatureHash = signature;
    console.log(APP_SECRET);
    var expectedHash = crypto.createHmac('sha256', APP_SECRET)
                   .update(JSON.stringify(req.body))
                   .digest('hex');

    if (signatureHash !== expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
    else
      return true;
    
  }
}