(function () {
  'use strict';

  angular.module('app')
    .directive('konsole', ['konsoleService', konsoleDirective]);

  function konsoleDirective() {
    return {
      restrict: 'E',
      templateUrl: './app/templates/directives/konsole.template.html',
      controller: function($scope, konsoleService) {
        $scope.unread = 0;
        $scope.messages = [];

        $scope.openConsole = () => {
          $scope.unread = 0;
          $scope.fullConsole = true;
        };

        konsoleService.subscribe($scope, (event, msg) => {
          $scope.messageClass = msg.color;
          $scope.message = msg.message;
          $scope.messages.push({'color': msg.color, 'message': msg.message});
          $scope.unread++;
        });
      }
    }
  }
})();
