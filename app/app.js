(function (angular) {
  'use strict';

  angular.module('app', ['ngRoute', 'ngMaterial', 'ngAnimate', 'ngDraggable'])
    .config(['$routeProvider', ($routeProvider) => {
      $routeProvider
        .when('/', {
          templateUrl: './app/pages/main.html',
          controller: 'homeCtrl'
        })
        .otherwise({redirectTo: '/'});
    }])
    .constant('PROD', false);
})(angular);

