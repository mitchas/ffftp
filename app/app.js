(function () {
  'use strict';

  // const dirTree = require('directory-tree'),
  // const JsFtp = require('jsftp'),
    // Ftp = require('jsftp-rmr')(JsFtp);
    // storage = require('electron-json-storage');

  const app = angular.module('app', ['ngRoute', 'ngMaterial', 'ngAnimate', 'ngDraggable']);

  app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: './app/pages/main.html',
        controller: 'homeCtrl'
      })
      .otherwise({redirectTo: '/'});
  }]);

  app.filter('filesize', function () {
    return function (bytes, precision) {
      if (bytes === 0 || isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
      if (typeof precision === undefined) precision = 1;
      const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'],
        number = Math.floor(Math.log(bytes) / Math.log(1024));

      return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) + ' ' + units[number];
    };
  });

  app.directive('showFocus', function ($timeout) {
    return function (scope, element, attrs) {
      scope.$watch(attrs.showFocus,
        function (newValue) {
          $timeout(function () {
            newValue && element.focus();
          });
        }, true);
    };
  });
})();

