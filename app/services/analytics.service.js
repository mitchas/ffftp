(function (angular) {
  'use strict';

  angular.module('app')
    .factory('analyticsService', ['PROD', analyticsService]);

  function analyticsService(PROD) {
    const ua = require('universal-analytics'),
      visitor = ua('UA-88669012-1');

    function track(uri) {
      if (PROD) {
        visitor.pageview(uri).send();
        console.log(`Tracking ${visitor}`);
      }
    }

    return {
      track
    }
  }
})(angular);
