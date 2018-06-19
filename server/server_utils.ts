import { Router } from "express";
import * as express from 'express';

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