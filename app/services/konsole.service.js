(function () {
  'use strict';

  angular.module('app')
    .factory('konsoleService', ['$rootScope', konsoleService]);

  function konsoleService($rootScope) {
    function subscribe(scope, callback) {
      const handler = $rootScope.$on('konsole-new-message-event', callback);
      scope.$on('$destroy', handler);
    }

    function notify(message) {
      $rootScope.$emit('konsole-new-message-event', message);
    }

    function addMessage(colour, message) {
      notify({colour, message});
    }

    return {
      subscribe,
      notify,
      addMessage
    }
  }
})();
