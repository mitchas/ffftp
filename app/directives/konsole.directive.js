(function () {
  'use strict';

  angular.module('app')
    .directive('konsole', konsoleDirective);

  function konsoleDirective() {
    return {
      restrict: 'E',
      controller: function() {
        console.log('test');
      }
    }
  }
});
