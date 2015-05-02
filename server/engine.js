'use strict';
var torrentStream = require('torrent-stream'),
  _ = require('lodash');

var BITTORRENT_PORT = 6881;

module.exports = function (torrent, opts) {
  var engine = torrentStream(torrent, _.clone(opts, true));

  engine.once('verifying', function () {
    console.log('verifying ' + engine.infoHash);
    engine.files.forEach(function (file, i) {
      console.log(i + ' ' + file.name);
    });
  });

  engine.once('ready', function () {
    console.log('ready ' + engine.infoHash);
    engine.torrent.ready = true;
  });

  engine.on('uninterested', function () {
    console.log('uninterested ' + engine.infoHash);
  });

  engine.on('interested', function () {
    console.log('interested ' + engine.infoHash);
  });

  engine.on('idle', function () {
    console.log('idle ' + engine.infoHash);
  });

  engine.on('error', function (e) {
    console.log('error ' + engine.infoHash + ': ' + e);
  });

  engine.once('destroyed', function () {
    console.log('destroyed ' + engine.infoHash);
    engine.removeAllListeners();
  });

  engine.listen(BITTORRENT_PORT, function () {
    console.log('listening ' + engine.infoHash + ' on port ' + engine.port);
  });

  return engine;
};
