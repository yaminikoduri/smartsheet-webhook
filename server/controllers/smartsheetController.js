const client = require('smartsheet')
const config = require('../config/config');

const sheetId = config.SCOPE_OBJECT_ID;

var smartsheet = client.createClient({
  accessToken: config.AUTH_TOKEN,
  logLevel: 'info'
});

exports.getCellHistory = function (rowId, columnId){
    const promise = new Promise((resolve, reject) => {   

        // Set options
        var options = {
            sheetId: sheetId,
            rowId: rowId,
            columnId: columnId
        };

        smartsheet.sheets.getCellHistory(options, function(err, history){
            if(err) {
                reject(err);
            } else {
                var response = {"data": history.data[0], "rowId": rowId}
                resolve(response);
            }  
        })         
    });
    return promise;
}

exports.listColumns = function (){
    const promise = new Promise((resolve, reject) => {   
        // Set options
        var options = {
            sheetId: sheetId,
        };

        smartsheet.sheets.getColumns(options, function(err, columnList){
            if(err) {
                reject(err);
            }
            else 
            {
                resolve(columnList)
            }  
        })         
    });
    return promise;
}


exports.getColumn = function (rowId, columnId){
    const promise = new Promise((resolve, reject) => {   
        // Set options
        var options = {
            sheetId: sheetId,
            columnId: columnId
        };

        smartsheet.sheets.getColumns(options, function(err, data){
            if(err) {
                reject(err);
            }
            else 
            {
                var response = {"title": data.title, "columnId": columnId, "rowId": rowId}
                resolve(response);  
            }  
        })         
    });
    return promise;
}

exports.getRow= function (rowId){
    const promise = new Promise((resolve, reject) => {   
        // Set options
        var options = {
            sheetId: sheetId,
            rowId: rowId
        };

        smartsheet.sheets.getRow(options, function(err, data){
            if(err) {
                reject(err);
            }
            else 
            {
                resolve(data);  
            }  
        })         
    });
    return promise;
}

exports.updateRow = function (rowId, columnId, updateValue){
    const promise = new Promise((resolve, reject) => { 
        var row = [
            {
                "id": rowId,
                "cells": [
                    {
                        "columnId": columnId,
                        "value": updateValue
                    }
                ]
            }
        
        ];  
        // Set options
        var options = {
            sheetId: sheetId,
            rowId: rowId
        };

        smartsheet.sheets.updateRow(options, function(err, data){
            if(err) {
                reject(err);
            }
            else 
            {
                resolve(data);  
            }  
        })         
    });
    return promise;
}