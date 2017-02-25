(function() {
  'use strict';

  angular.module('app')
    .controller('homeCtrl', homeController);

  /* @ngInject */
  function homeController($scope, $timeout, $filter, $interval, ngDraggable, $http) {
    // Analytics setup (https://github.com/peaksandpies/universal-analytics)
    const ua = require('universal-analytics'),
      visitor = ua('UA-88669012-1');
    visitor.pageview('/').send();
    console.log(`Tracking ${visitor}`);

    const fs = require('fs');

    // Get computer OS
    const os = require('os');
    let isWindowsOS = false,
      dirSeperator = '/';
    if (os.platform() === 'win32') {
      isWindowsOS = true;
      dirSeperator = '\\';
    }

    // $scope.remote = require('electron').remote;
    // $scope.dialog = remote.require('dialog');
    const remote = require('electron').remote,
      dialog = require('electron').dialog;

    $scope.path = '.';
    $scope.emptyMessage = 'Loading...';
    $scope.fullConsole = false;
    $scope.showingMenu = true;
    $scope.consoleMessage = 'Click to expand console.';

    $scope.editingFavorites = false;

    $scope.fileSelected = false;
    $scope.saveFavorite = false;


    const shell = require('electron').shell,
      pjson = require('./package.json');
    $scope.appVersion = pjson.version;
    // console.log(require('electron').remote.app.getVersion());

    // Get update notifications from ffftp.site
    $http({
      method: 'GET',
      url: 'http://www.ffftp.site/appupdate.json'
    }).then((data) => {
      if (data.version !== $scope.appVersion.toString()) {
        $scope.showUpdate = true;
      }
    }, () => {
      console.log('Error getting update notification');
    });

    $scope.updateApp = () => {
      shell.openExternal('http://ffftp.site/download/' + $scope.appVersion);
    };

    // Load Favorites
    const storage = require('electron-json-storage');
    $scope.favorites = [];
    storage.has('favorites', (error, hasKey) => {
      if (error) throw error;

      if (hasKey) {
        storage.get('favorites', (error, data) => {
          if (error) throw error;

          $timeout(() => {
            $scope.favorites = data;
            console.log('FAVORITES');
            console.log(data);
          }, 0);
        });
      } else {
        console.log('No favs');
      }
    });

    // On favorite click
    $scope.loadFavorite = (index) => {
      $scope.ftpHost = $scope.favorites[index].host;
      $scope.ftpPort = $scope.favorites[index].port;
      $scope.ftpUsername = $scope.favorites[index].user;
      $scope.ftpPassword = $scope.favorites[index].pass;
      $scope.favoriteName = $scope.favorites[index].name;
      $scope.connect();
    };
    $scope.deleteFavorite = (index) => {
      $scope.favorites.splice(index, 1);
      $scope.saveFavoritesToStorage();
    };


    // Connect to ftp
    $scope.connect = () => {
      $scope.showingMenu = false;

      if ($scope.saveFavorite) {
        $scope.newFavorite = {
          name: $scope.favoriteName,
          host: $scope.ftpHost,
          port: $scope.ftpPort,
          user: $scope.ftpUsername,
          pass: $scope.ftpPassword
        };
        $scope.favorites.push($scope.newFavorite);
        $scope.saveFavoritesToStorage();
      }

      $scope.saveFavorite = false;

      const JsFtp = require('jsftp'),
        Ftp = require('jsftp-rmr')(JsFtp);

      $scope.ftp = new Ftp({
        host: $scope.ftpHost,
        port: $scope.ftpPort,
        user: $scope.ftpUsername,
        pass: $scope.ftpPassword
      });
      $scope.ftp.on('error', (data) => {
        console.error(`Error: ${data}`);
      });
      $scope.ftp.on('lookup', (data) => {
        console.error(`Lookup error: ${data}`);
      });

      $scope.console('white', `Connected to ${$scope.ftp.host}`);

      // Start Scripts
      $scope.changeDir();
      $scope.splitPath();
    };

    $scope.saveFavoritesToStorage = () => {
      storage.set('favorites', $scope.favorites, (error) => {
        if (error) throw error;
      });
    };
    $scope.deleteFavs = () => {
      storage.clear((error) => {
        if (error) throw error;
      });
    };

    // Change directory
    $scope.changeDir = () => {
      $scope.searchFiles = '';
      if ($scope.showCancelOperation) {
        return;
      } else {
        $scope.fileSelected = false;
        $scope.ftp.ls($scope.path, (err, res) => {
          $timeout(() => {
            $scope.files = res;
            $scope.splitPath();
            $scope.emptyMessage = `There's nothin' here`;
            if ($scope.path !== '.') {
              $scope.console('white', `Navigated to ${$scope.path}`);
            }
          }, 0);
        });
      }
    };

    // Go into a directory (double click folder);
    $scope.intoDir = (dir) => {
      if ($scope.selectedFileType === 0) { // If file, do nothing but select
        return;
      } else {
        $scope.emptyMessage = 'Loading...';
        $scope.path = `${$scope.path}/${dir}`;
        $scope.changeDir();
      }
    };

    // Go up a directory - button on nav
    $scope.upDir = () => {
      $scope.path = $scope.path.substring(0, $scope.path.lastIndexOf('/'));
      $scope.changeDir();
    };

    // Click a breadcrumb to go up multiple directories
    $scope.breadCrumb = (index) => {
      $scope.path = '.';
      for (let i = 1; i <= index; i++) {
        $scope.path = `${$scope.path}/${$scope.pathArray[i]}`;
      }
      console.log($scope.path);
      $scope.changeDir();
    };

    // Split paths for use in breadcrumbs
    $scope.splitPath = () => {
      $scope.pathArray = new Array();
      $scope.pathArray = $scope.path.split('/');
    };

    // Select a file to modify
    $scope.selectTimer = () => {
      $scope.fileToFile = true;
      $timeout(() => {
        $scope.fileToFile = false;
      }, 200);
    };
    $scope.selectFile = (name, filetype) => {
      $scope.fileSelected = true;
      $scope.selectedFileName = name;
      $scope.selectedFileType = filetype;
      $scope.selectedFilePath = `${$scope.path}/${name}`;
      console.log($scope.selectedFileName);
    };
    $scope.clearSelected = () => {
      $timeout(() => {
        if (!$scope.fileToFile) $scope.fileSelected = false;
      }, 200);
    };

    // Create a new folder
    $scope.showingNewFolder = false;
    $scope.newFolder = () => {
      $scope.showingNewFolder = false;
      $scope.ftp.raw('mkd', `${$scope.path}/${$scope.newFolderName}`, (err, data) => {
        $scope.changeDir();
        $scope.newFolderName = '';
        if (err) {
          $scope.console("red", err);
        } else {
          $scope.console("white", data.text);
        }
      });
    };

    // Delete a file or folder depending on file type
    $scope.deleteFile = () => {
      console.log(`TYPE: ${$scope.selectedFileType}`);
      console.log(`NAME: ${$scope.selectedFileName}`);
      console.log(`PATH: ${$scope.path}`);
      $scope.showingConfirmDelete = false;
      console.log(`DELETING ${$scope.path}/${$scope.selectedFileName}`);
      if ($scope.selectedFileType === 0) { // 0 is file
        $scope.ftp.raw('dele', `${$scope.path}/${$scope.selectedFileName}`, (err, data) => {
          if (err) return $scope.console('red', err);
          $scope.changeDir();
          $scope.console('green', data.text);
        });
      } else if ($scope.selectedFileType === 1) { // Everything else is folder
        $scope.ftp.rmr(`${$scope.path}/${$scope.selectedFileName}`, (err) => {
          $scope.ftp.raw('rmd', `${$scope.path}/${$scope.selectedFileName}`, (err, data) => {
            if (err) return $scope.console('red', err);
            $scope.changeDir();
            $scope.console('green', data.text);
          });
        });
      }
    };

    // Rename a file or folder
    $scope.renameFile = () => {
      if (!$scope.showingRename) {
        $scope.fileRenameInput = $scope.selectedFileName;
        $scope.showingRename = true;
      } else {
        $scope.ftp.rename(`${$scope.path}/${$scope.selectedFileName}`, `${$scope.path}/${$scope.fileRenameInput}`, (err, res) => {
          if (!err) {
            $scope.showingRename = false;
            $scope.console('green', `Renamed ${$scope.selectedFileName} to ${$scope.fileRenameInput}`);
            $scope.changeDir();
          } else {
            $scope.console('red', err);
          }
        });
      }
    };

    // Download a file
    $scope.chooseDownloadDirectory = () => {
      document.getElementById('chooseDownloadDirectory').click();
    };
    $scope.saveDownloadPath = () => {
      $scope.downloadPath = document.getElementById('chooseDownloadDirectory').files[0].path;
      console.log($scope.downloadPath);
      $scope.downloadFiles();
    };
    $scope.downloadFiles = () => {
      console.log('downloadFiles');

      if ($scope.selectedFileType === 0) { // If file, download right away
        $scope.saveFileToDisk($scope.selectedFilePath, $scope.selectedFileName);
      } else if ($scope.selectedFileType === 1) { // if folder, index folders and files
        $scope.foldersToCreate = [];
        $scope.filesToDownload = [];
        $scope.getDownloadTree($scope.selectedFilePath);
        $scope.downloadTime = 0;
        $scope.showCancelOperation = true;
        $scope.downloadInterval = $interval(() => {
          $scope.downloadTime++;
        }, 1000); // Download Timer
        $scope.gettingDownloadReady = true;
        $scope.watchDownloadProcess();
      } else { // else unknown file type
        $scope.console('red', `Unable to download file ${$scope.selectedFileName}. Unknown file type.`);
      }
    };

    // Checks every 400ms if download tree is still processing
    $scope.watchDownloadProcess = () => {
      $timeout(() => {
        if ($scope.gettingDownloadReady) {
          $scope.watchDownloadProcess;
        } else {
          $scope.processFiles();
        }
      }, 400);
    };

    // Get download tree loops through all folders and files, and adds them to arrays.
    // Current directory folders are added to the tempfolders array
    $scope.getDownloadTree = (path) => {
      $scope.tempFolders = [];
      $scope.tempPath = path;
      $scope.gettingDownloadReady = true; // Reset because still working

      $scope.ftp.ls(path, (err, res) => {
        console.log(res);
        for (let i = 0, item; item = res[i]; i++) {
          if (item.type === 1) { // if folder, push to full array and temp
            $scope.foldersToCreate.push({'path': path, 'name': item.name});
            $scope.tempFolders.push({'path': path, 'name': item.name});
          } else if (item.type === 0) { // if file, push to file array
            $scope.filesToDownload.push({'path': path, 'name': item.name});
          }
        }
        $scope.gettingDownloadReady = false;
        for (let x = 0, folder; folder = $scope.tempFolders[x]; x++) { // for each folder, getDownloadTree again and index those. Same process
          console.log(`FOLDER PATH: ${folder.path}`);
          $scope.getDownloadTree(`${folder.path}/${folder.name}`);
        }
      });
    };

    // Once getDownloadTree is finished, this is called
    $scope.processFiles = () => {
      //First create base folder
      fs.mkdir(`${$scope.downloadPath}${dirSeperator}${$scope.selectedFileName}`);
      //Then create all folders within
      for (let i = 0, folder; folder = $scope.foldersToCreate[i]; i++) { // Create all empty folders
        const newfolderpath = `${folder.path}${dirSeperator}${folder.name}`;
        fs.mkdir(`${$scope.downloadPath}${dirSeperator}${$scope.selectedFileName + newfolderpath.replace($scope.selectedFilePath, '')}`);
      }


      // Then begin downloading files individually
      $scope.downloadFileZero = 0;
      $scope.saveAllFilesToDisk();
    };

    $scope.saveAllFilesToDisk = () => {
      if ($scope.filesToDownload[$scope.downloadFileZero]) {
        const filepath = $scope.filesToDownload[$scope.downloadFileZero].path,
          filename = $scope.filesToDownload[$scope.downloadFileZero].name,
          absoluteFilePath = filepath.substring(filepath.indexOf('/') + 1) + '/' + filename;

        const from = `${filepath}/${filename}`;

        const newfilepath = `${filepath}${dirSeperator}${filename}`;
        let to = `${$scope.downloadPath}${dirSeperator}${$scope.selectedFileName + newfilepath.replace($scope.selectedFilePath, '')}`;
        $scope.console('white', `Downloading ${filename} to ${$scope.downloadPath}${dirSeperator}${$scope.selectedFileName + newfilepath.replace($scope.selectedFilePath, '')}`);

        $scope.ftp.get(from, to, (hadErr) => {
          if (hadErr) {
            $scope.console('red', `Error downloading ${filename}... ${hadErr}`);
          } else {
            $scope.console('white', 'Done.');
          }
          $scope.downloadFileZero++;
          $scope.changeDir();
          $scope.saveAllFilesToDisk(); // do it again until all files are downloaded
        });
      } else { // once finished
        $timeout(() => {
          $scope.changeDir();
          $interval.cancel($scope.downloadInterval);
          $scope.showCancelOperation = false;
          $scope.console('blue', `Downloaded ${$scope.filesToDownload.length} files in ${$scope.foldersToCreate.length} directories in ${$scope.downloadTime} seconds.`);
        }, 200);
      }
    };

    // Download file if single file - not folder
    $scope.saveFileToDisk = (filepath, filename) => {
      const from = filepath;
      let to = `${$scope.downloadPath}\\${filename}`;
      console.log(`DOWNLOADING: ${from} TO: ${to}`);
      $scope.ftp.get(from, to, (hadErr) => {
        if (hadErr) {
          $scope.console('red', `Error downloading ${filename}`);
        } else {
          $scope.console('green', `Successfully downloaded ${filename}`);
        }
      });
    };

    // File Uploading
    document.ondragover = document.ondrop = (ev) => {
      ev.preventDefault();
    };
    document.body.ondrop = (ev) => {
      $scope.dragged = ev.dataTransfer.files;

      $scope.console('white', 'Getting file tree...');
      $scope.folderTree = [];
      $scope.baseUploadPath = $scope.path;

      $scope.foldersArray = [];
      $scope.filesArray = [];

      $scope.uploadTime = 0;
      $scope.uploadInterval = $interval(() => {
        $scope.uploadTime++;
      }, 1000);
      $scope.showCancelOperation = true;

      for (let i = 0, f; f = $scope.dragged[i]; i++) {
        $scope.folderTree.push(dirTree($scope.dragged[i].path));
      }

      $scope.baselocalpath = $scope.dragged[0].path.substring(0, $scope.dragged[0].path.lastIndexOf(dirSeperator));

      $scope.gatherFiles($scope.folderTree);
      $timeout(() => {
        $scope.uploadEverything();
      }, 1000);

      ev.preventDefault();
    };

    $scope.gatherFiles = (tree) => {
      if (!tree.length) {
        console.log("No folders");
      }
      $scope.nestedTree = [];
      for (let i = 0, f; f = tree[i]; i++) {
        if (tree[i].extension) { // if file
          $scope.filesArray.push({'name': tree[i].name, 'path': tree[i].path});
        } else { // if folder
          $scope.foldersArray.push({'name': tree[i].name, 'path': tree[i].path});
          if (tree[i].children.length) {
            console.log(`HAS CHILDREN: ${tree[i].name}`);
            for (let x = 0, y; y = tree[i].children[x]; x++) {
              $scope.nestedTree.push(dirTree(y.path));
            }
            $scope.gatherFiles($scope.nestedTree);
          }
        }
      }
    };

    $scope.uploadEverything = () => {
      console.log($scope.foldersArray);
      console.log($scope.filesArray);
      $scope.console('white', `Uploading ${$scope.foldersArray.length} folders and ${$scope.filesArray.length} files...`);
      $scope.filezero = 0;
      $scope.folderzero = 0;
      $scope.mkDirs();
    };
    $scope.mkDirs = () => {
      if ($scope.foldersArray[$scope.folderzero]) {
        const localpath = $scope.foldersArray[$scope.folderzero].path,
          uploadpath = $scope.baseUploadPath;

        $scope.dirToCreate = uploadpath + localpath.replace($scope.baselocalpath, '').replace(/\\/g, '/');
        $scope.console('white', `Creating folder ${$scope.dirToCreate}...`)

        $scope.ftp.raw('mkd', $scope.dirToCreate, (err, data) => {
          // $scope.changeDir();
          if (err) {
            $scope.console(err);
          }
          else {
            $scope.console(data.text);
          }
          $scope.folderzero++;
          $scope.mkDirs();
        });
      } else {
        $timeout(() => {
          $scope.changeDir();
          $scope.upFiles();
        }, 200);
      }
    };
    $scope.upFiles = () => {
      if ($scope.filesArray[$scope.filezero]) {
        const localpath = $scope.filesArray[$scope.filezero].path,
          uploadpath = $scope.baseUploadPath;
        $scope.fileToUpload = uploadpath + localpath.replace($scope.baselocalpath, '').replace(/\\/g, '/');
        $scope.console('white', `Uploading ${$scope.fileToUpload}...`);

        $scope.ftp.put(localpath, $scope.fileToUpload, (hadError) => {
          if (!hadError) {
            $scope.console('white', `Successfully uploaded ${localpath} to ${$scope.fileToUpload}`);
          } else {
            $scope.console('red', `Error Uploading ${$scope.fileToUpload}`);
          }
          $scope.filezero++;
          $scope.changeDir();
          $scope.upFiles();
        });
      } else {
        $timeout(() => {
          $interval.cancel($scope.uploadInterval);
          $scope.showCancelOperation = false;
          $scope.changeDir();
          $scope.console('blue', `File transfer completed in ${$scope.uploadTime} seconds.`);
        }, 200);
      }
    };

    // Drag to move files
    // Unused for now
    $scope.onDragComplete = (path) => {
      console.log(`MOVING: ${path}`);
    };
    $scope.onDropComplete = (path) => {
      console.log(`MOVE TO: ${path}`);
    };

    // Console controls
    $scope.consoleMessages = [];
    $scope.consoleUnread = 0;
    $scope.console = (color, msg) => {
      $timeout(() => {
        $scope.consoleMessageClass = color;
        $scope.consoleMessage = msg;
        $scope.consoleMessages.push({'color': color, 'message': msg});
        $scope.consoleUnread++;
      }, 0);
    };
    $scope.openConsole = () => {
      $scope.consoleUnread = 0;
      $scope.fullConsole = true;
    };

    // Cancel Operations
    // $scope.cancelFTPOperation = () => {
    //     $scope.ftp.raw('abor', () => {
    //         $scope.console('red', 'Process aborted.')
    //     });
    // }

    // Keyboard Shortcuts
    window.document.onkeydown = (e) => {
      if (!e) e = event;
      if (e.keyCode === 27) { // esc
        $timeout(() => {
          console.log('esc pressed');
          if (!$scope.showingRename && !$scope.showingNewFolder && !$scope.showingMenu) $scope.fullConsole = false;
          $scope.showingRename = false;
          $scope.showingMenu = false;
          $scope.showingNewFolder = false;
        }, 0);
      }
      if (e.keyCode === 8 || e.keyCode === 46) { // esc
        $timeout(() => {
          if ($scope.fileSelected) $scope.showingConfirmDelete = true;
        }, 0);
      }
    };

    // Electron Menu
    const Menu = remote.Menu;

    var template = [
      {
        label: 'ffftp',
        submenu: [{
          label: 'About',
          accelerator: 'CmdOrCtrl+H',
          click: (item, focusedWindow) => {
            shell.openExternal('http://ffftp.site');
          }
        },
          {
            label: 'Close',
            accelerator: 'CmdOrCtrl+Q',
            role: 'close'
          }]
      },
      {
        label: 'Action',
        submenu: [{
          label: 'Connect',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            $timeout(() => {
              $scope.showingMenu = true;
            }, 0);
          }
        },
          {
            label: 'Up directory',
            accelerator: 'CmdOrCtrl+U',
            click: () => {
              if ($scope.path === '.') {
                $scope.console('red', 'You are in the root directory.')
              }
              else {
                $scope.upDir();
              }
            }
          },
          {
            label: 'New folder',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              $timeout(() => {
                $scope.showingNewFolder = true;
              }, 0);
            }
          }]
      },
      {
        label: 'View',
        submenu: [{
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: (item, focusedWindow) => {
            if (focusedWindow)
              focusedWindow.reload();
          }
        },
          {
            label: 'Full screen',
            accelerator: (() => {
              if (process.platform === 'darwin')
                return 'Ctrl+Command+F';
              else
                return 'F11';
            })(),
            click: (item, focusedWindow) => {
              if (focusedWindow)
                focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
            }
          }]
      },
      {
        label: 'Edit',
        submenu: [
          {label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:'},
          {label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:'},
          {type: 'separator'},
          {label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:'},
          {label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:'},
          {label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:'},
          {label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:'}
        ]
      },
      {
        label: 'Dev',
        submenu: [
          {
            label: 'Dev tools',
            accelerator: (() => {
              if (process.platform === 'darwin')
                return 'Alt+Command+I';
              else
                return 'Ctrl+Shift+I';
            })(),
            click: (item, focusedWindow) => {
              if (focusedWindow)
                focusedWindow.toggleDevTools();
            }
          }, {
            label: 'Github',
            click: (item, focusedWindow) => {
              shell.openExternal('http://github.com/mitchas/ffftp');
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  homeController.$inject = ['$scope', '$timeout', '$filter', '$interval', 'ngDraggable', '$http'];
})();

