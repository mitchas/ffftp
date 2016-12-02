app.controller('homeCtrl', ['$scope', '$timeout', '$filter', '$interval', function($scope, $timeout, $filter, $interval){

    // Initialize Variables
    $scope.fs = require('fs');

    // $scope.remote = require('electron').remote;
    // $scope.dialog = remote.require('dialog');
    var remote = require('electron').remote;
    var dialog = require('electron').dialog;

    $scope.path = ".";
    $scope.emptyMessage = "Loading...";
    $scope.fullConsole = false;
    $scope.showingMenu = true;
    $scope.consoleMessage = "Click to expand console.";

    $scope.editingFavorites = false;

    $scope.fileSelected = false;


    //
    // Connecting to ftp
    //
    $scope.saveFavorite = false;




    // Load Favorites
    $scope.favorites = [];
    storage.has('favorites', function(error, hasKey) {
        if (error) throw error;
        if (hasKey) {
            storage.get('favorites', function(error, data) {
                if (error) throw error;
                $timeout(function() {
                    $scope.favorites = data;
                    console.log("FAVORITES");
                    console.log(data);
                }, 0);

            });
        }else{
            console.log("No favs");
        }
    });

    // On favorite click
    $scope.loadFavorite = function(index){
        $scope.ftpHost = $scope.favorites[index].host;
        $scope.ftpPort = $scope.favorites[index].port;
        $scope.ftpUsername = $scope.favorites[index].user;
        $scope.ftpPassword = $scope.favorites[index].pass;
        $scope.favoriteName = $scope.favorites[index].name;
        $scope.connect();
    }
    $scope.deleteFavorite = function(index){
        $scope.favorites.splice(index, 1);
        $scope.saveFavoritesToStorage();
    }




    //
    // Connect to ftp
    //
    $scope.connect = function(){
        $scope.showingMenu = false;

        if($scope.saveFavorite){
            $scope.newFavorite = {
                name: $scope.favoriteName,
                host: $scope.ftpHost,
                port: $scope.ftpPort,
                user: $scope.ftpUsername,
                pass: $scope.ftpPassword
            }
            $scope.favorites.push($scope.newFavorite);
            $scope.saveFavoritesToStorage();
        }

        $scope.saveFavorite = false;


        // Connect
        $scope.ftp = new JSFtp({
            host: $scope.ftpHost,
            port: $scope.ftpPort,
            user: $scope.ftpUsername,
            pass: $scope.ftpPassword
        });
        $scope.console("white", "Connected to " + $scope.ftpHost);

        // Start Scripts
        $scope.changeDir();
        $scope.splitPath();
    }

    $scope.saveFavoritesToStorage = function(){
        storage.set('favorites', $scope.favorites, function(error) {
            if (error) throw error;
        });
    }
    $scope.deleteFavs = function(){
        storage.clear(function(error) {
            if (error) throw error;
        });
    }




    //
    // Change directory
    //
    $scope.changeDir = function(){
        $scope.searchFiles = "";
        if($scope.showCancelOperation){
            return;
        }else{
            $scope.fileSelected = false;
            $scope.ftp.ls($scope.path, function(err, res) {
                $timeout(function() {
                    $scope.files = res;
                    $scope.splitPath();
                    $scope.emptyMessage = "There's nothin' here";
                    if($scope.path != '.'){
                        $scope.console("white", "Navigated to " + $scope.path);
                    }
                }, 0);
            });
        }
    }



    //
    // Go into a directory (double click folder);
    //
    $scope.intoDir = function(dir){
        if($scope.selectedFileType == 0){ // If file, do nothing but select
            return;
        }else{
            $scope.emptyMessage = "Loading...";
            $scope.path = $scope.path + "/" + dir;
            $scope.changeDir();
        }
    }

    // Go up a directory - button on nav
    $scope.upDir = function(){
        $scope.path = $scope.path.substring(0, $scope.path.lastIndexOf("/"));
        $scope.changeDir();
    }


    //
    // Click a breadcrumb to go up multiple directories
    //
    $scope.breadCrumb = function(index){
        $scope.path = ".";
        for (var i = 1; i <= index; i++) {
            $scope.path = $scope.path + "/" + $scope.pathArray[i];
        }
        console.log($scope.path);
        $scope.changeDir();
    }

    //
    // Split paths for use in breadcrumbs
    //
    $scope.splitPath = function(){
        $scope.pathArray = new Array();
        $scope.pathArray = $scope.path.split("/");
    }


    //
    // Select a file to modify
    //
    $scope.selectTimer = function(){
        $scope.fileToFile = true;
        $timeout(function() {
            $scope.fileToFile = false;
        }, 200);
    }
    $scope.selectFile = function(name, filetype){
        $scope.fileSelected = true;
        $scope.selectedFileName = name;
        $scope.selectedFileType = filetype;
        $scope.selectedFilePath = $scope.path + "/" + name;
        console.log($scope.selectedFileName);
    }
    $scope.clearSelected = function(){
        $timeout(function() {
            if(!$scope.fileToFile){
                $scope.fileSelected = false;
            }
        }, 200);
    }


    //
    // Create a new folder
    //
    $scope.showingNewFolder = false;
    $scope.newFolder = function(){
        $scope.showingNewFolder = false;
        $scope.ftp.raw('mkd', $scope.path + "/" + $scope.newFolderName, function(err, data) {
            $scope.changeDir();
            $scope.newFolderName = "";
            if(err){$scope.console("red", err)}
            else{$scope.console("white", data.text)}
        });
    }


    //
    // Delete a file or folder depending on file type
    //
    $scope.deleteFile = function(){
        console.log("TYPE: " + $scope.selectedFileType);
        console.log("NAME: " + $scope.selectedFileName);
        console.log("PATH: " + $scope.path);
        $scope.showingConfirmDelete = false;
        console.log("DELETING " + $scope.path + "/" + $scope.selectedFileName);
        if($scope.selectedFileType == 0){ // 0 is file
            $scope.ftp.raw('dele', $scope.path + "/" + $scope.selectedFileName, function(err, data) {
                if(err){return $scope.console("red", err);}
                $scope.changeDir();
                $scope.console("green", data.text);
            });
        }else if($scope.selectedFileType == 1){ // Everything else is folder
            $scope.ftp.rmr($scope.path + "/" + $scope.selectedFileName, function (err) {
                $scope.ftp.raw('rmd', $scope.path + "/" + $scope.selectedFileName, function(err, data) {
                    if(err){return $scope.console("red", err);}
                    $scope.changeDir();
                    $scope.console("green", data.text);
                });
            });
        }
    }


    //
    // Rename a file or folder
    //
    $scope.renameFile = function(){
        if(!$scope.showingRename){
            $scope.fileRenameInput = $scope.selectedFileName;
            $scope.showingRename = true;
        }else{
            $scope.ftp.rename($scope.path + "/" + $scope.selectedFileName, $scope.path + "/" + $scope.fileRenameInput, function(err, res) {
                if (!err){
                    $scope.showingRename = false;
                    $scope.console("green", "Renamed " + $scope.selectedFileName + " to " + $scope.fileRenameInput);
                    $scope.changeDir();
                }else{
                    $scope.console("red", err);
                }
            });
        }
    }


    //
    // Download a file
    //
    $scope.chooseDownloadDirectory = function(){
        document.getElementById('chooseDownloadDirectory').click()
    }
    $scope.saveDownloadPath = function(){
        $scope.downloadPath = document.getElementById('chooseDownloadDirectory').files[0].path;
        $scope.downloadFiles();
    }
    $scope.downloadFiles = function(){
        if($scope.selectedFileType == 0){ // If file, download right away
            $scope.saveFileToDisk($scope.selectedFilePath, $scope.selectedFileName);
        }else if($scope.selectedFileType == 1){ // if folder, index folders and files
            $scope.fs.mkdir("C:\\Users\\samue\\Desktop\\ftptest\\" + $scope.selectedFileName);
            $scope.foldersToCreate = [];
            $scope.filesToDownload = [];
            $scope.getDownloadTree($scope.selectedFilePath);
            $scope.downloadTime = 0;
            $scope.showCancelOperation = true;
            $scope.downloadInterval = $interval(function () {$scope.downloadTime++;}, 1000); // Download Timer
            $scope.gettingDownloadReady = true;
            $scope.watchDownloadProcess();
        }else{ // else unknown file type
            $scope.console("red", "Unable to download file " + $scope.selectedFileName + ". Unknown file type.")
        }
    }

    // Checks every 400ms if download tree is still processing
    $scope.watchDownloadProcess = function(){
        $timeout(function() {
            if($scope.gettingDownloadReady){$scope.watchDownloadProcess;}
            else{$scope.processFiles();}
        }, 400);
    }

    // Get download tree loops through all folders and files, and adds them to arrays.
    // Current directory folders are added to the tempfolders array
    $scope.getDownloadTree = function(path){
        $scope.tempFolders = [];
        $scope.tempPath = path;
        $scope.gettingDownloadReady = true; // Reset because still working

        $scope.ftp.ls(path, function(err, res) {
            console.log(res);
            for (var i = 0, item; item = res[i]; i++) {
                if(item.type==1){ // if folder, push to full array and temp
                    $scope.foldersToCreate.push({"path": path, "name": item.name});
                    $scope.tempFolders.push({"path": path, "name": item.name});
                }else if(item.type==0){ // if file, push to file array
                    $scope.filesToDownload.push({"path": path, "name": item.name});
                }
            }
            $scope.gettingDownloadReady = false;
            for (var x = 0, folder; folder = $scope.tempFolders[x]; x++) { // for each folder, getDownloadTree again and index those. Same process
                console.log("FOLDER PATH: " + folder.path);
                $scope.getDownloadTree(folder.path + "/" + folder.name);
            }
        });
    }

    // Once getDownloadTree is finished, this is called
    $scope.processFiles = function(){
        for (var i = 0, folder; folder = $scope.foldersToCreate[i]; i++) { // Create all empty folders
            var stringWithoutSlash = folder.path.substring(folder.path.indexOf("/") + 1) + "/" + folder.name;
            $scope.fs.mkdir("C:\\Users\\samue\\Desktop\\ftptest\\" + stringWithoutSlash);
        }
        // Then begin downloading files individually
        $scope.downloadFileZero = 0;
        $scope.saveAllFilesToDisk();
    }

    $scope.saveAllFilesToDisk = function(){
        if($scope.filesToDownload[$scope.downloadFileZero]){
            var filepath = $scope.filesToDownload[$scope.downloadFileZero].path;
            var filename = $scope.filesToDownload[$scope.downloadFileZero].name;
            var absoluteFilePath = filepath.substring(filepath.indexOf("/") + 1) + "/" + filename;

            var from = filepath + "/" + filename;
            var to = $scope.downloadPath + "\\" + absoluteFilePath.replace(/\//g, "\\");

            $scope.ftp.get(from, to, function(hadErr) {
                if (hadErr){
                    $scope.console("red", "Error downloading " + filename + "... " + hadErr);
                }else{
                    $scope.console("white", "Downloaded " + filename + " to " + to);
                }
                $scope.downloadFileZero++;
                $scope.changeDir();
                $scope.saveAllFilesToDisk(); // do it again until all files are downloaded
            });

        }else{ // once finished
            $timeout(function() {
                $scope.changeDir();
                $interval.cancel($scope.downloadInterval);
                $scope.showCancelOperation = false;
                $scope.console("blue", "Successfully downloaded " + $scope.foldersToCreate.length + " folders and " + $scope.filesToDownload.length + " files in " + $scope.downloadTime + " seconds.");
            }, 200);
        }
    }


    // Download file if single file - not folder
    $scope.saveFileToDisk = function(filepath, filename){
        var from = filepath;
        var to = $scope.downloadPath + "\\" + filename;
        console.log("DOWNLOADING: " + from + " TO: " + to);
        $scope.ftp.get(from, to, function(hadErr) {
            if (hadErr){
                $scope.console("red", "Error downloading " + filename);
            }else{
                $scope.console("green", "Successfully downloaded " + filename);
            }
        });
    }




    //
    // File Uploading
    //
    document.ondragover = document.ondrop = (ev) => {
        ev.preventDefault()
    }
    document.body.ondrop = (ev) => {
        $scope.dragged = ev.dataTransfer.files;

        if($scope.dragged[1]){
            $scope.console("white", "Getting file tree...")
            $scope.folderTree = [];
            $scope.baseUploadPath = $scope.path;

            $scope.foldersArray = [];
            $scope.filesArray = [];

            $scope.uploadTime = 0;
            $scope.uploadInterval = $interval(function () {$scope.uploadTime++;}, 1000);
            $scope.showCancelOperation = true;


            for (var i = 0, f; f = $scope.dragged[i]; i++) {
                $scope.folderTree.push(dirTree($scope.dragged[i].path));
            }

            $scope.baselocalpath = $scope.dragged[0].path.substring(0, $scope.dragged[0].path.lastIndexOf('\\'));

            $scope.gatherFiles($scope.folderTree);
            $timeout(function() {
                $scope.uploadEverything();
            }, 1000);
        }


        ev.preventDefault();
    }

    $scope.gatherFiles = function(tree){
        if(!tree.length){
            console.log("No folders")
        }
        $scope.nestedTree = [];
        for (var i = 0, f; f = tree[i]; i++) {
            if(tree[i].extension){ // if file
                $scope.filesArray.push({"name": tree[i].name, "path": tree[i].path});
            }else{ // if folder
                $scope.foldersArray.push({"name": tree[i].name, "path": tree[i].path});
                if(tree[i].children.length){
                    console.log("HAS CHILDREN: " + tree[i].name)
                    for (var x = 0, y; y = tree[i].children[x]; x++) {
                        $scope.nestedTree.push(dirTree(y.path));
                    }
                    $scope.gatherFiles($scope.nestedTree);
                }
            }
        }
    }

    $scope.uploadEverything = function(){
        console.log($scope.foldersArray);
        console.log($scope.filesArray);
        $scope.console("white", "Uploading " + $scope.foldersArray.length + " folders and " + $scope.filesArray.length + " files...");
        $scope.filezero = 0;
        $scope.folderzero = 0;
        $scope.mkDirs();
    }
    $scope.mkDirs = function(){
        if($scope.foldersArray[$scope.folderzero]){
            var localpath = $scope.foldersArray[$scope.folderzero].path;
            var uploadpath = $scope.baseUploadPath;

            $scope.dirToCreate = uploadpath +  localpath.replace($scope.baselocalpath, "").replace(/\\/g,"/");
            $scope.console("white", "Creating folder " + $scope.dirToCreate + "...")

            $scope.ftp.raw('mkd', $scope.dirToCreate, function(err, data) {
                // $scope.changeDir();
                if(err){$scope.console(err);}
                else{$scope.console(data.text);}
                $scope.folderzero++;
                $scope.mkDirs();
            });

        }else{
            $timeout(function() {
                $scope.changeDir();
                $scope.upFiles();
            }, 200);
        }
    }
    $scope.upFiles = function(){
        if($scope.filesArray[$scope.filezero]){
            var localpath = $scope.filesArray[$scope.filezero].path;
            var uploadpath = $scope.baseUploadPath;
            $scope.fileToUpload = uploadpath +  localpath.replace($scope.baselocalpath, "").replace(/\\/g,"/");
            $scope.console("white", "Uploading " + $scope.fileToUpload + "...");

            $scope.ftp.put(localpath, $scope.fileToUpload, function(hadError) {
                if (!hadError){
                    $scope.console("white", "Successfully uploaded " + localpath + " to " + $scope.fileToUpload);
                }else{
                    $scope.console("red", "Error Uploading " + $scope.fileToUpload);
                }
                $scope.filezero++;
                $scope.changeDir();
                $scope.upFiles();
            });
        }else{
            $timeout(function() {
                $interval.cancel($scope.uploadInterval);
                $scope.showCancelOperation = false;
                $scope.changeDir();
                $scope.console("blue", "File transfer completed in " + $scope.uploadTime + " seconds.");
            }, 200);
        }
    }






    //
    // Console controls
    //
    $scope.consoleMessages = [];
    $scope.consoleUnread = 0;
    $scope.console = function(color, msg){
        $timeout(function() {
            $scope.consoleMessageClass = color;
            $scope.consoleMessage = msg;
            $scope.consoleMessages.push({"color":color, "message":msg});
            $scope.consoleUnread++;
        }, 0);
    }
    $scope.openConsole = function(){
        $scope.consoleUnread = 0;
        $scope.fullConsole = true
    }


    //
    // Cancel Operations
    //
    // $scope.cancelFTPOperation = function(){
    //     $scope.ftp.raw('abor', function() {
    //         $scope.console("red", "Process aborted.")
    //     });
    // }






    //
    // Keyboard Shortcuts
    //
    window.document.onkeydown = function (e){
        if (!e) e = event;
        if (e.keyCode == 27){ // esc
            $timeout(function() {
                console.log("esc pressed");
                if(!$scope.showingRename && !$scope.showingNewFolder && !$scope.showingMenu){$scope.fullConsole = false;}
                $scope.showingRename = false;
                $scope.showingMenu = false;
                $scope.showingNewFolder = false;
            }, 0);
        }
        if (e.keyCode == 8 || e.keyCode == 46){ // esc
            $timeout(function() {
                if($scope.fileSelected){
                    $scope.showingConfirmDelete = true;
                }
            }, 0);
        }
    }




    //
    // Electron Menu
    //
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
                        $timeout(function() {$scope.showingMenu = true;}, 0);
                    }
                },{
                        label: 'up directory',
                        accelerator: 'CmdOrCtrl+U',
                        click: function() {
                            if($scope.path == '.'){$scope.console("red", "You are in the root directory.")}
                                else{$scope.upDir();}
                        }
                },{
                        label: 'new folder',
                        accelerator: 'CmdOrCtrl+N',
                        click: function() {
                            $timeout(function() {$scope.showingNewFolder = true;}, 0);
                        }
                }
            ]
        },{
            label: 'view',
            submenu: [{
                    label: 'reload',
                    accelerator: 'CmdOrCtrl+R',
                    click: function(item, focusedWindow) {
                        if (focusedWindow)
                            focusedWindow.reload();
                    }
                },{
                    label: 'full screen',
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
