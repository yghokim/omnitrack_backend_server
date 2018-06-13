import * as bodyParser from "body-parser";
import * as dotenv from "dotenv";
import * as express from "express";
import * as morgan from "morgan";
import * as mongoose from "mongoose";
import * as path from "path";
import * as firebaseAdmin from "firebase-admin";
import env from "./env";
import { environmentPath } from './env';
import * as fs from "fs-extra";
import OmniTrackModule from "./modules/omnitrack.module";
import { AppWrapper } from "./modules/app.interface";
import { ClientApiRouter } from "./router_api";
import { ResearchRouter } from "./router_research";
import { installationWizardCtrl } from './controllers/ot_installation_wizard_controller';
import { InstallationRouter } from "./router_installation";

if (fs.pathExistsSync(environmentPath) !== true) {
  //copy sample file
  try {
    fs.copySync(
      path.join(__dirname, "../../../credentials/environment.sample.json"),
      environmentPath
    )
  } catch (err) {
    console.log(err)
    console.log("check for the environment.sample.json file existing.")
  }
}

var firebaseApp = null

const app = express();
const appWrapper = new AppWrapper(app);
dotenv.load({ path: ".env" });
app.set("port", env.port || 3000);

app.use("/", express.static(path.join(__dirname, "../public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(morgan("dev"));

initializeFirebase();


if (!module.parent) {
  const server = app.listen(app.get("port"), () => {
    console.log(
      "OmniTrack API Server listening on port " + app.get("port")
    );
  });

  const io = require("socket.io")(server);
  app.set("io", io);
}

if (installationWizardCtrl.isInstallationComplete() === true) {
  installServer()
} else {
  console.log("the server installation is not yet finished. Attached the installation routes.")
  app.use("/api/installation", new InstallationRouter().router);
}

function installServer() {
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
    app.use("/api", new ClientApiRouter().router);
    app.use("/api/research", new ResearchRouter(env).router); // research path
    // ==========================================
    app.set("omnitrack", new OmniTrackModule(app));
  });
}

function initializeFirebase() {
  try {
    const firebaseServiceAccount = require(path.join(
      __dirname,
      "../../../credentials/firebase-cert.json"
    ));

    if (firebaseAdmin.apps.find(app => app.name === firebaseServiceAccount.project_id) == null) {
      firebaseApp = firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(firebaseServiceAccount)
      }, firebaseServiceAccount.project_id);
    }else firebaseApp = firebaseAdmin.app(firebaseServiceAccount.project_id)

  } catch (ex) {
    console.log(ex)
    console.log("could not initialize the Firebase admin.")
    firebaseApp = null
  }
}

function clearFirebaseApp(){
  firebaseApp = null
}

export { app, firebaseApp, initializeFirebase, installServer, clearFirebaseApp };
export default appWrapper;
