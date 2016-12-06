module.exports = function (jsFtp) {
    jsFtp.prototype = Object.create(jsFtp.prototype, {
        rmr: {
            value: rmr
        }
    });

    return jsFtp;
};

function rmr(remoteDirectory, callback) {
    var jsFtp = this;

    listAllDirectoriesAndFiles(remoteDirectory, function (error, directoriesAndFiles) {
        if (error) {
            callback(error);
        } else {
            deleteAllFiles(directoriesAndFiles.files, function (error) {
                if (error) {
                    callback(error);
                } else {
                    deleteAllDirectories(directoriesAndFiles.directories, callback);
                }
            });
        }
    });

    function listAllDirectoriesAndFiles(pendingDirectories, callback, allDirectoriesAndFiles) {
        if (typeof pendingDirectories === 'string') {
            pendingDirectories = [pendingDirectories];
        }
        if (allDirectoriesAndFiles === undefined) {
            allDirectoriesAndFiles = {directories: [], files: []};
        }

        if (pendingDirectories.length === 0) {
            callback(null, allDirectoriesAndFiles);
        } else {
            var currentDirectory = pendingDirectories[0];

            pendingDirectories.splice(0, 1);

            listDirectoriesAndFiles(currentDirectory, function (error, directoriesAndFiles) {
                if (error) {
                    callback(error);
                } else {
                    var relativeDirectories = directoriesAndFiles.directories.map(makeRelative),
                        relativeFiles = directoriesAndFiles.files.map(makeRelative);

                    allDirectoriesAndFiles.directories = allDirectoriesAndFiles.directories.concat(relativeDirectories);
                    allDirectoriesAndFiles.files = allDirectoriesAndFiles.files.concat(relativeFiles);
                    pendingDirectories = pendingDirectories.concat(relativeDirectories);

                    listAllDirectoriesAndFiles(pendingDirectories, callback, allDirectoriesAndFiles);

                    function makeRelative(entryName) {
                        return currentDirectory + '/' + entryName;
                    }
                }
            });
        }
    }

    function listDirectoriesAndFiles(remoteDirectory, callback) {
        jsFtp.ls(remoteDirectory, function (error, directoryEntries) {
                if (error) {
                    callback(error);
                } else {
                    callback(null, toDirectoriesAndFiles(directoryEntries));
                }
            }
        );

        function toDirectoriesAndFiles(directoryEntries) {
            return directoryEntries
                .reduce(toDirectoriesAndFiles, {directories: [], files: []});

            function toDirectoriesAndFiles(directoriesAndFiles, directoryEntry) {
                if (directoryEntry.type === 1 && directoryEntry.name !== '.' && directoryEntry.name !== '..') {
                    directoriesAndFiles.directories.push(directoryEntry.name);
                }

                if (directoryEntry.type === 0) {
                    directoriesAndFiles.files.push(directoryEntry.name);
                }

                return directoriesAndFiles;
            }
        }
    }

    function deleteAllDirectories(directories, callback) {
        applyCommand(directories, 'rmd', callback);
    }

    function deleteAllFiles(files, callback) {
        applyCommand(files, 'dele', callback);
    }

    function applyCommand(entries, command, callback) {
        if (entries.length === 0) {
            callback();
        } else {
            var currentEntry = entries[0];

            entries.splice(0, 1);

            jsFtp.raw[command](currentEntry, function (error) {
                if (error) {
                    callback(error);
                } else {
                    applyCommand(entries, command, callback);
                }
            });
        }
    }
}
