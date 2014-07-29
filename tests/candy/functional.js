/*global define */

define([
	'intern!bdd',
	'intern/chai!expect'
], function (bdd, expect) {
	bdd.describe('Basic chat operation', function () {
		bdd.it('should load the correct page', function () {
			return this.remote.get('http://localhost:8080')
				.getPageTitle()
				.then(function (title) {
					expect(title).to.equal('Candy - Chats are not dead yet');
				});
		});
	});
});
