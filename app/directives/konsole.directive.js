(function () {
  'use strict';

  angular.module('app')
    .directive('konsole', ['konsoleService', konsoleDirective]);

  function konsoleDirective() {
    return {
      restrict: 'E',
      templateUrl: './app/templates/directives/konsole.template.html',
      controllerAs: 'konsole',
      bindToController: true,
      controller: function($scope, konsoleService) {
        let konsole = this;

        konsole.unread = 0;
        konsole.messages = [];

        konsole.openConsole = () => {
          konsole.unread = 0;
          konsole.fullConsole = true;
        };

        konsoleService.subscribe($scope, (event, msg) => {
          konsole.messageClass = msg.color;
          konsole.message = msg.message;
          konsole.messages.push({'color': msg.color, 'message': msg.message});
          konsole.unread++;
        });
      }
    }
  }
})();
