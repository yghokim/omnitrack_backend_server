import { installServer } from "./app";
import { RouterWrapper } from "./server_utils";
import { installationWizardCtrl } from "./controllers/ot_installation_wizard_controller";

export class InstallationRouter extends RouterWrapper {
  private getSummarizedFlags(): any {
    return {
      flags: {
        firebase_cert: installationWizardCtrl.isFirebaseSet(),
        super_users: installationWizardCtrl.isSuperUserSet(),
        jwt_secret: installationWizardCtrl.isJwtSecretSet()
      },
      completable: installationWizardCtrl.isCriticalConditionMet()
    };
  }

  constructor() {
    super();

    const assertInstallableStatusMiddleware = (req: Request, res, next) => {
      if (installationWizardCtrl.isInstallationComplete() === true) {
        res.status(500).send({
          error: "AlreadyInstalled",
          message:
            "You cannot use the installation API because the server installation was already complete."
        });
      } else {
        next();
      }
    };

    this.router.get("/status", (_, res) => {
      res.status(200).send(installationWizardCtrl.isInstallationComplete());
    });

    this.router.get(
      "/status/each",
      assertInstallableStatusMiddleware,
      (_, res) => {
        res.status(200).send(this.getSummarizedFlags());
      }
    );

    this.router.get(
      "/status/firebase_cert",
      assertInstallableStatusMiddleware,
      (req, res) => {
        res.status(200).send(installationWizardCtrl.isFirebaseSet());
      }
    );

    this.router.get(
      "/status/jwt_secret",
      assertInstallableStatusMiddleware,
      (req, res) => {
        res.status(200).send(installationWizardCtrl.isJwtSecretSet());
      }
    );

    this.router.get(
      "/status/super_users",
      assertInstallableStatusMiddleware,
      (req, res) => {
        res.status(200).send(installationWizardCtrl.isSuperUserSet());
      }
    );

    this.router.post(
      "/set/firebase_cert",
      assertInstallableStatusMiddleware,
      (req, res) => {
        try {
          installationWizardCtrl
            .setFirebaseCert(req.body.value)
            .then(success => {
              res.status(200).send({
                success: success,
                completable: installationWizardCtrl.isCriticalConditionMet()
              });
            })
            .catch(err => {
              res.status(500).send(err);
            });
        } catch (ex) {
          console.error(ex);
          res.status(500).send(ex);
        }
      }
    );

    this.router.post(
      "/set/super_users",
      assertInstallableStatusMiddleware,
      (req, res) => {
        try {
          installationWizardCtrl
            .setValue(req.body.value, "super_users")
            .then(changed => {
              res.status(200).send({
                success: true,
                changed: changed,
                completable: installationWizardCtrl.isCriticalConditionMet()
              });
            })
            .catch(ex => {
              console.error(ex);
              res.status(500).send(ex);
            });
        } catch (ex) {
          console.error(ex);
          res.status(500).send(ex);
        }
      }
    );

    this.router.post(
      "/set/jwt_secret",
      assertInstallableStatusMiddleware,
      (req, res) => {
        try {
          installationWizardCtrl
            .setValue(req.body.value, "jwt_secret")
            .then(changed => {
              res.status(200).send({
                success: true,
                changed: changed,
                completable: installationWizardCtrl.isCriticalConditionMet()
              });
            })
            .catch(ex => {
              console.error(ex);
              res.status(500).send(ex);
            });
        } catch (ex) {
          console.error(ex);
          res.status(500).send(ex);
        }
      }
    );

    this.router.post(
      "/set/complete_installation",
      assertInstallableStatusMiddleware,
      (req, res) => {
        try {
          installationWizardCtrl
            .setInstallationMode(!req.body.value)
            .then(success => {
              if (success === true) {
                if (req.body.value === true) {
                  // installation mode on.
                  installServer();
                }
                res.status(200).send(true);
              } else {
                res.status(500).send("failed");
              }
            })
            .catch(err => {
              console.error(err);
              res.status(500).send(err);
            });
        } catch (ex) {
          console.error(ex);
          res.status(500).send(ex);
        }
      }
    );

    this.router.post("/reset", assertInstallableStatusMiddleware, (_, res) => {
      installationWizardCtrl
        .resetAll()
        .then(success => {
          if (success === true) {
            res.status(200).send(this.getSummarizedFlags());
          } else {
            res.status(500).send("fail");
          }
        })
        .catch(err => {
          res.status(500).send(err);
        });
    });
  }
}
