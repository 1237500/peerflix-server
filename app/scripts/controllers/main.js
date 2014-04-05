'use strict';

angular.module('peerflixServerApp')
  .controller('MainCtrl', function ($scope, $resource, $log, torrentSocket) {
    var Torrent = $resource('/torrents/:infoHash');
    var torrents = Torrent.query(function () {
      $scope.torrents = torrents;
    });

    $scope.download = function () {
      var torrent = new Torrent();
      torrent.link = $scope.link;
      torrent.$save();
      $scope.link = '';
    };

    torrentSocket.on('ready', function (hash) {
      $log.info('ready', hash);
      var torrent = Torrent.get({ infoHash: hash }, function () {
        $scope.torrents.unshift(torrent);
      });
    });

    torrentSocket.on('interested', function (hash, stats) {
      var torrent = _.find($scope.torrents, { infoHash: hash });
      torrent.interested = true;
      torrent.stats = stats;
    });

    torrentSocket.on('uninterested', function (hash) {
      var torrent = _.find($scope.torrents, { infoHash: hash });
      torrent.interested = false;
      torrent.stats = undefined;
    });

    torrentSocket.on('stats', function (hash, stats) {
      var torrent = _.find($scope.torrents, { infoHash: hash });
      torrent.stats = stats;
    });
  });
