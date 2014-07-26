/*global define, Candy */
/*jshint -W030 */

define([
    'intern!bdd'
  , 'intern/chai!expect'
  , 'intern/order!jquery'
  , 'intern/order!candy/libs.bundle.js'
  , 'intern/order!candy/src/candy.js'
  , 'intern/order!candy/src/core.js'
  , 'intern/order!candy/src/core/chatUser.js'
  , 'intern/order!candy/src/core/chatRoster.js'
], function (bdd, expect) {
  bdd.describe('Candy.Core.ChatRoster', function () {
    var chatRoster;

    bdd.beforeEach(function () {
      chatRoster = new Candy.Core.ChatRoster();
    });

    bdd.it('can add and fetch users', function () {
      expect(chatRoster.get('foo@bar.com')).to.be.undefined;

      var chatUser = new Candy.Core.ChatUser('foo@bar.com', 'SomeNick');
      chatRoster.add(chatUser);

      expect(chatRoster.get('foo@bar.com')).to.be.equal(chatUser);
    });

    bdd.it('reveals the full set of users', function () {
      expect(chatRoster.getAll()).to.be.empty;

      var chatUser = new Candy.Core.ChatUser('foo@bar.com', 'SomeNick');
      chatRoster.add(chatUser);

      expect(chatRoster.getAll()).to.eql({'foo@bar.com': chatUser});
    });

    bdd.it('can remove users', function () {
      var chatUser = new Candy.Core.ChatUser('foo@bar.com', 'SomeNick');
      chatRoster.add(chatUser);

      chatRoster.remove('foo@bar.com');

      expect(chatRoster.get('foo@bar.com')).to.be.undefined;
      expect(chatRoster.getAll()).to.be.empty;
    });
  });
});
