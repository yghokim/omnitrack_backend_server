import { Model } from "mongoose";
import { Request, Response } from "express";

abstract class BaseCtrl {

  abstract model: any;

  protected preprocessBeforeInsertToDb(singleQueryObject: any): any {
    return singleQueryObject
  }

  protected preprocessSingleQuery(queryObject: any, req: Request, res: Response): any {
    return queryObject
  }

  // Get all
  getAll = (req, res) => {
    this.model.find({}, (err, docs) => {
      if (err) { return console.error(err); }
      res.json(docs);
    });
  }

  // Count all
  count = (req, res) => {
    this.model.count((err, count) => {
      if (err) { return console.error(err); }
      res.json(count);
    });
  }

  // Insert
  insert = (req, res) => {
    const obj = new this.model(this.preprocessBeforeInsertToDb(req.body));
    obj.save((err, item) => {
      // 11000 is the code for duplicate key error
      if (err && err.code === 11000) {
        res.sendStatus(400);
      }
      if (err) {
        return console.error(err);
      }
      res.status(200).json(item);
    });
  }

  // Get by id
  get = (req, res) => {
    this.model.findOne(this.preprocessSingleQuery({ _id: req.params.id }, req, res), (err, obj) => {
      if (err) { return console.error(err); }
      res.json(obj);
    });
  }

  // Update by id
  update = (req, res) => {
    this.model.findOneAndUpdate(this.preprocessSingleQuery({ _id: req.params.id }, req, res), req.body, (err) => {
      if (err) { return console.error(err); }
      res.sendStatus(200);
    });
  }

  // Delete by id
  delete = (req, res) => {
    this.model.findOneAndRemove(this.preprocessSingleQuery({ _id: req.params.id }, req, res), (err) => {
      if (err) { return console.error(err); }
      res.sendStatus(200);
    });
  }

  destroy = (req, res) => {
    this.model.remove({}, err => {
      if (err) {
        console.log(err)
        res.sendStatus(500);
      } else {
        res.status(200).send({result: "destroyed all data rows in " + this.model + "."})
      }
    })
  }
}

export default BaseCtrl;
