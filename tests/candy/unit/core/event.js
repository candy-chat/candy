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
	, 'intern/order!candy/src/core/event.js'
	, 'intern/order!candy/src/core/chatUser.js'
	, 'intern/order!candy/src/core/contact.js'
], function (bdd, chai, expect, sinon, sinonChai, testHelper) {
	chai.use(sinonChai);

	bdd.describe('Candy.Core.Event', function () {
		var fakeConnection;

		bdd.before(function () {
			sinon.stub(Strophe.Bosh.prototype, '_processRequest');
		});

		bdd.after(function () {
			Strophe.Bosh.prototype._processRequest.restore();
		});

		bdd.beforeEach(function () {
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
				}
			);

			fakeConnection = Candy.Core.getConnection();
			fakeConnection.authenticated = true;
			fakeConnection.jid = 'n@d/r';

			// The Strophe roster plugin adds its callbacks when we connect only (see https://github.com/strophe/strophejs-plugins/commit/4f3bcd25c43142f99c314f75a9bc10c8957a23d1). Add them manually here to compensate.
			fakeConnection.addHandler(fakeConnection.roster._onReceivePresence.bind(fakeConnection.roster), null, 'presence', null, null, null);
			fakeConnection.addHandler(fakeConnection.roster._onReceiveIQ.bind(fakeConnection.roster), Strophe.NS.ROSTER, 'iq', "set", null, null);

			Candy.Core.registerEventHandlers();
		});

		bdd.describe('processing room presence', function () {
			bdd.describe('when a user joins a room', function () {
				var room,
					roomJid = 'coven@chat.shakespeare.lit',
					participantJid = roomJid + '/secondwitch';

				var createRoom = function () {
					room = new Candy.Core.ChatRoom(roomJid);
					Candy.Core.getRooms()[roomJid] = room;

					var me = new Candy.Core.ChatUser('foo@bar.com', 'SomeNick', 'admin', 'member');
					Candy.Core.setUser(me);
				};

				var receivePresence = function () {
					var presence = new Strophe.Builder('presence', {
						from: participantJid
					})
					.c('x', {xmlns: 'http://jabber.org/protocol/muc#user'})
					.c('item', {affiliation: 'admin', role: 'moderator', jid: 'doo@dah.com/somewhere'});

					testHelper.receiveStanza(fakeConnection, presence);
				};

				bdd.beforeEach(createRoom);
				bdd.beforeEach(receivePresence);

				bdd.it('adds the user to the room roster', function () {
					var rosterEntry = room.getRoster().get(participantJid);
					expect(rosterEntry.getJid()).to.eql(participantJid);
					expect(rosterEntry.getNick()).to.eql('secondwitch');
					expect(rosterEntry.getRole()).to.eql('moderator');
					expect(rosterEntry.getAffiliation()).to.eql('admin');
					expect(rosterEntry.getRealJid()).to.eql('doo@dah.com/somewhere');
				});
			});

			bdd.describe('when a user leaves a room', function () {

			});

			bdd.describe('when a user changes their room nick', function () {

			});

			bdd.describe('when we join a room', function () {

			});

			bdd.describe('when we leave a room', function () {

			});
		});
	});
});
