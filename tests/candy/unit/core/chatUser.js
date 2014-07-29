/*global define, Candy */

define([
    'intern!bdd'
  , 'intern/chai!expect'
  , 'intern/order!../../../../bower_components/jquery/jquery.js'
  , 'intern/order!../../../../libs.bundle.js'
  , 'intern/order!../../../../src/candy.js'
  , 'intern/order!../../../../src/core.js'
  , 'intern/order!../../../../src/core/chatUser.js'
], function (bdd, expect) {
  bdd.describe('Candy.Core.ChatUser', function () {
    var chatUser;

    bdd.beforeEach(function () {
      chatUser = new Candy.Core.ChatUser('foo bar@baz.com', 'SomeNick', 'admin', 'member');
    });

    bdd.it('reveals its JID', function () {
      expect(chatUser.getJid()).to.equal('foo bar@baz.com');
    });

    bdd.it('reveals its escaped JID', function () {
      expect(chatUser.getEscapedJid()).to.equal('foo\\20bar@baz.com');
    });

    bdd.it('allows setting its JID', function () {
      chatUser.setJid('doo dah@bah.com');
      expect(chatUser.getJid()).to.equal('doo dah@bah.com');
      expect(chatUser.getEscapedJid()).to.equal('doo\\20dah@bah.com');
    });

    bdd.it('reveals its nick', function () {
      expect(chatUser.getNick()).to.equal('SomeNick');
    });

    bdd.it('allows setting its nick', function () {
      chatUser.setNick('OtherNick');
      expect(chatUser.getNick()).to.equal('OtherNick');
    });

    bdd.it('reveals its role', function () {
      expect(chatUser.getRole()).to.equal('member');
    });

    bdd.it('allows setting its role', function () {
      chatUser.setRole('moderator');
      expect(chatUser.getRole()).to.equal('moderator');
    });

    bdd.it('reveals its affiliation', function () {
      expect(chatUser.getAffiliation()).to.equal('admin');
    });

    bdd.it('allows setting its affiliation', function () {
      chatUser.setAffiliation('owner');
      expect(chatUser.getAffiliation()).to.equal('owner');
    });

    bdd.describe('isModerator()', function () {
      bdd.describe('when the user is not a moderator', function () {
        bdd.it('returns false', function () {
          expect(chatUser.getRole()).to.equal('member');
          expect(chatUser.getAffiliation()).to.equal('admin');
          expect(chatUser.isModerator()).to.equal(false);
        });
      });

      bdd.describe('when the role is moderator', function () {
        bdd.beforeEach(function () {
          chatUser.setRole('moderator');
        });

        bdd.it('returns true', function () {
          expect(chatUser.isModerator()).to.equal(true);
        });
      });

      bdd.describe('when the affiliation is owner', function () {
        bdd.beforeEach(function () {
          chatUser.setAffiliation('owner');
        });

        bdd.it('returns true', function () {
          expect(chatUser.isModerator()).to.equal(true);
        });
      });
    });
  });
});
