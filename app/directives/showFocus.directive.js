(function () {
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

  /*var inputHost = document.getElementsByName('input[name="ftpHost"]')

  console.log(inputHost)
  inputHost.on('input', () => {

    let inputPassword = document.getElementsByName('input[name="ftp-password"]'),
      inputPrivateKey = document.getElementsByName('input[name="sftp-publicKey"]')
    
    if (inputHost.value[0, 5] == "sftp") {
      inputPassword.style.display = "none"
      inputPrivateKey.style.display = "true"
    } else if (inputHost.value[0, 5] == "ftp") {
      inputPassword.style.display = "true"
      inputPrivateKey.style.display = "none"
    }
  })*/

})();

