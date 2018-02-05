import * as jwt from "jsonwebtoken";
import * as uuid from "uuid";
import * as path from "path";
import { ResearcherPrevilages } from '../../omnitrack/core/research/researcher';
import OTResearcher from "../models/ot_researcher";

import OTExperiment from "../models/ot_experiment";
import OTResearcherToken from "../models/ot_researcher_token";
import OTResearcherClient from "../models/ot_researcher_client";
import env from "../env";
import app from "../app";
import { isNullOrBlank } from "../../shared_lib/utils";
import { Document } from "mongoose";

export default class OTResearchAuthCtrl {
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

  private generateJWTToken(user, iat?: Date): string {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    return jwt.sign(
      {
        uid: user._id,
        email: user.email,
        alias: user.alias,
        previlage: (env.super_users as Array<string> || []).indexOf(user.email) != -1? ResearcherPrevilages.SUPERUSER : ResearcherPrevilages.NORMAL,
        exp: Math.floor(expiry.getTime() / 1000),
        iat: (iat || user.passwordSetAt || new Date()).getTime() / 1000
      },
      env.jwt_secret
    );
  }

  registerResearcher = (req, res) => {
    console.log("try register researcher.");

    const email = req.body.email;
    const password = req.body.password;
    const alias = req.body.alias;

    if (email == null || password == null || alias == null) {
      res.status(401).send({ error: "One or more entries are null." });
    } else {
      console.log("find researcher with email: " + email);
      OTResearcher.where("email", email)
        .findOne()
        .catch(err => {
          console.log(err);
        })
        .then(user => {
          if (user != null) {
            console.log("a researcher already exists.");
            res.status(500).send({ error: "User already exists." });
          } else {
            console.log("hash the password.");
            this.hashPassword(password, (err, hashedPassword) => {
              const researcherId = uuid.v1();
              console.log(
                "generate example experiments with researcher id: " +
                  researcherId
              );
              app
                .researchModule()
                .generateExampleExperimentToResearcher(
                  "productivity_diary",
                  researcherId
                )
                .then(experimentId => {
                  const newResearcher = new OTResearcher({
                    _id: researcherId,
                    email: email,
                    hashed_password: hashedPassword,
                    passwordSetAt: new Date(),
                    alias: alias
                  });
                  newResearcher
                    .save()
                    .catch(saveError => {
                      console.log(saveError);
                      res.status(500).send({ error: saveError });
                    })
                    .then(researcher => {
                      res.status(200).send({
                        token: this.generateJWTToken(researcher)
                      });
                    });
                });
            });
          }
        });
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
    console.log("query:");
    console.log(query);
    console.log("update:");
    console.log(update);
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

    console.log(req.researcher)
    console.log(req.body)

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
                      for (let change in update) {
                        researcher[change] = update[change];
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
