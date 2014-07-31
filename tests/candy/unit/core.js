/*global define, Candy */
/*jshint -W030 */

define([
		'intern!bdd'
	, 'intern/chai!expect'
	, 'intern/order!jquery'
	, 'intern/order!candy/libs.bundle.js'
	, 'intern/order!candy/src/candy.js'
	, 'intern/order!candy/src/core.js'
	, 'intern/order!candy/src/core/chatRoster.js'
], function (bdd, expect) {
	bdd.describe('Candy.Core', function () {
		bdd.beforeEach(function () {
			Candy.Core.init('http://example.com/http-bind');
		});

		bdd.describe('the main roster', function () {
			bdd.it('should be a chatRoster', function () {
				expect(Candy.Core.getRoster()).to.be.an.instanceof(Candy.Core.ChatRoster);
			});

			bdd.it('should be initially empty', function () {
				expect(Candy.Core.getRoster().getAll()).to.be.empty;
			});
		});
	});
});
