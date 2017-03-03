var CandyShop = (function(self) { return self; }(CandyShop || {}));

CandyShop.MeDoes = (function(self, Candy, $) {
// CandyShop.Timeago


	self.init = function() {
		$(Candy).on("candy:view.message.before-show", function(e, args) {
			if (args && args.message && args.message.match(/^\/me /i)) {
				var message = args.message.match(/^\/([^\s]+)(?:\s+(.*))?$/m)[2];
				self.userInfoMessage(args.roomJid, args.name, message);
				return false;
			}
		});

	};
	
        if(CandyShop.Timeago === undefined) {
		Candy.View.Template.Chat.userInfoMessage = '<li><small>{{time}}</small><div class="infomessage">' +
		'<span class="spacer">•</span>&nbsp;<span><strong>{{name}}</strong>&nbsp;{{{message}}}</span></div></li>';
	}
	else {
		Candy.View.Template.Chat.userInfoMessage = '<li><small><abbr title="{{time}}">{{time}}</abbr></small><div class="infomessage">' +
		'<span class="spacer">•</span>&nbsp;<span><strong>{{name}}</strong>&nbsp;{{{message}}}</span></div></li>';
	}
	
	//Using logic from real infoMessage function and inserting custom template
	self.userInfoMessage = function (roomJid, name, message){

		if(Candy.View.getCurrent().roomJid) {
			var html = Mustache.to_html(Candy.View.Template.Chat.userInfoMessage, {
				name: name,
				message: message,
				time: Candy.Util.localizedTime(new Date().toGMTString())
			});
			Candy.View.Pane.Room.appendToMessagePane(roomJid, html);
			if (Candy.View.getCurrent().roomJid === roomJid) {
				Candy.View.Pane.Room.scrollToBottom(Candy.View.getCurrent().roomJid);
			}
			$(Candy).triggerHandler('candy:view.message.after-show', {
				'message' : message
			});
		}
	};
	
	return self;
}(CandyShop.MeDoes || {}, Candy, jQuery));
