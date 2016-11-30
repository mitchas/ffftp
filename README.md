# Electron + AngularJS + Angular Material

_For a TypeScript Version of the Boilerplate see the `typescript` branch_

**Clone and run for a quick way to get started with Electron + AngularJS + AngularMaterial.**

A basic Electron application needs just these files:

- `index.html` - A web page to render.
- `main.js` - Starts the app and creates a browser window to render HTML.
- `package.json` - Points to the app's main file and lists its details and dependencies.

You can learn more about each of these components within the [Quick Start Guide](http://electron.atom.io/docs/latest/tutorial/quick-start).

The Angular App is located in the `scripts/` folder.
This boilerplate includes:

- `AngularJS` - For running the AngularJS App
- `Angular-Material`, `Angular-Aria` and `Angular-Animate` - For a sexy look, for everyone
- `Angular-route` - For a better life

You can learn more about AngularJS on the [AngularJS Website](https://angularjs.org/).

## Requirements

Electron is no longer a dev dependency and is expected to be installed globally:

```bash
npm install -g electron-prebuilt
```

## To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
$ git clone https://github.com/thomas-barthelemy/electron-angular-boilerplate
# Go into the repository
$ cd electron-angular-boilerplate
# Install dependencies and run the app
$ npm install && npm start
```

Learn more about Electron and its API in the [documentation](http://electron.atom.io/docs/latest).

## To build

To fully use this boilerplate you will need grunt (`npm install grunt-cli`),
from there you can use `grunt build` to package your Electron app using Electron Packager
which will:

- Clean any previous build
- Prepare a minimal App in the `/build` folder (configurable in Gruntfile.js)
- Find node_modules dependencies in your `index.html` and add them accordingly to the `build` folder
- Uglify the JS files in the `build` folder
- Package the App using `ASAR` (configurable)
- Create distribution package for all platforms (configurable) in the `dist` folder

#### License [MIT](LICENSE.md)
