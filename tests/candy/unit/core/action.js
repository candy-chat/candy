/*global define, Candy, Strophe */
/*jshint -W030 */

define([
		'intern!bdd'
	, 'intern/chai!'
	, 'intern/chai!expect'
	, 'sinon'
	, 'sinon-chai'
	, 'intern/order!candy/tests/helper.js'
	, 'intern/order!jquery'
	, 'intern/order!candy/libs.bundle.js'
	, 'intern/order!candy/src/candy.js'
	, 'intern/order!candy/src/core.js'
	, 'intern/order!candy/src/core/action.js'
	, 'intern/order!candy/src/core/event.js'
	, 'intern/order!candy/src/core/contact.js'
], function (bdd, chai, expect, sinon, sinonChai, testHelper, $) {
	chai.use(sinonChai);

	bdd.describe('Candy.Core.Action', function () {
		var fakeConnection;

		bdd.before(function () {
			sinon.stub(Strophe.Bosh.prototype, '_processRequest');
		});

		bdd.beforeEach(function () {
			fakeConnection = new Strophe.Connection("http://foo.bar/http-bind");
			fakeConnection.authenticated = true;
			fakeConnection.jid = 'n@d/r';

			// The Strophe roster plugin adds its callbacks when we connect only (see https://github.com/strophe/strophejs-plugins/commit/4f3bcd25c43142f99c314f75a9bc10c8957a23d1). Add them manually here to compensate.
			fakeConnection.addHandler(fakeConnection.roster._onReceivePresence.bind(fakeConnection.roster), null, 'presence', null, null, null);
			fakeConnection.addHandler(fakeConnection.roster._onReceiveIQ.bind(fakeConnection.roster), Strophe.NS.ROSTER, 'iq', "set", null, null);

			Candy.Core.init(
				'http://foo.bar/http-bind',
				{
					initialRosterVersion: 'abc',
					initialRosterItems: [
						{
							jid: 'stored@guy.com',
							name: 'Stored Guy',
							subscription: 'both',
							groups: ['Some', 'People'],
							resources: {
								'resource1': {
									show: 'busy',
									status: 'Stuff',
									priority: 10
								}
							}
						}
					]
				},
				fakeConnection
			);
			Candy.Core.registerEventHandlers();
		});

		bdd.describe('requesting the roster', function() {
			bdd.it('sends a roster request stanza', function () {
				var request = sinon.spy(fakeConnection, 'send');

				Candy.Core.Action.Jabber.Roster();

				expect(testHelper.str(request.firstCall.args[0])).to.eql(
					"<iq type='get' id='1:roster' xmlns='jabber:client'><query xmlns='jabber:iq:roster'/></iq>"
				);
			});

			bdd.describe('if roster versioning is supported server side', function () {
				bdd.beforeEach(function () {
					fakeConnection.features = Strophe.xmlGenerator().createElement("stream:features");
					var verFeature = Strophe.xmlGenerator().createElement('ver');
					verFeature.setAttribute('xmlns', 'urn:xmpp:features:rosterver');
					fakeConnection.features.appendChild(verFeature);
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
					var request = sinon.spy(fakeConnection, 'send');

					Candy.Core.Action.Jabber.Roster();

					expect(testHelper.str(request.firstCall.args[0])).to.eql(
						"<iq type='get' id='1:roster' xmlns='jabber:client'><query xmlns='jabber:iq:roster' ver='abc'/></iq>"
					);
				});

				bdd.it('emits an event indicating that the roster was loaded from cache', function () {
					var foo;
					$(Candy).on('candy:core.roster.loaded', function (ev, params) { foo = params; });
					Candy.Core.Action.Jabber.Roster();
					expect(foo).to.be.eql({roster: Candy.Core.getRoster()});
				});
			});

			bdd.describe('once the roster is received', function () {
				var receiveResponse = function () {
					var rosterResponse = new Strophe.Builder('iq', {
						type: 'result',
						id: '1:roster'
					})
					.c('query', {xmlns: 'jabber:iq:roster'})
					.c('item', {jid: 'foo@bar.com', name: 'Foo Bar', subscription: 'both'})
					.c('group').t('Friends').up()
					.c('group').t('Close Friends').up()
					.up()
					.c('item', {jid: 'doo@dah.com'});

					testHelper.receiveStanza(fakeConnection, rosterResponse);
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
					$(Candy).on('candy:core.roster.fetched', function (ev, params) { foo = params; });
					receiveResponse();
					expect(foo).to.be.eql({roster: Candy.Core.getRoster()});
				});

				bdd.describe('updating roster items from pushes', function () {
					bdd.beforeEach(receiveResponse);

					bdd.describe('modifying a user', function () {
						var modifiedUser;

						var receivePush = function () {
							var rosterPush = new Strophe.Builder('iq', {
								type: 'set'
							})
							.c('query', {xmlns: 'jabber:iq:roster'})
							.c('item', {jid: 'foo@bar.com', name: 'My Friend', subscription: 'to'})
							.c('group').t('Friends');

							testHelper.receiveStanza(fakeConnection, rosterPush);

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
							$(Candy).on('candy:core.roster.updated', function (ev, params) { eventParams = params; });
							receivePush();
							expect(eventParams).to.eql({contact: modifiedUser});
						});
					});

					bdd.describe('removing a user', function () {
						var receivePush = function () {
							var rosterPush = new Strophe.Builder('iq', {
								type: 'set'
							})
							.c('query', {xmlns: 'jabber:iq:roster'})
							.c('item', {jid: 'foo@bar.com', subscription: 'remove'});

							testHelper.receiveStanza(fakeConnection, rosterPush);
						};

						bdd.it('removes the user from the roster', function () {
							receivePush();
							expect(Candy.Core.getRoster().get('foo@bar.com')).to.be.undefined;
						});

						bdd.it('emits an event indicating that the roster was updated', function () {
							var eventParams = null;
							var contact = Candy.Core.getRoster().get('foo@bar.com');
							$(Candy).on('candy:core.roster.removed', function (ev, params) { eventParams = params; });
							receivePush();
							expect(eventParams).to.eql({contact: contact});
						});
					});

					bdd.describe('adding a user', function () {
						var receivePush = function () {
							var rosterPush = new Strophe.Builder('iq', {
								type: 'set'
							})
							.c('query', {xmlns: 'jabber:iq:roster'})
							.c('item', {jid: 'new@guy.com', name: 'Foo Bar', subscription: 'both'})
							.c('group').t('Friends').up()
							.c('group').t('Close Friends').up();

							testHelper.receiveStanza(fakeConnection, rosterPush);
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
							$(Candy).on('candy:core.roster.added', function (ev, params) { eventParams = params; });
							receivePush();
							var contact = Candy.Core.getRoster().get('new@guy.com');
							expect(eventParams).to.eql({contact: contact});
						});
					});
				});
			});
		});
	});
});
