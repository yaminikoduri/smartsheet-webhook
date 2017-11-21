var AuthenticationContext = require('adal-node').AuthenticationContext;
const rp = require('request-promise-native');
const config = require('../config/config');
const authotityURL = config.AUTHORITY_HOSTURL + config.TENANT + "/oauth2/token"
var context = new AuthenticationContext(authotityURL);

exports.getToken = function(){
    const promise = new Promise((resolve, reject) => { 
        context.acquireTokenWithClientCredentials(config.RESOURCE, config.APPLICATION_ID, config.CLIENT_SECRET, function(err, tokenResponse) {
            if (err) {
                reject('well that didn\'t work: ' + err.stack);
            } else {
                resolve(tokenResponse);
            }
        })
    })
    return promise;
}

exports.CreateUser = function(accesToken, body) {
  var options = {
    method: 'POST',
    uri: config.RESOURCE + config.TENANT + "/users?api-version=1.6",
    auth: {'bearer': accesToken},
    body: body,
    json: true,
    resolveWithFullResponse: true
  };
  
  const promise = new Promise((resolve, reject) => { 
   rp(options)
   .then(function (response){
       resolve(response)
    })    
    .catch(function (err) {
        reject(err);
    });  
  })
  return promise;    
}