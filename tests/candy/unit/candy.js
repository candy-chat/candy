/*global define, Candy */

define([
    'intern!bdd'
  , 'intern/chai!expect'
  , 'intern/order!jquery'
  , 'intern/order!candy/libs.bundle.js'
  , 'intern/order!candy/src/candy.js'
], function (bdd, expect, $) {
  bdd.describe('Candy', function () {
    bdd.describe('event triggering', function () {
      bdd.it('should bubble up exceptions from event handlers', function () {
        $(Candy).on('candy:core.message', function(ev, obj) {
          throw new ReferenceError(obj.msg);
        });
        expect(function () {
          $(Candy).triggerHandler('candy:core.message', { msg: 'foo bar' });
        }).to.throw(ReferenceError, /foo bar/);
      });
    });
  });
});
