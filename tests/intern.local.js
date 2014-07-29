/*global define */

define([
  './intern'
], function (intern) {
  intern.tunnel = 'NullTunnel';

  intern.environments = [ { browserName: 'phantomjs' } ];

  return intern;
});
