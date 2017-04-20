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
    const dirTree = require('directory-tree');

    const JsFtp = require('jsftp'),
      Ftp = require('jsftp-rmr')(JsFtp);
    let ftp;
    let ssh;

    var $scopeFtp = {a:"2"};
    var $scopeSftp = {a:"3"};

    const path = require('path'),
          node_ssh = require('node-ssh');

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
      $scope.sftpPrivateKey = $scope.favorites[index].privateKey;
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
          pass: $scope.ftpPassword,
          privateKey: $scope.sftpPrivateKey
        };
        $scope.favorites.push($scope.newFavorite);
        $scope.saveFavoritesToStorage();
      }

      $scope.saveFavorite = false;

      if ( $scope.ftpHost.substring(0, 5) == 'sftp.') {
        $scope.showingPassphrase = true;
        //$scope.connectSsh();
      } else {
        $scope.connectFtp();
      }
    }

    $scope.connectFtp = () => {
      console.log('connection through FTP');

      ftp = new Ftp({
        host: $scope.ftpHost,
        port: $scope.ftpPort,
        user: $scope.ftpUsername,
        pass: $scope.ftpPassword
      });

      ftp.on('error', (data) => {
        $scope.console('red', data);
        $scope.emptyMessage = 'Error connecting.'
        console.error(data);
      });

      ftp.on('lookup', (data) => {
        $scope.console('red', `Lookup error: ${data}`);
        $scope.emptyMessage = 'Error connecting.'
        console.error(`Lookup error: ${data}`);
      });

      console.log('Connection Successfull');
      $scope.console('white', `Connected to ${ftp.host}`);

      // Add FTP functions
      $scope.changeDir = $scopeFtp.changeDir;
      $scope.newFolder = $scopeFtp.newFolder;
      $scope.deleteFile = $scopeFtp.deleteFile;
      $scope.renameFile = $scopeFtp.renameFile;
      $scope.getDownloadTree = $scopeFtp.getDownloadTree;
      $scope.saveAllFilesToDisk = $scopeFtp.saveAllFilesToDisk;
      $scope.saveFileToDisk = $scopeFtp.saveFileToDisk;
      $scope.mkDirs = $scopeFtp.mkDirs;
      $scope.upFiles = $scopeFtp.upFiles;

      // Start Scripts
      $scope.changeDir();
      $scope.splitPath();
    }

    $scope.connectSsh = () => {
      console.log('connection through sftp')

      $scope.showingPassphrase = false

      let home = require('os').homedir(),
        privateKeyUri = $scope.sftpPrivateKey.replace('~', home).replace(/\//g, dirSeperator)

      ssh = new node_ssh()
      ssh.connect({
        host: $scope.ftpHost.substring(5),
        port: $scope.ftpPort,
        username: $scope.ftpUsername,
        privateKey: privateKeyUri,
        passphrase: $scope.sftpPassphrase,
        tryKeyboard: true
      }, (err) => {
        $scope.console('red', err)
        $scope.emptyMessage = 'Error connecting.'
      }).then(() => {
        $scope.console('white', `Connected to ${ssh.connection.config.host}`)

        // Add SFTP functions
        $scope.changeDir = $scopeSftp.changeDir
        $scope.newFolder = $scopeSftp.newFolder
        $scope.deleteFile = $scopeSftp.deleteFile
        $scope.renameFile = $scopeSftp.renameFile
        $scope.getDownloadTree = $scopeSftp.getDownloadTree
        $scope.saveAllFilesToDisk = $scopeSftp.saveAllFilesToDisk
        $scope.saveFileToDisk = $scopeSftp.saveFileToDisk
        $scope.mkDirs = $scopeSftp.mkDirs
        $scope.upFiles = $scopeSftp.upFiles

        // Start Scripts
        $scope.changeDir()
        $scope.splitPath()
      })
    }

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
    $scopeFtp.changeDir = () => {
      console.log('FTP function changeDir')

      $scope.searchFiles = '';
      if ($scope.showCancelOperation) {
        return;
      } else {
        $scope.fileSelected = false;
        ftp.ls($scope.path, (err, res) => {
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
    }

    $scopeSftp.changeDir = () => {
      console.log('SFTP function changeDir')

      $scope.searchFiles = ''
      if ($scope.showCancelOperation) {
        return
      } else {
        ssh.requestSFTP().then((sftp) => {
          return new Promise((resolve, reject) => {
            sftp.readdir($scope.path, (err, data) => {
              sftp.end()
              if (err) {
                reject(err)
              } else {
                resolve(data)
              }
            })
          })
        }).then((list) => {
          //list = list.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item.filename)) // sert à enlever les fichiers cachés

          let newList = []
          for (let i=0; i < list.length; i++) {
            let item, type,
              time = new Date(1970,0,1)

            time.setSeconds(list[i].attrs.mtime)
            
            if (list[i].longname[0] === "d") {
              type = 1
            } else { 
              type = 0
            }
            
            item = {
              name: list[i].filename,
              size: list[i].attrs.size,
              time,
              type
            }
            newList.push(item)
          }

          $timeout(() => {
            $scope.files = newList
            $scope.splitPath()
            $scope.emptyMessage = `There's nothin' here`
            if ($scope.path !== '.') {
              $scope.console('white', `Navigated to ${$scope.path}`)
            }
          }, 0)
        })
      }
    }

    // Go into a directory (double click folder);
    $scope.intoDir = (dir) => {
      console.log('IntoDir function')

      if ($scope.selectedFileType === 0) { // If file, do nothing but select
        console.log('domage ce nest pas un folder')
        return;
      } else {
        $scope.emptyMessage = 'Loading...';
        console.log('dir', dir)
        $scope.path = `${$scope.path}/${dir}`;
        $scope.changeDir();
      }
    };

    // Go up a directory - button on nav
    $scope.upDir = () => {
      console.log('upDir function')

      $scope.path = $scope.path.substring(0, $scope.path.lastIndexOf('/'));
      $scope.changeDir();
    };

    // Click a breadcrumb to go up multiple directories
    $scope.breadCrumb = (index) => {
      console.log('breadCrumb function')

      $scope.path = '.';
      for (let i = 1; i <= index; i++) {
        $scope.path = `${$scope.path}/${$scope.pathArray[i]}`;
      }
      console.log($scope.path);
      $scope.changeDir();
    };

    // Split paths for use in breadcrumbs
    $scope.splitPath = () => {
      console.log('splitPath function')

      $scope.pathArray = new Array();
      $scope.pathArray = $scope.path.split('/');
      console.log('patharray', $scope.pathArray);
    };

    // Select a file to modify
    $scope.selectTimer = () => {
      console.log('selectTimer function')

      $scope.fileToFile = true;
      $timeout(() => {
        $scope.fileToFile = false;
      }, 200);
    };
    $scope.selectFile = (name, filetype) => {
      console.log('selectFile function')

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

    $scopeFtp.newFolder = () => {
      console.log('FTP newFolder function')

      $scope.showingNewFolder = false;
      ftp.raw('mkd', `${$scope.path}/${$scope.newFolderName}`, (err, data) => {
        $scope.changeDir();
        $scope.newFolderName = '';
        if (err) {
          $scope.console("red", err);
        } else {
          $scope.console("white", data.text);
        }
      });
    };

    $scopeSftp.newFolder = () => {
      console.log('SFTP newFolder function')

      $scope.showingNewFolder = false
      ssh.requestSFTP().then((sftp) => {
        return new Promise((resolve, reject) => {
          sftp.mkdir(`${$scope.path}/${$scope.newFolderName}`, (err) => {
            sftp.end()
            if (err) {
              $scope.console("red", err)
              reject(err)
            } else {
              resolve()
            }
          })
        })
      }).then(() => {
        $scope.console("white", `${$scope.path}/${$scope.newFolderName} created`)
        $scope.changeDir()
      })
    }

    // Delete a file or folder depending on file type
    $scopeFtp.deleteFile = () => {
      console.log('FTP deleteFile function')

      console.log(`TYPE: ${$scope.selectedFileType}`)
      console.log(`NAME: ${$scope.selectedFileName}`)
      console.log(`PATH: ${$scope.path}`)
      $scope.showingConfirmDelete = false;
      console.log(`DELETING ${$scope.path}/${$scope.selectedFileName}`)
      if ($scope.selectedFileType === 0) { // 0 is file
        ftp.raw('dele', `${$scope.path}/${$scope.selectedFileName}`, (err, data) => {
          if (err) return $scope.console('red', err)
          $scope.changeDir()
          $scope.console('green', data.text)
        })
      } else if ($scope.selectedFileType === 1) { // Everything else is folder
        ftp.rmr(`${$scope.path}/${$scope.selectedFileName}`, (err) => {
          ftp.raw('rmd', `${$scope.path}/${$scope.selectedFileName}`, (err, data) => {
            if (err) return $scope.console('red', err)
            $scope.changeDir()
            $scope.console('green', data.text)
          });
        });
      }
    }

    $scopeSftp.deleteFile = () => {
      console.log('SFTP deleteFile function')

      $scope.showingConfirmDelete = false;

      if ($scope.selectedFileType === 0) { // 0 is file

        ssh.requestSFTP().then((sftp) => {
          return new Promise((resolve, reject) => {
            sftp.unlink(`${$scope.path}/${$scope.selectedFileName}`, (err) => {
              sftp.end()
              if (err) {
                $scope.console("red", `Can't removed ${$scope.path}/${$scope.selectedFileName}`)
                reject(err)
              } else {
                resolve()
              }
            })
          })
        }).then(() => {
          $scope.console("green", `${$scope.path}/${$scope.selectedFileName} removed`)
          $scope.changeDir()
        })

      } else if ($scope.selectedFileType === 1) { // Everything else is folder

        let dirPath = $scope.path.replace(/\//g, `"/"`)
        dirPath = dirPath + `"`
        dirPath = dirPath.slice(0, 1) + dirPath.slice(2, dirPath.length)
        dirPath = `${dirPath}/"${$scope.selectedFileName}"`

        ssh.exec(`rm -rf ${dirPath}`).then((result) => {
          if (result.stderr) {
            $scope.console("red", result.stderr)
          } else {
            $scope.console("green", `${$scope.path}/${$scope.selectedFileName} removed`)
          }
          $scope.changeDir()
        })

      }
    }

    // Rename a file or folder
    $scopeFtp.renameFile = () => {
      console.log('FTP renameFile function')

      if (!$scope.showingRename) {
        $scope.fileRenameInput = $scope.selectedFileName;
        $scope.showingRename = true;
      } else {
        ftp.rename(`${$scope.path}/${$scope.selectedFileName}`, `${$scope.path}/${$scope.fileRenameInput}`, (err, res) => {
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

    $scopeSftp.renameFile = () => {
      console.log('SFTP renameFile function')

      if (!$scope.showingRename) {
        $scope.fileRenameInput = $scope.selectedFileName
        $scope.showingRename = true
      } else {
        ssh.requestSFTP().then((sftp) => {
          return new Promise((resolve, reject) => {
            sftp.rename(`${$scope.path}/${$scope.selectedFileName}`, `${$scope.path}/${$scope.fileRenameInput}`, (err) => {
              sftp.end()
              if (err) {
                $scope.console('red', err)
                reject(err)
              } else {
                resolve()
              }
            })
          })
        }).then( () => {
          $scope.showingRename = false
          $scope.console('green', `Renamed ${$scope.selectedFileName} to ${$scope.fileRenameInput}`)
          $scope.changeDir()
        })
      }
    }

    // Download a file
    $scope.chooseDownloadDirectory = () => {
      document.getElementById('chooseDownloadDirectory').click();
    };
    $scope.saveDownloadPath = () => {
      console.log('saveDownloadPath function')
      $scope.downloadPath = document.getElementById('chooseDownloadDirectory').files[0].path;
      console.log($scope.downloadPath);
      $scope.downloadFiles();
    };
    $scope.downloadFiles = () => {
      console.log('downloadFiles function');

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
    $scopeFtp.getDownloadTree = (path) => {
      console.log('FTP getDownloadTree function')

      $scope.tempFolders = [];
      $scope.tempPath = path;
      $scope.gettingDownloadReady = true; // Reset because still working

      ftp.ls(path, (err, res) => {
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

    $scopeSftp.getDownloadTree = (path) => {
      console.log('SFTP getDownloadTree function')

      $scope.tempFolders = []
      $scope.tempPath = path
      $scope.gettingDownloadReady = true // Reset because still working

      ssh.requestSFTP().then((sftp) => {
        return new Promise((resolve, reject) => {
          sftp.readdir(path, (err, res) => {
            sftp.end()
            if (err) {
              reject(err)
            } else {
              resolve(res)
            }
          })
        })
      }).then((res) => {
        for (let i = 0, item; item = res[i]; i++) {
          if (item.longname[0] === "d") { // if folder, push to full array and temp
            $scope.foldersToCreate.push({'path': path, 'name': item.filename})
            $scope.tempFolders.push({'path': path, 'name': item.filename})
          } else { // if file, push to file array
            console.log('path', path, 'name', item.filename)
            $scope.filesToDownload.push({'path': path, 'name': item.filename})
          }
        }
        $scope.gettingDownloadReady = false
        for (let x = 0, folder; folder = $scope.tempFolders[x]; x++) { // for each folder, getDownloadTree again and index those. Same process
          $scope.getDownloadTree(`${folder.path}/${folder.name}`)
        }
      })
    }

    // Once getDownloadTree is finished, this is called
    $scope.processFiles = () => {
      console.log('processFiles function')

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

    $scopeFtp.saveAllFilesToDisk = () => {
      console.log('FTP saveAllFilesToDisk function')

      if ($scope.filesToDownload[$scope.downloadFileZero]) {
        const filepath = $scope.filesToDownload[$scope.downloadFileZero].path,
          filename = $scope.filesToDownload[$scope.downloadFileZero].name,
          absoluteFilePath = filepath.substring(filepath.indexOf('/') + 1) + '/' + filename;

        const from = `${filepath}/${filename}`;

        const newfilepath = `${filepath}${dirSeperator}${filename}`;
        let to = `${$scope.downloadPath}${dirSeperator}${$scope.selectedFileName + newfilepath.replace($scope.selectedFilePath, '')}`;
        $scope.console('white', `Downloading ${filename} to ${$scope.downloadPath}${dirSeperator}${$scope.selectedFileName + newfilepath.replace($scope.selectedFilePath, '')}`);

        ftp.get(from, to, (hadErr) => {
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

    $scopeSftp.saveAllFilesToDisk = () => {
      console.log('SFTP saveAllFilesToDisk function')

      if ($scope.filesToDownload[$scope.downloadFileZero]) {
        const filepath = $scope.filesToDownload[$scope.downloadFileZero].path,
          filename = $scope.filesToDownload[$scope.downloadFileZero].name,
          absoluteFilePath = filepath.substring(filepath.indexOf('/') + 1) + '/' + filename

        const from = `${filepath}/${filename}`

        const newfilepath = `${filepath}${dirSeperator}${filename}`
        let to = `${$scope.downloadPath}${dirSeperator}${$scope.selectedFileName + newfilepath.replace($scope.selectedFilePath, '')}`
        $scope.console('white', `Downloading ${filename} to ${$scope.downloadPath}${dirSeperator}${$scope.selectedFileName + newfilepath.replace($scope.selectedFilePath, '')}`)

        console.log('scope.selectedFileName', $scope.selectedFileName)
        console.log('newfilepath', newfilepath)
        console.log('from', from)
        console.log('to', to)

        ssh.getFile(to, from).then((data) => {
          $scope.console("white", 'Done.')
          $scope.downloadFileZero++
          $scope.changeDir()
          $scope.saveAllFilesToDisk() // do it again until all files are downloaded
        }, (err) => {
          $scope.console("red", `Error downloading ${filename}... ${err}`)
          $scope.downloadFileZero++
          $scope.changeDir()
          $scope.saveAllFilesToDisk() // do it again until all files are downloaded
        })
      } else { // once finished
        $timeout(() => {
          $scope.changeDir()
          $interval.cancel($scope.downloadInterval)
          $scope.showCancelOperation = false
          $scope.console("blue", `Downloaded ${$scope.filesToDownload.length} files in ${$scope.foldersToCreate.length} directories in ${$scope.downloadTime} seconds.`)
        }, 200)
      }
    };

    // Download file if single file - not folder
    $scopeFtp.saveFileToDisk = (filepath, filename) => {
      console.log('FTP saveFileToDisk function')

      const from = filepath;
      let to = `${$scope.downloadPath}${dirSeperator}${filename}`;
      console.log(`DOWNLOADING: ${from} TO: ${to}`);
      ftp.get(from, to, (hadErr) => {
        if (hadErr) {
          $scope.console('red', `Error downloading ${filename}`);
        } else {
          $scope.console('green', `Successfully downloaded ${filename}`);
        }
      });
    };

    $scopeSftp.saveFileToDisk = (filepath, filename) => {
      console.log('SFTP saveFileToDisk function')

      const from = filepath
      let to = `${$scope.downloadPath}${dirSeperator}${filename}`

      ssh.getFile(to, from).then((data) => {
        $scope.console("green", `Successfully downloaded ${filename}`)
      }, (err) => {
        $scope.console("red", `Error downloading ${filename}`)
      })
    }


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
      console.log('gatherFile function')

      if (!tree.length) {
        console.log("No folders");
      }
      $scope.nestedTree = [];
      for (let i = 0, f; f = tree[i]; i++) {
        if (!tree[i].children) { // if file
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
      console.log('uploadEverything function')

      console.log($scope.foldersArray);
      console.log($scope.filesArray);
      $scope.console('white', `Uploading ${$scope.foldersArray.length} folders and ${$scope.filesArray.length} files...`);
      $scope.filezero = 0;
      $scope.folderzero = 0;
      $scope.mkDirs();
    };

    $scopeFtp.mkDirs = () => {
      console.log('FTP mkDirs function')

      if ($scope.foldersArray[$scope.folderzero]) {
        const localpath = $scope.foldersArray[$scope.folderzero].path,
          uploadpath = $scope.baseUploadPath;

        $scope.dirToCreate = uploadpath + localpath.replace($scope.baselocalpath, '').replace(/\\/g, '/');
        $scope.console('white', `Creating folder ${$scope.dirToCreate}...`)

        ftp.raw('mkd', $scope.dirToCreate, (err, data) => {
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

    $scopeSftp.mkDirs = () => {
      console.log('SFTP mkDirs function')

      if ($scope.foldersArray[$scope.folderzero]) {
        const localpath = $scope.foldersArray[$scope.folderzero].path,
          uploadpath = $scope.baseUploadPath

        $scope.dirToCreate = uploadpath + localpath.replace($scope.baselocalpath, '').replace(/\\/g, '/')
        $scope.console('white', `Creating folder ${$scope.dirToCreate}...`)

        ssh.requestSFTP().then((sftp) => {
          return new Promise((resolve, reject) => {
            sftp.mkdir($scope.dirToCreate, (err) => {
              sftp.end()
              if (err) {
                $scope.console(err)
                reject(err)
              } else {
                $scope.console("created")
                resolve()
              }
            })
          })
        }).then(() => {
          $scope.folderzero++
          $scope.mkDirs()
        })
      } else {
        $timeout(() => {
          $scope.changeDir()
          $scope.upFiles()
        }, 200)
      }
    }

    $scopeFtp.upFiles = () => {
      console.log('FTP upFiles function')

      if ($scope.filesArray[$scope.filezero]) {
        const localpath = $scope.filesArray[$scope.filezero].path,
          uploadpath = $scope.baseUploadPath;
        $scope.fileToUpload = uploadpath + localpath.replace($scope.baselocalpath, '').replace(/\\/g, '/');
        $scope.console('white', `Uploading ${$scope.fileToUpload}...`);

        ftp.put(localpath, $scope.fileToUpload, (hadError) => {
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

    $scopeSftp.upFiles = () => {
      console.log('SFTP upFiles function')

      if ($scope.filesArray[$scope.filezero]) {
        const localpath = $scope.filesArray[$scope.filezero].path,
          uploadpath = $scope.baseUploadPath
        $scope.fileToUpload = uploadpath + localpath.replace($scope.baselocalpath, '').replace(/\\/g, '/')
        $scope.console('white', `Uploading ${$scope.fileToUpload}...`)

        ssh.putFile(localpath, $scope.fileToUpload).then((data) => {
          $scope.console('white', `Successfully uploaded ${localpath} to ${$scope.fileToUpload}`)
          $scope.filezero++
          $scope.changeDir()
          $scope.upFiles()
        }, (err) => {
          $scope.console('red', `Error Uploading ${$scope.fileToUpload}`)
          $scope.filezero++
          $scope.changeDir()
          $scope.upFiles()
        })
      } else {
        $timeout(() => {
          $interval.cancel($scope.uploadInterval)
          $scope.showCancelOperation = false
          $scope.changeDir()
          $scope.console('blue', `File transfer completed in ${$scope.uploadTime} seconds.`)
        }, 200)
      }
    }


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
    //     ftp.raw('abor', () => {
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
          $scope.showingPassphrase = false;
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

    var hostInput = angular.element( document.querySelector('#hostInput') )
    console.log(hostInput)
    hostInput.on('input', () => {
      let passwordInput = angular.element( document.querySelector('#passwordInput') ),
        privateKeyInput = angular.element( document.querySelector('#privateKeyInput') )
      console.log('passwordInput', passwordInput)
      console.log('privateKeyInput', privateKeyInput)
      console.log(hostInput[0].value.substring(0, 4))
      if (hostInput[0].value.substring(0, 4) == "sftp") {
        console.log(true)
        passwordInput.addClass('hidden')
        privateKeyInput.removeClass('hidden')
      } else {
        console.log(false)
        passwordInput.removeClass('hidden')
        privateKeyInput.addClass('hidden')
      }
    })

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

