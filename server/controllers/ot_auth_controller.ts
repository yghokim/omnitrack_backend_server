import { Model, Document } from "mongoose";
import * as jwt from "jsonwebtoken";
import env from '../env';
import { isNullOrBlank } from "../../shared_lib/utils";

export interface JwtTokenSchemaBase {
  uid: string,
  email: string,
  exp: number,
  iat: number
}

export abstract class OTAuthCtrlBase {
  private bcrypt = require("bcryptjs");

  constructor(private model: Model<any>, private decodedPropertyName: string, private userModifiableFields: Array<string> = []) { }

  private hashPassword(password, cb) {
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
      email: user.email,
      exp: Math.floor(expiry.getTime() / 1000),
      iat: (iat || user.passwordSetAt || new Date()).getTime() / 1000
    }

    this.modifyJWTSchema(user, token)

    return jwt.sign(
      token,
      env.jwt_secret
    );
  }

  protected abstract modifyJWTSchema(user: any, tokenSchema: JwtTokenSchemaBase): void

  protected makeUserIndexQueryObj(requestBody: any): any {
    return {
      email: requestBody.username
    }
  }

  authenticate = (req, res) => {
    const grant_type = req.body.grant_type;
    switch (grant_type || "password") {
      case "password":
        console.log("password grant type.");
        const password = req.body.password;
        const modelIndexQuery = this.makeUserIndexQueryObj(req.body)
        console.log("index query: ", modelIndexQuery)
        this.model.findOne(modelIndexQuery, (err, user: any) => {
          if (err) {
            res.status(500).send(err);
          } else if (user == null) {
            console.log("not such user: " + JSON.stringify(modelIndexQuery));
            res.status(401).json({
              error: "CredentialWrong"
            });
          } else {
            this.bcrypt.compare(
              password,
              user.hashed_password,
              (compareError, match) => {
                if (compareError == null) {
                  if (match === true) {
                    res.status(200).json({
                      token: this.generateJWTToken(user)
                    });
                  } else {
                    res.status(401).json({
                      error: "CredentialWrong"
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
          } else { done(null, true) }
        })
      }
    })
  }

  verifyToken = (req, res) => {
    res.status(200).send(req[this.decodedPropertyName] != null);
  };

  protected abstract modifyNewAccountSchema(schema: any, requestBody: any)

  register = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    if (email == null || password == null) {
      res.status(401).send({ error: "One or more entries are null." });
    } else {
      this.model.findOne(this.makeUserIndexQueryObj(req.body))
        .lean()
        .then(user => {
          if (user != null) {
            throw new Error("UserAlreadyExists")
          } else {
            return this.hashPasswordPromise(password).then(
              hashedPassword => {

                const newAccountSchema = {
                  email: email,
                  hashed_password: hashedPassword,
                  passwordSetAt: new Date()
                }

                this.modifyNewAccountSchema(newAccountSchema, req.body)

                return new this.model(newAccountSchema).save()
                  .then(doc =>
                    doc.toJSON())
              }
            )
          }
        }).then(
          account => {
            res.status(200).send({
              token: this.generateJWTToken(account)
            });
          }
        ).catch(err => {
          res.status(500).send({
            error: err
          })
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
            return Promise.reject<string>("No such user");
          }
        }
        );
    } else {
      return Promise.reject<string>("Empty query or update.");
    }
  }



  update = (req, res) => {
    const query: any = { _id: req.researcher.uid };
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