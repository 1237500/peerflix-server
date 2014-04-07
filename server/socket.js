'use strict';

var io = require('socket.io').listen(8111),
  _ = require('lodash'),
  progress = require('./progressbar');

io.set('log level', 2);

io.sockets.on('connection', function (socket) {
  var store = require('./store');
  socket.on('pause', function (infoHash) {
    console.log('pausing ' + infoHash);
    store.get(infoHash).swarm.pause();
  });
  socket.on('resume', function (infoHash) {
    console.log('resuming ' + infoHash);
    store.get(infoHash).swarm.resume();
  });
  socket.on('select', function (infoHash, file) {
    console.log('selected ' + infoHash + '/' + file);
    file = store.get(infoHash).files[file];
    file.select();
    file.selected = true;
  });
  socket.on('deselect', function (infoHash, file) {
    console.log('deselected ' + infoHash + '/' + file);
    file = store.get(infoHash).files[file];
    file.deselect();
    file.selected = false;
  });
});

module.exports = {
  register: function (engine) {
    var hash;

    engine.once('ready', function () {
      hash = engine.torrent.infoHash;
      io.sockets.emit('ready', hash, stats());

      engine.on('uninterested', function () {
        io.sockets.emit('uninterested', hash);
      });

      engine.on('interested', function () {
        io.sockets.emit('interested', hash);
      });

      setInterval(function () {
        io.sockets.emit('stats', hash, stats());
      }, 1000);

      engine.on('download', _.throttle(function () {
        io.sockets.emit('download', hash, progress(engine.bitfield.buffer));
      }, 1000));
    });

    var stats = function () {
      var swarm = engine.swarm;
      return {
        peers: {
          total: swarm.wires.length,
          unchocked: swarm.wires.reduce(function (prev, wire) {
            return prev + !wire.peerChoking;
          }, 0)
        },
        traffic: {
          down: swarm.downloaded,
          up: swarm.uploaded
        },
        speed: {
          down: swarm.downloadSpeed(),
          up: swarm.uploadSpeed()
        },
        queue: swarm.queued,
        paused: swarm.paused
      };
    };
  }
};
