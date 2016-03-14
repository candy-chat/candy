/**
 * Nickchange plugin for Candy
 *
 * Copyright 2014 Michael Weibel <michael.weibel@gmail.com>
 *
 * License: MIT
 */

/* global Candy, jQuery, Mustache */

var CandyShop = (function(self) { return self; }(CandyShop || {}));

CandyShop.Nickchange = (function(self, Candy, $) {

	self.init = function() {
		self.applyTranslations();

		var html = '<li id="nickchange-control" data-tooltip="' + $.i18n._('candyshopNickchange') + '"></li>';
		$('#emoticons-icon').after(html);
		$('#nickchange-control').click(function() {
			self.showModal();
		});
	};

	self.showModal = function() {
		Candy.View.Pane.Chat.Modal.show(Mustache.to_html(self.nicknameChangeForm, {
			_labelNickname: $.i18n._('labelNickname'),
			_label: $.i18n._('candyshopNickchange')
		}));
		$('#nickname').focus();

		// register submit handler
		$('#nickname-change-form').submit(self.changeNickname);
	};

	self.changeNickname = function() {
		var nickname = $('#nickname').val();
		Candy.View.Pane.Chat.Modal.hide(function() {
			Candy.Core.Action.Jabber.SetNickname(nickname);
		});
		return false;
	};

	self.nicknameChangeForm = '<strong>{{_label}}</strong>' +
		'<form method="post" id="nickname-change-form" class="nickname-change-form">' +
		'<label for="nickname">{{_labelNickname}}</label><input type="text" id="nickname" name="nickname" />' +
		'<input type="submit" class="button" value="{{_label}}" /></form>';

	self.applyTranslations = function() {
		var translations = {
		  'en' : 'Change nickname',
		  'de' : 'Spitzname ändern'
		};
		$.each(translations, function(k, v) {
			if(Candy.View.Translation[k]) {
				Candy.View.Translation[k].candyshopNickchange = v;
			}

		});
	};

	return self;
}(CandyShop.Nickchange || {}, Candy, jQuery));
