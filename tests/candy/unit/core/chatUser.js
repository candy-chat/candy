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

    bdd.describe('privacy lists', function () {
      bdd.it('has only empty lists to start', function () {
        expect(chatUser.getPrivacyList('somelist')).to.be.empty;
        expect(chatUser.isInPrivacyList('somelist', 'some@jid.com')).to.be.false;
      });

      bdd.it('can have existing lists set', function () {
        chatUser.setPrivacyLists({'somelist': ['some@jid.com']});
        expect(chatUser.isInPrivacyList('somelist', 'some@jid.com')).to.be.true;
        expect(chatUser.isInPrivacyList('otherlist', 'some@jid.com')).to.be.false;
      });

      bdd.it('can have contacts toggled in and out of a list', function () {
        expect(chatUser.isInPrivacyList('somelist', 'some@jid.com')).to.be.false;
        expect(chatUser.isInPrivacyList('otherlist', 'some@jid.com')).to.be.false;

        chatUser.addToOrRemoveFromPrivacyList('somelist', 'some@jid.com');
        expect(chatUser.isInPrivacyList('somelist', 'some@jid.com')).to.be.true;
        expect(chatUser.isInPrivacyList('otherlist', 'some@jid.com')).to.be.false;

        chatUser.addToOrRemoveFromPrivacyList('somelist', 'some@jid.com');
        expect(chatUser.isInPrivacyList('somelist', 'some@jid.com')).to.be.false;
        expect(chatUser.isInPrivacyList('otherlist', 'some@jid.com')).to.be.false;
      });
    });

    bdd.describe('custom data', function () {
      bdd.it('can be written and read', function () {
        expect(chatUser.getCustomData()).to.eql({});
        chatUser.setCustomData({foo: 'bar'});
        expect(chatUser.getCustomData()).to.eql({foo: 'bar'});
      });
    });

    bdd.describe('previous nick', function () {
      bdd.it('can be written and read', function () {
        expect(chatUser.getPreviousNick()).to.equal(undefined);
        chatUser.setPreviousNick('oldNick');
        expect(chatUser.getPreviousNick()).to.equal('oldNick');
      });
    });
  });
});
