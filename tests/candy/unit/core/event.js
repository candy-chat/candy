/*global define, Candy, Strophe */
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
	, 'intern/order!candy/src/core/event.js'
	, 'intern/order!candy/src/core/chatUser.js'
	, 'intern/order!candy/src/core/contact.js'
], function (bdd, expect, sinon, testHelper) {
	bdd.describe('Candy.Core.Event', function () {
		testHelper.setupTests(bdd, sinon);

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

					testHelper.receiveStanza(Candy.Core.getConnection(), presence);
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
