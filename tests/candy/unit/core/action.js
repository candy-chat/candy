/*global define, Candy, Strophe, $iq */
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
	, 'intern/order!candy/src/core/action.js'
	, 'intern/order!candy/src/core/event.js'
	, 'intern/order!candy/src/core/contact.js'
], function (bdd, expect, sinon, testHelper, $) {
	bdd.describe('Candy.Core.Action', function () {
		testHelper.setupTests(bdd, sinon);

		bdd.describe('requesting the roster', function() {
			bdd.it('sends a roster request stanza', function () {
				var request = sinon.spy(Candy.Core.getConnection(), 'send');

				Candy.Core.Action.Jabber.Roster();

				var stanza = testHelper.stanzaFromRequest(request);
				expect(stanza.prop('tagName')).to.eql('iq');
				expect(stanza.attr('type')).to.eql('get');
				expect(stanza.children('query').attr('xmlns')).to.eql('jabber:iq:roster');
			});

			bdd.describe('if roster versioning is supported server side', function () {
				bdd.beforeEach(function () {
					Candy.Core.getConnection().features = Strophe.xmlGenerator().createElement("stream:features");
					var verFeature = Strophe.xmlGenerator().createElement('ver');
					verFeature.setAttribute('xmlns', 'urn:xmpp:features:rosterver');
					Candy.Core.getConnection().features.appendChild(verFeature);
				});

				bdd.it('bootstraps the roster from the initial items provided', function () {
					Candy.Core.Action.Jabber.Roster();

					var rosterItem = Candy.Core.getRoster().get('stored@guy.com');
					expect(rosterItem.getName()).to.eql('Stored Guy');
					expect(rosterItem.getJid()).to.eql('stored@guy.com');
					expect(rosterItem.getSubscription()).to.eql('both');
					expect(rosterItem.getGroups()).to.eql(['Some', 'People']);
					expect(rosterItem.getStatus()).to.eql('unavailable'); // Throw away resources from the cache
				});

				bdd.it('includes the cached version in the roster request', function () {
					var request = sinon.spy(Candy.Core.getConnection(), 'send');

					Candy.Core.Action.Jabber.Roster();

					var stanza = testHelper.stanzaFromRequest(request);
					expect(stanza.children('query').attr('ver')).to.eql('abc');
				});

				bdd.it('emits an event indicating that the roster was loaded from cache', function () {
					var foo;
					$(Candy).on('candy:core:roster:loaded', function (ev, params) { foo = params; });
					Candy.Core.Action.Jabber.Roster();
					expect(foo).to.be.eql({roster: Candy.Core.getRoster()});
				});
			});

			bdd.describe('once the roster is received', function () {
				var receiveResponse = function () {
					var rosterResponse = $iq({
						type: 'result',
						id: '1:roster'
					})
					.c('query', {xmlns: 'jabber:iq:roster'})
					.c('item', {jid: 'foo@bar.com', name: 'Foo Bar', subscription: 'both'})
					.c('group').t('Friends').up()
					.c('group').t('Close Friends').up()
					.up()
					.c('item', {jid: 'doo@dah.com'});

					testHelper.receiveStanza(rosterResponse);
				};

				bdd.beforeEach(Candy.Core.Action.Jabber.Roster);

				bdd.it('makes the returned items available in the main roster', function () {
					receiveResponse();
					expect(Candy.Core.getRoster().getAll()).to.have.keys(['foo@bar.com', 'doo@dah.com']);
					expect(Candy.Core.getRoster().get('foo@bar.com')).to.be.an.instanceof(Candy.Core.Contact);
					expect(Candy.Core.getRoster().get('doo@dah.com')).to.be.an.instanceof(Candy.Core.Contact);
				});

				bdd.it('records the contact name properly', function () {
					receiveResponse();
					var rosterItem = Candy.Core.getRoster().get('foo@bar.com');
					expect(rosterItem.getName()).to.eql('Foo Bar');
				});

				bdd.it('uses the JID as name if not available', function () {
					receiveResponse();
					var rosterItem = Candy.Core.getRoster().get('doo@dah.com');
					expect(rosterItem.getName()).to.eql('doo@dah.com');
				});

				bdd.it('records the subscription', function () {
					receiveResponse();
					var rosterItem = Candy.Core.getRoster().get('foo@bar.com');
					expect(rosterItem.getSubscription()).to.eql('both');
				});

				bdd.it('records the subscription as none by default', function () {
					receiveResponse();
					var rosterItem = Candy.Core.getRoster().get('doo@dah.com');
					expect(rosterItem.getSubscription()).to.eql('none');
				});

				bdd.it('records groups', function () {
					receiveResponse();
					var rosterItem = Candy.Core.getRoster().get('foo@bar.com');
					expect(rosterItem.getGroups()).to.eql(['Friends', 'Close Friends']);
				});

				bdd.it('emits an event indicating that the roster was fetched', function () {
					var foo;
					$(Candy).on('candy:core:roster:fetched', function (ev, params) { foo = params; });
					receiveResponse();
					expect(foo).to.be.eql({roster: Candy.Core.getRoster()});
				});

				bdd.describe('updating roster items from pushes', function () {
					bdd.beforeEach(receiveResponse);

					bdd.describe('modifying a user', function () {
						var modifiedUser;

						var receivePush = function () {
							var rosterPush = $iq({
								type: 'set'
							})
							.c('query', {xmlns: 'jabber:iq:roster'})
							.c('item', {jid: 'foo@bar.com', name: 'My Friend', subscription: 'to'})
							.c('group').t('Friends');

							testHelper.receiveStanza(rosterPush);

							modifiedUser = Candy.Core.getRoster().get('foo@bar.com');
						};

						bdd.it('updates the nick', function () {
							receivePush();
							expect(modifiedUser.getName()).to.equal('My Friend');
						});

						bdd.it('updates the affiliation', function () {
							receivePush();
							expect(modifiedUser.getSubscription()).to.equal('to');
						});

						bdd.it('updates the groups', function () {
							receivePush();
							expect(modifiedUser.getGroups()).to.eql(['Friends']);
						});

						bdd.it('emits an event indicating that the roster was updated', function () {
							var eventParams = null;
							$(Candy).on('candy:core:roster:updated', function (ev, params) { eventParams = params; });
							receivePush();
							expect(eventParams).to.eql({contact: modifiedUser});
						});
					});

					bdd.describe('removing a user', function () {
						var receivePush = function () {
							var rosterPush = $iq({
								type: 'set'
							})
							.c('query', {xmlns: 'jabber:iq:roster'})
							.c('item', {jid: 'foo@bar.com', subscription: 'remove'});

							testHelper.receiveStanza(rosterPush);
						};

						bdd.it('removes the user from the roster', function () {
							receivePush();
							expect(Candy.Core.getRoster().get('foo@bar.com')).to.be.undefined;
						});

						bdd.it('emits an event indicating that the roster was updated', function () {
							var eventParams = null;
							var contact = Candy.Core.getRoster().get('foo@bar.com');
							$(Candy).on('candy:core:roster:removed', function (ev, params) { eventParams = params; });
							receivePush();
							expect(eventParams).to.eql({contact: contact});
						});
					});

					bdd.describe('adding a user', function () {
						var receivePush = function () {
							var rosterPush = $iq({
								type: 'set'
							})
							.c('query', {xmlns: 'jabber:iq:roster'})
							.c('item', {jid: 'new@guy.com', name: 'Foo Bar', subscription: 'both'})
							.c('group').t('Friends').up()
							.c('group').t('Close Friends').up();

							testHelper.receiveStanza(rosterPush);
						};

						bdd.it('makes the new item available in the main roster', function () {
							receivePush();
							expect(Candy.Core.getConnection().roster.findItem('new@guy.com').name).to.eql('Foo Bar');
							expect(Candy.Core.getRoster().get('new@guy.com')).to.be.an.instanceof(Candy.Core.Contact);
						});

						bdd.it('records the contact name properly', function () {
							receivePush();
							var rosterItem = Candy.Core.getRoster().get('new@guy.com');
							expect(rosterItem.getName()).to.eql('Foo Bar');
						});

						bdd.it('records the subscription type as affiliation', function () {
							receivePush();
							var rosterItem = Candy.Core.getRoster().get('new@guy.com');
							expect(rosterItem.getSubscription()).to.eql('both');
						});

						bdd.it('records groups', function () {
							receivePush();
							var rosterItem = Candy.Core.getRoster().get('new@guy.com');
							expect(rosterItem.getGroups()).to.eql(['Friends', 'Close Friends']);
						});

						bdd.it('emits an event indicating that the roster item was added', function () {
							var eventParams = null;
							$(Candy).on('candy:core:roster:added', function (ev, params) { eventParams = params; });
							receivePush();
							var contact = Candy.Core.getRoster().get('new@guy.com');
							expect(eventParams).to.eql({contact: contact});
						});
					});
				});
			});
		});

		bdd.describe('enabling message carbons', function() {
			bdd.it('sends a carbons enable request stanza', function () {
				var request = sinon.spy(Candy.Core.getConnection(), 'send');

				Candy.Core.Action.Jabber.EnableCarbons();

				var stanza = testHelper.stanzaFromRequest(request);
				expect(stanza.prop('tagName')).to.eql('iq');
				expect(stanza.attr('type')).to.eql('set');
				expect(stanza.children('enable').attr('xmlns')).to.eql('urn:xmpp:carbons:2');
			});
		});
	});
});
