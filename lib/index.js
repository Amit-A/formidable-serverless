const formidable = require('formidable');

// modifying the parse function

formidable.IncomingForm.prototype.parse = function(req, cb) {

  // setup callback first, so we don't miss data events emitted immediately
  if (cb) {
    const fields = {};
    const files = {};
    this
      .on('field', function (name, value) {
        fields[name] = value;
      })
      .on('file', function (name, file) {
        if (this.multiples) {
          if (files[name]) {
            if (!Array.isArray(files[name])) {
              files[name] = [files[name]];
            }
            files[name].push(file);
          } else {
            files[name] = file;
          }
        } else {
          files[name] = file;
        }
      })
      .on('error', function (err) {
        cb(err, fields, files);
      })
      .on('end', function () {
        cb(null, fields, files);
      });
  }

  const self = this;

  req.on('error', function (err) {
    self._error(err);
  });

  req.on('end', function () {
    if (self.error) {
      return;
    }
    const err = self._parser.end();
    if (err) {
      self._error(err);
    }
  });

  // handling serverless cases
  if (Buffer.isBuffer(req.rawBody)) { // firebase
    try {
      // parse headers
      this.writeHeaders(req.headers);
      // parse body
      this.write(req.rawBody);
    } catch (err) {
      this._error(err);
    }
  } else if (Buffer.isBuffer(req.body)) { // body parser
    try {
      // parse headers
      this.writeHeaders(req.headers);
      // parse body
      this.write(req.body);
    } catch (err) {
      this._error(err);
    }
  } else {
    // standard formidable parse prototype (not serverless)...

    this.pause = function () {
      try {
        req.pause();
      } catch (err) {
        // the stream was destroyed
        if (!this.ended) {
          // before it was completed, crash & burn
          this._error(err);
        }
        return false;
      }
      return true;
    };

    this.resume = function () {
      try {
        req.resume();
      } catch (err) {
        // the stream was destroyed
        if (!this.ended) {
          // before it was completed, crash & burn
          this._error(err);
        }
        return false;
      }
      return true;
    };

    // parse headers
    try {
      this.writeHeaders(req.headers);
    } catch (err) {
      this._error(err);
    }

    // start listening for data...

    req.on('aborted', function () {
      self.emit('aborted');
      self._error(new Error('Request aborted'));
    });

    req.on('data', function (buffer) {
      try {
        self.write(buffer);
      } catch (err) {
        self._error(err);
      }
    });
  }
  return this;
};

module.exports = formidable;
