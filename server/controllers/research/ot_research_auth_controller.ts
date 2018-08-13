import * as jwt from "jsonwebtoken";
import * as uuid from "uuid";
import * as path from "path";
import env from '../../env';
import { ResearcherPrevilages } from '../../../omnitrack/core/research/researcher';
import OTResearcher from "../../models/ot_researcher";
import { isNullOrBlank } from "../../../shared_lib/utils";
import { Document } from "mongoose";
import { IResearcherDbEntity } from "../../../omnitrack/core/research/db-entity-types";
import { resolve } from "../../../node_modules/@types/q";

export class OTResearchAuthCtrl {
  private bcrypt = require("bcryptjs");
  private crypto = require("crypto");

  private hashPassword(password, cb) {
    this.bcrypt.genSalt(10, (err, salt) => {
      if (err == null) {
        this.bcrypt.hash(password, salt, cb);
      } else {
        cb(err, null);
      }
    });
  }

  private hashPasswordPromise(password): Promise<string>{
    return new Promise((resolve, reject)=>{
      this.hashPassword(password, (err, hashedPassword) => {
        if(err){
          reject(err)
        }else{
          resolve(hashedPassword)
        }
      })
    })
  }

  private generateJWTToken(user, iat?: Date): string {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    return jwt.sign(
      {
        uid: user._id,
        email: user.email,
        alias: user.alias,
        approved: user.account_approved,
        previlage: (env.super_users as Array<string> || []).indexOf(user.email) !== -1 ? ResearcherPrevilages.SUPERUSER : ResearcherPrevilages.NORMAL,
        exp: Math.floor(expiry.getTime() / 1000),
        iat: (iat || user.passwordSetAt || new Date()).getTime() / 1000
      },
      env.jwt_secret
    );
  }

  _registerResearcher(email: string, password: string, alias: string): Promise<IResearcherDbEntity>
  {
    return OTResearcher.where("email", email)
    .findOne()
    .catch(err => {
      console.log(err);
    })
    .then(user => {
      if (user != null) {
        console.log("a researcher already exists.");
        return user
      } else {
        return this.hashPasswordPromise(password).then(
          hashedPassword => {
            const researcherId = uuid.v1();
          console.log(
            "generate example experiments with researcher id: " +
            researcherId
          );
          const newResearcher = new OTResearcher({
            _id: researcherId,
            email: email,
            hashed_password: hashedPassword,
            passwordSetAt: new Date(),
            alias: alias,
            account_approved: env.super_users.indexOf(email) !== -1 ? true : null
          });
          return newResearcher
            .save()
            .then(doc =>
              doc.toJSON())
          }
        )
      }
    });
  }

  registerResearcher = (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const alias = req.body.alias;

    if (email == null || password == null || alias == null) {
      res.status(401).send({ error: "One or more entries are null." });
    } else {
      this._registerResearcher(email, password, alias).then(
        researcher => {
          res.status(200).send({
            token: this.generateJWTToken(researcher)
          });
        }
      )
    }
  };

  authenticate = (req, res) => {
    const grant_type = req.body.grant_type;
    switch (grant_type || "password") {
      case "password":
        console.log("password grant type.");
        const email = req.body.username;
        const password = req.body.password;
        OTResearcher.findOne({ email: email }, (err, user: any) => {
          if (err) {
            res.status(500).send(err);
          } else if (user == null) {
            console.log("not such user of email: " + email);
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
      case "token":
        const researcher = req.researcher;
        break;
    }
  };

  verifyToken = (req, res) => {
    res.status(200).send(req.researcher != null);
  };

  private _updateSingleUserAndGetToken(
    query: any,
    update: any
  ): Promise<string> {
    if (Object.keys(query).length > 0 && Object.keys(update).length > 0) {
      return OTResearcher.findOneAndUpdate(query, update, { new: true }).then(
        (researcher: any) => {
          if (researcher) {
            console.log(researcher);
            console.log("updated researcher information. return updated token");
            return this.generateJWTToken(researcher);
          } else {
            return Promise.reject<string>("No such researcher");
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

    if (!isNullOrBlank(req.body.alias)) {
      update.alias = req.body.alias;
    }

    if (
      !isNullOrBlank(req.body.newPassword) &&
      !isNullOrBlank(req.body.originalPassword)
    ) {
      OTResearcher.findById(req.researcher.uid).then((researcher: any) => {
        if (researcher) {
          console.log("found researcher with uid")
          this.bcrypt.compare(
            req.body.originalPassword,
            researcher.hashed_password,
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
                          researcher[change] = update[change];
                        }
                      }
                      (researcher as Document).save().then(newResearcher => {
                        console.log(newResearcher);
                        res
                          .status(200)
                          .send({
                            token: this.generateJWTToken(newResearcher)
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

  /*
    getAccessToken(bearerToken, callback) {
      OTResearcherToken.findOne({ accessToken: bearerToken }, callback)
    };

    saveAccessToken(accessToken, clientId, expires, user, callback) {

      var token = new OTResearcherToken({
        accessToken: accessToken,
        expires: expires,
        clientId: clientId,
        user: user
      });

      token.save(callback);
    };


    getClient(clientId, clientSecret, callback) {
      OTResearcherClient.findOne({
        clientId: clientId,
        clientSecret: clientSecret
      }, callback);
    };

    getUser(username, password, callback) {
      this.authenticate(username, password, callback)
    };

    saveAuthorizationCode(code, client, user, cb){
      console.log("saveAuthorizationCode was invoked.")
      console.log(code)
      console.log(client)
      console.log(user)
    }

    authenticate(email, password, cb) {
      OTResearcher.findOne({ email: email }, (err, user: any) => {
        if (err || !user) return cb(err);
        this.bcrypt.compare(password, user.hashed_password, (err, match) => {
          if (err != null) {
            cb(null, match == true ? user : null)
          }
          else {
            cb(err)
          }
        })
      });
    }*/
}