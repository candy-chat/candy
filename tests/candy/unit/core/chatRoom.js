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
  , 'intern/order!candy/src/core/chatRoom.js'
], function (bdd, expect) {
  bdd.describe('Candy.Core.ChatRoom', function () {
    var chatRoom;

    bdd.beforeEach(function () {
      chatRoom = new Candy.Core.ChatRoom('foo@conference.example.com');
    });

    bdd.it('reveals its JID', function () {
      expect(chatRoom.getJid()).to.equal('foo@conference.example.com');
    });

    bdd.it('defaults its name to the node part of the JID', function () {
      expect(chatRoom.getName()).to.equal('foo');
    });

    bdd.it('can set a new name', function () {
      chatRoom.setName('SomeRoom');
      expect(chatRoom.getName()).to.equal('SomeRoom');
    });

    bdd.it('can associate a user', function () {
      expect(chatRoom.getUser()).to.be.null;

      var chatUser = new Candy.Core.ChatUser('foo@bar.com', 'SomeNick');
      chatRoom.setUser(chatUser);

      expect(chatRoom.getUser()).to.eql(chatUser);
    });

    bdd.it('has an (initially empty) roster', function () {
      var roster = chatRoom.getRoster();
      expect(roster).to.be.an.instanceof(Candy.Core.ChatRoster);
      expect(roster.getAll()).to.be.empty;
    });
  });
});
