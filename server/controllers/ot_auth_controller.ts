import { Model, Document } from "mongoose";
import * as jwt from "jsonwebtoken";
import env from '../env';
import { isNullOrBlank, merge } from "../../shared_lib/utils";
import { Request } from "express";
import C from '../server_consts';

export interface JwtTokenSchemaBase {
  uid: string,
  exp: number,
  iat: number
}

export abstract class OTAuthCtrlBase {
  protected bcrypt = require("bcryptjs");

  constructor(private model: Model<any>, private decodedPropertyName: string, private usernamePropertyName: string, private userModifiableFields: Array<string> = []) { }

  protected hashPassword(password, cb) {
    this.bcrypt.genSalt(10, (err, salt) => {
      if (err == null) {
        this.bcrypt.hash(password, salt, cb);
      } else {
        cb(err, null);
      }
    });
  }

  private hashPasswordPromise(password): Promise<string> {
    return new Promise((resolve, reject) => {
      this.hashPassword(password, (err, hashedPassword) => {
        if (err) {
          reject(err)
        } else {
          resolve(hashedPassword)
        }
      })
    })
  }

  protected generateJWTToken(user, iat?: Date): string {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    const token = {
      uid: user._id,
      exp: Math.floor(expiry.getTime() / 1000),
      iat: (iat || user.passwordSetAt || new Date()).getTime() / 1000
    }
    token[this.usernamePropertyName] = user[this.usernamePropertyName]

    this.modifyJWTSchema(user, token)

    return jwt.sign(
      token,
      env.jwt_secret
    );
  }

  protected abstract modifyJWTSchema(user: any, tokenSchema: JwtTokenSchemaBase): void

  protected makeUserIndexQueryObj(request: Request): any {

    const query: any = {}
    query[this.usernamePropertyName] = request.body.username
    return query
  }

  protected onAuthenticate(user: any, request: Request): Promise<{
    user: any,
    resultPayload?: any
  }> {
    return Promise.resolve({
      user: user })
  }

  authenticate = (req, res) => {
    const grant_type = req.body.grant_type;
    switch (grant_type || "password") {
      case "password":
        console.log("password grant type.");
        const password = req.body.password;
        const modelIndexQuery = this.makeUserIndexQueryObj(req)
        console.log("index query: ", modelIndexQuery)
        this.model.findOne(modelIndexQuery, (err, user: any) => {
          if (err) {
            res.status(500).send(err);
          } else if (user == null) {
            console.log("not such user: " + JSON.stringify(modelIndexQuery));
            res.status(401).json({
              error: C.ERROR_CODE_WRONG_CREDENTIAL
            });
          } else {
            this.bcrypt.compare(
              password,
              user.hashed_password,
              (compareError, match) => {
                if (compareError == null) {
                  if (match === true) {
                    this.onAuthenticate(user, req).then(
                      result => {
                        var delivery = {
                          token: this.generateJWTToken(result.user)
                        }
                        if(result.resultPayload!=null){
                          delivery = merge(delivery, result.resultPayload, false, true)
                        }

                        res.status(200).json(delivery);
                      }
                    ).catch(
                      err => {
                        console.error(JSON.stringify(err))
                        res.status(500).send(err)
                      }
                    )
                  } else {
                    res.status(401).json({
                      error: C.ERROR_CODE_WRONG_CREDENTIAL
                    });
                  }
                } else {
                  console.log(compareError);
                  res.status(500).send(compareError);
                }
              }
            );
          }
        });
        break;
      default: throw new Error("Unsupported grant type: " + grant_type)
    }
  };

  public makeTokenAuthMiddleware(pipe: (user, parsedToken?) => string = () => null): any {
    return require('express-jwt')({
      secret: env.jwt_secret, userProperty: this.decodedPropertyName, isRevoked: (req, payload, done) => {
        this.model.findById(payload.uid, (idFindErr, user) => {
          if (idFindErr) {
            done(idFindErr, true)
            return
          } else if (user) {
            const pipeResult = pipe(user)
            if (pipeResult) {
              done(pipeResult, true)
            } else if (payload.iat < (user["passwordSetAt"] || user["createdAt"]).getTime() / 1000) {
              done("passwordChanged", true)
            } else { done(null, false) }
          } else { done(null, false) }
        })
      }
    })
  }

  verifyToken = (req, res) => {
    res.status(200).send(req[this.decodedPropertyName] != null);
  };

