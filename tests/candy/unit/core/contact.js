/*global define, Candy */
/*jshint -W030 */

define([
    'intern!bdd'
  , 'intern/chai!expect'
  , 'intern/order!jquery'
  , 'intern/order!candy/libs.bundle.js'
  , 'intern/order!candy/src/candy.js'
  , 'intern/order!candy/src/core.js'
  , 'intern/order!candy/src/core/contact.js'
], function (bdd, expect) {
  bdd.describe('Candy.Core.Contact', function () {
    var contact;

    bdd.beforeEach(function () {
      contact = new Candy.Core.Contact({jid: 'foo bar@baz.com', name: 'Some Name', subscription: 'both', groups: ['Friends']});
    });

    bdd.it('reveals its JID', function () {
      expect(contact.getJid()).to.equal('foo bar@baz.com');
    });

    bdd.it('reveals its escaped JID', function () {
      expect(contact.getEscapedJid()).to.equal('foo\\20bar@baz.com');
    });

    bdd.it('reveals its name', function () {
      expect(contact.getName()).to.equal('Some Name');
    });

    bdd.it('reveals its subscription', function () {
      expect(contact.getSubscription()).to.equal('both');
    });

    bdd.it('reveals its groups', function () {
      expect(contact.getGroups()).to.eql(['Friends']);
    });
  });
});
