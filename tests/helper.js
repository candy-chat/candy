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

	return self;
}));
