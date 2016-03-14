/* global Candy, jQuery */

var CandyShop = (function(self) { return self; }(CandyShop || {}));

CandyShop.ColorsXhtml = (function(self, Candy, $) {

	var _numColors,
		_currentColor = '',
		_colors = [
			'#333',
			'#c4322b',
			'#37991e',
			'#1654c9',
			'#66379b',
			'#ba7318',
			'#32938a',
			'#9e2274'
		];

	self.init = function(colors) {
		if(colors && colors.length) {
			_colors = colors;
		}
		_numColors = _colors.length;

		self.applyTranslations();

		$(Candy).on('candy:view.message.before-send', function(e, args) {
			if(_currentColor !== '' && $.trim(args.message) !== '') {
				args.xhtmlMessage = '<span style="color:' + _currentColor + '">' + Candy.Util.Parser.escape(args.message) + '</span>';
			}
		});

		if(Candy.Util.cookieExists('candyshop-colors-xhtml-current')) {
			var color = Candy.Util.getCookie('candyshop-colors-xhtml-current');
			if(_colors.indexOf(color) !== -1) {
				_currentColor = color;
			}
		}
		var html = '<li id="colors-control" data-tooltip="' + $.i18n._('candyshopColorsXhtmlMessagecolor') + '"><span style="color:' + _currentColor + ';background-color:' + _currentColor +'" id="colors-control-indicator"></span></li>';
		$('#emoticons-icon').after(html);
		$('#colors-control').click(function() {
			CandyShop.ColorsXhtml.showPicker(this);
		});
	};

	self.showPicker = function(elem) {
		elem = $(elem);
		var pos = elem.offset(),
			menu = $('#context-menu'),
			content = $('ul', menu),
			colors = '',
			i;

		$('#tooltip').hide();

		for(i = _numColors-1; i >= 0; i--) {
			colors = '<span style="color:' + _colors[i] + ';background-color:' + _colors[i] + ';" data-color="' + _colors[i] + '"></span>' + colors;
		}
		content.html('<li class="colors">' + colors + '</li>');
		content.find('span').click(function() {
			_currentColor = $(this).attr('data-color');
			$('#colors-control-indicator').attr('style', 'color:' + _currentColor + ';background-color:' + _currentColor);
			Candy.Util.setCookie('candyshop-colors-xhtml-current', _currentColor, 365);
			Candy.View.Pane.Room.setFocusToForm(Candy.View.getCurrent().roomJid);
			menu.hide();
		});

		var posLeft = Candy.Util.getPosLeftAccordingToWindowBounds(menu, pos.left),
			posTop  = Candy.Util.getPosTopAccordingToWindowBounds(menu, pos.top);

		menu.css({'left': posLeft.px, 'top': posTop.px, backgroundPosition: posLeft.backgroundPositionAlignment + ' ' + posTop.backgroundPositionAlignment});
		menu.fadeIn('fast');

		return true;
	};

	self.applyTranslations = function() {
		var translations = {
		  'en' : 'Message Color',
		  'ru' : 'Цвет сообщения',
		  'de' : 'Farbe für Nachrichten',
		  'fr' : 'Couleur des messages',
		  'nl' : 'Berichtkleur',
		  'es' : 'Color de los mensajes'
		};
		$.each(translations, function(k, v) {
			if(Candy.View.Translation[k]) {
				Candy.View.Translation[k].candyshopColorsXhtmlMessagecolor = v;
			}

		});
	};

	return self;
}(CandyShop.ColorsXhtml || {}, Candy, jQuery));
