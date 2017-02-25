(function () {
  'use strict';

  angular.module('app')
    .service('ftpService', ftpService);

  function ftpService() {
    return {
      connect: connect
    };

    const JsFtp = require('jsftp'),
      Ftp = require('jsftp-rmr')(JsFtp);
    let ftp;

    ftp.on('error', (data) => {
      consoleService('red', data);
      // $scope.emptyMessage = 'Error connecting.'
      console.error(data);
    });

    ftp.on('lookup', (data) => {
      consoleService('red', `Lookup error: ${data}`);
      // $scope.emptyMessage = 'Error connecting.'
      console.error(`Lookup error: ${data}`);
    });

    function connect({ftpHost, ftpPort, ftpUsername, ftpPassword}) {
      // $scope.showingMenu = false;

      ftp = new Ftp({
        host: ftpHost,
        port: ftpPort,
        user: ftpUsername,
        pass: ftpPassword
      });

      consoleService('white', `Connected to ${ftp.host}`);

      changeDir();
      splitPath();
    }

    function changeDir() {

    }

    function splitPath() {

    }
  }
})();
