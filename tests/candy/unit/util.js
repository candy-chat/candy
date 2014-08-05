/*global define, Candy */
/*jshint -W027*/

define([
		'intern!bdd'
	, 'intern/chai!expect'
	, 'intern/order!jquery'
	, 'intern/order!candy/libs.bundle.js'
	, 'intern/order!candy/src/candy.js'
	, 'intern/order!candy/src/core.js'
	, 'intern/order!candy/src/util.js'
], function (bdd, expect) {
	bdd.describe('Candy.Util', function () {
		bdd.describe('jidToId', function () {
			bdd.it('should MD5 hash a JID', function () {
				expect(Candy.Util.jidToId('foo@bar.com')).to.equal('f3ada405ce890b6f8204094deb12d8a8');
			});
		});

		bdd.describe('escapeJid', function () {
			bdd.it('should escape JIDs per XEP-0106', function () {
				expect(Candy.Util.escapeJid("space cadet@example.com")).to.equal("space\\20cadet@example.com");
			});
			bdd.it('should escape JIDs per XEP-0106', function () {
				expect(Candy.Util.escapeJid("call me \"ishmael\"@example.com")).to.equal("call\\20me\\20\\22ishmael\\22@example.com");
			});
			bdd.it('should escape JIDs per XEP-0106', function () {
				expect(Candy.Util.escapeJid("at&t guy@example.com")).to.equal("at\\26t\\20guy@example.com");
			});
			bdd.it('should escape JIDs per XEP-0106', function () {
				expect(Candy.Util.escapeJid("d'artagnan@example.com")).to.equal("d\\27artagnan@example.com");
			});
			bdd.it('should escape JIDs per XEP-0106', function () {
				return true; // Skip this for now. See https://github.com/theintern/intern/pull/195
				expect(Candy.Util.escapeJid("/.fanboy@example.com")).to.equal("\\2f.fanboy@example.com");
			});
			bdd.it('should escape JIDs per XEP-0106', function () {
				expect(Candy.Util.escapeJid("::foo::@example.com")).to.equal("\\3a\\3afoo\\3a\\3a@example.com");
			});
			bdd.it('should escape JIDs per XEP-0106', function () {
				expect(Candy.Util.escapeJid("<foo>@example.com")).to.equal("\\3cfoo\\3e@example.com");
			});
			bdd.it('should escape JIDs per XEP-0106', function () {
				return true; // Skip this for now. See https://github.com/theintern/intern/pull/195
				expect(Candy.Util.escapeJid("user@host@example.com")).to.equal("user\\40host@example.com");
			});
			bdd.it('should escape JIDs per XEP-0106', function () {
				expect(Candy.Util.escapeJid("c:\\net@example.com")).to.equal('c\\3a\\5cnet@example.com');
			});
			bdd.it('should escape JIDs per XEP-0106', function () {
				expect(Candy.Util.escapeJid("c:\\net@example.com")).to.equal("c\\3a\\5cnet@example.com");
			});
			bdd.it('should escape JIDs per XEP-0106', function () {
				expect(Candy.Util.escapeJid("c:\\cool stuff@example.com")).to.equal("c\\3a\\5ccool\\20stuff@example.com");
			});
			bdd.it('should escape JIDs per XEP-0106', function () {
				expect(Candy.Util.escapeJid("c:\\5commas@example.com")).to.equal("c\\3a\\5c5commas@example.com");
			});
		});

		bdd.describe('unescapeJid', function () {
			bdd.it('should unescape JIDs per XEP-0106', function () {
				expect(Candy.Util.unescapeJid("space\\20cadet@example.com")).to.equal("space cadet@example.com");
			});
			bdd.it('should unescape JIDs per XEP-0106', function () {
				expect(Candy.Util.unescapeJid("call\\20me\\20\\22ishmael\\22@example.com")).to.equal("call me \"ishmael\"@example.com");
			});
			bdd.it('should unescape JIDs per XEP-0106', function () {
				expect(Candy.Util.unescapeJid("at\\26t\\20guy@example.com")).to.equal("at&t guy@example.com");
			});
			bdd.it('should unescape JIDs per XEP-0106', function () {
				expect(Candy.Util.unescapeJid("d\\27artagnan@example.com")).to.equal("d'artagnan@example.com");
			});
			bdd.it('should unescape JIDs per XEP-0106', function () {
				expect(Candy.Util.unescapeJid("\\2f.fanboy@example.com")).to.equal("/.fanboy@example.com");
			});
			bdd.it('should unescape JIDs per XEP-0106', function () {
				expect(Candy.Util.unescapeJid("\\3a\\3afoo\\3a\\3a@example.com")).to.equal("::foo::@example.com");
			});
			bdd.it('should unescape JIDs per XEP-0106', function () {
				expect(Candy.Util.unescapeJid("\\3cfoo\\3e@example.com")).to.equal("<foo>@example.com");
			});
			bdd.it('should unescape JIDs per XEP-0106', function () {
				expect(Candy.Util.unescapeJid("user\\40host@example.com")).to.equal("user@host@example.com");
			});
			bdd.it('should unescape JIDs per XEP-0106', function () {
				expect(Candy.Util.unescapeJid('c\\3a\\5cnet@example.com')).to.equal("c:\\net@example.com");
			});
			bdd.it('should unescape JIDs per XEP-0106', function () {
				expect(Candy.Util.unescapeJid("c\\3a\\5cnet@example.com")).to.equal("c:\\net@example.com");
			});
			bdd.it('should unescape JIDs per XEP-0106', function () {
				expect(Candy.Util.unescapeJid("c\\3a\\5ccool\\20stuff@example.com")).to.equal("c:\\cool stuff@example.com");
			});
			bdd.it('should unescape JIDs per XEP-0106', function () {
				expect(Candy.Util.unescapeJid("c\\3a\\5c5commas@example.com")).to.equal("c:\\5commas@example.com");
			});
		});

		bdd.describe('crop', function () {
			bdd.describe('with a string longer than the crop length', function () {
				bdd.it('crops the string to the specified length and replaces the end with elipses', function () {
					expect(Candy.Util.crop('FooBarBaz', 6)).to.equal('Foo...');
				});
			});

			bdd.describe('with a string the same length as the crop length', function () {
				bdd.it('does not modify the string', function () {
					expect(Candy.Util.crop('FooBar', 6)).to.equal('FooBar');
				});
			});

			bdd.describe('with a string shorter than the crop length', function () {
				bdd.it('does not modify the string', function () {
					expect(Candy.Util.crop('FooBar', 9)).to.equal('FooBar');
				});
			});
		});

		bdd.describe('Parser', function () {
			bdd.describe('jid', function () {
				bdd.it('should parse JIDs per RFC6122', function () {
					var jid = Candy.Util.Parser.jid("space cadet@example.com");
					expect(jid.node).to.equal("space cadet");
					expect(jid.domain).to.equal("example.com");
					expect(jid.resource).to.equal(undefined);
				});
				bdd.it('should parse JIDs per RFC6122', function () {
					var jid = Candy.Util.Parser.jid("call me \"ishmael\"@example.com");
					expect(jid.node).to.equal("call me \"ishmael\"");
					expect(jid.domain).to.equal("example.com");
					expect(jid.resource).to.equal(undefined);
				});
				bdd.it('should parse JIDs per RFC6122', function () {
					var jid = Candy.Util.Parser.jid("at&t guy@example.com");
					expect(jid.node).to.equal("at&t guy");
					expect(jid.domain).to.equal("example.com");
					expect(jid.resource).to.equal(undefined);
				});
				bdd.it('should parse JIDs per RFC6122', function () {
					var jid = Candy.Util.Parser.jid("d'artagnan@example.com");
					expect(jid.node).to.equal("d'artagnan");
					expect(jid.domain).to.equal("example.com");
					expect(jid.resource).to.equal(undefined);
				});
				bdd.it('should parse JIDs per RFC6122', function () {
					var jid = Candy.Util.Parser.jid("/.fanboy@example.com");
					expect(jid.node).to.equal("/.fanboy");
					expect(jid.domain).to.equal("example.com");
					expect(jid.resource).to.equal(undefined);
				});
				bdd.it('should parse JIDs per RFC6122', function () {
					var jid = Candy.Util.Parser.jid("::foo::@example.com");
					expect(jid.node).to.equal("::foo::");
					expect(jid.domain).to.equal("example.com");
					expect(jid.resource).to.equal(undefined);
				});
				bdd.it('should parse JIDs per RFC6122', function () {
					var jid = Candy.Util.Parser.jid("<foo>@example.com");
					expect(jid.node).to.equal("<foo>");
					expect(jid.domain).to.equal("example.com");
					expect(jid.resource).to.equal(undefined);
				});
				bdd.it('should parse JIDs per RFC6122', function () {
					return true; // Skip this for now. See https://github.com/theintern/intern/pull/195
					var jid = Candy.Util.Parser.jid("user@host@example.com");
					expect(jid.node).to.equal("user@host");
					expect(jid.domain).to.equal("example.com");
					expect(jid.resource).to.equal(undefined);
				});
				bdd.it('should parse JIDs per RFC6122', function () {
					var jid = Candy.Util.Parser.jid("c:\\net@example.com");
					expect(jid.node).to.equal('c:\\net');
					expect(jid.domain).to.equal('example.com');
					expect(jid.resource).to.equal(undefined);
				});
				bdd.it('should parse JIDs per RFC6122', function () {
					var jid = Candy.Util.Parser.jid("c:\\net@example.com");
					expect(jid.node).to.equal("c:\\net");
					expect(jid.domain).to.equal("example.com");
					expect(jid.resource).to.equal(undefined);
				});
				bdd.it('should parse JIDs per RFC6122', function () {
					var jid = Candy.Util.Parser.jid("c:\\cool stuff@example.com");
					expect(jid.node).to.equal("c:\\cool stuff");
					expect(jid.domain).to.equal("example.com");
					expect(jid.resource).to.equal(undefined);
				});
				bdd.it('should parse JIDs per RFC6122', function () {
					var jid = Candy.Util.Parser.jid("c:\\5commas@example.com");
					expect(jid.node).to.equal("c:\\5commas");
					expect(jid.domain).to.equal("example.com");
					expect(jid.resource).to.equal(undefined);
				});
			});
		});
	});
});
