# OmniTrack Official Backend Server + Research Platform

## Prerequisites
1. Setup Google Firebase Auth and save certification file to json, rename it to **firebase-cert.json**.

## Installation
1. Install [Node.js](https://nodejs.org) and [MongoDB](https://www.mongodb.com)
2. Install Angular CLI: `npm i -g @angular/cli`
3. From project root folder install all the dependencies: `npm i`

## Run
### Development mode
`npm run dev`: [concurrently](https://github.com/kimmobrunfeldt/concurrently) execute MongoDB, Angular build, TypeScript compiler and Express server.

A window will automatically open at [localhost:4200](http://localhost:4200). Angular and Express files are being watched. Any change automatically creates a new bundle, restart Express server and reload your browser.

### Production mode
`npm run prod`: run the project with a production bundle and AOT compilation listening at [localhost:3000](http://localhost:3000) 

### Author
* [Young-Ho Kim](https://younghokim.net)


## Project Structure
1. **.angular-cli.json**: The project depends on [Angular-CLI](https://github.com/angular/angular-cli). If you add a library which requires you to add external dependencies to another CSS or Javascript files, add them in this file.
1. **server**: contains source codes for backend server. The server is built with [Express.js](http://expressjs.com/) and manages backend database stored in MongoDB through REST API.

   * **models**: contains model schema for MongoDB entities.
   * **router_api.ts**: routing URIs for REST APIs that can be accessed by OmniTrack mobile app users.
   * **router_research.ts**: routing URIs for REST APIs used by the *research platform* client.

1. **client**: contains source codes for client web applications. The client is built with [Angular 5](https://angular.io/).

   * **style.scss**: a global stylesheet
   * **app**: contains main web app codes.
      * **Angular Modules**
         1. **AppModule** (app.module.ts): 
         1. **ResearchModule** (research.module.ts):
         1. **RoutingModule** (routing.module.ts):
         1. **MaterialDesignModule** (material-design.module.ts): 
         
      * **Angular Components**
         1. **Research Platform**
            1. **Authorization and Account Profile**
               * ResearcherLoginComponent (research-login/\*)
               * ResearcherSignupComponent (research-signup/\*)
               * ResearcherAccountSettingsComponent (researcher-account-settings/\*)
               
      * **Angular Services**
         1. **ResearcherAuthService** (services/researcher.auth.service.ts)
         
            Defines researcher authorization and authentication APIs and holds the signed-in researcher's ids and token informations.
         
         1. **ResearchApiService** (services/research-api.service.ts)
        
            Defines researcher-level APIs that can mostly be accessed by signed-in researchers. This service also holds the cached data of API call to enhance performance. the cached data are automatically refreshed by Websocket notifications from server. 
         
         1. **ExperimentService** (services/experiment.service.ts)
            
            Defines experiment-level APIs of the experiment detail pages. This service also holds the cached data of API call to enhance performance. the cached data are automatically refreshed by Websocket notifications from server. *This service is NOT injected by Angular but maintained by ResearcherApiService.*                        
         
         1. **SocketService** (services/socket.service.ts)
         
            Manages connection with server's WebSocket communication. The communication is implemented using [Socket.io](https://socket.io/). In the research platform, the websocket communication is usually used for receiving notification when the server database is changed.
         
         1. **NotificationService** (services/notification.service.ts)
            
            Manages communication between Notification GUIs and notification sender. This service provides API to enqueue the messages to be notified to current researcher. The GUI components such as Snackbar observes the queue and display notification when new message is enqueued.
         
         1. **TrackingDataService** (services/tracking-data.service.ts)
         
            Manages OmniTrack tracking entities of the OmniTrack users.

1. **shared_lib**: contains TypeScript codes that are shared between the server and the client.

1. **omnitrack**:  contains OmniTrack-related codes that are shared between the server and the client.
