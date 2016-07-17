/*
 * grunt-gcloud
 * https://github.com/ubilabs/grunt-gcloud
 *
 * Copyright (c) 2014 Frank Mecklenburg Ubilabs
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
  var fs = require('fs'),
    async = require('async'),
    storage, bucket, asyncTasks = [];

  grunt.registerMultiTask('gcloud', 'Grunt wrapper for google-gcloud.', function() {
    var done = this.async(),
      options = this.options({
        keyFilename: '.gcloud.json',
        options: {},
        appendSlash: false
      }),
      gcloud = require('gcloud'),
      storage = gcloud({
        projectId: options.projectId,
        keyFilename: options.keyFilename
      }).storage(),
      bucket = storage.bucket(options.bucket);

    var _this = this;
    this.files.forEach(function(filePair) {
      filePair.src.forEach(function(src) {
        var srcFile = (_this.data.expand) ? src : filePair.cwd + '/' + src;
        var destFile = (_this.data.expand) ? filePair.dest : (filePair.dest === undefined || filePair.dest === '') ? src : filePair.dest + src;

        if (!grunt.file.isDir(srcFile)) {
          asyncTasks.push(
            function(callback) {
              var bucketOptions = JSON.parse(JSON.stringify(options.options));
              if (!bucketOptions.hasOwnProperty('gzip')){
                  bucketOptions.gzip = true;
              }
              if (options.appendSlash){
                  destFile = "/" + destFile;
              }
              bucketOptions.destination = destFile;

              bucket.upload(srcFile, bucketOptions, function(err, file) {
                if (err) {
                  grunt.fail.warn(err);
                }

                grunt.log.ok('Uploading [' + file.name + ']');

                callback();
              });
            });
        }
      });
    });

    async.parallelLimit(asyncTasks, options.asyncLimit || 100, function() {
      done();
    });
  });
};
