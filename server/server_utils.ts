import { Router } from "express";
import * as express from 'express';
import * as fs from 'fs-extra';
import * as path from 'path';

export function makeArrayLikeQueryCondition(queryValue: string | Array<String>): any {
  if (queryValue instanceof Array) {
    return { "$in": queryValue }
  } else { return queryValue }
}

export class RouterWrapper{
  public readonly router: Router
  constructor(){
    this.router = express.Router()
  }
}

var promiseAllWait = function(promises) {
  // this is the same as Promise.all(), except that it will wait for all promises to fulfill before rejecting
  var all_promises = [];
  for(var i_promise=0; i_promise < promises.length; i_promise++) {
      all_promises.push(
          promises[i_promise]
          .then(function(res) {
              return { res: res };
          }).catch(function(err) {
              return { err: err };
          })
      );
  }

  return Promise.all(all_promises)
  .then(function(results) {
      return new Promise(function(resolve, reject) {
          var is_failure = false;
          var i_result;
          for(i_result=0; i_result < results.length; i_result++) {
              if (results[i_result].err) {
                  is_failure = true;
                  break;
              } else {
                  results[i_result] = results[i_result].res;
              }
          }

          if (is_failure) {
              reject( results[i_result].err );
          } else {
              resolve(results);
          }
      });
  });
};

export function checkFileExistenceAndType(path: string): string{
  try{
    const stat = fs.statSync(path)
    return stat.isDirectory() === true? 'directory' : 'file'
  }catch(e){
    return null
  }
}