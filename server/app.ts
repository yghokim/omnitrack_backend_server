import * as bodyParser from "body-parser";
import * as dotenv from "dotenv";
import * as express from "express";
import * as morgan from "morgan";
import * as mongoose from "mongoose";
import * as fs from 'fs-extra';
import * as path from "path";
import * as firebaseAdmin from "firebase-admin";
import env from "./env";
import OmniTrackModule from "./modules/omnitrack.module";
import { AppWrapper } from "./modules/app.interface";
import { ClientApiRouter } from "./router_api";
import { ResearchRouter } from "./router_research";
import { installationWizardCtrl } from "./controllers/ot_installation_wizard_controller";
import { InstallationRouter } from "./router_installation";
import { ShortUrlRouter } from "./router_shorturl";
import { checkFileExistenceAndType } from "./server_utils";
import { SocketConstants } from "../omnitrack/core/research/socket";

mongoose.set("useCreateIndex", true)

let firebaseApp = null;
const CERT_PATH = path.join(
  __dirname,
  "../../../credentials/firebase-cert.json"
)

var isMongodbConnected = false

const app = express();
const appWrapper = new AppWrapper(app);
dotenv.load({ path: ".env" });
app.set("port", 3000);

app.use("/", express.static(path.join(__dirname, "../public")));
app.use(bodyParser.json({ limit: "20mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "5mb" }));

app.use(morgan("dev"));

// Debug =====================
app.get("/debug/logs/production", (req, res) => {
  if (checkFileExistenceAndType("logs/production.log") != null) {
    res.download("logs/production.log");
  } else {
    res.status(200).send("No production log.");
  }
});
// ============================

app.get("/api/version", (req, res) => {
  fs.readJson('./package.json')
    .then(packageObj => {
      res.status(200).send(packageObj.version)
    })
    .catch(err => {
      console.error(err)
      res.status(500).send(err)
    })
})

app.get("/api/server_status", (req, res) => {
  res.status(200).send({
    mongodb_connected: isMongodbConnected
  })
})

initializeFirebase();

const os = require("os");
const netInterfaces = os.networkInterfaces();
let ipv4: string = null;
Object.keys(netInterfaces).forEach(ifgroup => {
  netInterfaces[ifgroup].forEach(iface => {
    if (iface.internal !== false || iface.family !== "IPv4") {
      return;
    }
    ipv4 = iface.address;
  });
});
console.log("current server private ip: ", ipv4);
app.set("privateIP", ipv4);

const exec = require("child_process").exec;
exec("curl ifconfig.co", (err, stdout, stderr) => {
  if (err) {
    console.error(err);
  } else {
    const ip = String(stdout).trim()
    console.log("current server public ip: ", ip);
    app.set("publicIP", ip);
  }
});

if (!module.parent) {
  const server = app.listen(app.get("port"), () => {
    console.log("OmniTrack API Server listening on port " + app.get("port"));
  });
  const io: SocketIO.Server = require("socket.io")(server, { origins: "*:*" });
  app.set("io", io);
}

if (installationWizardCtrl.isInstallationComplete() === true) {
  installServer();
  app.get("/api/installation/status", (_, res) => {
    res.status(200).send(true)
  })
} else {
  console.log(
    "the server installation is not yet finished. Attached the installation routes."
  );
  app.use("/api/installation", new InstallationRouter().router);
}

function installServer() {
  const connectedHandler = err => {
    const socket = app.get("io") as SocketIO.Server
    if (err) {
      isMongodbConnected = false
      if(err.name === "MongoNetworkError"){
        console.log("Cannot connect to MongoDB server. Check whether the MongoDB service is running.")
      }else{
        console.log(err)
      }
      socket.emit(SocketConstants.SERVER_EVENT_BACKEND_DIAGNOSTICS, {mongodb_connected: false})
      console.log( "Retry after 5 seconds...")
      setTimeout(()=>{installServer()}, 5000)
    } else {
      console.log("Connected to MongoDB");
      isMongodbConnected = true
      socket.emit(SocketConstants.SERVER_EVENT_BACKEND_DIAGNOSTICS, {mongodb_connected: true})

      // Routers===================================
      app.use("/api/s", new ShortUrlRouter().router);
      app.use("/api", new ClientApiRouter().router);
      app.use("/api/research", new ResearchRouter(env).router); // research path
      // ==========================================

      const omnitrackModule = new OmniTrackModule(app);
      app.set("omnitrack", omnitrackModule);
      omnitrackModule.bootstrap();
    }
  };

  (<any>mongoose).Promise = global.Promise;
  console.log("Try connect to MongoDB..")
  if (env.node_env === "test") {
    mongoose.connect(
      env.mongodb_test_uri,
      { useNewUrlParser: true },
      connectedHandler
    );
  } else {
    mongoose.connect(
      env.mongodb_uri,
      { useNewUrlParser: true },
      connectedHandler
    );
  }
}

export function getFirebaseProjectId(): string{
  return require(CERT_PATH).project_id
}

function initializeFirebase() {
  if (checkFileExistenceAndType(CERT_PATH) != null) {
    try {
      const firebaseServiceAccount = require(CERT_PATH);

      if (
        firebaseAdmin.apps.find(
          a => a.name === firebaseServiceAccount.project_id
        ) == null
      ) {
        firebaseApp = firebaseAdmin.initializeApp(
          {
            credential: firebaseAdmin.credential.cert(firebaseServiceAccount)
          },
          firebaseServiceAccount.project_id
        );
      } else {
        firebaseApp = firebaseAdmin.app(firebaseServiceAccount.project_id);
      }
    } catch (ex) {
      console.log(ex);
      console.log("could not initialize the Firebase admin.");
      firebaseApp = null;
    }
  } else {
    console.log("Firebase Certificate file does not exist.")
  }
}

function clearFirebaseApp() {
  firebaseApp = null;
}

export {
  app,
  firebaseApp,
  initializeFirebase,
  installServer,
  clearFirebaseApp
};
export default appWrapper;
