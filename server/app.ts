import * as bodyParser from "body-parser";
import * as dotenv from "dotenv";
import * as express from "express";
import * as morgan from "morgan";
import * as mongoose from "mongoose";
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

let firebaseApp = null;

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
  const io = require("socket.io")(server, { origins: "*:*" });

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
    if (err) {
      console.error.bind(console, "connection error:");
    } else {
      console.log("Connected to MongoDB");

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

function initializeFirebase() {
  const CERT_PATH = path.join(
    __dirname,
    "../../../credentials/firebase-cert.json"
  )
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
  }else{
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