  refreshToken = (req, res) => {
    if (req[this.decodedPropertyName] != null) {
      this.model.findById(req[this.decodedPropertyName].uid).lean().then(
        user => {
          if (user != null) {
            res.status(200).send(this.generateJWTToken(user))
          }else{
            res.status(401).send({
              error: "NoSuchAccount"
            })
          }
        }
      ).catch(err => {
        res.status(500).send({
          error: err
        })
      })
    }else{
      res.status(401).send({
        error: "NoToken"
      })
    }
  }

  protected abstract modifyNewAccountSchema(schema: any, request: any)

  protected onPreRegisterNewUserInstance(user: any, request: Request): Promise<any> { return Promise.resolve(user) }

  protected onAfterRegisterNewUserInstance(user: any, request: Request): Promise<any> { return Promise.resolve(user) }

  protected processRegisterResult(user: any, request: Request): Promise<{user: any, resultPayload?: any}>{
    return Promise.resolve({
      user: user,
    })
  }

  register = (req, res) => {
    const username = req.body[this.usernamePropertyName];
    const password = req.body.password;
    if (username == null || password == null) {
      res.status(401).send({ error: C.ERROR_CODE_WRONG_CREDENTIAL });
    } else {
      this.model.findOne(this.makeUserIndexQueryObj(req))
        .lean()
        .then(user => {
          if (user != null) {
            throw {error:C.ERROR_CODE_USER_ALREADY_EXISTS}
          } else {
            return this.hashPasswordPromise(password).then(
              hashedPassword => {

                const newAccountSchema = {
                  hashed_password: hashedPassword,
                  passwordSetAt: new Date()
                }

                newAccountSchema[this.usernamePropertyName] = username

                this.modifyNewAccountSchema(newAccountSchema, req)

                const newUser = new this.model(newAccountSchema)
                return this.onPreRegisterNewUserInstance(newUser, req)
                  .then(user => {
                    return user.save().then(
                      doc => this.onAfterRegisterNewUserInstance(doc, req)
                    ).then(doc => doc.toJSON())
                  })
              }
            )
          }
        })
        .then(account => this.processRegisterResult(account, req))
        .then(
          result => {
            var delivery = {
              token: this.generateJWTToken(result.user)
            }

            if(result.resultPayload != null){
              delivery = merge(delivery, result.resultPayload, false, true)
            }

            res.status(200).send(delivery);
          }
        ).catch(err => {
          console.log(this.model + " register error:")
          console.error(err)
          res.status(500).send(err)
        })
    }
  }

  private _updateSingleUserAndGetToken(
    query: any,
    update: any
  ): Promise<string> {
    if (Object.keys(query).length > 0 && Object.keys(update).length > 0) {
      return this.model.findOneAndUpdate(query, update, { new: true })
        .lean().then(user => {
          if (user) {
            console.log(user);
            console.log("updated user information. return updated token");
            return this.generateJWTToken(user);
          } else {
            return Promise.reject<string>({
              error: C.ERROR_CODE_ACCOUNT_NOT_EXISTS
            });
          }
        }
        );
    } else {
      return Promise.reject<string>("Empty query or update.");
    }
  }



  update = (req, res) => {
    const query: any = { _id: req[this.decodedPropertyName].uid };
    const update: any = {};

    this.userModifiableFields.forEach(field => {
      if (!isNullOrBlank(req.body[field])) {
        update[field] = req.body[field];
      }
    })

    if (
      !isNullOrBlank(req.body.newPassword) &&
      !isNullOrBlank(req.body.originalPassword)
    ) {
      this.model.findById(req[this.decodedPropertyName].uid).then((user: any) => {
        if (user) {
          this.bcrypt.compare(
            req.body.originalPassword,
            user.hashed_password,
            (compareErr, match) => {
              if (match === true) {
                this.hashPassword(
                  req.body.newPassword,
                  (newPasswordErr, hashedNewPassword) => {
                    if (newPasswordErr) {
                      res.status(500).send(newPasswordErr);
                      return;
                    } else {
                      update.hashed_password = hashedNewPassword;
                      update.passwordSetAt = new Date();
                      for (const change in update) {
                        if (update.hasOwnProperty(change)) {
                          user[change] = update[change];
                        }
                      }
                      (user as Document).save().then(newAccount => {
                        res.status(200)
                          .send({
                            token: this.generateJWTToken(newAccount)
                          });
                      });
                    }
                  }
                );
              }
            }
          );
        }
      });
    } else {
      this._updateSingleUserAndGetToken(query, update)
        .then(token => {
          if (token) {
            res.status(200).send({ token: token });
          } else {
            res.status(500).send("null token");
          }
        })
        .catch(err => {
          res.status(500).send(err);
        });
    }
  };
}
