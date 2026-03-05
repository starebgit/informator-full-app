# Informator

Informator is a web application intended to help with the daily shopfloor process. It provides valuable information on production realization, OEE indicators, personel presence, quality control and toolshop overview. It is connected to external services using REST apis.

## How to run
To run the application we follow next steps:
1. Ensure that the database is up and running and all the other apis are started (informatorAPI, sinaproAPI, spicaAPI).
2. Run `npm ci` to install required modules.
3. Run `npm start` to run the application localy.

### Database setup
This is done using the *informatorAPI*(link) migrations and seeding functions.

### Enviromental variables
Application requires enviromental variables to run, these are the following:
```
REACT_APP_EASE='172.20.1.40:3020'
REACT_APP_INFORMATOR='172.20.1.40:3030'
REACT_APP_SINAPRO='172.20.1.40:3040'
REACT_APP_SPICA='172.20.1.40:3050'
REACT_APP_DRAWINGS='172.20.1.40:3060'
REACT_APP_EORODJARNA='172.20.1.40:3070'
REACT_APP_DREAMREPORT='172.20.1.40:3080'
REACT_APP_QUALITY='172.20.1.40:3090'
REACT_APP_MODE='local'
```
## Project structure
The project is structured in the following way:
```
src/
├─ assets/        (static assets such as images, pdfs)
├─ components/    (individual components of the UI)
├─ containers/    (containers for route path)
├─ context/       (react context)
├─ data/          (queries, data helpers, etc.)
├─ feathers/      (feathers config)
├─ i18n/          (i18n config)
├─ routes/        (custom routes)
├─ services/      (configs)
├─ theme/         (styling)
├─ utils/         (utils for data wrangling)
├─ workers/       (web workers)
```

## Deployment
App is deployed to production using Github Actions and a local runner. Deploy is triggered with a PR from `development` branch to `production` branch.
Upon deploy, the app is built and then moved to a appropriate directory on the server.

### Enviroment
Local Ubuntu server 20.04 with:
- MySQL DB
- [PM2](https://pm2.keymetrics.io/docs/usage/quick-start/) (process management)
- nginx (reverse proxy)

There is a configuration file for production enviroment on home path called `production.config.js`.
This is used to define all the application paths, env variables and other settings for PM2.
To check if the processes are running we can use `pm2 ls` command. For more advanced uses take a look at PM2 documentation.