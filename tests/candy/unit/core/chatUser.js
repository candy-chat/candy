/*global define, Candy */
/*jshint -W030 */

define([
    'intern!bdd'
  , 'intern/chai!expect'
  , 'sinon'
  , 'intern/order!candy/tests/helper.js'
  , 'intern/order!jquery'
  , 'intern/order!candy/libs.bundle.js'
  , 'intern/order!candy/src/candy.js'
  , 'intern/order!candy/src/core.js'
  , 'intern/order!candy/src/core/chatUser.js'
  , 'intern/order!candy/src/core/contact.js'
], function (bdd, expect, sinon, testHelper) {
  bdd.describe('Candy.Core.ChatUser', function () {
    testHelper.setupTests(bdd, sinon);

    var chatUser;

    bdd.beforeEach(function () {
      chatUser = new Candy.Core.ChatUser('foo bar@conference.baz.com/SomeNick', 'SomeNick', 'admin', 'member', 'foo@bar.com/somewhere');
    });

    bdd.it('reveals its JID', function () {
      expect(chatUser.getJid()).to.equal('foo bar@conference.baz.com/SomeNick');
    });

    bdd.it('reveals its escaped JID', function () {
      expect(chatUser.getEscapedJid()).to.equal('foo\\20bar@conference.baz.com/SomeNick');
    });

    bdd.it('allows setting its JID', function () {
      chatUser.setJid('doo dah@bah.com');
      expect(chatUser.getJid()).to.equal('doo dah@bah.com');
      expect(chatUser.getEscapedJid()).to.equal('doo\\20dah@bah.com');
    });

    bdd.it('reveals its real JID', function () {
      expect(chatUser.getRealJid()).to.equal('foo@bar.com/somewhere');
    });

    bdd.it('reveals its nick', function () {
      expect(chatUser.getNick()).to.equal('SomeNick');
    });

    bdd.it('allows setting its nick', function () {
      chatUser.setNick('OtherNick');
      expect(chatUser.getNick()).to.equal('OtherNick');
    });

    bdd.describe('revealing its name', function () {
      bdd.describe('when the user is not in our roster', function () {
        bdd.it('returns the nick', function () {
          expect(chatUser.getName()).to.equal('SomeNick');
        });
      });

      bdd.describe('when the user is in our roster', function () {
        var contact;

        bdd.beforeEach(function () {
          contact = new Candy.Core.Contact({
            jid: 'foo@bar.com',
            name: 'Some Name',
            subscription: 'both',
            groups: ['Friends'],
            resources: {}
          });

          Candy.Core.getRoster().add(contact);
        });

        bdd.it("returns the contact's name", function () {
          expect(chatUser.getName()).to.eql('Some Name');
        });
      });
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

    bdd.describe("getting the user's contact from our roster", function () {
      bdd.describe('when the user is not in our roster', function () {
        bdd.it('returns null', function () {
          expect(chatUser.getContact()).to.be.undefined;
        });
      });

      bdd.describe('when the user is in our roster', function () {
        var contact;

        bdd.beforeEach(function () {
          contact = new Candy.Core.Contact({
            jid: 'foo@bar.com',
            name: 'Some Name',
            subscription: 'both',
            groups: ['Friends'],
            resources: {}
          });

          Candy.Core.getRoster().add(contact);
        });

        bdd.it('returns the contact', function () {
          expect(chatUser.getContact()).to.eql(contact);
        });
      });
    });

    bdd.describe("status", function () {
      bdd.it('is unavailable by default', function () {
        expect(chatUser.getStatus()).to.equal('unavailable');
      });

      bdd.it('can be set', function () {
        chatUser.setStatus('busy');
        expect(chatUser.getStatus()).to.equal('busy');
      });
    });
  });
});
