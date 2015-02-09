/*global define, Strophe, Candy, $ */

'use strict';

(function (testHelper) {
	// Module systems magic dance.
	if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
		// NodeJS
		module.exports = testHelper({});
	} else if (typeof define === "function" && define.amd) {
		// AMD
		define(function () {
			return testHelper({});
		});
	}
}(function testHelper(self) {
	self.stanzaFromRequest = function (request) {
		var builder = request.firstCall.args[0];
		if (builder.tree) { builder.tree(); }
		return $(builder);
	};

	self.createRequest = function (stanza) {
		stanza = typeof stanza.tree === "function" ? stanza.tree() : stanza;
		var req = new Strophe.Request(stanza, function() {});
		req.getResponse = function() {
			var env = new Strophe.Builder('env', {type: 'mock'}).tree();
			env.appendChild(stanza);
			return env;
		};
		return req;
	};

	self.receiveStanza = function (stanza) {
		Candy.Core.getConnection()._dataRecv(self.createRequest(stanza));
	};

	self.bootstrapTestClient = function () {
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

		var fakeConnection = Candy.Core.getConnection();
		fakeConnection.authenticated = true;
		fakeConnection.jid = 'n@d/r';

		// The Strophe roster plugin adds its callbacks when we connect only (see https://github.com/strophe/strophejs-plugins/commit/4f3bcd25c43142f99c314f75a9bc10c8957a23d1). Add them manually here to compensate.
		fakeConnection.addHandler(fakeConnection.roster._onReceivePresence.bind(fakeConnection.roster), null, 'presence', null, null, null);
		fakeConnection.addHandler(fakeConnection.roster._onReceiveIQ.bind(fakeConnection.roster), Strophe.NS.ROSTER, 'iq', "set", null, null);

		Candy.Core.registerEventHandlers();

		// Remove all event handlers
		$(Candy).off();

		return fakeConnection;
	};

	self.setupTests = function (bdd, sinon) {
		bdd.before(function () {
			sinon.stub(Strophe.Bosh.prototype, '_processRequest');
		});

		bdd.after(function () {
			Strophe.Bosh.prototype._processRequest.restore();
		});

		bdd.beforeEach(self.bootstrapTestClient);
	};

	return self;
}));
