# formidable-serverless

[![npm version](https://badge.fury.io/js/formidable-serverless.svg)](https://badge.fury.io/js/formidable-serverless)

## Purpose

This module is a variant of [formidable](https://www.npmjs.com/package/formidable) with tweaks to enable use in serverless environments (AWS Lambda, Firebase/Google Cloud Functions, etc.) and environments where the request has already been processed (e.g. by bodyparser).

The functionality and usage/API are identical to [formidable](https://www.npmjs.com/package/formidable) (documentation cloned below).

## Status

Sponsored and maintained by the folks at [testmail.app](https://testmail.app)

## How it works

The preprocessing by bodyparsers built-in to serverless environments breaks formidable's parse handlers and causes "Request Aborted" errors. This module imports formidable as a dependency and modifies the handlers to support preprocessed request bodies.

This module can also be used in non-serverless environments (usage and API are identical), but it may be a version or two behind. This package is focused on serverless - if you have issues with formidable itself, please open them in the formidable repo.

## Formidable

A Node.js module for parsing form data, especially file uploads.

Formidable was developed for [Transloadit](http://transloadit.com/), a service focused on uploading and encoding images and videos. It has been battle-tested against hundreds of GB of file uploads from a large variety of clients and is considered production-ready.

## Features

* Fast (~500mb/sec), non-buffering multipart parser
* Automatically writing file uploads to disk
* Low memory footprint
* Graceful error handling
* Very high test coverage

## Installation

```sh
npm install --save formidable-serverless
```

This is a low-level package, and if you're using a high-level framework it may already be included. However, [Express v4](http://expressjs.com) does not include any multipart handling, nor does [body-parser](https://github.com/expressjs/body-parser).

## Example

Parse an incoming file upload.

```javascript
const formidable = require('formidable-serverless');
const http = require('http');
const util = require('util');

http.createServer(function(req, res) {
  if (req.url == '/upload' && req.method.toLowerCase() == 'post') {
    // parse a file upload
    const form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
      res.writeHead(200, {'content-type': 'text/plain'});
      res.write('received upload:\n\n');
      res.end(util.inspect({fields: fields, files: files}));
    });

    return;
  }

  // show a file upload form
  res.writeHead(200, {'content-type': 'text/html'});
  res.end(
    '<form action="/upload" enctype="multipart/form-data" method="post">'+
    '<input type="text" name="title"><br>'+
    '<input type="file" name="upload" multiple="multiple"><br>'+
    '<input type="submit" value="Upload">'+
    '</form>'
  );
}).listen(8080);
```

## API

### Formidable.IncomingForm

```javascript
var form = new formidable.IncomingForm()
```

Creates a new incoming form.

```javascript
form.encoding = 'utf-8';
```

Sets encoding for incoming form fields.

```javascript
form.uploadDir = "/my/dir";
```

Sets the directory for placing file uploads in. You can move them later on using `fs.rename()`. The default is `os.tmpdir()`.

```javascript
form.keepExtensions = false;
```

If you want the files written to `form.uploadDir` to include the extensions of the original files, set this property to `true`.

```javascript
form.type
```

Either 'multipart' or 'urlencoded' depending on the incoming request.

```javascript
form.maxFieldsSize = 20 * 1024 * 1024;
```

Limits the amount of memory all fields together (except files) can allocate in bytes. If this value is exceeded, an `'error'` event is emitted. The default size is 20MB.

```javascript
form.maxFileSize = 200 * 1024 * 1024;
```

Limits the size of uploaded file. If this value is exceeded, an `'error'` event is emitted. The default size is 200MB.

```javascript
form.maxFields = 1000;
```

Limits the number of fields that the querystring parser will decode. Defaults to 1000 (0 for unlimited).

```javascript
form.hash = false;
```

If you want checksums calculated for incoming files, set this to either `'sha1'` or `'md5'`.

```javascript
form.multiples = false;
```

If this option is enabled, when you call `form.parse`, the `files` argument will contain arrays of files for inputs which submit multiple files using the HTML5 `multiple` attribute.

```javascript
form.bytesReceived
```

The amount of bytes received for this form so far.

```javascript
form.bytesExpected
```

The expected number of bytes in this form.

```javascript
form.parse(request, [cb]);
```

Parses an incoming node.js `request` containing form data. If `cb` is provided, all fields and files are collected and passed to the callback:

```javascript
form.parse(req, function(err, fields, files) {
  // ...
});

form.onPart(part);
```

You may overwrite this method if you are interested in directly accessing the multipart stream. Doing so will disable any `'field'` / `'file'` events  processing which would occur otherwise, making you fully responsible for handling the processing.

```javascript
form.onPart = function(part) {
  part.addListener('data', function() {
    // ...
  });
}
```

If you want to use formidable to only handle certain parts for you, you can do so:

```javascript
form.onPart = function(part) {
  if (!part.filename) {
    // let formidable handle all non-file parts
    form.handlePart(part);
  }
}
```

Check the code in this method for further inspiration.

### Formidable.File

```javascript
file.size = 0
```

The size of the uploaded file in bytes. If the file is still being uploaded (see `'fileBegin'` event), this property says how many bytes of the file have been written to disk yet.

```javascript
file.path = null
```

The path this file is being written to. You can modify this in the `'fileBegin'` event in case you are unhappy with the way formidable generates a temporary path for your files.

```javascript
file.name = null
```

The name this file had according to the uploading client.

```javascript
file.type = null
```

The mime type of this file, according to the uploading client.

```javascript
file.lastModifiedDate = null
```

A date object (or `null`) containing the time this file was last written to. Mostly here for compatibility with the [W3C File API Draft](http://dev.w3.org/2006/webapi/FileAPI/).

```javascript
file.hash = null
```

If hash calculation was set, you can read the hex digest out of this var.

#### Formidable.File#toJSON()

This method returns a JSON-representation of the file, allowing you to `JSON.stringify()` the file which is useful for logging and responding to requests.

### Events

#### 'progress'

Emitted after each incoming chunk of data that has been parsed. Can be used to roll your own progress bar.

```javascript
form.on('progress', function(bytesReceived, bytesExpected) {
});
```

#### 'field'

Emitted whenever a field / value pair has been received.

```javascript
form.on('field', function(name, value) {
});
```

#### 'fileBegin'

Emitted whenever a new file is detected in the upload stream. Use this event if you want to stream the file to somewhere else while buffering the upload on the file system.

```javascript
form.on('fileBegin', function(name, file) {
});
```

#### 'file'

Emitted whenever a field / file pair has been received. `file` is an instance of `File`.

```javascript
form.on('file', function(name, file) {
});
```

#### 'error'

Emitted when there is an error processing the incoming form. A request that experiences an error is automatically paused, you will have to manually call `request.resume()` if you want the request to continue firing `'data'` events.

```javascript
form.on('error', function(err) {
});
```

#### 'aborted'

Emitted when the request was aborted by the user. Right now this can be due to a 'timeout' or 'close' event on the socket. After this event is emitted, an `error` event will follow. In the future there will be a separate 'timeout' event (needs a change in the node core).

```javascript
form.on('aborted', function() {
});
```

##### 'end'

```javascript
form.on('end', function() {
});
```

Emitted when the entire request has been received, and all contained files have finished flushing to disk. This is a great place for you to send your response.

## License

Formidable and formidable-serverless are licensed under the MIT license.
