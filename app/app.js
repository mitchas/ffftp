(function () {
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
    .filter('filesize', filesizeFilter)
    .directive('showFocus', showFocusDirective);

  function filesizeFilter() {
    return (bytes, precision) => {
      if (bytes === 0 || isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
      if (typeof precision === undefined) precision = 1;
      const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'],
        number = Math.floor(Math.log(bytes) / Math.log(1024));

      return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) + ' ' + units[number];
    };
  }

  function showFocusDirective($timeout) {
    return (scope, element, attrs) => {
      scope.$watch(attrs.showFocus,
        (newValue) => {
          $timeout(() => {
            newValue && element.focus();
          });
        }, true);
    };
  }
})();

