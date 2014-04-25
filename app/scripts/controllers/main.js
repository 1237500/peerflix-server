'use strict';

angular.module('peerflixServerApp')
  .controller('MainCtrl', function ($scope, $resource, $log, $q, torrentSocket) {
    var Torrent = $resource('/torrents/:infoHash');
    var torrents = Torrent.query(function () {
      $scope.torrents = torrents;
    });

    $scope.download = function () {
      Torrent.save({ link: $scope.link });
      $scope.link = '';
    };

    $scope.pauseResume = function (torrent) {
      torrentSocket.emit(torrent.stats.paused ? 'resume' : 'pause', torrent.infoHash);
    };

    $scope.select = function (torrent, file) {
      torrentSocket.emit(file.selected ? 'deselect' : 'select', torrent.infoHash, torrent.files.indexOf(file));
    };

    $scope.remove = function (torrent) {
      Torrent.remove({ infoHash: torrent.infoHash });
    };

    function findTorrent(hash) {
      var torrent = _.find($scope.torrents, { infoHash: hash });
      if (torrent) {
        return $q.when(torrent);
      } else {
        return Torrent.get({ infoHash: hash }).$promise.then(function (torrent) {
          $scope.torrents.unshift(torrent);
          return torrent;
        });
      }
    }

    torrentSocket.on('verifying', function (hash) {
      findTorrent(hash);
    });

    torrentSocket.on('ready', function (hash) {
      findTorrent(hash).then(function (torrent) {
        torrent.ready = true;
      });
    });

    torrentSocket.on('interested', function (hash) {
      findTorrent(hash).then(function (torrent) {
        torrent.interested = true;
      });
    });

    torrentSocket.on('uninterested', function (hash) {
      findTorrent(hash).then(function (torrent) {
        torrent.interested = false;
      });
    });

    torrentSocket.on('stats', function (hash, stats) {
      findTorrent(hash).then(function (torrent) {
        torrent.stats = stats;
      });
    });

    torrentSocket.on('download', function (hash, progress) {
      findTorrent(hash).then(function (torrent) {
        torrent.progress = progress;
      });
    });

    torrentSocket.on('destroyed', function (hash) {
      _.remove($scope.torrents, { infoHash: hash });
    });
  });
