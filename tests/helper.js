/*global define, Strophe */

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
	self.str = function(builder) {
		if (builder.tree) {
			return Strophe.serialize(builder.tree());
		}
		return Strophe.serialize(builder);
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

	self.receiveStanza = function (connection, stanza) {
		connection._dataRecv(self.createRequest(stanza));
	};

	return self;
}));
