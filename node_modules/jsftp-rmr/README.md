# jsftp-rmr
> Recursively delete non-empty nested directories with [jsftp](https://github.com/sergi/jsftp), like 'rm -r'

FTP can natively delete only one directory at the time and it must be empty.

Useful for being able to clean up remote directories before uploading files.

## Install

```
$ npm install --save jsftp-rmr
```

## Usage

```js
var jsFtp = require('jsftp');

// decorate `jsFtp` with a new method `rmr`
jsFtp = require('jsftp-rmr')(jsFtp);

var remoteDirectory = 'public_html/deploy'
    ftp = new jsFtp(options);

ftp.rmr(remoteDirectory, function (err) {
	console.log('Successfully removed:', remoteDirectory);
});
```

## API

### jsFtp.rmr(remoteDirectory, callback)

#### remoteDirectory

*Required*  
Type: `string`

Path of the remote directory to recursively remove.

## Note

Using this command in production can be dangerous. Use it at your own risk. 

## License

MIT © [Alberto Mijares](http://github.com/almilo)
