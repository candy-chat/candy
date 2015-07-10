/*global define, Candy, $pres, $msg */
/*jshint -W027*/
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

		// TODO: Test me
		bdd.describe('processing strophe connection status events', function () {});

		// TODO: Test me
		bdd.describe('processing requests for client version', function () {});

		bdd.describe('processing non-MUC presence', function () {
			var receivePresence = function () {
				var presence = $pres({
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
					var presence = $pres({
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
						expect(rosterEntry.getStatus()).to.eql('available');
					});

					bdd.it('emits a candy:core.presence.room event', function () {
						var eventParams;
						$(Candy).on('candy:core.presence.room', function (ev, params) { eventParams = params; });

						receiveJoinPresence();

						expect(eventParams).to.have.keys(['roomJid', 'roomName', 'user', 'action', 'currentUser', 'isNewRoom']);
						expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
						expect(eventParams.roomName).to.eql('coven');
						expect(eventParams.user).to.eql(room.getRoster().get(participantJid));
						expect(eventParams.action).to.eql('join');
						expect(eventParams.currentUser).to.eql(Candy.Core.getUser());
						expect(eventParams.isNewRoom).to.eql(false);
					});
				});

				bdd.describe('when a user updates their status in a room', function () {
					bdd.beforeEach(receiveJoinPresence);

					var receiveUpdatePresence = function () {
						var presence = $pres({
							from: participantJid
						})
						.c('show').t('busy')
						.up()
						.c('x', {xmlns: 'http://jabber.org/protocol/muc#user'})
						.c('item', {affiliation: 'admin', role: 'moderator', jid: 'doo@dah.com/somewhere'});

						testHelper.receiveStanza(presence);
					};

					bdd.it("updates the user's status in the room roster", function () {
						receiveUpdatePresence();

						var rosterEntry = room.getRoster().get(participantJid);
						expect(rosterEntry.getStatus()).to.eql('busy');
					});

					bdd.it('emits a candy:core.presence.room event', function () {
						var eventParams;
						$(Candy).on('candy:core.presence.room', function (ev, params) { eventParams = params; });

						receiveUpdatePresence();

						expect(eventParams).to.have.keys(['roomJid', 'roomName', 'user', 'action', 'currentUser', 'isNewRoom']);
						expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
						expect(eventParams.roomName).to.eql('coven');
						expect(eventParams.user).to.eql(room.getRoster().get(participantJid));
						expect(eventParams.action).to.eql('join');
						expect(eventParams.currentUser).to.eql(Candy.Core.getUser());
						expect(eventParams.isNewRoom).to.eql(false);
					});
				});

				bdd.describe('when a user leaves a room', function () {
					bdd.beforeEach(receiveJoinPresence);

					bdd.describe('voluntarily', function () {
						var receiveLeavePresence = function () {
							var presence = $pres({
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

							expect(eventParams).to.have.keys(['roomJid', 'roomName', 'user', 'action', 'currentUser', 'isNewRoom']);
							expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
							expect(eventParams.roomName).to.eql('coven');
							expect(eventParams.user).to.eql(user);
							expect(eventParams.action).to.eql('leave');
							expect(eventParams.currentUser).to.eql(Candy.Core.getUser());
							expect(eventParams.isNewRoom).to.eql(false);
						});
					});

					bdd.describe('because they were kicked', function () {
						var receiveLeavePresence = function () {
							var presence = $pres({
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
							var presence = $pres({
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
						var presence = $pres({
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

						expect(eventParams).to.have.keys(['roomJid', 'roomName', 'user', 'action', 'currentUser', 'isNewRoom']);
						expect(eventParams.roomJid).to.eql(roomJid);
						expect(eventParams.roomName).to.eql('coven');
						expect(eventParams.user).to.eql(room.getRoster().get(newJid));
						expect(eventParams.action).to.eql('nickchange');
						expect(eventParams.currentUser).to.eql(Candy.Core.getUser());
						expect(eventParams.isNewRoom).to.eql(false);
					});
				});

				bdd.describe('when a user updates affiliation/role', function () {
					var receiveUpdatePresence = function () {
						var presence = $pres({
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

						expect(eventParams).to.have.keys(['roomJid', 'roomName', 'user', 'action', 'currentUser', 'isNewRoom']);
						expect(eventParams.roomJid).to.eql(roomJid);
						expect(eventParams.roomName).to.eql('coven');
						expect(eventParams.user).to.eql(room.getRoster().get(participantJid));
						expect(eventParams.action).to.eql('join');
						expect(eventParams.currentUser).to.eql(Candy.Core.getUser());
						expect(eventParams.isNewRoom).to.eql(false);
					});
				});

				bdd.describe('when we leave a room', function () {
					var ourJid = roomJid + '/SomeNick';

					var receiveJoinPresence = function () {
						var presence = $pres({
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
							var presence = $pres({
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
							var presence = $pres({
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
							var presence = $pres({
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
						var presence = $pres({
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
					var presence = $pres({
						from: participantJid
					})
					.c('x', {xmlns: 'http://jabber.org/protocol/muc#user'})
					.c('item', {affiliation: 'admin', role: 'moderator', jid: 'doo@dah.com/somewhere'})
					.c('status', {code: '110'});

					testHelper.receiveStanza(presence);

					room = Candy.Core.getRooms()[roomJid];
				};

				bdd.beforeEach(setMe);

				bdd.describe('and the room is being created', function() {
					var receiveJoinPresence = function () {
						var presence = $pres({
							from: participantJid
						})
						.c('x', {xmlns: 'http://jabber.org/protocol/muc#user'})
						.c('item', {affiliation: 'admin', role: 'moderator', jid: 'doo@dah.com/somewhere'})
						.c('status', {code: '110'})
						.c('status', {code: '201'});

						testHelper.receiveStanza(presence);

						room = Candy.Core.getRooms()[roomJid];
					};

					bdd.it('on a new room it emits a candy:core.presence.room event with isNewRoom set', function () {
						var eventParams;
						$(Candy).on('candy:core.presence.room', function (ev, params) { eventParams = params; });

						receiveJoinPresence();

						expect(eventParams).to.have.keys(['roomJid', 'roomName', 'user', 'action', 'currentUser', 'isNewRoom']);
						expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
						expect(eventParams.roomName).to.eql('coven');
						expect(eventParams.user).to.eql(room.getRoster().get(participantJid));
						expect(eventParams.action).to.eql('join');
						expect(eventParams.currentUser).to.eql(room.getUser());
						expect(eventParams.isNewRoom).to.eql(true);
					});
				});

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

					expect(eventParams).to.have.keys(['roomJid', 'roomName', 'user', 'action', 'currentUser', 'isNewRoom']);
					expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
					expect(eventParams.roomName).to.eql('coven');
					expect(eventParams.user).to.eql(room.getRoster().get(participantJid));
					expect(eventParams.action).to.eql('join');
					expect(eventParams.currentUser).to.eql(room.getUser());
					expect(eventParams.isNewRoom).to.eql(false);
				});

				bdd.describe('when I am assigned a different nick to the one I asked for', function () {
					var newParticipantJid = roomJid + '/ServerAssignedNick';

					var receiveJoinPresenceAssignedNick = function () {
						var presence = $pres({
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

						expect(eventParams).to.have.keys(['roomJid', 'roomName', 'user', 'action', 'currentUser', 'isNewRoom']);
						expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
						expect(eventParams.roomName).to.eql('coven');
						expect(eventParams.user).to.eql(room.getRoster().get(newParticipantJid));
						expect(eventParams.action).to.eql('join');
						expect(eventParams.currentUser).to.eql(room.getUser());
						expect(eventParams.isNewRoom).to.eql(false);
					});
				});
			});
		});

		// TODO: Test me
		bdd.describe('processing lists of bookmarks', function () {
			bdd.describe('from pubsub', function () {});

			bdd.describe('from private storage', function () {});
		});

		// TODO: Test me
		bdd.describe('processing privacy lists', function () {
			bdd.describe('which contain an error', function () {});
		});

		bdd.describe('processing messages', function () {
			var setMe = function () {
				var me = new Candy.Core.ChatUser('foo@bar.com', 'Me oh me', 'admin', 'member');
				Candy.Core.setUser(me);
			};

			bdd.describe('which have no type', function () {
				var receiveMessage = function () {
					testHelper.receiveStanza(
						$msg({
							from: 'foo@bar.com'
						})
						.c('body').t('Some message text')
					);
				};

				bdd.it('emits a candy:core:chat:message:normal event', function () {
					var eventParams;
					$(Candy).on('candy:core:chat:message:normal', function (ev, params) { eventParams = params; });

					receiveMessage();

					expect(eventParams.type).to.eql('normal');
					expect(eventParams.message.attr('from')).to.eql('foo@bar.com');
				});

				bdd.describe('and contain a mediated MUC invite', function () {
					var receiveMessage = function () {
						var message = $msg({
							from: 'coven@chat.shakespeare.lit'
						})
						.c('x', {xmlns: 'http://jabber.org/protocol/muc#user'})
						.c('invite', {from: 'crone1@shakespeare.lit/desktop'})
							.c('reason').t('Hey Hecate, this is the place for all good witches!')
							.up()
							.c('continue', {thread: 'e0ffe42b28561960c6b12b944a092794b9683a38'})
						.up().up()
						.c('password').t('cauldronburn');

						testHelper.receiveStanza(message);
					};

					bdd.it('emits a candy:core:chat:invite event', function () {
						var eventParams;
						$(Candy).on('candy:core:chat:invite', function (ev, params) { eventParams = params; });

						receiveMessage();

						expect(eventParams).to.have.keys(['roomJid', 'from', 'reason', 'password', 'continuedThread']);
						expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
						expect(eventParams.from).to.eql('crone1@shakespeare.lit/desktop');
						expect(eventParams.reason).to.eql('Hey Hecate, this is the place for all good witches!');
						expect(eventParams.password).to.eql('cauldronburn');
						expect(eventParams.continuedThread).to.eql('e0ffe42b28561960c6b12b944a092794b9683a38');
					});

					bdd.it('emits a candy:core:chat:message:normal event', function () {
						var eventParams;
						$(Candy).on('candy:core:chat:message:normal', function (ev, params) { eventParams = params; });

						receiveMessage();

						expect(eventParams).to.have.keys(['type', 'message']);
						expect(eventParams.type).to.eql('normal');
						expect(eventParams.message.attr('from')).to.eql('coven@chat.shakespeare.lit');
					});

					bdd.describe('with only the minimal required data', function () {
						var receiveMessage = function () {
							var message = $msg({
								from: 'coven@chat.shakespeare.lit'
							})
							.c('x', {xmlns: 'http://jabber.org/protocol/muc#user'})
							.c('invite', {from: 'crone1@shakespeare.lit/desktop'});

							testHelper.receiveStanza(message);
						};

						bdd.it('emits a candy:core:chat:invite event', function () {
							var eventParams;
							$(Candy).on('candy:core:chat:invite', function (ev, params) { eventParams = params; });

							receiveMessage();

							expect(eventParams).to.have.keys(['roomJid', 'from', 'reason', 'password', 'continuedThread']);
							expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
							expect(eventParams.from).to.eql('crone1@shakespeare.lit/desktop');
							expect(eventParams.reason).to.be.undefined;
							expect(eventParams.password).to.be.undefined;
							expect(eventParams.continuedThread).to.be.undefined;
						});

						bdd.it('emits a candy:core:chat:message:normal event', function () {
							var eventParams;
							$(Candy).on('candy:core:chat:message:normal', function (ev, params) { eventParams = params; });

							receiveMessage();

							expect(eventParams).to.have.keys(['type', 'message']);
							expect(eventParams.type).to.eql('normal');
							expect(eventParams.message.attr('from')).to.eql('coven@chat.shakespeare.lit');
						});
					});
				});

				bdd.describe('and contain a direct MUC invite', function () {
					var receiveMessage = function () {
						var message = $msg({
							from: 'crone1@shakespeare.lit/desktop'
						})
						.c('x', {
							xmlns: 'jabber:x:conference',
							continue: 'true',
							jid: 'coven@chat.shakespeare.lit',
							password: 'cauldronburn',
							reason: 'Hey Hecate, this is the place for all good witches!',
							thread: 'e0ffe42b28561960c6b12b944a092794b9683a38'
						});

						testHelper.receiveStanza(message);
					};

					bdd.it('emits a candy:core:chat:invite event', function () {
						var eventParams;
						$(Candy).on('candy:core:chat:invite', function (ev, params) { eventParams = params; });

						receiveMessage();

						expect(eventParams).to.have.keys(['roomJid', 'from', 'reason', 'password', 'continuedThread']);
						expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
						expect(eventParams.from).to.eql('crone1@shakespeare.lit/desktop');
						expect(eventParams.reason).to.eql('Hey Hecate, this is the place for all good witches!');
						expect(eventParams.password).to.eql('cauldronburn');
						expect(eventParams.continuedThread).to.eql('e0ffe42b28561960c6b12b944a092794b9683a38');
					});

					bdd.it('emits a candy:core:chat:message:normal event', function () {
						var eventParams;
						$(Candy).on('candy:core:chat:message:normal', function (ev, params) { eventParams = params; });

						receiveMessage();

						expect(eventParams).to.have.keys(['type', 'message']);
						expect(eventParams.type).to.eql('normal');
						expect(eventParams.message.attr('from')).to.eql('crone1@shakespeare.lit/desktop');
					});

					bdd.describe('with only the minimal required data', function () {
						var receiveMessage = function () {
							var message = $msg({
								from: 'crone1@shakespeare.lit/desktop'
							})
							.c('x', {
								xmlns: 'jabber:x:conference',
								jid: 'coven@chat.shakespeare.lit'
							});

							testHelper.receiveStanza(message);
						};

						bdd.it('emits a candy:core:chat:invite event', function () {
							var eventParams;
							$(Candy).on('candy:core:chat:invite', function (ev, params) { eventParams = params; });

							receiveMessage();

							expect(eventParams).to.have.keys(['roomJid', 'from', 'reason', 'password', 'continuedThread']);
							expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
							expect(eventParams.from).to.eql('crone1@shakespeare.lit/desktop');
							expect(eventParams.reason).to.be.undefined;
							expect(eventParams.password).to.be.undefined;
							expect(eventParams.continuedThread).to.be.undefined;
						});

						bdd.it('emits a candy:core:chat:message:normal event', function () {
							var eventParams;
							$(Candy).on('candy:core:chat:message:normal', function (ev, params) { eventParams = params; });

							receiveMessage();

							expect(eventParams).to.have.keys(['type', 'message']);
							expect(eventParams.type).to.eql('normal');
							expect(eventParams.message.attr('from')).to.eql('crone1@shakespeare.lit/desktop');
						});
					});
				});
			});

			bdd.describe('which are normal', function () {
				var receiveMessage = function () {
					testHelper.receiveStanza(
						$msg({
							from: 'foo@bar.com',
							type: 'normal'
						})
						.c('body').t('Some message text')
					);
				};

				bdd.it('emits a candy:core:chat:message:normal event', function () {
					var eventParams;
					$(Candy).on('candy:core:chat:message:normal', function (ev, params) { eventParams = params; });

					receiveMessage();

					expect(eventParams.type).to.eql('normal');
					expect(eventParams.message.attr('from')).to.eql('foo@bar.com');
				});

				bdd.describe('and contain a mediated MUC invite', function () {
					var receiveMessage = function () {
						var message = $msg({
							from: 'coven@chat.shakespeare.lit',
							type: 'normal'
						})
						.c('x', {xmlns: 'http://jabber.org/protocol/muc#user'})
						.c('invite', {from: 'crone1@shakespeare.lit/desktop'})
							.c('reason').t('Hey Hecate, this is the place for all good witches!')
							.up()
							.c('continue', {thread: 'e0ffe42b28561960c6b12b944a092794b9683a38'})
						.up().up()
						.c('password').t('cauldronburn');

						testHelper.receiveStanza(message);
					};

					bdd.it('emits a candy:core:chat:invite event', function () {
						var eventParams;
						$(Candy).on('candy:core:chat:invite', function (ev, params) { eventParams = params; });

						receiveMessage();

						expect(eventParams).to.have.keys(['roomJid', 'from', 'reason', 'password', 'continuedThread']);
						expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
						expect(eventParams.from).to.eql('crone1@shakespeare.lit/desktop');
						expect(eventParams.reason).to.eql('Hey Hecate, this is the place for all good witches!');
						expect(eventParams.password).to.eql('cauldronburn');
						expect(eventParams.continuedThread).to.eql('e0ffe42b28561960c6b12b944a092794b9683a38');
					});

					bdd.it('emits a candy:core:chat:message:normal event', function () {
						var eventParams;
						$(Candy).on('candy:core:chat:message:normal', function (ev, params) { eventParams = params; });

						receiveMessage();

						expect(eventParams).to.have.keys(['type', 'message']);
						expect(eventParams.type).to.eql('normal');
						expect(eventParams.message.attr('from')).to.eql('coven@chat.shakespeare.lit');
					});

					bdd.describe('with only the minimal required data', function () {
						var receiveMessage = function () {
							var message = $msg({
								from: 'coven@chat.shakespeare.lit',
								type: 'normal'
							})
							.c('x', {xmlns: 'http://jabber.org/protocol/muc#user'})
							.c('invite', {from: 'crone1@shakespeare.lit/desktop'});

							testHelper.receiveStanza(message);
						};

						bdd.it('emits a candy:core:chat:invite event', function () {
							var eventParams;
							$(Candy).on('candy:core:chat:invite', function (ev, params) { eventParams = params; });

							receiveMessage();

							expect(eventParams).to.have.keys(['roomJid', 'from', 'reason', 'password', 'continuedThread']);
							expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
							expect(eventParams.from).to.eql('crone1@shakespeare.lit/desktop');
							expect(eventParams.reason).to.be.undefined;
							expect(eventParams.password).to.be.undefined;
							expect(eventParams.continuedThread).to.be.undefined;
						});

						bdd.it('emits a candy:core:chat:message:normal event', function () {
							var eventParams;
							$(Candy).on('candy:core:chat:message:normal', function (ev, params) { eventParams = params; });

							receiveMessage();

							expect(eventParams).to.have.keys(['type', 'message']);
							expect(eventParams.type).to.eql('normal');
							expect(eventParams.message.attr('from')).to.eql('coven@chat.shakespeare.lit');
						});
					});
				});

				bdd.describe('and contain a direct MUC invite', function () {
					var receiveMessage = function () {
						var message = $msg({
							from: 'crone1@shakespeare.lit/desktop',
							type: 'normal'
						})
						.c('x', {
							xmlns: 'jabber:x:conference',
							continue: 'true',
							jid: 'coven@chat.shakespeare.lit',
							password: 'cauldronburn',
							reason: 'Hey Hecate, this is the place for all good witches!',
							thread: 'e0ffe42b28561960c6b12b944a092794b9683a38'
						});

						testHelper.receiveStanza(message);
					};

					bdd.it('emits a candy:core:chat:invite event', function () {
						var eventParams;
						$(Candy).on('candy:core:chat:invite', function (ev, params) { eventParams = params; });

						receiveMessage();

						expect(eventParams).to.have.keys(['roomJid', 'from', 'reason', 'password', 'continuedThread']);
						expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
						expect(eventParams.from).to.eql('crone1@shakespeare.lit/desktop');
						expect(eventParams.reason).to.eql('Hey Hecate, this is the place for all good witches!');
						expect(eventParams.password).to.eql('cauldronburn');
						expect(eventParams.continuedThread).to.eql('e0ffe42b28561960c6b12b944a092794b9683a38');
					});

					bdd.it('emits a candy:core:chat:message:normal event', function () {
						var eventParams;
						$(Candy).on('candy:core:chat:message:normal', function (ev, params) { eventParams = params; });

						receiveMessage();

						expect(eventParams).to.have.keys(['type', 'message']);
						expect(eventParams.type).to.eql('normal');
						expect(eventParams.message.attr('from')).to.eql('crone1@shakespeare.lit/desktop');
					});

					bdd.describe('with only the minimal required data', function () {
						var receiveMessage = function () {
							var message = $msg({
								from: 'crone1@shakespeare.lit/desktop',
								type: 'normal'
							})
							.c('x', {
								xmlns: 'jabber:x:conference',
								jid: 'coven@chat.shakespeare.lit'
							});

							testHelper.receiveStanza(message);
						};

						bdd.it('emits a candy:core:chat:invite event', function () {
							var eventParams;
							$(Candy).on('candy:core:chat:invite', function (ev, params) { eventParams = params; });

							receiveMessage();

							expect(eventParams).to.have.keys(['roomJid', 'from', 'reason', 'password', 'continuedThread']);
							expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
							expect(eventParams.from).to.eql('crone1@shakespeare.lit/desktop');
							expect(eventParams.reason).to.be.undefined;
							expect(eventParams.password).to.be.undefined;
							expect(eventParams.continuedThread).to.be.undefined;
						});

						bdd.it('emits a candy:core:chat:message:normal event', function () {
							var eventParams;
							$(Candy).on('candy:core:chat:message:normal', function (ev, params) { eventParams = params; });

							receiveMessage();

							expect(eventParams).to.have.keys(['type', 'message']);
							expect(eventParams.type).to.eql('normal');
							expect(eventParams.message.attr('from')).to.eql('crone1@shakespeare.lit/desktop');
						});
					});
				});
			});

			bdd.describe('which are a chat message', function () {
				var receiveMessage = function () {
					testHelper.receiveStanza(
						$msg({
							to: 'foo@bar.com',
							from: 'doo@dah.com/resource1',
							type: 'chat'
						})
						.c('body').t('Some message text')
						.up()
						.c('html', {xmlns: 'http://jabber.org/protocol/xhtml-im'})
						.c('body', {xmlns: 'http://www.w3.org/1999/xhtml'})
						.c('p', {style: 'font-weight: bold;'}).t('hi!')
					);
				};

				bdd.it('emits a candy:core.message event', function () {
					var eventParams;
					$(Candy).on('candy:core.message', function (ev, params) { eventParams = params; });

					receiveMessage();

					expect(eventParams).to.have.keys(['roomJid', 'roomName', 'message', 'timestamp', 'carbon', 'stanza']);
					expect(eventParams.roomJid).to.eql('doo@dah.com');
					expect(eventParams.roomName).to.eql('doo');

					var message = eventParams.message;
					expect(message).to.have.keys(['from', 'name', 'body', 'type', 'delay', 'isNoConferenceRoomJid', 'xhtmlMessage']);
					expect(message.from).to.eql('doo@dah.com/resource1');
					expect(message.name).to.eql('doo');
					expect(message.type).to.eql('chat');
					expect(message.body).to.eql('Some message text');
					expect(message.isNoConferenceRoomJid).to.be.true;
					expect(message.xhtmlMessage.attr('style')).to.eql('font-weight: bold;');
				});

				bdd.describe('which is a carbon', function () {
					bdd.describe('sent', function () {
						var receiveMessage = function () {
							testHelper.receiveStanza(
								$msg({
									to: 'foo@bar.com/resource1',
									from: 'foo@bar.com',
									type: 'chat'
								})
								.c('sent', {xmlns: 'urn:xmpp:carbons:2'})
								.c('forwarded', {xmlns: 'urn:xmpp:forward:0'})
								.c('message', {
									to: 'doo@dah.com/resource1',
									from: 'foo@bar.com/resource2',
									type: 'chat'
								})
								.c('body').t('Some message text')
								.up()
								.c('html', {xmlns: 'http://jabber.org/protocol/xhtml-im'})
								.c('body', {xmlns: 'http://www.w3.org/1999/xhtml'})
								.c('p', {style: 'font-weight: bold;'}).t('hi!')
							);
						};

						bdd.it('emits a candy:core.message event tagged as carbon', function () {
							var eventParams;
							$(Candy).on('candy:core.message', function (ev, params) { eventParams = params; });

							setMe();
							receiveMessage();

							expect(eventParams).to.have.keys(['roomJid', 'roomName', 'message', 'timestamp', 'carbon', 'stanza']);
							expect(eventParams.roomJid).to.eql('doo@dah.com');
							expect(eventParams.roomName).to.eql('doo');
							expect(eventParams.carbon).to.eql(true);

							var message = eventParams.message;
							expect(message).to.have.keys(['from', 'name', 'body', 'type', 'delay', 'isNoConferenceRoomJid', 'xhtmlMessage']);
							expect(message.from).to.eql('foo@bar.com/resource2');
							expect(message.name).to.eql('Me oh me');
							expect(message.type).to.eql('chat');
							expect(message.body).to.eql('Some message text');
							expect(message.isNoConferenceRoomJid).to.be.true;
							expect(message.xhtmlMessage.attr('style')).to.eql('font-weight: bold;');
						});
					});

					bdd.describe('received', function () {
						var receiveMessage = function () {
							testHelper.receiveStanza(
								$msg({
									to: 'foo@bar.com/resource1',
									from: 'foo@bar.com',
									type: 'chat'
								})
								.c('received', {xmlns: 'urn:xmpp:carbons:2'})
								.c('forwarded', {xmlns: 'urn:xmpp:forward:0'})
								.c('message', {
									to: 'foo@bar.com/resource2',
									from: 'doo@dah.com/resource1',
									type: 'chat'
								})
								.c('body').t('Some message text')
								.up()
								.c('html', {xmlns: 'http://jabber.org/protocol/xhtml-im'})
								.c('body', {xmlns: 'http://www.w3.org/1999/xhtml'})
								.c('p', {style: 'font-weight: bold;'}).t('hi!')
							);
						};

						bdd.it('emits a candy:core.message event tagged as carbon', function () {
							var eventParams;
							$(Candy).on('candy:core.message', function (ev, params) { eventParams = params; });

							receiveMessage();

							expect(eventParams).to.have.keys(['roomJid', 'roomName', 'message', 'timestamp', 'carbon', 'stanza']);
							expect(eventParams.roomJid).to.eql('doo@dah.com');
							expect(eventParams.roomName).to.eql('doo');
							expect(eventParams.carbon).to.eql(true);

							var message = eventParams.message;
							expect(message).to.have.keys(['from', 'name', 'body', 'type', 'delay', 'isNoConferenceRoomJid', 'xhtmlMessage']);
							expect(message.from).to.eql('doo@dah.com/resource1');
							expect(message.name).to.eql('doo');
							expect(message.type).to.eql('chat');
							expect(message.body).to.eql('Some message text');
							expect(message.isNoConferenceRoomJid).to.be.true;
							expect(message.xhtmlMessage.attr('style')).to.eql('font-weight: bold;');
						});

						bdd.describe('and they are in our roster', function () {
							bdd.beforeEach(function () {
								var contact = new Candy.Core.Contact({
									jid: 'doo@dah.com',
									name: 'Some Name',
									subscription: 'both',
									groups: ['Friends'],
									resources: {}
							 	});

							 	Candy.Core.getRoster().add(contact);
							});

							bdd.it('uses the contact name as the originating name of the message', function () {
								var eventParams;
								$(Candy).on('candy:core.message', function (ev, params) { eventParams = params; });

								receiveMessage();

								expect(eventParams.message.name).to.eql('Some Name');
							});
						});
					});
				});

				bdd.describe('and they are in our roster', function () {
					bdd.beforeEach(function () {
						var contact = new Candy.Core.Contact({
							jid: 'doo@dah.com',
							name: 'Some Name',
							subscription: 'both',
							groups: ['Friends'],
							resources: {}
					 	});

					 	Candy.Core.getRoster().add(contact);
					});

					bdd.it('uses the contact name as the originating name of the message', function () {
						var eventParams;
						$(Candy).on('candy:core.message', function (ev, params) { eventParams = params; });

						receiveMessage();

						expect(eventParams.roomName).to.eql('Some Name');
						expect(eventParams.message.name).to.eql('Some Name');
					});
				});

				bdd.describe('with a delay', function () {
					bdd.describe('according to XEP-0203', function () {
						var receiveMessage = function () {
							testHelper.receiveStanza(
								$msg({
									to: 'foo@bar.com',
									from: 'doo@dah.com/resource1',
									type: 'chat'
								})
								.c('body').t('Some message text')
								.up()
								.c('delay', {
									xmlns: 'urn:xmpp:delay',
									from: 'coven@chat.shakespeare.lit',
									stamp: '2002-09-10T23:08:25Z'
							  }).t('Offline Storage')
							);
						};

						bdd.it('emits a candy:core.message event with the timestamp and a delay marker', function () {
							var eventParams;
							$(Candy).on('candy:core.message', function (ev, params) { eventParams = params; });

							receiveMessage();

							expect(eventParams.timestamp).to.eql('2002-09-10T23:08:25Z');
							expect(eventParams.message.delay).to.eql(true);
						});
					});

					bdd.describe('according to XEP-0091', function () {
						var receiveMessage = function () {
							testHelper.receiveStanza(
								$msg({
									to: 'foo@bar.com',
									from: 'doo@dah.com/resource1',
									type: 'chat'
								})
								.c('body').t('Some message text')
								.up()
								.c('x', {
									xmlns: 'jabber:x:delay',
									from: 'coven@chat.shakespeare.lit',
									stamp: '20020910T23:08:25'
							  }).t('Offline Storage')
							);
						};

						bdd.it('emits a candy:core.message event with the timestamp', function () {
							var eventParams;
							$(Candy).on('candy:core.message', function (ev, params) { eventParams = params; });

							receiveMessage();

							expect(eventParams.timestamp).to.eql('20020910T23:08:25');
						});
					});
				});

				bdd.describe('without a delay', function() {
					var receiveMessage = function () {
						testHelper.receiveStanza(
							$msg({
								to: 'foo@bar.com',
								from: 'doo@dah.com/resource1',
								type: 'chat'
							})
							.c('body').t('Some message text')
						);
					};

					bdd.it('emits a candy:core.message event with the timestamp', function () {
						// TODO: Sinon.useFakeTimers() is undefined, so we can't make this test reliable. See https://groups.google.com/forum/#!topic/sinonjs/_TQugVk441s
						return;
						var eventParams;
						$(Candy).on('candy:core.message', function (ev, params) { eventParams = params; });

						receiveMessage();

						expect(eventParams.timestamp).to.eql('20140413T10:56:00.000');
					});
				});

				bdd.describe('including a chat state notification', function () {
					bdd.describe('of state active', function () {
						var receiveMessage = function () {
							testHelper.receiveStanza(
								$msg({
									to: 'foo@bar.com',
									from: 'doo@dah.com/resource1',
									type: 'chat'
								})
								.c('body').t('Some message text')
								.up()
								.c('active', {xmlns: 'http://jabber.org/protocol/chatstates'})
							);
						};

						bdd.it('emits a candy:core:message:chatstate event', function () {
							var eventParams;
							$(Candy).on('candy:core:message:chatstate', function (ev, params) { eventParams = params; });

							receiveMessage();

							expect(eventParams).to.have.keys(['name', 'roomJid', 'chatstate']);
							expect(eventParams.name).to.eql('doo');
							expect(eventParams.roomJid).to.eql('doo@dah.com');
							expect(eventParams.chatstate).to.eql('active');
						});
					});

					bdd.describe('of state composing', function () {
						var receiveMessage = function () {
							testHelper.receiveStanza(
								$msg({
									to: 'foo@bar.com',
									from: 'doo@dah.com/resource1',
									type: 'chat'
								})
								.c('body').t('Some message text')
								.up()
								.c('composing', {xmlns: 'http://jabber.org/protocol/chatstates'})
							);
						};

						bdd.it('emits a candy:core:message:chatstate event', function () {
							var eventParams;
							$(Candy).on('candy:core:message:chatstate', function (ev, params) { eventParams = params; });

							receiveMessage();

							expect(eventParams).to.have.keys(['name', 'roomJid', 'chatstate']);
							expect(eventParams.name).to.eql('doo');
							expect(eventParams.roomJid).to.eql('doo@dah.com');
							expect(eventParams.chatstate).to.eql('composing');
						});
					});

					bdd.describe('of state paused', function () {
						var receiveMessage = function () {
							testHelper.receiveStanza(
								$msg({
									to: 'foo@bar.com',
									from: 'doo@dah.com/resource1',
									type: 'chat'
								})
								.c('body').t('Some message text')
								.up()
								.c('paused', {xmlns: 'http://jabber.org/protocol/chatstates'})
							);
						};

						bdd.it('emits a candy:core:message:chatstate event', function () {
							var eventParams;
							$(Candy).on('candy:core:message:chatstate', function (ev, params) { eventParams = params; });

							receiveMessage();

							expect(eventParams).to.have.keys(['name', 'roomJid', 'chatstate']);
							expect(eventParams.name).to.eql('doo');
							expect(eventParams.roomJid).to.eql('doo@dah.com');
							expect(eventParams.chatstate).to.eql('paused');
						});
					});

					bdd.describe('of state inactive', function () {
						var receiveMessage = function () {
							testHelper.receiveStanza(
								$msg({
									to: 'foo@bar.com',
									from: 'doo@dah.com/resource1',
									type: 'chat'
								})
								.c('body').t('Some message text')
								.up()
								.c('inactive', {xmlns: 'http://jabber.org/protocol/chatstates'})
							);
						};

						bdd.it('emits a candy:core:message:chatstate event', function () {
							var eventParams;
							$(Candy).on('candy:core:message:chatstate', function (ev, params) { eventParams = params; });

							receiveMessage();

							expect(eventParams).to.have.keys(['name', 'roomJid', 'chatstate']);
							expect(eventParams.name).to.eql('doo');
							expect(eventParams.roomJid).to.eql('doo@dah.com');
							expect(eventParams.chatstate).to.eql('inactive');
						});
					});

					bdd.describe('of state gone', function () {
						var receiveMessage = function () {
							testHelper.receiveStanza(
								$msg({
									to: 'foo@bar.com',
									from: 'doo@dah.com/resource1',
									type: 'chat'
								})
								.c('body').t('Some message text')
								.up()
								.c('gone', {xmlns: 'http://jabber.org/protocol/chatstates'})
							);
						};

						bdd.it('emits a candy:core:message:chatstate event', function () {
							var eventParams;
							$(Candy).on('candy:core:message:chatstate', function (ev, params) { eventParams = params; });

							receiveMessage();

							expect(eventParams).to.have.keys(['name', 'roomJid', 'chatstate']);
							expect(eventParams.name).to.eql('doo');
							expect(eventParams.roomJid).to.eql('doo@dah.com');
							expect(eventParams.chatstate).to.eql('gone');
						});
					});
				});
			});

			bdd.describe('which are from a MUC room participant', function () {
				var roomJid = 'coven@chat.shakespeare.lit',
					participantJid = roomJid + '/thirdwitch';

				var createRoom = function () {
					var room = new Candy.Core.ChatRoom(roomJid);
					Candy.Core.getRooms()[roomJid] = room;
				};

				var receiveJoinPresence = function () {
					var presence = $pres({
						from: participantJid
					})
					.c('x', {xmlns: 'http://jabber.org/protocol/muc#user'})
					.c('item', {affiliation: 'admin', role: 'moderator', jid: 'foo@bar.com/somewhere'});

					testHelper.receiveStanza(presence);
				};

				bdd.beforeEach(createRoom);
				bdd.beforeEach(receiveJoinPresence);
				bdd.afterEach(function () {
					Candy.Core.removeRoom(roomJid);
				});

				bdd.describe('to the room', function () {
					var receiveMessage = function () {
						testHelper.receiveStanza(
							$msg({
								to: 'foo@bar.com',
								from: 'coven@chat.shakespeare.lit/thirdwitch',
								type: 'groupchat'
							})
							.c('body').t('Some message text')
							.up()
							.c('html', {xmlns: 'http://jabber.org/protocol/xhtml-im'})
							.c('body', {xmlns: 'http://www.w3.org/1999/xhtml'})
							.c('p', {style: 'font-weight: bold;'}).t('hi!')
						);
					};

					bdd.it('emits a candy:core.message event', function () {
						var eventParams;
						$(Candy).on('candy:core.message', function (ev, params) { eventParams = params; });

						receiveMessage();

						expect(eventParams).to.have.keys(['roomJid', 'roomName', 'message', 'timestamp', 'carbon', 'stanza']);
						expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
						expect(eventParams.roomName).to.eql('coven');

						var message = eventParams.message;
						expect(message).to.have.keys(['from', 'name', 'body', 'type', 'delay', 'xhtmlMessage']);
						expect(message.from).to.eql('coven@chat.shakespeare.lit');
						expect(message.name).to.eql('thirdwitch');
						expect(message.type).to.eql('groupchat');
						expect(message.body).to.eql('Some message text');
						expect(message.xhtmlMessage.attr('style')).to.eql('font-weight: bold;');
					});

					bdd.describe('and they are in our roster', function () {
						bdd.beforeEach(function () {
							var contact = new Candy.Core.Contact({
								jid: 'foo@bar.com',
								name: 'Some Name',
								subscription: 'both',
								groups: ['Friends'],
								resources: {}
						 	});

						 	Candy.Core.getRoster().add(contact);
						});

						bdd.it('uses the contact name as the originating name of the message', function () {
							var eventParams;
							$(Candy).on('candy:core.message', function (ev, params) { eventParams = params; });

							receiveMessage();

							expect(eventParams.message.name).to.eql('Some Name');
						});
					});

					bdd.describe('with a delay', function () {
						bdd.describe('according to XEP-0203', function () {
							var receiveMessage = function () {
								testHelper.receiveStanza(
									$msg({
										to: 'foo@bar.com',
										from: 'coven@chat.shakespeare.lit/thirdwitch',
										type: 'groupchat'
									})
									.c('body').t('Some message text')
									.up()
									.c('delay', {
										xmlns: 'urn:xmpp:delay',
										from: 'coven@chat.shakespeare.lit',
										stamp: '2002-09-10T23:08:25Z'
								  }).t('Offline Storage')
								);
							};

							bdd.it('emits a candy:core.message event with the timestamp', function () {
								var eventParams;
								$(Candy).on('candy:core.message', function (ev, params) { eventParams = params; });

								receiveMessage();

								expect(eventParams.timestamp).to.eql('2002-09-10T23:08:25Z');
							});
						});

						bdd.describe('according to XEP-0091', function () {
							var receiveMessage = function () {
								testHelper.receiveStanza(
									$msg({
										to: 'foo@bar.com',
										from: 'coven@chat.shakespeare.lit/thirdwitch',
										type: 'groupchat'
									})
									.c('body').t('Some message text')
									.up()
									.c('x', {
										xmlns: 'jabber:x:delay',
										from: 'coven@chat.shakespeare.lit',
										stamp: '20020910T23:08:25'
								  }).t('Offline Storage')
								);
							};

							bdd.it('emits a candy:core.message event with the timestamp', function () {
								var eventParams;
								$(Candy).on('candy:core.message', function (ev, params) { eventParams = params; });

								receiveMessage();

								expect(eventParams.timestamp).to.eql('20020910T23:08:25');
							});
						});
					});

					bdd.describe('including a chat state notification', function () {
						bdd.describe('of state active', function () {
							var receiveMessage = function () {
								testHelper.receiveStanza(
									$msg({
										to: 'foo@bar.com',
										from: 'coven@chat.shakespeare.lit/thirdwitch',
										type: 'groupchat'
									})
									.c('body').t('Some message text')
									.up()
									.c('active', {xmlns: 'http://jabber.org/protocol/chatstates'})
								);
							};

							bdd.it('emits a candy:core:message:chatstate event', function () {
								var eventParams;
								$(Candy).on('candy:core:message:chatstate', function (ev, params) { eventParams = params; });

								receiveMessage();

								expect(eventParams).to.have.keys(['name', 'roomJid', 'chatstate']);
								expect(eventParams.name).to.eql('thirdwitch');
								expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
								expect(eventParams.chatstate).to.eql('active');
							});
						});

						bdd.describe('of state composing', function () {
							var receiveMessage = function () {
								testHelper.receiveStanza(
									$msg({
										to: 'foo@bar.com',
										from: 'coven@chat.shakespeare.lit/thirdwitch',
										type: 'groupchat'
									})
									.c('body').t('Some message text')
									.up()
									.c('composing', {xmlns: 'http://jabber.org/protocol/chatstates'})
								);
							};

							bdd.it('emits a candy:core:message:chatstate event', function () {
								var eventParams;
								$(Candy).on('candy:core:message:chatstate', function (ev, params) { eventParams = params; });

								receiveMessage();

								expect(eventParams).to.have.keys(['name', 'roomJid', 'chatstate']);
								expect(eventParams.name).to.eql('thirdwitch');
								expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
								expect(eventParams.chatstate).to.eql('composing');
							});
						});

						bdd.describe('of state paused', function () {
							var receiveMessage = function () {
								testHelper.receiveStanza(
									$msg({
										to: 'foo@bar.com',
										from: 'coven@chat.shakespeare.lit/thirdwitch',
										type: 'groupchat'
									})
									.c('body').t('Some message text')
									.up()
									.c('paused', {xmlns: 'http://jabber.org/protocol/chatstates'})
								);
							};

							bdd.it('emits a candy:core:message:chatstate event', function () {
								var eventParams;
								$(Candy).on('candy:core:message:chatstate', function (ev, params) { eventParams = params; });

								receiveMessage();

								expect(eventParams).to.have.keys(['name', 'roomJid', 'chatstate']);
								expect(eventParams.name).to.eql('thirdwitch');
								expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
								expect(eventParams.chatstate).to.eql('paused');
							});
						});

						bdd.describe('of state inactive', function () {
							var receiveMessage = function () {
								testHelper.receiveStanza(
									$msg({
										to: 'foo@bar.com',
										from: 'coven@chat.shakespeare.lit/thirdwitch',
										type: 'groupchat'
									})
									.c('body').t('Some message text')
									.up()
									.c('inactive', {xmlns: 'http://jabber.org/protocol/chatstates'})
								);
							};

							bdd.it('emits a candy:core:message:chatstate event', function () {
								var eventParams;
								$(Candy).on('candy:core:message:chatstate', function (ev, params) { eventParams = params; });

								receiveMessage();

								expect(eventParams).to.have.keys(['name', 'roomJid', 'chatstate']);
								expect(eventParams.name).to.eql('thirdwitch');
								expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
								expect(eventParams.chatstate).to.eql('inactive');
							});
						});

						bdd.describe('of state gone', function () {
							var receiveMessage = function () {
								testHelper.receiveStanza(
									$msg({
										to: 'foo@bar.com',
										from: 'coven@chat.shakespeare.lit/thirdwitch',
										type: 'groupchat'
									})
									.c('body').t('Some message text')
									.up()
									.c('gone', {xmlns: 'http://jabber.org/protocol/chatstates'})
								);
							};

							bdd.it('emits a candy:core:message:chatstate event', function () {
								var eventParams;
								$(Candy).on('candy:core:message:chatstate', function (ev, params) { eventParams = params; });

								receiveMessage();

								expect(eventParams).to.have.keys(['name', 'roomJid', 'chatstate']);
								expect(eventParams.name).to.eql('thirdwitch');
								expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
								expect(eventParams.chatstate).to.eql('gone');
							});
						});
					});

					bdd.describe('indicating a subject change', function () {
						var receiveMessage = function () {
							testHelper.receiveStanza(
								$msg({
									to: 'foo@bar.com',
									from: 'coven@chat.shakespeare.lit/thirdwitch',
									type: 'groupchat'
								})
								.c('subject').t('Some new subject!')
							);
						};

						bdd.it('emits a candy:core.message event', function () {
							var eventParams;
							$(Candy).on('candy:core.message', function (ev, params) { eventParams = params; });

							receiveMessage();

							expect(eventParams).to.have.keys(['roomJid', 'roomName', 'message', 'timestamp', 'carbon', 'stanza']);
							expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
							expect(eventParams.roomName).to.eql('coven');

							var message = eventParams.message;
							expect(message).to.have.keys(['from', 'name', 'body', 'type', 'delay']);
							expect(message.from).to.eql('coven@chat.shakespeare.lit');
							expect(message.name).to.eql('coven');
							expect(message.body).to.eql('Some new subject!');
							expect(message.type).to.eql('subject');
						});
					});
				});

				bdd.describe('as a private message', function () {
					var receiveMessage = function () {
						testHelper.receiveStanza(
							$msg({
								to: 'foo@bar.com',
								from: 'coven@chat.shakespeare.lit/thirdwitch',
								type: 'chat'
							})
							.c('body').t('Some message text')
							.up()
							.c('html', {xmlns: 'http://jabber.org/protocol/xhtml-im'})
							.c('body', {xmlns: 'http://www.w3.org/1999/xhtml'})
							.c('p', {style: 'font-weight: bold;'}).t('hi!')
						);
					};

					bdd.it('emits a candy:core.message event', function () {
						var eventParams;
						$(Candy).on('candy:core.message', function (ev, params) { eventParams = params; });

						receiveMessage();

						expect(eventParams).to.have.keys(['roomJid', 'roomName', 'message', 'timestamp', 'carbon', 'stanza']);
						expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit/thirdwitch');
						expect(eventParams.roomName).to.eql('thirdwitch');

						var message = eventParams.message;
						expect(message).to.have.keys(['from', 'name', 'body', 'type', 'delay', 'isNoConferenceRoomJid', 'xhtmlMessage']);
						expect(message.from).to.eql('coven@chat.shakespeare.lit/thirdwitch');
						expect(message.name).to.eql('thirdwitch');
						expect(message.type).to.eql('chat');
						expect(message.body).to.eql('Some message text');
						expect(message.isNoConferenceRoomJid).to.be.false;
						expect(message.xhtmlMessage.attr('style')).to.eql('font-weight: bold;');
					});

					bdd.describe('and they are in our roster', function () {
						bdd.beforeEach(function () {
							var contact = new Candy.Core.Contact({
								jid: 'foo@bar.com',
								name: 'Some Name',
								subscription: 'both',
								groups: ['Friends'],
								resources: {}
						 	});

						 	Candy.Core.getRoster().add(contact);
						});

						bdd.it('uses the contact name as the originating name of the message', function () {
							var eventParams;
							$(Candy).on('candy:core.message', function (ev, params) { eventParams = params; });

							receiveMessage();

							expect(eventParams.message.name).to.eql('Some Name');
						});
					});

					bdd.describe('with a delay', function () {
						bdd.describe('according to XEP-0203', function () {
							var receiveMessage = function () {
								testHelper.receiveStanza(
									$msg({
										to: 'foo@bar.com',
										from: 'coven@chat.shakespeare.lit/thirdwitch',
										type: 'chat'
									})
									.c('body').t('Some message text')
									.up()
									.c('delay', {
										xmlns: 'urn:xmpp:delay',
										from: 'coven@chat.shakespeare.lit',
										stamp: '2002-09-10T23:08:25Z'
								  }).t('Offline Storage')
								);
							};

							bdd.it('emits a candy:core.message event with the timestamp', function () {
								var eventParams;
								$(Candy).on('candy:core.message', function (ev, params) { eventParams = params; });

								receiveMessage();

								expect(eventParams.timestamp).to.eql('2002-09-10T23:08:25Z');
							});
						});

						bdd.describe('according to XEP-0091', function () {
							var receiveMessage = function () {
								testHelper.receiveStanza(
									$msg({
										to: 'foo@bar.com',
										from: 'coven@chat.shakespeare.lit/thirdwitch',
										type: 'chat'
									})
									.c('body').t('Some message text')
									.up()
									.c('x', {
										xmlns: 'jabber:x:delay',
										from: 'coven@chat.shakespeare.lit',
										stamp: '20020910T23:08:25'
								  }).t('Offline Storage')
								);
							};

							bdd.it('emits a candy:core.message event with the timestamp', function () {
								var eventParams;
								$(Candy).on('candy:core.message', function (ev, params) { eventParams = params; });

								receiveMessage();

								expect(eventParams.timestamp).to.eql('20020910T23:08:25');
							});
						});
					});

					bdd.describe('including a chat state notification', function () {
						bdd.describe('of state active', function () {
							var receiveMessage = function () {
								testHelper.receiveStanza(
									$msg({
										to: 'foo@bar.com',
										from: 'coven@chat.shakespeare.lit/thirdwitch',
										type: 'chat'
									})
									.c('body').t('Some message text')
									.up()
									.c('active', {xmlns: 'http://jabber.org/protocol/chatstates'})
								);
							};

							bdd.it('emits a candy:core:message:chatstate event', function () {
								var eventParams;
								$(Candy).on('candy:core:message:chatstate', function (ev, params) { eventParams = params; });

								receiveMessage();

								expect(eventParams).to.have.keys(['name', 'roomJid', 'chatstate']);
								expect(eventParams.name).to.eql('thirdwitch');
								expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit/thirdwitch');
								expect(eventParams.chatstate).to.eql('active');
							});
						});

						bdd.describe('of state composing', function () {
							var receiveMessage = function () {
								testHelper.receiveStanza(
									$msg({
										to: 'foo@bar.com',
										from: 'coven@chat.shakespeare.lit/thirdwitch',
										type: 'chat'
									})
									.c('body').t('Some message text')
									.up()
									.c('composing', {xmlns: 'http://jabber.org/protocol/chatstates'})
								);
							};

							bdd.it('emits a candy:core:message:chatstate event', function () {
								var eventParams;
								$(Candy).on('candy:core:message:chatstate', function (ev, params) { eventParams = params; });

								receiveMessage();

								expect(eventParams).to.have.keys(['name', 'roomJid', 'chatstate']);
								expect(eventParams.name).to.eql('thirdwitch');
								expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit/thirdwitch');
								expect(eventParams.chatstate).to.eql('composing');
							});
						});

						bdd.describe('of state paused', function () {
							var receiveMessage = function () {
								testHelper.receiveStanza(
									$msg({
										to: 'foo@bar.com',
										from: 'coven@chat.shakespeare.lit/thirdwitch',
										type: 'chat'
									})
									.c('body').t('Some message text')
									.up()
									.c('paused', {xmlns: 'http://jabber.org/protocol/chatstates'})
								);
							};

							bdd.it('emits a candy:core:message:chatstate event', function () {
								var eventParams;
								$(Candy).on('candy:core:message:chatstate', function (ev, params) { eventParams = params; });

								receiveMessage();

								expect(eventParams).to.have.keys(['name', 'roomJid', 'chatstate']);
								expect(eventParams.name).to.eql('thirdwitch');
								expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit/thirdwitch');
								expect(eventParams.chatstate).to.eql('paused');
							});
						});

						bdd.describe('of state inactive', function () {
							var receiveMessage = function () {
								testHelper.receiveStanza(
									$msg({
										to: 'foo@bar.com',
										from: 'coven@chat.shakespeare.lit/thirdwitch',
										type: 'chat'
									})
									.c('body').t('Some message text')
									.up()
									.c('inactive', {xmlns: 'http://jabber.org/protocol/chatstates'})
								);
							};

							bdd.it('emits a candy:core:message:chatstate event', function () {
								var eventParams;
								$(Candy).on('candy:core:message:chatstate', function (ev, params) { eventParams = params; });

								receiveMessage();

								expect(eventParams).to.have.keys(['name', 'roomJid', 'chatstate']);
								expect(eventParams.name).to.eql('thirdwitch');
								expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit/thirdwitch');
								expect(eventParams.chatstate).to.eql('inactive');
							});
						});

						bdd.describe('of state gone', function () {
							var receiveMessage = function () {
								testHelper.receiveStanza(
									$msg({
										to: 'foo@bar.com',
										from: 'coven@chat.shakespeare.lit/thirdwitch',
										type: 'chat'
									})
									.c('body').t('Some message text')
									.up()
									.c('gone', {xmlns: 'http://jabber.org/protocol/chatstates'})
								);
							};

							bdd.it('emits a candy:core:message:chatstate event', function () {
								var eventParams;
								$(Candy).on('candy:core:message:chatstate', function (ev, params) { eventParams = params; });

								receiveMessage();

								expect(eventParams).to.have.keys(['name', 'roomJid', 'chatstate']);
								expect(eventParams.name).to.eql('thirdwitch');
								expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit/thirdwitch');
								expect(eventParams.chatstate).to.eql('gone');
							});
						});
					});
				});

				bdd.describe('indicating an error', function () {
					var receiveMessage = function () {
						testHelper.receiveStanza(
							$msg({
								to: 'foo@bar.com',
								from: 'coven@chat.shakespeare.lit',
								type: 'error'
							})
							.c('error', {code: '403', type: 'auth'})
							.c('forbidden', {xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'})
							.up()
							.c('text', {xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'}).t('Visitors are not allowed to send messages to all occupants')
						);
					};

					bdd.it('emits a candy:core.message event', function () {
						var eventParams;
						$(Candy).on('candy:core.message', function (ev, params) { eventParams = params; });

						receiveMessage();

						expect(eventParams).to.have.keys(['roomJid', 'roomName', 'message', 'timestamp', 'carbon', 'stanza']);
						expect(eventParams.roomJid).to.eql('coven@chat.shakespeare.lit');
						expect(eventParams.roomName).to.eql('coven');

						var message = eventParams.message;
						expect(message).to.have.keys(['from', 'body', 'type', 'delay']);
						expect(message.from).to.eql('coven@chat.shakespeare.lit');
						expect(message.type).to.eql('info');
						expect(message.body).to.eql('Visitors are not allowed to send messages to all occupants');
					});
				});
			});

			bdd.describe('which are from a MUC room itself', function () {
				var roomJid = 'coven@chat.shakespeare.lit';

				var receiveMessage = function () {
					var message = $msg({
						from: roomJid,
						type: 'groupchat'
					})
					.c('body').t('Some announcement');

					testHelper.receiveStanza(message);
				};

				bdd.describe('in which we are present', function () {
					var createRoom = function () {
						var room = new Candy.Core.ChatRoom(roomJid);
						Candy.Core.getRooms()[roomJid] = room;
					};

					bdd.beforeEach(createRoom);
					bdd.afterEach(function () {
						Candy.Core.removeRoom(roomJid);
					});

					bdd.it('emits a candy:core.message event', function () {
						var eventParams;
						$(Candy).on('candy:core.message', function (ev, params) { eventParams = params; });

						receiveMessage();

						expect(eventParams).to.have.keys(['roomJid', 'roomName', 'message', 'timestamp', 'carbon', 'stanza']);
						expect(eventParams.roomJid).to.eql(roomJid);
						expect(eventParams.roomName).to.eql('');

						var message = eventParams.message;
						expect(message).to.have.keys(['from', 'name', 'body', 'type', 'delay']);
						expect(message.from).to.eql(roomJid);
						expect(message.name).to.eql('');
						expect(message.body).to.eql('Some announcement');
						expect(message.type).to.eql('info');
					});
				});

				bdd.describe('in which we are not present', function () {
					bdd.it('does not emit a candy:core.message event', function () {
						var emitted = false;
						$(Candy).on('candy:core.message', function () { emitted = true; });

						receiveMessage();

						expect(emitted).to.be.false;
					});
				});
			});

			bdd.describe('which are of a type not listed in the XMPP spec', function () {
				var receiveMessage = function () {
					testHelper.receiveStanza(
						$msg({
							from: 'foo@bar.com',
							type: 'randomtype'
						})
						.c('body').t('Some message text')
					);
				};

				bdd.it('emits a candy:core:chat:message:other event', function () {
					var eventParams;
					$(Candy).on('candy:core:chat:message:other', function (ev, params) { eventParams = params; });

					receiveMessage();

					expect(eventParams.type).to.eql('randomtype');
					expect(eventParams.message.attr('from')).to.eql('foo@bar.com');
				});
			});

			bdd.describe('which are from a server admin (broadcast)', function () {
				var receiveMessage = function () {
					testHelper.receiveStanza(
						$msg({
							from: 'bar.com',
							type: 'headline'
						})
						.c('body').t('Some message text')
					);
				};

				bdd.it('emits a candy:core.chat.message.admin event', function () {
					var eventParams;
					$(Candy).on('candy:core.chat.message.admin', function (ev, params) { eventParams = params; });

					receiveMessage();

					expect(eventParams.type).to.eql('headline');
					expect(eventParams.message).to.eql('Some message text');
				});
			});

			bdd.describe('which are from the server', function () {
				var receiveMessage = function () {
					testHelper.receiveStanza(
						$msg({
							from: 'bar.com',
							type: 'headline',
							to: 'doo@dah.com'
						})
						.c('subject').t('Hey!').up()
						.c('body').t('Some message text')
					);
				};

				bdd.it('emits a candy:core.chat.message.server event', function () {
					var eventParams;
					$(Candy).on('candy:core.chat.message.server', function (ev, params) { eventParams = params; });

					receiveMessage();

					expect(eventParams.type).to.eql('headline');
					expect(eventParams.subject).to.eql('Hey!');
					expect(eventParams.message).to.eql('Some message text');
				});
			});
		});

		// TODO: Test me
		bdd.describe('processing room disco info', function () {});
	});
});
