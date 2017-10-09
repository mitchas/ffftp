(function (angular) {
  'use strict';

  angular.module('app')
    .directive('showFocus', showFocusDirective);

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
})(angular);

