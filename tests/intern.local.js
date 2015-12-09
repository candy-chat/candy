/*global define */

define([
  './intern'
], function (intern) {
  intern.tunnel = 'NullTunnel';

  intern.environments = [ { browserName: 'chrome', version: '43', platform: [ 'Linux' ] } ];

  intern.tunnelOptions = {
    hostname: 'selenium',
    port: '4444',
    verbose: true
  };

  intern.proxyUrl = 'http://grunt:9000/';

  return intern;
});
