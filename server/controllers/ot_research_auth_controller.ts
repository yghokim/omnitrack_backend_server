import * as jwt from 'jsonwebtoken';
import * as uuid from 'uuid';
import * as path from "path";
import OTResearcher from '../models/ot_researcher';

import OTExperiment from '../models/ot_experiment';
import OTResearcherToken from '../models/ot_researcher_token';
import OTResearcherClient from '../models/ot_researcher_client';
import env from '../env';

export default class OTResearchAuthCtrl {

  private bcrypt = require('bcryptjs');
  private crypto = require('crypto');

  private hashPassword(password, cb) {
    this.bcrypt.genSalt(10, (err, salt) => {
      if (err == null) {
        this.bcrypt.hash(password, salt, cb);
      } else {
        cb(err, null)
      }
    });
  }

  private generateJWTToken(user): string {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7)

    return jwt.sign({
      uid: user._id,
      email: user.email,
      alias: user.alias,
      exp: Math.floor(expiry.getTime() / 1000)
    }, env.jwt_secret);
  }

  private generateExampleExperiments(researcherId, cb) {
    const experiment = new OTExperiment({
      name: "Diary Study On Personal Productivity",
      manager: researcherId
    })

    const trackingPackage = {
      name: "Diaries and Reminders",
      data: require(path.join(__dirname, "../../../../omnitrack/examples/diary_study_template.json"))
    }
    experiment["trackingPackages"].push(trackingPackage)
    experiment["groups"][0].trackingPackageKey = experiment["trackingPackages"][0].key

    experiment.save((err, savedExperiment) => {
      if (err != null) {
        console.log(err)
        cb(err, null)
      } else { cb(null, [savedExperiment]) }
    })
  }

  registerResearcher = (req, res) => {

    console.log("try register researcher.")

    const email = req.body.email
    const password = req.body.password
    const alias = req.body.alias

    if (email == null || password == null || alias == null) {
      res.status(401).send({ error: "One or more entries are null." })
    } else {
      console.log("find researcher with email: " + email)
      OTResearcher.where("email", email).findOne()
        .catch((err) => {
          console.log(err)
        })
        .then(user => {
          if (user != null) {
            console.log("a researcher already exists.")
            res.status(500).send({ error: "User already exists." })
          } else {
            console.log("hash the password.")
            this.hashPassword(password, (err, hashedPassword) => {

              const researcherId = uuid.v1()
              console.log("generate example experiments with researcher id: " + researcherId)
              this.generateExampleExperiments(researcherId, (generationError, experiments) => {
                if (generationError != null) {
                  res.status(500).send(generationError)
                } else {
                  const newResearcher = new OTResearcher({
                    _id: researcherId,
                    email: email,
                    hashed_password: hashedPassword,
                    alias: alias,
                    experiments: experiments.map(exp => exp._id)
                  })
                  newResearcher.save().catch(saveError => {
                      res.status(500).send({ error: saveError })
                    })
                    .then(
                    researcher => {
                      console.log(researcher)
                      res.status(200).send({
                        token: this.generateJWTToken(researcher)
                      })
                    })
                }
              })
            })
          }
        })
    }
  }


  authenticate = (req, res) => {
    const grant_type = req.body.grant_type
    switch (grant_type || 'password') {
      case 'password':
        console.log("password grant type.")
        const email = req.body.username
        const password = req.body.password
        OTResearcher.findOne({ email: email }, (err, user: any) => {
          if (err) { res.status(500).send(err); } else if (user == null) {
            console.log("not such user of email: " + email)
            res.status(401).json(
              {
                error: "CredentialWrong"
              }
            )
          } else {
            this.bcrypt.compare(password, user.hashed_password, (compareError, match) => {
              if (compareError == null) {
                if (match === true) {
                  res.status(200).json(
                    {
                      token: this.generateJWTToken(user)
                    }
                  )
                } else {
                  res.status(401).json(
                    {
                      error: "CredentialWrong"
                    }
                  )
                }
              } else {
                console.log(compareError)
                res.status(500).send(compareError);
              }
            })
          }
        })
        break;
      case 'token':
        break;
    }
  }

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