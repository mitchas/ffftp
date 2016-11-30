app.controller('menuCtrl', ['$scope', '$timeout', function($scope, $timeout){


    // Module automatically included (only) in the Renderer process (Electron)
    //noinspection NodeRequireContents
    var remote = require('electron').remote;
    var Menu = remote.Menu;

    var template = [
        {label: 'ffftp',
            submenu: [{
                    label: 'about',
                    accelerator: 'CmdOrCtrl+H',
                    click: function(item, focusedWindow) {
                        window.open('http://ffftp.site')
                    }
                },{
                    label: 'close',
                    accelerator: 'CmdOrCtrl+Q',
                    role: 'close'
                }
            ]
        },{
            label: 'action',
            submenu: [{
                    label: 'connect',
                    accelerator: 'CmdOrCtrl+R',
                    click: function() {
                        alert("Ayee");
                    }
                },{
                    label: 'Full Screen',
                    accelerator: (function() {
                        if (process.platform == 'darwin')
                            return 'Ctrl+Command+F';
                        else
                            return 'F11';
                    })(),
                    click: function(item, focusedWindow) {
                        if (focusedWindow)
                            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
                    }
                }
            ]
        },{
            label: 'view',
            submenu: [{
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click: function(item, focusedWindow) {
                        if (focusedWindow)
                            focusedWindow.reload();
                    }
                },{
                    label: 'Full Screen',
                    accelerator: (function() {
                        if (process.platform == 'darwin')
                            return 'Ctrl+Command+F';
                        else
                            return 'F11';
                    })(),
                    click: function(item, focusedWindow) {
                        if (focusedWindow)
                            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
                    }
                }
                // {
                //     label: 'Toggle Developer Tools',
                //     accelerator: (function() {
                //         if (process.platform == 'darwin')
                //             return 'Alt+Command+I';
                //         else
                //             return 'Ctrl+Shift+I';
                //     })(),
                //     click: function(item, focusedWindow) {
                //         if (focusedWindow)
                //             focusedWindow.toggleDevTools();
                //     }
                // }
            ]
        }
    ];


    var menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

}]);
