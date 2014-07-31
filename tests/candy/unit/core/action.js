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
	, 'intern/order!candy/src/core/action.js'
], function (bdd, chai, expect, sinon, sinonChai, testHelper) {
	chai.use(sinonChai);

	bdd.describe('Candy.Core.Action', function () {
		var fakeConnection;

		bdd.before(function () {
			sinon.stub(Strophe.Bosh.prototype, '_processRequest');
		});

		bdd.beforeEach(function () {
			fakeConnection = new Strophe.Connection("http://foo.bar/http-bind");
			fakeConnection.authenticated = true;
			fakeConnection.jid = 'n@d/r';

			sinon.stub(Candy.Core, 'getConnection', function () {
				// TODO: Switch this back to using returns() once https://github.com/cjohansen/Sinon.JS/pull/523 is released
				return fakeConnection;
			});
		});

		bdd.describe('requesting the roster', function() {
			bdd.it('sends a roster request stanza', function () {
				var request = sinon.spy(fakeConnection, 'send');

				Candy.Core.Action.Jabber.Roster();

				expect(testHelper.str(request.firstCall.args[0])).to.eql(
					"<iq type='get' xmlns='jabber:client' id='1:sendIQ'><query xmlns='jabber:iq:roster'/></iq>"
				);
			});
		});
	});
});
