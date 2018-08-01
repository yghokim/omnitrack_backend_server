import { Router } from "express";
import * as express from 'express';
import * as fs from 'fs-extra';
import * as path from 'path';

export function makeArrayLikeQueryCondition(queryValue: string | Array<String>): any {
  if (queryValue instanceof Array) {
    return { "$in": queryValue }
  } else { return queryValue }
}

export class RouterWrapper {
  public readonly router: Router
  constructor() {
    this.router = express.Router()
  }
}

export function checkFileExistenceAndType(filePath: string): string {
  try {
    const stat = fs.statSync(filePath)
    return stat.isDirectory() === true ? 'directory' : 'file'
  } catch (e) {
    return null
  }
}