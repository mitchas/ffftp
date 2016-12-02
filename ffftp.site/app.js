var app = angular.module('app', ['ngRoute']);

app.config(function($routeProvider) {
    $routeProvider

    .when('/', {
        templateUrl : 'pages/home.html',
        controller  : 'homeController'
    })
    .when('/download/', {
        templateUrl : 'pages/download.html',
        controller  : 'downloadController'
    })
    .when('/download/:version', {
        templateUrl : 'pages/download.html',
        controller  : 'downloadController'
    })
    .otherwise({
        redirectTo: "/"
    });

});

app.controller('homeController', function($scope) {

});

app.controller('downloadController', ['$scope', '$route', '$routeParams',
function($scope, $route, $routeParams) {
    $scope.userVersion = $routeParams.version;

    $scope.windowsDownload = 'https://github.com/mitchas/ffftp/tree/master/ffftp.app/releases/windows/'

    $scope.changelog = [
        {
            "version": "0.0.5 beta",
            "date": "12/2/2016",
            "changes": [
                "It's all new, this is the first release."
            ]
        }
    ]

}]);
