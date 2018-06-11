import * as bodyParser from "body-parser";
import * as dotenv from "dotenv";
import * as express from "express";
import * as morgan from "morgan";
import * as mongoose from "mongoose";
import * as path from "path";
import * as firebaseAdmin from "firebase-admin";
import * as Agenda from "agenda";
import env from "./env";
import { environmentSubject }  from './env';
import * as fs from "fs-extra";
import OmniTrackModule from "./modules/omnitrack.module";
import { AppWrapper } from "./modules/app.interface";
import apiRouter from "./router_api";
import researchRouter from "./router_research";

if (!env) {
  //copy sample file
  fs.copy(
    path.join(__dirname, "../../../credentials/environment.sample.json"),
    path.join(__dirname, "../../../credentials/environment.json")
  ).then(success => {
    if (success === true) {
      initializeDatabase()
    }
  });
}else initializeDatabase()

const app = express();
const appWrapper = new AppWrapper(app);
dotenv.load({ path: ".env" });
app.set("port", env.port || 3000);

app.use("/", express.static(path.join(__dirname, "../public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(morgan("dev"));

initializeFirebase();

function initializeDatabase() {
  (<any>mongoose).Promise = global.Promise;
  if (env.node_env === "test") {
    mongoose.connect(env.mongodb_test_uri);
  } else {
    mongoose.connect(env.mongodb_uri);
  }

  const db = mongoose.connection;

  db.on("error", console.error.bind(console, "connection error:"));
  db.once("open", () => {
    console.log("Connected to MongoDB");

    // Routers===================================
    app.use("/api", apiRouter);
    app.use("/api/research", researchRouter); // research path
    // ==========================================

    app.get("/*", function(req, res) {
      res.sendFile(path.join(__dirname, "../public/index.html"));
    });

    if (!module.parent) {
      const server = app.listen(app.get("port"), () => {
        console.log(
          "OmniTrack API Server listening on port " + app.get("port")
        );
      });

      const io = require("socket.io")(server);
      app.set("io", io);

      app.set("omnitrack", new OmniTrackModule(app));

      environmentSubject.subscribe(
        env => {
          if(env) app.get("omnitrack").bootstrap();
        }
      )
    }
  });
}

function initializeFirebase() {
  try {
    if (firebaseAdmin.apps.length > 0) {
      firebaseAdmin.apps.splice(0, firebaseAdmin.apps.length);
    }

    const firebaseServiceAccount = require(path.join(
      __dirname,
      "../../../credentials/firebase-cert.json"
    ));
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(firebaseServiceAccount)
    });
  } catch (ex) {
    console.log(ex);
  }
}

export { app, initializeFirebase };
export default appWrapper;
