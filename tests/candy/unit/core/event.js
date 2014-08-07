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
], function (bdd, expect, sinon, testHelper, $) {
	bdd.describe('Candy.Core.Event', function () {
		testHelper.setupTests(bdd, sinon);

		bdd.describe('processing non-MUC presence', function () {
			var receivePresence = function () {
				var presence = new Strophe.Builder('presence', {
					from: 'foo@bar.com',
					id: 'abc123'
				});

				testHelper.receiveStanza(presence);
			};

			bdd.it('should trigger the candy:core.presence event', function () {
				var eventParams;
				$(Candy).on('candy:core.presence', function (ev, params) { eventParams = params; });
				receivePresence();
				expect(eventParams.from).to.eql('foo@bar.com');
				expect(eventParams.stanza.attr('id')).to.eql('abc123');
			});
		});

		bdd.describe('processing room presence', function () {
			var roomJid = 'coven@chat.shakespeare.lit';

			var setMe = function () {
				var me = new Candy.Core.ChatUser('foo@bar.com', 'SomeNick', 'admin', 'member');
				Candy.Core.setUser(me);
			};

			bdd.afterEach(function () {
				Candy.Core.removeRoom(roomJid);
			});

			bdd.describe('for a room we are in', function () {
				var room,
					participantJid = roomJid + '/secondwitch';

				var createRoom = function () {
					setMe();
					room = new Candy.Core.ChatRoom(roomJid);
					Candy.Core.getRooms()[roomJid] = room;
				};

				var receiveJoinPresence = function () {
					var presence = new Strophe.Builder('presence', {
						from: participantJid
					})
					.c('x', {xmlns: 'http://jabber.org/protocol/muc#user'})
					.c('item', {affiliation: 'admin', role: 'moderator', jid: 'doo@dah.com/somewhere'});

					testHelper.receiveStanza(presence);
				};

				bdd.beforeEach(createRoom);

				bdd.describe('when a user joins a room', function () {
					bdd.it('adds the user to the room roster', function () {
						receiveJoinPresence();

						var rosterEntry = room.getRoster().get(participantJid);
						expect(rosterEntry.getJid()).to.eql(participantJid);
						expect(rosterEntry.getNick()).to.eql('secondwitch');
						expect(rosterEntry.getRole()).to.eql('moderator');
						expect(rosterEntry.getAffiliation()).to.eql('admin');
						expect(rosterEntry.getRealJid()).to.eql('doo@dah.com/somewhere');
					});

					bdd.it('emits a candy:core.presence.room event', function () {
						var eventParams;
						$(Candy).on('candy:core.presence.room', function (ev, params) { eventParams = params; });

						receiveJoinPresence();

						expect(eventParams).to.have.keys(['roomJid', 'roomName', 'user', 'action', 'currentUser']);
						expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
						expect(eventParams.roomName).to.eql('coven');
						expect(eventParams.user).to.eql(room.getRoster().get(participantJid));
						expect(eventParams.action).to.eql('join');
						expect(eventParams.currentUser).to.eql(Candy.Core.getUser());
					});
				});

				bdd.describe('when a user leaves a room', function () {
					bdd.beforeEach(receiveJoinPresence);

					bdd.describe('voluntarily', function () {
						var receiveLeavePresence = function () {
							var presence = new Strophe.Builder('presence', {
								from: participantJid,
								type: 'unavailable'
							})
							.c('x', {xmlns: 'http://jabber.org/protocol/muc#user'})
							.c('item', {affiliation: 'admin', role: 'none', jid: 'doo@dah.com/somewhere'});

							testHelper.receiveStanza(presence);
						};

						bdd.it('removes the user from the room roster', function () {
							receiveLeavePresence();

							expect(room.getRoster().get(participantJid)).to.be.undefined;
						});

						bdd.it('emits a candy:core.presence.room event', function () {
							var eventParams;
							$(Candy).on('candy:core.presence.room', function (ev, params) { eventParams = params; });

							var user = room.getRoster().get(participantJid);
							receiveLeavePresence();

							expect(eventParams).to.have.keys(['roomJid', 'roomName', 'user', 'action', 'currentUser']);
							expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
							expect(eventParams.roomName).to.eql('coven');
							expect(eventParams.user).to.eql(user);
							expect(eventParams.action).to.eql('leave');
							expect(eventParams.currentUser).to.eql(Candy.Core.getUser());
						});
					});

					bdd.describe('because they were kicked', function () {
						var receiveLeavePresence = function () {
							var presence = new Strophe.Builder('presence', {
								from: participantJid,
								type: 'unavailable'
							})
							.c('x', {xmlns: 'http://jabber.org/protocol/muc#user'})
							.c('item', {affiliation: 'admin', role: 'none', jid: 'doo@dah.com/somewhere'}).up()
							.c('status', {code: '307'});

							testHelper.receiveStanza(presence);
						};

						bdd.it('emits the candy:core.presence.room event indicating they were kicked', function () {
							var eventParams;
							$(Candy).on('candy:core.presence.room', function (ev, params) { eventParams = params; });

							receiveLeavePresence();

							expect(eventParams.action).to.eql('kick');
						});
					});

					bdd.describe('because they were banned', function () {
						var receiveLeavePresence = function () {
							var presence = new Strophe.Builder('presence', {
								from: participantJid,
								type: 'unavailable'
							})
							.c('x', {xmlns: 'http://jabber.org/protocol/muc#user'})
							.c('item', {affiliation: 'admin', role: 'none', jid: 'doo@dah.com/somewhere'}).up()
							.c('status', {code: '301'});

							testHelper.receiveStanza(presence);
						};

						bdd.it('emits the candy:core.presence.room event indicating they were banned', function () {
							var eventParams;
							$(Candy).on('candy:core.presence.room', function (ev, params) { eventParams = params; });

							receiveLeavePresence();

							expect(eventParams.action).to.eql('ban');
						});
					});
				});

				bdd.describe('when a user changes their room nick', function () {
					var receiveLeavePresence = function () {
						var presence = new Strophe.Builder('presence', {
							from: participantJid,
							type: 'unavailable'
						})
						.c('x', {xmlns: 'http://jabber.org/protocol/muc#user'})
						.c('item', {affiliation: 'admin', role: 'member', jid: 'doo@dah.com/somewhere', nick: 'newnick'}).up()
						.c('status', {code: '303'});

						testHelper.receiveStanza(presence);
					};

					bdd.beforeEach(receiveJoinPresence);

					var newJid = roomJid + '/newnick';

					bdd.it('updates the nick in the room roster', function () {
						receiveLeavePresence();

						var rosterEntry = room.getRoster().get(newJid);
						expect(rosterEntry.getJid()).to.eql(newJid);
						expect(rosterEntry.getNick()).to.eql('newnick');
						expect(rosterEntry.getPreviousNick()).to.eql('secondwitch');
						expect(rosterEntry.getRole()).to.eql('moderator');
						expect(rosterEntry.getAffiliation()).to.eql('admin');
						expect(rosterEntry.getRealJid()).to.eql('doo@dah.com/somewhere');
					});

					bdd.it('emits a candy:core.presence.room event', function () {
						var eventParams;
						$(Candy).on('candy:core.presence.room', function (ev, params) { eventParams = params; });

						receiveLeavePresence();

						expect(eventParams).to.have.keys(['roomJid', 'roomName', 'user', 'action', 'currentUser']);
						expect(eventParams.roomJid).to.eql(roomJid);
						expect(eventParams.roomName).to.eql('coven');
						expect(eventParams.user).to.eql(room.getRoster().get(newJid));
						expect(eventParams.action).to.eql('nickchange');
						expect(eventParams.currentUser).to.eql(Candy.Core.getUser());
					});
				});

				bdd.describe('when a user updates affiliation/role', function () {
					var receiveUpdatePresence = function () {
						var presence = new Strophe.Builder('presence', {
							from: participantJid
						})
						.c('x', {xmlns: 'http://jabber.org/protocol/muc#user'})
						.c('item', {affiliation: 'member', role: 'participant', jid: 'doo@dah.com/somewhere'});

						testHelper.receiveStanza(presence);
					};

					bdd.beforeEach(receiveJoinPresence);

					bdd.it('updates the user in the room roster', function () {
						receiveUpdatePresence();

						var rosterEntry = room.getRoster().get(participantJid);
						expect(rosterEntry.getJid()).to.eql(participantJid);
						expect(rosterEntry.getNick()).to.eql('secondwitch');
						expect(rosterEntry.getRole()).to.eql('participant');
						expect(rosterEntry.getAffiliation()).to.eql('member');
						expect(rosterEntry.getRealJid()).to.eql('doo@dah.com/somewhere');
					});

					bdd.it('emits a candy:core.presence.room event', function () {
						var eventParams;
						$(Candy).on('candy:core.presence.room', function (ev, params) { eventParams = params; });

						receiveUpdatePresence();

						expect(eventParams).to.have.keys(['roomJid', 'roomName', 'user', 'action', 'currentUser']);
						expect(eventParams.roomJid).to.eql(roomJid);
						expect(eventParams.roomName).to.eql('coven');
						expect(eventParams.user).to.eql(room.getRoster().get(participantJid));
						expect(eventParams.action).to.eql('join');
						expect(eventParams.currentUser).to.eql(Candy.Core.getUser());
					});
				});

				bdd.describe('when we leave a room', function () {
					var ourJid = roomJid + '/SomeNick';

					var receiveJoinPresence = function () {
						var presence = new Strophe.Builder('presence', {
							from: ourJid
						})
						.c('x', {xmlns: 'http://jabber.org/protocol/muc#user'})
						.c('item', {affiliation: 'admin', role: 'moderator', jid: 'doo@dah.com/somewhere'})
						.c('status', {code: '110'});

						testHelper.receiveStanza(presence);

						room = Candy.Core.getRooms()[roomJid];
					};

					bdd.beforeEach(receiveJoinPresence);

					bdd.describe('voluntarily', function () {
						var receiveLeavePresence = function () {
							var presence = new Strophe.Builder('presence', {
								from: ourJid,
								type: 'unavailable'
							})
							.c('x', {xmlns: 'http://jabber.org/protocol/muc#user'})
							.c('item', {affiliation: 'admin', role: 'moderator', jid: 'doo@dah.com/somewhere'});

							testHelper.receiveStanza(presence);
						};

						bdd.it('removes the room from our collection', function () {
							receiveLeavePresence();

							expect(Candy.Core.getRooms()).not.to.have.key(roomJid);
						});

						bdd.it('emits a candy:core.presence.leave event', function () {
							var eventParams;
							$(Candy).on('candy:core.presence.leave', function (ev, params) { eventParams = params; });

							receiveLeavePresence();

							expect(eventParams).to.have.keys(['roomJid', 'roomName', 'user', 'type', 'reason', 'actor']);
							expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
							expect(eventParams.roomName).to.eql('coven');
							expect(eventParams.type).to.eql('leave');
							expect(eventParams.reason).to.be.undefined;
							expect(eventParams.actor).to.be.undefined;

							expect(eventParams.user.getJid()).to.eql(ourJid);
							expect(eventParams.user.getNick()).to.eql('SomeNick');
							expect(eventParams.user.getRole()).to.eql('moderator');
							expect(eventParams.user.getAffiliation()).to.eql('admin');
						});
					});

					bdd.describe('because we were kicked', function () {
						var receiveLeavePresence = function () {
							var presence = new Strophe.Builder('presence', {
								from: ourJid,
								type: 'unavailable'
							})
							.c('x', {xmlns: 'http://jabber.org/protocol/muc#user'})
							.c('item', {affiliation: 'admin', role: 'none', jid: 'doo@dah.com/somewhere'})
							.c('actor', {jid: roomJid + '/TheBoss'}).up()
							.c('reason').t('Get out of here!').up()
							.up()
							.c('status', {code: '307'});

							testHelper.receiveStanza(presence);
						};

						bdd.it('emits the candy:core.presence.leave event indicating they were kicked', function () {
							var eventParams;
							$(Candy).on('candy:core.presence.leave', function (ev, params) { eventParams = params; });

							receiveLeavePresence();

							expect(eventParams.type).to.eql('kick');
							expect(eventParams.reason).to.eql('Get out of here!');
							expect(eventParams.actor).to.eql(roomJid + '/TheBoss');
						});
					});

					bdd.describe('because we were banned', function () {
						var receiveLeavePresence = function () {
							var presence = new Strophe.Builder('presence', {
								from: ourJid,
								type: 'unavailable'
							})
							.c('x', {xmlns: 'http://jabber.org/protocol/muc#user'})
							.c('item', {affiliation: 'admin', role: 'none', jid: 'doo@dah.com/somewhere'})
							.c('actor', {jid: roomJid + '/TheBoss'}).up()
							.c('reason').t('Get out of here!').up()
							.up()
							.c('status', {code: '301'});

							testHelper.receiveStanza(presence);
						};

						bdd.it('emits the candy:core.presence.leave event indicating they were banned', function () {
							var eventParams;
							$(Candy).on('candy:core.presence.leave', function (ev, params) { eventParams = params; });

							receiveLeavePresence();

							expect(eventParams.type).to.eql('ban');
							expect(eventParams.reason).to.eql('Get out of here!');
							expect(eventParams.actor).to.eql(roomJid + '/TheBoss');
						});
					});
				});

				bdd.describe('which is an error', function () {
					var receiveErrorPresence = function () {
						var presence = new Strophe.Builder('presence', {
							from: roomJid,
							type: 'error',
							id: 'abc123'
						})
						.c('x', {xmlns: 'http://jabber.org/protocol/muc'}).up()
						.c('error', {by: 'coven@chat.shakespeare.lit', type: 'modify'})
						.c('jid-malformed', {xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'});

						testHelper.receiveStanza(presence);
					};

					bdd.it('removes the room from our collection', function () {
						expect(Candy.Core.getRooms()[roomJid]).to.be.an.instanceof(Candy.Core.ChatRoom);

						receiveErrorPresence();

						expect(Candy.Core.getRooms()).to.not.have.key(roomJid);
					});

					bdd.it('emits a candy:core.presence.error event', function () {
						var eventParams;
						$(Candy).on('candy:core.presence.error', function (ev, params) { eventParams = params; });

						receiveErrorPresence();

						expect(eventParams).to.have.keys(['roomJid', 'roomName', 'type', 'msg']);
						expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
						expect(eventParams.roomName).to.eql('coven');
						expect(eventParams.type).to.eql('jid-malformed');
						expect(eventParams.msg.attr('id')).to.eql('abc123');
					});
				});
			});

			bdd.describe('when we join a room', function () {
				var room,
					participantJid = roomJid + '/SomeNick';

				var receiveJoinPresence = function () {
					var presence = new Strophe.Builder('presence', {
						from: participantJid
					})
					.c('x', {xmlns: 'http://jabber.org/protocol/muc#user'})
					.c('item', {affiliation: 'admin', role: 'moderator', jid: 'doo@dah.com/somewhere'})
					.c('status', {code: '110'});

					testHelper.receiveStanza(presence);

					room = Candy.Core.getRooms()[roomJid];
				};

				bdd.beforeEach(setMe);

				bdd.it('creates the room instance in our collection', function () {
					expect(Candy.Core.getRooms()).not.to.have.key('roomJid');

					receiveJoinPresence();

					expect(room).to.be.an.instanceof(Candy.Core.ChatRoom);
					expect(room.getJid()).to.eql(roomJid);
				});

				bdd.it('sets the room user to be me', function () {
					receiveJoinPresence();

					var roomUser = room.getUser();
					expect(roomUser.getJid()).to.eql(participantJid);
					expect(roomUser.getNick()).to.eql('SomeNick');
					expect(roomUser.getRole()).to.eql('moderator');
					expect(roomUser.getAffiliation()).to.eql('admin');
					expect(roomUser.getRealJid()).to.eql('doo@dah.com/somewhere');
				});

				bdd.it('adds me to the room roster', function () {
					receiveJoinPresence();

					var rosterEntry = room.getRoster().get(participantJid);
					expect(rosterEntry.getJid()).to.eql(participantJid);
					expect(rosterEntry.getNick()).to.eql('SomeNick');
					expect(rosterEntry.getRole()).to.eql('moderator');
					expect(rosterEntry.getAffiliation()).to.eql('admin');
					expect(rosterEntry.getRealJid()).to.eql('doo@dah.com/somewhere');
				});

				bdd.it('emits a candy:core.presence.room event', function () {
					var eventParams;
					$(Candy).on('candy:core.presence.room', function (ev, params) { eventParams = params; });

					receiveJoinPresence();

					expect(eventParams).to.have.keys(['roomJid', 'roomName', 'user', 'action', 'currentUser']);
					expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
					expect(eventParams.roomName).to.eql('coven');
					expect(eventParams.user).to.eql(room.getRoster().get(participantJid));
					expect(eventParams.action).to.eql('join');
					expect(eventParams.currentUser).to.eql(room.getUser());
				});

				bdd.describe('when I am assigned a different nick to the one I asked for', function () {
					var newParticipantJid = roomJid + '/ServerAssignedNick';

					var receiveJoinPresenceAssignedNick = function () {
						var presence = new Strophe.Builder('presence', {
							from: newParticipantJid
						})
						.c('x', {xmlns: 'http://jabber.org/protocol/muc#user'})
						.c('item', {affiliation: 'admin', role: 'moderator', jid: 'doo@dah.com/somewhere'}).up()
						.c('status', {code: '110'}).up()
						.c('status', {code: '210'});

						testHelper.receiveStanza(presence);

						room = Candy.Core.getRooms()[roomJid];
					};

					bdd.it('sets the room user to be me with the new nick', function () {
						receiveJoinPresenceAssignedNick();

						var roomUser = room.getUser();
						expect(roomUser.getJid()).to.eql(newParticipantJid);
						expect(roomUser.getNick()).to.eql('ServerAssignedNick');
						expect(roomUser.getRole()).to.eql('moderator');
						expect(roomUser.getAffiliation()).to.eql('admin');
						expect(roomUser.getRealJid()).to.eql('doo@dah.com/somewhere');
					});

					bdd.it('adds me to the room roster with the new nick', function () {
						receiveJoinPresenceAssignedNick();

						var rosterEntry = room.getRoster().get(newParticipantJid);
						expect(rosterEntry.getJid()).to.eql(newParticipantJid);
						expect(rosterEntry.getNick()).to.eql('ServerAssignedNick');
						expect(rosterEntry.getRole()).to.eql('moderator');
						expect(rosterEntry.getAffiliation()).to.eql('admin');
						expect(rosterEntry.getRealJid()).to.eql('doo@dah.com/somewhere');
					});

					bdd.it('emits a candy:core.presence.room event with the new nick', function () {
						var eventParams;
						$(Candy).on('candy:core.presence.room', function (ev, params) { eventParams = params; });

						receiveJoinPresenceAssignedNick();

						expect(eventParams).to.have.keys(['roomJid', 'roomName', 'user', 'action', 'currentUser']);
						expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
						expect(eventParams.roomName).to.eql('coven');
						expect(eventParams.user).to.eql(room.getRoster().get(newParticipantJid));
						expect(eventParams.action).to.eql('join');
						expect(eventParams.currentUser).to.eql(room.getUser());
					});
				});
			});
		});
	});
});
