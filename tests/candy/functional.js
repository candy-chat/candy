/*global define */

var exampleUrl;

if (process.env.CANDY_VAGRANT) {
	exampleUrl = 'http://localhost:80/';
} else {
	exampleUrl = 'http://localhost:8080/';
}

define([
	'intern!bdd',
	'intern/chai!expect'
], function (bdd, expect) {
	bdd.describe('Basic chat operation', function () {
		bdd.it('should load the correct page', function () {
			return this.remote.get(exampleUrl)
				.getPageTitle()
				.then(function (title) {
					expect(title).to.equal('Candy - Chats are not dead yet');
				});
		});
	});
});
