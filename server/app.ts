import * as bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import * as express from 'express';
import * as morgan from 'morgan';
import * as mongoose from 'mongoose';
import * as path from 'path';
import * as firebaseAdmin from 'firebase-admin';
import * as Agenda from 'agenda';
import OmniTrackModule from './modules/omnitrack.module';
import { AppWrapper } from './modules/app.interface';

import setRoutes from './routes';

const app = express();
const appWrapper = new AppWrapper(app)
dotenv.load({ path: '.env' });
app.set('port', (process.env.PORT || 3000));

app.use('/', express.static(path.join(__dirname, '../public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(morgan('dev'));

if (process.env.NODE_ENV === 'test') {
  mongoose.connect(process.env.MONGODB_TEST_URI);
} else {
  mongoose.connect(process.env.MONGODB_URI);
}

const firebaseServiceAccount = require(path.resolve(__dirname, "../../../credentials/firebase-cert.json"));
firebaseAdmin.initializeApp({credential: firebaseAdmin.credential.cert(firebaseServiceAccount)})

const db = mongoose.connection;
(<any>mongoose).Promise = global.Promise;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');

  app.set("omnitrack", new OmniTrackModule(app))
  app.get("omnitrack").bootstrap()

  setRoutes(app);

  app.get('/*', function(req, res) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

  if (!module.parent) {
    app.listen(app.get('port'), () => {
      console.log('Angular Full Stack listening on port ' + app.get('port'));
    });
  }
});

export { app }
export default appWrapper
