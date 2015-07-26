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
      contact = new Candy.Core.Contact({
        jid: 'foo bar@baz.com',
        name: 'Some Name',
        subscription: 'both',
        groups: ['Friends'],
        resources: {}
      });
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

    bdd.it('reveals its name as its Nick for compatability with ChatUser', function () {
      expect(contact.getNick()).to.equal('Some Name');
    });

    bdd.it('reveals its subscription', function () {
      expect(contact.getSubscription()).to.equal('both');
    });

    bdd.it('reveals its groups', function () {
      expect(contact.getGroups()).to.eql(['Friends']);
    });

    bdd.it('defaults the priority to 0 when not defined', function() {
     contact.data.resources = {
       'resource1': {
          show: 'away',
          status: 'Hanging out',
          priority: 0
        },
       'resource2': {
          show: 'available',
          status: 'Not Hanging out',
          priority: ""
        }
      };
      expect(contact.getStatus()).to.eql('available');
    });

    bdd.describe('aggregate status', function () {
      bdd.describe('when there are no online resources', function () {
        bdd.it('is unavailable when there are no online resources', function () {
          expect(contact.getStatus()).to.eql('unavailable');
        });
      });

      bdd.describe('when only one resource is online', function () {
        bdd.beforeEach(function () {
          contact = new Candy.Core.Contact({
            jid: 'foo bar@baz.com',
            name: 'Some Name',
            subscription: 'both',
            groups: ['Friends'],
            resources: {
              'foo bar@baz.com/resource1': {
                show: 'away',
                status: 'Hanging out',
                priority: 0
              }
            }
          });
        });

        bdd.it('matches the show attribute of the online resource', function () {
          expect(contact.getStatus()).to.eql('away');
        });

        bdd.describe('when its show is not available', function () {
          bdd.beforeEach(function () {
            contact = new Candy.Core.Contact({
              jid: 'foo bar@baz.com',
              name: 'Some Name',
              subscription: 'both',
              groups: ['Friends'],
              resources: {
                'foo bar@baz.com/resource1': {
                  status: 'Hanging out',
                  priority: 0
                }
              }
            });
          });

          bdd.it('appears available', function () {
            expect(contact.getStatus()).to.eql('available');
          });
        });

        bdd.describe('when its show is null', function () {
          bdd.beforeEach(function () {
            contact = new Candy.Core.Contact({
              jid: 'foo bar@baz.com',
              name: 'Some Name',
              subscription: 'both',
              groups: ['Friends'],
              resources: {
                'foo bar@baz.com/resource1': {
                  show: null,
                  status: 'Hanging out',
                  priority: 0
                }
              }
            });
          });

          bdd.it('appears available', function () {
            expect(contact.getStatus()).to.eql('available');
          });
        });

        bdd.describe('when its show is empty', function () {
          bdd.beforeEach(function () {
            contact = new Candy.Core.Contact({
              jid: 'foo bar@baz.com',
              name: 'Some Name',
              subscription: 'both',
              groups: ['Friends'],
              resources: {
                'foo bar@baz.com/resource1': {
                  show: '',
                  status: 'Hanging out',
                  priority: 0
                }
              }
            });
          });

          bdd.it('appears available', function () {
            expect(contact.getStatus()).to.eql('available');
          });
        });
      });

      bdd.describe('when multiple resources are online', function () {
        bdd.describe('with the same priority', function () {
          bdd.beforeEach(function () {
            contact = new Candy.Core.Contact({
              jid: 'foo bar@baz.com',
              name: 'Some Name',
              subscription: 'both',
              groups: ['Friends'],
              resources: {
                'foo bar@baz.com/resource1': {
                  show: 'away',
                  status: 'Hanging out',
                  priority: 5
                },
                'foo bar@baz.com/resource2': {
                  show: 'dnd',
                  status: 'Doing stuff',
                  priority: 5
                }
              }
            });
          });

          bdd.it('matches the lowest weighted status', function () {
            expect(contact.getStatus()).to.eql('dnd');
          });
        });

        bdd.describe('with differing priority', function () {
          bdd.beforeEach(function () {
            contact = new Candy.Core.Contact({
              jid: 'foo bar@baz.com',
              name: 'Some Name',
              subscription: 'both',
              groups: ['Friends'],
              resources: {
                'foo bar@baz.com/resource1': {
                  show: 'away',
                  status: 'Hanging out',
                  priority: 10
                },
                'foo bar@baz.com/resource2': {
                  show: 'dnd',
                  status: 'Doing stuff',
                  priority: 5
                }
              }
            });
          });

          bdd.it('matches the show attribute of the highest priority resource', function () {
            expect(contact.getStatus()).to.eql('away');
          });
        });
      });
    });
  });
});
