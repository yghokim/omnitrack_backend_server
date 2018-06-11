import * as path from "path";
import { merge } from "../shared_lib/utils";
import * as fs from 'fs-extra';
import { BehaviorSubject } from 'rxjs'; 
const environmentPath = path.join(
  __dirname,
  "../../../credentials/environment.json"
)

var env: any;

const environmentSubject = new BehaviorSubject(null)

function reloadEnvironment(fromJson?: any) {
  if (fromJson) {
    env = merge(env, fromJson, true, true)
  } else {
    try {
      env = require(environmentPath);
    } catch (err) {
      env = null;
      console.log(err);
    }
  }
  environmentSubject.next(env)
}

function saveEnv(): Promise<void>{
  if(env){
    return fs.writeJson(environmentPath, env)
  }else return Promise.reject("env instance is null")
}

reloadEnvironment();

export default env;
export { reloadEnvironment, saveEnv, environmentSubject };