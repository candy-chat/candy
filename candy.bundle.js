/** File: candy.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@gmail.com>
 *   - Michael Weibel <michael.weibel@gmail.com>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 *   (c) 2012, 2013 Patrick Stadler & Michael Weibel. All rights reserved.
 */

/* global jQuery */

/** Class: Candy
 * Candy base class for initalizing the view and the core
 *
 * Parameters:
 *   (Candy) self - itself
 *   (jQuery) $ - jQuery
 */
var Candy = (function(self, $) {
	/** Object: about
	 * About candy
	 *
	 * Contains:
	 *   (String) name - Candy
	 *   (Float) version - Candy version
	 */
	self.about = {
		name: 'Candy',
		version: '1.5.1-dev'
	};

	/** Function: init
	 * Init view & core
	 *
	 * Parameters:
	 *   (String) service - URL to the BOSH interface
	 *   (Object) options - Options for candy
	 *
	 * Options:
	 *   (Boolean) debug - Debug (Default: false)
	 *   (Array|Boolean) autojoin - Autojoin these channels. When boolean true, do not autojoin, wait if the server sends something.
	 */
	self.init = function(service, options) {
		if (!options.viewClass) {
			options.viewClass = self.View;
		}
		options.viewClass.init($('#candy'), options.view);
		self.Core.init(service, options.core);
	};

	return self;
}(Candy || {}, jQuery));

/** File: core.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@gmail.com>
 *   - Michael Weibel <michael.weibel@gmail.com>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 *   (c) 2012, 2013 Patrick Stadler & Michael Weibel. All rights reserved.
 */

/* global Candy, window, Strophe, jQuery */

/** Class: Candy.Core
 * Candy Chat Core
 *
 * Parameters:
 *   (Candy.Core) self - itself
 *   (Strophe) Strophe - Strophe JS
 *   (jQuery) $ - jQuery
 */
Candy.Core = (function(self, Strophe, $) {
		/** PrivateVariable: _connection
		 * Strophe connection
		 */
	var _connection = null,
		/** PrivateVariable: _service
		 * URL of BOSH service
		 */
		_service = null,
		/** PrivateVariable: _user
		 * Current user (me)
		 */
		_user = null,
		/** PrivateVariable: _rooms
		 * Opened rooms, containing instances of Candy.Core.ChatRooms
		 */
		_rooms = {},
		/** PrivateVariable: _anonymousConnection
		 * Set in <Candy.Core.connect> when jidOrHost doesn't contain a @-char.
		 */
		_anonymousConnection = false,
		/** PrivateVariable: _status
		 * Current Strophe connection state
		 */
		_status,
		/** PrivateVariable: _options
		 * Options:
		 *   (Boolean) debug - Debug (Default: false)
		 *   (Array|Boolean) autojoin - Autojoin these channels. When boolean true, do not autojoin, wait if the server sends something.
		 */
		_options = {
			/** Boolean: autojoin
			 * If set to `true` try to get the bookmarks and autojoin the rooms (supported by Openfire).
			 * You may want to define an array of rooms to autojoin: `['room1@conference.host.tld', 'room2...]` (ejabberd, Openfire, ...)
			 */
			autojoin: undefined,
			debug: false,
			disableWindowUnload: false,
			/** Integer: presencePriority
			 * Default priority for presence messages in order to receive messages across different resources
			 */
			presencePriority: 1
		},

		/** PrivateFunction: _addNamespace
		 * Adds a namespace.
		 *
		 * Parameters:
		 *   (String) name - namespace name (will become a constant living in Strophe.NS.*)
		 *   (String) value - XML Namespace
		 */
		_addNamespace = function(name, value) {
			Strophe.addNamespace(name, value);
		},

		/** PrivateFunction: _addNamespaces
		 * Adds namespaces needed by Candy.
		 */
		_addNamespaces = function() {
			_addNamespace('PRIVATE', 'jabber:iq:private');
			_addNamespace('BOOKMARKS', 'storage:bookmarks');
			_addNamespace('PRIVACY', 'jabber:iq:privacy');
			_addNamespace('DELAY', 'jabber:x:delay');
		},

		_getEscapedJidFromJid = function(jid) {
			var node = Strophe.getNodeFromJid(jid),
				domain = Strophe.getDomainFromJid(jid);
			return node ? Strophe.escapeNode(node) + '@' + domain : domain;
		};

	/** Function: init
	 * Initialize Core.
	 *
	 * Parameters:
	 *   (String) service - URL of BOSH service
	 *   (Object) options - Options for candy
	 */
	self.init = function(service, options) {
		_service = service;
		// Apply options
		$.extend(true, _options, options);

		// Enable debug logging
		if(_options.debug) {
			self.log = function(str) {
				try { // prevent erroring
					if(typeof window.console !== undefined && typeof window.console.log !== undefined) {
						console.log(str);
					}
				} catch(e) {}
			};
			self.log('[Init] Debugging enabled');
		}

		_addNamespaces();
		// Connect to BOSH service
		_connection = new Strophe.Connection(_service);
		_connection.rawInput = self.rawInput.bind(self);
		_connection.rawOutput = self.rawOutput.bind(self);

		// Window unload handler... works on all browsers but Opera. There is NO workaround.
		// Opera clients getting disconnected 1-2 minutes delayed.
		if (!_options.disableWindowUnload) {
			window.onbeforeunload = self.onWindowUnload;
		}
	};

	/** Function: registerEventHandlers
	 * Adds listening handlers to the connection.
	 *
	 * Use with caution from outside of Candy.
	 */
	self.registerEventHandlers = function() {
		self.addHandler(self.Event.Jabber.Version, Strophe.NS.VERSION, 'iq');
		self.addHandler(self.Event.Jabber.Presence, null, 'presence');
		self.addHandler(self.Event.Jabber.Message, null, 'message');
		self.addHandler(self.Event.Jabber.Bookmarks, Strophe.NS.PRIVATE, 'iq');
		self.addHandler(self.Event.Jabber.Room.Disco, Strophe.NS.DISCO_INFO, 'iq', 'result');
		self.addHandler(self.Event.Jabber.PrivacyList, Strophe.NS.PRIVACY, 'iq', 'result');
		self.addHandler(self.Event.Jabber.PrivacyListError, Strophe.NS.PRIVACY, 'iq', 'error');

		self.addHandler(_connection.disco._onDiscoInfo.bind(_connection.disco), Strophe.NS.DISCO_INFO, 'iq', 'get');
		self.addHandler(_connection.disco._onDiscoItems.bind(_connection.disco), Strophe.NS.DISCO_ITEMS, 'iq', 'get');
		self.addHandler(_connection.caps._delegateCapabilities.bind(_connection.caps), Strophe.NS.CAPS);
	};

	/** Function: connect
	 * Connect to the jabber host.
	 *
	 * There are four different procedures to login:
	 *   connect('JID', 'password') - Connect a registered user
	 *   connect('domain') - Connect anonymously to the domain. The user should receive a random JID.
	 *   connect('domain', null, 'nick') - Connect anonymously to the domain. The user should receive a random JID but with a nick set.
	 *   connect('JID') - Show login form and prompt for password. JID input is hidden.
	 *   connect() - Show login form and prompt for JID and password.
	 *
	 * See:
	 *   <Candy.Core.attach()> for attaching an already established session.
	 *
	 * Parameters:
	 *   (String) jidOrHost - JID or Host
	 *   (String) password  - Password of the user
	 *   (String) nick      - Nick of the user. Set one if you want to anonymously connect but preset a nick. If jidOrHost is a domain
	 *                        and this param is not set, Candy will prompt for a nick.
	 */
	self.connect = function(jidOrHost, password, nick) {
		// Reset before every connection attempt to make sure reconnections work after authfail, alltabsclosed, ...
		_connection.reset();
		self.registerEventHandlers();

		_anonymousConnection = !_anonymousConnection ? jidOrHost && jidOrHost.indexOf("@") < 0 : true;

		if(jidOrHost && password) {
			// authentication
			_connection.connect(_getEscapedJidFromJid(jidOrHost) + '/' + Candy.about.name, password, Candy.Core.Event.Strophe.Connect);
			if (nick) {
				_user = new self.ChatUser(jidOrHost, nick);
			} else {
				_user = new self.ChatUser(jidOrHost, Strophe.getNodeFromJid(jidOrHost));
			}
		} else if(jidOrHost && nick) {
			// anonymous connect
			_connection.connect(_getEscapedJidFromJid(jidOrHost) + '/' + Candy.about.name, null, Candy.Core.Event.Strophe.Connect);
			_user = new self.ChatUser(null, nick); // set jid to null because we'll later receive it
		} else if(jidOrHost) {
			Candy.Core.Event.Login(jidOrHost);
		} else {
			// display login modal
			Candy.Core.Event.Login();
		}
	};

	/** Function: attach
	 * Attach an already binded & connected session to the server
	 *
	 * _See_ Strophe.Connection.attach
	 *
	 * Parameters:
	 *   (String) jid - Jabber ID
	 *   (Integer) sid - Session ID
	 *   (Integer) rid - rid
	 */
	self.attach = function(jid, sid, rid) {
		_user = new self.ChatUser(jid, Strophe.getNodeFromJid(jid));
		self.registerEventHandlers();
		_connection.attach(jid, sid, rid, Candy.Core.Event.Strophe.Connect);
	};

	/** Function: disconnect
	 * Leave all rooms and disconnect
	 */
	self.disconnect = function() {
		if(_connection.connected) {
			$.each(self.getRooms(), function() {
				Candy.Core.Action.Jabber.Room.Leave(this.getJid());
			});
			_connection.disconnect();
		}
	};

	/** Function: addHandler
	 * Wrapper for Strophe.Connection.addHandler() to add a stanza handler for the connection.
	 *
	 * Parameters:
	 *   (Function) handler - The user callback.
	 *   (String) ns - The namespace to match.
	 *   (String) name - The stanza name to match.
	 *   (String) type - The stanza type attribute to match.
	 *   (String) id - The stanza id attribute to match.
	 *   (String) from - The stanza from attribute to match.
	 *   (String) options - The handler options
	 *
	 * Returns:
	 *   A reference to the handler that can be used to remove it.
	 */
	self.addHandler = function(handler, ns, name, type, id, from, options) {
		return _connection.addHandler(handler, ns, name, type, id, from, options);
	};

	/** Function: getUser
	 * Gets current user
	 *
	 * Returns:
	 *   Instance of Candy.Core.ChatUser
	 */
	self.getUser = function() {
		return _user;
	};

	/** Function: setUser
	 * Set current user. Needed when anonymous login is used, as jid gets retrieved later.
	 *
	 * Parameters:
	 *   (Candy.Core.ChatUser) user - User instance
	 */
	self.setUser = function(user) {
		_user = user;
	};

	/** Function: getConnection
	 * Gets Strophe connection
	 *
	 * Returns:
	 *   Instance of Strophe.Connection
	 */
	self.getConnection = function() {
		return _connection;
	};

	/** Function: removeRoom
	 * Removes a room from the rooms list
	 *
	 * Parameters:
	 *   (String) roomJid - roomJid
	 */
	self.removeRoom = function(roomJid) {
		delete _rooms[roomJid];
	};

	/** Function: getRooms
	 * Gets all joined rooms
	 *
	 * Returns:
	 *   Object containing instances of Candy.Core.ChatRoom
	 */
	self.getRooms = function() {
		return _rooms;
	};

	/** Function: getStropheStatus
	 * Get the status set by Strophe.
	 *
	 * Returns:
	 *   (Strophe.Status.*) - one of Strophe's statuses
	 */
	self.getStropheStatus = function() {
		return _status;
	};

	/** Function: setStropheStatus
	 * Set the strophe status
	 *
	 * Called by:
	 *   Candy.Core.Event.Strophe.Connect
	 *
	 * Parameters:
	 *   (Strophe.Status.*) status - Strophe's status
	 */
	self.setStropheStatus = function(status) {
		_status = status;
	};

	/** Function: isAnonymousConnection
	 * Returns true if <Candy.Core.connect> was first called with a domain instead of a jid as the first param.
	 *
	 * Returns:
	 *   (Boolean)
	 */
	self.isAnonymousConnection = function() {
		return _anonymousConnection;
	};

	/** Function: getOptions
	 * Gets options
	 *
	 * Returns:
	 *   Object
	 */
	self.getOptions = function() {
		return _options;
	};

    /** Function: getRoom
	 * Gets a specific room
	 *
	 * Parameters:
	 *   (String) roomJid - JID of the room
	 *
	 * Returns:
	 *   If the room is joined, instance of Candy.Core.ChatRoom, otherwise null.
	 */
	self.getRoom = function(roomJid) {
		if (_rooms[roomJid]) {
			return _rooms[roomJid];
		}
		return null;
	};

	/** Function: onWindowUnload
	 * window.onbeforeunload event which disconnects the client from the Jabber server.
	 */
	self.onWindowUnload = function() {
		// Enable synchronous requests because Safari doesn't send asynchronous requests within unbeforeunload events.
		// Only works properly when following patch is applied to strophejs: https://github.com/metajack/strophejs/issues/16/#issuecomment-600266
		// FIXME: Is this still needed?
		//        Strophe.js still didn't implement it and initial tests with
		//        Safari seemed to work.
		_connection.sync = true;
		self.disconnect();
		_connection.flush();
	};

	/** Function: rawInput
	 * (Overridden from Strophe.Connection.rawInput)
	 *
	 * Logs all raw input if debug is set to true.
	 */
	self.rawInput = function(data) {
		this.log('RECV: ' + data);
	};

	/** Function rawOutput
	 * (Overridden from Strophe.Connection.rawOutput)
	 *
	 * Logs all raw output if debug is set to true.
	 */
	self.rawOutput = function(data) {
		this.log('SENT: ' + data);
	};

	/** Function: log
	 * Overridden to do something useful if debug is set to true.
	 *
	 * See: Candy.Core#init
	 */
	self.log = function() {};

	return self;
}(Candy.Core || {}, Strophe, jQuery));

/** File: view.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@gmail.com>
 *   - Michael Weibel <michael.weibel@gmail.com>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 *   (c) 2012, 2013 Patrick Stadler & Michael Weibel. All rights reserved.
 */

/* global jQuery, Candy, window, Mustache */

/** Class: Candy.View
 * The Candy View Class
 *
 * Parameters:
 *   (Candy.View) self - itself
 *   (jQuery) $ - jQuery
 */
Candy.View = (function(self, $) {
		/** PrivateObject: _current
		 * Object containing current container & roomJid which the client sees.
		 */
	var _current = { container: null, roomJid: null },
		/** PrivateObject: _options
		 *
		 * Options:
		 *   (String) language - language to use
		 *   (String) resources - path to resources directory (with trailing slash)
		 *   (Object) messages - limit: clean up message pane when n is reached / remove: remove n messages after limit has been reached
		 *   (Object) crop - crop if longer than defined: message.nickname=15, message.body=1000, roster.nickname=15
		 *   (Object) bigroom - Thresholds for improving scalability with a big amount of users
		 */
		_options = {
			language: 'en',
			resources: 'res/',
			messages: { limit: 2000, remove: 500 },
			crop: {
				message: { nickname: 15, body: 1000 },
				roster: { nickname: 15 }
			},
			bigroom: {
				disableAnimationThreshold: 200,
				disableSortingThreshold: 1000,
				batchRosterUpdate: {
					threshold: 500,
					interval: 100 //ms
				}
			}
		},

		/** PrivateFunction: _setupTranslation
		 * Set dictionary using jQuery.i18n plugin.
		 *
		 * See: view/translation.js
		 * See: libs/jquery-i18n/jquery.i18n.js
		 *
		 * Parameters:
		 *   (String) language - Language identifier
		 */
		_setupTranslation = function(language) {
			$.i18n.setDictionary(self.Translation[language]);
		},

		/** PrivateFunction: _registerObservers
		 * Register observers. Candy core will now notify the View on changes.
		 */
		_registerObservers = function() {
			$(Candy).on('candy:core.chat.connection', self.Observer.Chat.Connection);
			$(Candy).on('candy:core.chat.message', self.Observer.Chat.Message);
			$(Candy).on('candy:core.login', self.Observer.Login);
			$(Candy).on('candy:core.autojoin-missing', self.Observer.AutojoinMissing);
			$(Candy).on('candy:core.presence', self.Observer.Presence.update);
			$(Candy).on('candy:core.presence.leave', self.Observer.Presence.update);
			$(Candy).on('candy:core.presence.room', self.Observer.Presence.update);
			$(Candy).on('candy:core.presence.error', self.Observer.PresenceError);
			$(Candy).on('candy:core.message', self.Observer.Message);
		},

		/** PrivateFunction: _registerWindowHandlers
		 * Register window focus / blur / resize handlers.
		 *
		 * jQuery.focus()/.blur() <= 1.5.1 do not work for IE < 9. Fortunately onfocusin/onfocusout will work for them.
		 */
		_registerWindowHandlers = function() {
			$(window).focus(Candy.View.Pane.Window.onFocus).blur(Candy.View.Pane.Window.onBlur);
			$(window).resize(Candy.View.Pane.Chat.fitTabs);
		},

		/** PrivateFunction: _initToolbar
		 * Initialize toolbar.
		 */
		_initToolbar = function() {
			self.Pane.Chat.Toolbar.init();
		},

		/** PrivateFunction: _delegateTooltips
		 * Delegate mouseenter on tooltipified element to <Candy.View.Pane.Chat.Tooltip.show>.
		 */
		_delegateTooltips = function() {
			$('body').delegate('li[data-tooltip]', 'mouseenter', Candy.View.Pane.Chat.Tooltip.show);
		};

	/** Function: init
	 * Initialize chat view (setup DOM, register handlers & observers)
	 *
	 * Parameters:
	 *   (jQuery.element) container - Container element of the whole chat view
	 *   (Object) options - Options: see _options field (value passed here gets extended by the default value in _options field)
	 */
	self.init = function(container, options) {
		$.extend(true, _options, options);
		_setupTranslation(_options.language);

		// Set path to emoticons
		Candy.Util.Parser.setEmoticonPath(this.getOptions().resources + 'img/emoticons/');

		// Start DOMination...
		_current.container = container;
		_current.container.html(Mustache.to_html(Candy.View.Template.Chat.pane, {
			tooltipEmoticons : $.i18n._('tooltipEmoticons'),
			tooltipSound : $.i18n._('tooltipSound'),
			tooltipAutoscroll : $.i18n._('tooltipAutoscroll'),
			tooltipStatusmessage : $.i18n._('tooltipStatusmessage'),
			tooltipAdministration : $.i18n._('tooltipAdministration'),
			tooltipUsercount : $.i18n._('tooltipUsercount'),
			resourcesPath : this.getOptions().resources
		}, {
			tabs: Candy.View.Template.Chat.tabs,
			rooms: Candy.View.Template.Chat.rooms,
			modal: Candy.View.Template.Chat.modal,
			toolbar: Candy.View.Template.Chat.toolbar,
			soundcontrol: Candy.View.Template.Chat.soundcontrol
		}));

		// ... and let the elements dance.
		_registerWindowHandlers();
		_initToolbar();
		_registerObservers();
		_delegateTooltips();
	};

	/** Function: getCurrent
	 * Get current container & roomJid in an object.
	 *
	 * Returns:
	 *   Object containing container & roomJid
	 */
	self.getCurrent = function() {
		return _current;
	};

	/** Function: getOptions
	 * Gets options
	 *
	 * Returns:
	 *   Object
	 */
	self.getOptions = function() {
		return _options;
	};

	/** Function: getOption
	 * Gets option by key
	 *¨
	 * Parameters:
	 *   (String) key - Config key
	 *
	 * Returns:
	 *   Object
	 */
	self.getOption = function(key) {
		return _options[key];
	};

	return self;
}(Candy.View || {}, jQuery));

/** File: util.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@gmail.com>
 *   - Michael Weibel <michael.weibel@gmail.com>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 *   (c) 2012, 2013 Patrick Stadler & Michael Weibel. All rights reserved.
 */

/* global Candy, MD5, Strophe, document, escape, jQuery */

/** Class: Candy.Util
 * Candy utils
 *
 * Parameters:
 *   (Candy.Util) self - itself
 *   (jQuery) $ - jQuery
 */
Candy.Util = (function(self, $){
	/** Function: jidToId
	 * Translates a jid to a MD5-Id
	 *
	 * Parameters:
	 *   (String) jid - Jid
	 *
	 * Returns:
	 *   MD5-ified jid
	 */
	self.jidToId = function(jid) {
		return MD5.hexdigest(jid);
	};

	/** Function: escapeJid
	 * Escapes a jid (node & resource get escaped)
	 *
	 * See:
	 *   XEP-0106
	 *
	 * Parameters:
	 *   (String) jid - Jid
	 *
	 * Returns:
	 *   (String) - escaped jid
	 */
	self.escapeJid = function(jid) {
		var node = Strophe.escapeNode(Strophe.getNodeFromJid(jid)),
			domain = Strophe.getDomainFromJid(jid),
			resource = Strophe.getResourceFromJid(jid);

		jid = node + '@' + domain;
		if (resource) {
			jid += '/' + Strophe.escapeNode(resource);
		}

		return jid;
	};

	/** Function: unescapeJid
	 * Unescapes a jid (node & resource get unescaped)
	 *
	 * See:
	 *   XEP-0106
	 *
	 * Parameters:
	 *   (String) jid - Jid
	 *
	 * Returns:
	 *   (String) - unescaped Jid
	 */
	self.unescapeJid = function(jid) {
		var node = Strophe.unescapeNode(Strophe.getNodeFromJid(jid)),
			domain = Strophe.getDomainFromJid(jid),
			resource = Strophe.getResourceFromJid(jid);

		jid = node + '@' + domain;
		if(resource) {
			jid += '/' + Strophe.unescapeNode(resource);
		}

		return jid;
	};

	/** Function: crop
	 * Crop a string with the specified length
	 *
	 * Parameters:
	 *   (String) str - String to crop
	 *   (Integer) len - Max length
	 */
	self.crop = function(str, len) {
		if (str.length > len) {
			str = str.substr(0, len - 3) + '...';
		}
		return str;
	};

	/** Function: setCookie
	 * Sets a new cookie
	 *
	 * Parameters:
	 *   (String) name - cookie name
	 *   (String) value - Value
	 *   (Integer) lifetime_days - Lifetime in days
	 */
	self.setCookie = function(name, value, lifetime_days) {
		var exp = new Date();
		exp.setDate(new Date().getDate() + lifetime_days);
		document.cookie = name + '=' + value + ';expires=' + exp.toUTCString() + ';path=/';
	};

	/** Function: cookieExists
	 * Tests if a cookie with the given name exists
	 *
	 * Parameters:
	 *   (String) name - Cookie name
	 *
	 * Returns:
	 *   (Boolean) - true/false
	 */
	self.cookieExists = function(name) {
		return document.cookie.indexOf(name) > -1;
	};

	/** Function: getCookie
	 * Returns the cookie value if there's one with this name, otherwise returns undefined
	 *
	 * Parameters:
	 *   (String) name - Cookie name
	 *
	 * Returns:
	 *   Cookie value or undefined
	 */
	self.getCookie = function(name) {
		if(document.cookie)	{
			var regex = new RegExp(escape(name) + '=([^;]*)', 'gm'),
				matches = regex.exec(document.cookie);
			if(matches) {
				return matches[1];
			}
		}
	};

	/** Function: deleteCookie
	 * Deletes a cookie with the given name
	 *
	 * Parameters:
	 *   (String) name - cookie name
	 */
	self.deleteCookie = function(name) {
		document.cookie = name + '=;expires=Thu, 01-Jan-70 00:00:01 GMT;path=/';
	};

	/** Function: getPosLeftAccordingToWindowBounds
	 * Fetches the window width and element width
	 * and checks if specified position + element width is bigger
	 * than the window width.
	 *
	 * If this evaluates to true, the position gets substracted by the element width.
	 *
	 * Parameters:
	 *   (jQuery.Element) elem - Element to position
	 *   (Integer) pos - Position left
	 *
	 * Returns:
	 *   Object containing `px` (calculated position in pixel) and `alignment` (alignment of the element in relation to pos, either 'left' or 'right')
	 */
	self.getPosLeftAccordingToWindowBounds = function(elem, pos) {
		var windowWidth = $(document).width(),
			elemWidth   = elem.outerWidth(),
			marginDiff = elemWidth - elem.outerWidth(true),
			backgroundPositionAlignment = 'left';

		if (pos + elemWidth >= windowWidth) {
			pos -= elemWidth - marginDiff;
			backgroundPositionAlignment = 'right';
		}

		return { px: pos, backgroundPositionAlignment: backgroundPositionAlignment };
	};

	/** Function: getPosTopAccordingToWindowBounds
	 * Fetches the window height and element height
	 * and checks if specified position + element height is bigger
	 * than the window height.
	 *
	 * If this evaluates to true, the position gets substracted by the element height.
	 *
	 * Parameters:
	 *   (jQuery.Element) elem - Element to position
	 *   (Integer) pos - Position top
	 *
	 * Returns:
	 *   Object containing `px` (calculated position in pixel) and `alignment` (alignment of the element in relation to pos, either 'top' or 'bottom')
	 */
	self.getPosTopAccordingToWindowBounds = function(elem, pos) {
		var windowHeight = $(document).height(),
			elemHeight   = elem.outerHeight(),
			marginDiff = elemHeight - elem.outerHeight(true),
			backgroundPositionAlignment = 'top';

		if (pos + elemHeight >= windowHeight) {
			pos -= elemHeight - marginDiff;
			backgroundPositionAlignment = 'bottom';
		}

		return { px: pos, backgroundPositionAlignment: backgroundPositionAlignment };
	};

	/** Function: localizedTime
	 * Localizes ISO-8610 Date with the time/dateformat specified in the translation.
	 *
	 * See: libs/dateformat/dateFormat.js
	 * See: src/view/translation.js
	 * See: jquery-i18n/jquery.i18n.js
	 *
	 * Parameters:
	 *   (String) dateTime - ISO-8610 Datetime
	 *
	 * Returns:
	 *   If current date is equal to the date supplied, format with timeFormat, otherwise with dateFormat
	 */
	self.localizedTime = function(dateTime) {
		if (dateTime === undefined) {
			return undefined;
		}

		var date = self.iso8601toDate(dateTime);
		if(date.toDateString() === new Date().toDateString()) {
			return date.format($.i18n._('timeFormat'));
		} else {
			return date.format($.i18n._('dateFormat'));
		}
	};

	/** Function: iso8610toDate
	 * Parses a ISO-8610 Date to a Date-Object.
	 *
	 * Uses a fallback if the client's browser doesn't support it.
	 *
	 * Quote:
	 *   ECMAScript revision 5 adds native support for ISO-8601 dates in the Date.parse method,
	 *   but many browsers currently on the market (Safari 4, Chrome 4, IE 6-8) do not support it.
	 *
	 * Credits:
	 *  <Colin Snover at http://zetafleet.com/blog/javascript-dateparse-for-iso-8601>
	 *
	 * Parameters:
	 *   (String) date - ISO-8610 Date
	 *
	 * Returns:
	 *   Date-Object
	 */
	self.iso8601toDate = function(date) {
		var timestamp = Date.parse(date);
		if(isNaN(timestamp)) {
			var struct = /^(\d{4}|[+\-]\d{6})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3,}))?)?(?:(Z)|([+\-])(\d{2})(?::?(\d{2}))?))?/.exec(date);
			if(struct) {
				var minutesOffset = 0;
				if(struct[8] !== 'Z') {
					minutesOffset = +struct[10] * 60 + (+struct[11]);
					if(struct[9] === '+') {
						minutesOffset = -minutesOffset;
					}
				}
				minutesOffset -= new Date().getTimezoneOffset();
				return new Date(+struct[1], +struct[2] - 1, +struct[3], +struct[4], +struct[5] + minutesOffset, +struct[6], struct[7] ? +struct[7].substr(0, 3) : 0);
			} else {
				// XEP-0091 date
				timestamp = Date.parse(date.replace(/^(\d{4})(\d{2})(\d{2})/, '$1-$2-$3') + 'Z');
			}
		}
		return new Date(timestamp);
	};

	/** Function: isEmptyObject
	 * IE7 doesn't work with jQuery.isEmptyObject (<=1.5.1), workaround.
	 *
	 * Parameters:
	 *   (Object) obj - the object to test for
	 *
	 * Returns:
	 *   Boolean true or false.
	 */
	self.isEmptyObject = function(obj) {
		var prop;
		for(prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				return false;
			}
		}
		return true;
	};

	/** Function: forceRedraw
	 * Fix IE7 not redrawing under some circumstances.
	 *
	 * Parameters:
	 *   (jQuery.element) elem - jQuery element to redraw
	 */
	self.forceRedraw = function(elem) {
		elem.css({display:'none'});
		setTimeout(function() {
			this.css({display:'block'});
		}.bind(elem), 1);
	};

	/** Class: Candy.Util.Parser
	 * Parser for emoticons, links and also supports escaping.
	 */
	self.Parser = {
		/** PrivateVariable: _emoticonPath
		 * Path to emoticons.
		 *
		 * Use setEmoticonPath() to change it
		 */
		_emoticonPath: '',

		/** Function: setEmoticonPath
		 * Set emoticons location.
		 *
		 * Parameters:
		 *   (String) path - location of emoticons with trailing slash
		 */
		setEmoticonPath: function(path) {
			this._emoticonPath = path;
		},

		/** Array: emoticons
		 * Array containing emoticons to be replaced by their images.
		 *
		 * Can be overridden/extended.
		 */
		emoticons: [
			{
				plain: ':)',
				regex: /((\s):-?\)|:-?\)(\s|$))/gm,
				image: 'Smiling.png'
			},
			{
				plain: ';)',
				regex: /((\s);-?\)|;-?\)(\s|$))/gm,
				image: 'Winking.png'
			},
			{
				plain: ':D',
				regex: /((\s):-?D|:-?D(\s|$))/gm,
				image: 'Grinning.png'
			},
			{
				plain: ';D',
				regex: /((\s);-?D|;-?D(\s|$))/gm,
				image: 'Grinning_Winking.png'
			},
			{
				plain: ':(',
				regex: /((\s):-?\(|:-?\((\s|$))/gm,
				image: 'Unhappy.png'
			},
			{
				plain: '^^',
				regex: /((\s)\^\^|\^\^(\s|$))/gm,
				image: 'Happy_3.png'
			},
			{
				plain: ':P',
				regex: /((\s):-?P|:-?P(\s|$))/igm,
				image: 'Tongue_Out.png'
			},
			{
				plain: ';P',
				regex: /((\s);-?P|;-?P(\s|$))/igm,
				image: 'Tongue_Out_Winking.png'
			},
			{
				plain: ':S',
				regex: /((\s):-?S|:-?S(\s|$))/igm,
				image: 'Confused.png'
			},
			{
				plain: ':/',
				regex: /((\s):-?\/|:-?\/(\s|$))/gm,
				image: 'Uncertain.png'
			},
			{
				plain: '8)',
				regex: /((\s)8-?\)|8-?\)(\s|$))/gm,
				image: 'Sunglasses.png'
			},
			{
				plain: '$)',
				regex: /((\s)\$-?\)|\$-?\)(\s|$))/gm,
				image: 'Greedy.png'
			},
			{
				plain: 'oO',
				regex: /((\s)oO|oO(\s|$))/gm,
				image: 'Huh.png'
			},
			{
				plain: ':x',
				regex: /((\s):x|:x(\s|$))/gm,
				image: 'Lips_Sealed.png'
			},
			{
				plain: ':666:',
				regex: /((\s):666:|:666:(\s|$))/gm,
				image: 'Devil.png'
			},
			{
				plain: '<3',
				regex: /((\s)&lt;3|&lt;3(\s|$))/gm,
				image: 'Heart.png'
			}
		],

		/** Function: emotify
		 * Replaces text-emoticons with their image equivalent.
		 *
		 * Parameters:
		 *   (String) text - Text to emotify
		 *
		 * Returns:
		 *   Emotified text
		 */
		emotify: function(text) {
			var i;
			for(i = this.emoticons.length-1; i >= 0; i--) {
				text = text.replace(this.emoticons[i].regex, '$2<img class="emoticon" alt="$1" src="' + this._emoticonPath + this.emoticons[i].image + '" />$3');
			}
			return text;
		},

		/** Function: linkify
		 * Replaces URLs with a HTML-link.
		 *
		 * Parameters:
		 *   (String) text - Text to linkify
		 *
		 * Returns:
		 *   Linkified text
		 */
		linkify: function(text) {
			text = text.replace(/(^|[^\/])(www\.[^\.]+\.[\S]+(\b|$))/gi, '$1http://$2');
			return text.replace(/(\b(https?|ftp|file):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/ig, '<a href="$1" target="_blank">$1</a>');
		},

		/** Function: escape
		 * Escapes a text using a jQuery function (like htmlspecialchars in PHP)
		 *
		 * Parameters:
		 *   (String) text - Text to escape
		 *
		 * Returns:
		 *   Escaped text
		 */
		escape: function(text) {
			return $('<div/>').text(text).html();
		},

		/** Function: nl2br
		 * replaces newline characters with a <br/> to make multi line messages look nice
		 *
		 * Parameters:
		 *   (String) text - Text to process
		 *
		 * Returns:
		 *   Processed text
		 */
		nl2br: function(text) {
			return text.replace(/\r\n|\r|\n/g, '<br />');
		},

		/** Function: all
		 * Does everything of the parser: escaping, linkifying and emotifying.
		 *
		 * Parameters:
		 *   (String) text - Text to parse
		 *
		 * Returns:
		 *   Parsed text
		 */
		all: function(text) {
			if(text) {
				text = this.escape(text);
				text = this.linkify(text);
				text = this.emotify(text);
				text = this.nl2br(text);
			}
			return text;
		}
	};

	return self;
}(Candy.Util || {}, jQuery));

/** File: action.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@gmail.com>
 *   - Michael Weibel <michael.weibel@gmail.com>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 *   (c) 2012, 2013 Patrick Stadler & Michael Weibel. All rights reserved.
 */

/* global Candy, $iq, navigator, Candy, $pres, Strophe, jQuery */

/** Class: Candy.Core.Action
 * Chat Actions (basicly a abstraction of Jabber commands)
 *
 * Parameters:
 *   (Candy.Core.Action) self - itself
 *   (Strophe) Strophe - Strophe
 *   (jQuery) $ - jQuery
 */
Candy.Core.Action = (function(self, Strophe, $) {
	/** Class: Candy.Core.Action.Jabber
	 * Jabber actions
	 */
	self.Jabber = {
		/** Function: Version
		 * Replies to a version request
		 *
		 * Parameters:
		 *   (jQuery.element) msg - jQuery element
		 */
		Version: function(msg) {
			Candy.Core.getConnection().send($iq({type: 'result', to: msg.attr('from'), from: msg.attr('to'), id: msg.attr('id')}).c('query', {name: Candy.about.name, version: Candy.about.version, os: navigator.userAgent}));
		},

		/** Function: Roster
		 * Sends a request for a roster
		 */
		Roster: function() {
			Candy.Core.getConnection().send($iq({type: 'get', xmlns: Strophe.NS.CLIENT}).c('query', {xmlns: Strophe.NS.ROSTER}).tree());
		},

		/** Function: Presence
		 * Sends a request for presence
		 *
		 * Parameters:
		 *   (Object) attr - Optional attributes
		 *   (Strophe.Builder) el - Optional element to include in presence stanza
		 */
		Presence: function(attr, el) {
			var pres = $pres(attr).c('priority').t(Candy.Core.getOptions().presencePriority.toString())
				.up().c('c', Candy.Core.getConnection().caps.generateCapsAttrs())
				.up();
			if(el) {
				pres.node.appendChild(el.node);
			}
			Candy.Core.getConnection().send(pres.tree());
		},

		/** Function: Services
		 * Sends a request for disco items
		 */
		Services: function() {
			Candy.Core.getConnection().send($iq({type: 'get', xmlns: Strophe.NS.CLIENT}).c('query', {xmlns: Strophe.NS.DISCO_ITEMS}).tree());
		},

		/** Function: Autojoin
		 * When Candy.Core.getOptions().autojoin is true, request autojoin bookmarks (OpenFire)
		 *
		 * Otherwise, if Candy.Core.getOptions().autojoin is an array, join each channel specified.
		 * Channel can be in jid:password format to pass room password if needed.

		 * Triggers:
		 *   candy:core.autojoin-missing in case no autojoin info has been found
		 */
		Autojoin: function() {
			// Request bookmarks
			if(Candy.Core.getOptions().autojoin === true) {
				Candy.Core.getConnection().sendIQ($iq({type: 'get', xmlns: Strophe.NS.CLIENT}).c('query', {xmlns: Strophe.NS.PRIVATE}).c('storage', {xmlns: Strophe.NS.BOOKMARKS}).tree());
			// Join defined rooms
			} else if($.isArray(Candy.Core.getOptions().autojoin)) {
				$.each(Candy.Core.getOptions().autojoin, function() {
					self.Jabber.Room.Join.apply(null, this.valueOf().split(':',2));
				});
			} else {
				/** Event: candy:core.autojoin-missing
				 * Triggered when no autojoin information has been found
				 */
				$(Candy).triggerHandler('candy:core.autojoin-missing');
			}
		},

		/** Function: ResetIgnoreList
		 * Create new ignore privacy list (and reset the old one, if it exists).
		 */
		ResetIgnoreList: function() {
			Candy.Core.getConnection().send($iq({type: 'set', from: Candy.Core.getUser().getJid(), id: 'set1'})
				.c('query', {xmlns: Strophe.NS.PRIVACY }).c('list', {name: 'ignore'}).c('item', {'action': 'allow', 'order': '0'}).tree());
		},

		/** Function: RemoveIgnoreList
		 * Remove an existing ignore list.
		 */
		RemoveIgnoreList: function() {
			Candy.Core.getConnection().send($iq({type: 'set', from: Candy.Core.getUser().getJid(), id: 'remove1'})
				.c('query', {xmlns: Strophe.NS.PRIVACY }).c('list', {name: 'ignore'}).tree());
		},

		/** Function: GetIgnoreList
		 * Get existing ignore privacy list when connecting.
		 */
		GetIgnoreList: function() {
			Candy.Core.getConnection().send($iq({type: 'get', from: Candy.Core.getUser().getJid(), id: 'get1'})
				.c('query', {xmlns: Strophe.NS.PRIVACY }).c('list', {name: 'ignore'}).tree());
		},

		/** Function: SetIgnoreListActive
		 * Set ignore privacy list active
		 */
		SetIgnoreListActive: function() {
			Candy.Core.getConnection().send($iq({type: 'set', from: Candy.Core.getUser().getJid(), id: 'set2'})
				.c('query', {xmlns: Strophe.NS.PRIVACY }).c('active', {name:'ignore'}).tree());
		},

		/** Function: GetJidIfAnonymous
		 * On anonymous login, initially we don't know the jid and as a result, Candy.Core._user doesn't have a jid.
		 * Check if user doesn't have a jid and get it if necessary from the connection.
		 */
		GetJidIfAnonymous: function() {
			if (!Candy.Core.getUser().getJid()) {
				Candy.Core.log("[Jabber] Anonymous login");
				Candy.Core.getUser().data.jid = Candy.Core.getConnection().jid;
			}
		},

		/** Class: Candy.Core.Action.Jabber.Room
		 * Room-specific commands
		 */
		Room: {
			/** Function: Join
			 * Requests disco of specified room and joins afterwards.
			 *
			 * TODO:
			 *   maybe we should wait for disco and later join the room?
			 *   but what if we send disco but don't want/can join the room
			 *
			 * Parameters:
			 *   (String) roomJid - Room to join
			 *   (String) password - [optional] Password for the room
			 */
			Join: function(roomJid, password) {
				self.Jabber.Room.Disco(roomJid);
				Candy.Core.getConnection().muc.join(roomJid, Candy.Core.getUser().getNick(), null, null, password);
				var conn = Candy.Core.getConnection(),
					room_nick = conn.muc.test_append_nick(roomJid, Candy.Core.getUser().getNick()),
					pres = $pres({ from: conn.jid, to: room_nick })
						.c('x', {xmlns: Strophe.NS.MUC});
				if (password !== null) {
					pres.c('password').t(password);
				}
				pres.up().c('c', conn.caps.generateCapsAttrs());
				conn.send(pres.tree());
			},

			/** Function: Leave
			 * Leaves a room.
			 *
			 * Parameters:
			 *   (String) roomJid - Room to leave
			 */
			Leave: function(roomJid) {
				var user = Candy.Core.getRoom(roomJid).getUser();
				if (user) {
					Candy.Core.getConnection().muc.leave(roomJid, user.getNick(), function() {});
				}
			},

			/** Function: Disco
			 * Requests <disco info of a room at http://xmpp.org/extensions/xep-0045.html#disco-roominfo>.
			 *
			 * Parameters:
			 *   (String) roomJid - Room to get info for
			 */
			Disco: function(roomJid) {
				Candy.Core.getConnection().send($iq({type: 'get', from: Candy.Core.getUser().getJid(), to: roomJid, id: 'disco3'}).c('query', {xmlns: Strophe.NS.DISCO_INFO}).tree());
			},

			/** Function: Message
			 * Send message
			 *
			 * Parameters:
			 *   (String) roomJid - Room to which send the message into
			 *   (String) msg - Message
			 *   (String) type - "groupchat" or "chat" ("chat" is for private messages)
			 *
			 * Returns:
			 *   (Boolean) - true if message is not empty after trimming, false otherwise.
			 */
			Message: function(roomJid, msg, type) {
				// Trim message
				msg = $.trim(msg);
				if(msg === '') {
					return false;
				}
				Candy.Core.getConnection().muc.message(Candy.Util.escapeJid(roomJid), null, msg, null, type);
				return true;
			},

			/** Function: IgnoreUnignore
			 * Checks if the user is already ignoring the target user, if yes: unignore him, if no: ignore him.
			 *
			 * Uses the ignore privacy list set on connecting.
			 *
			 * Parameters:
			 *   (String) userJid - Target user jid
			 */
			IgnoreUnignore: function(userJid) {
				Candy.Core.getUser().addToOrRemoveFromPrivacyList('ignore', userJid);
				Candy.Core.Action.Jabber.Room.UpdatePrivacyList();
			},

			/** Function: UpdatePrivacyList
			 * Updates privacy list according to the privacylist in the currentUser
			 */
			UpdatePrivacyList: function() {
				var currentUser = Candy.Core.getUser(),
					iq = $iq({type: 'set', from: currentUser.getJid(), id: 'edit1'})
						.c('query', {xmlns: 'jabber:iq:privacy' })
							.c('list', {name: 'ignore'}),
					privacyList = currentUser.getPrivacyList('ignore');
				if (privacyList.length > 0) {
					$.each(privacyList, function(index, jid) {
						iq.c('item', {type:'jid', value: Candy.Util.escapeJid(jid), action: 'deny', order : index})
							.c('message').up().up();
					});
				} else {
					iq.c('item', {action: 'allow', order : '0'});
				}
				Candy.Core.getConnection().send(iq.tree());
			},

			/** Class: Candy.Core.Action.Jabber.Room.Admin
			 * Room administration commands
			 */
			Admin: {
				/** Function: UserAction
				 * Kick or ban a user
				 *
				 * Parameters:
				 *   (String) roomJid - Room in which the kick/ban should be done
				 *   (String) userJid - Victim
				 *   (String) type - "kick" or "ban"
				 *   (String) msg - Reason
				 *
				 * Returns:
				 *   (Boolean) - true if sent successfully, false if type is not one of "kick" or "ban".
				 */
				UserAction: function(roomJid, userJid, type, reason) {
					var iqId,
						itemObj = {nick: Strophe.escapeNode(Strophe.getResourceFromJid(userJid))};
					switch(type) {
						case 'kick':
							iqId = 'kick1';
							itemObj.role = 'none';
							break;
						case 'ban':
							iqId = 'ban1';
							itemObj.affiliation = 'outcast';
							break;
						default:
							return false;
					}
					Candy.Core.getConnection().send($iq({type: 'set', from: Candy.Core.getUser().getJid(), to: roomJid, id: iqId}).c('query', {xmlns: Strophe.NS.MUC_ADMIN }).c('item', itemObj).c('reason').t(reason).tree());
					return true;
				},

				/** Function: SetSubject
				 * Sets subject (topic) of a room.
				 *
				 * Parameters:
				 *   (String) roomJid - Room
				 *   (String) subject - Subject to set
				 */
				SetSubject: function(roomJid, subject) {
					Candy.Core.getConnection().muc.setTopic(roomJid, subject);
				}
			}
		}
	};

	return self;
}(Candy.Core.Action || {}, Strophe, jQuery));

/** File: chatRoom.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@gmail.com>
 *   - Michael Weibel <michael.weibel@gmail.com>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 *   (c) 2012, 2013 Patrick Stadler & Michael Weibel. All rights reserved.
 */

/* global Candy */

/** Class: Candy.Core.ChatRoom
 * Candy Chat Room
 *
 * Parameters:
 *   (String) roomJid - Room jid
 */
Candy.Core.ChatRoom = function(roomJid) {
	/** Object: room
	 * Object containing roomJid and name.
	 */
	this.room = {
		jid: roomJid,
		name: null
	};

	/** Variable: user
	 * Current local user of this room.
	 */
	this.user = null;

	/** Variable: Roster
	 * Candy.Core.ChatRoster instance
	 */
	this.roster = new Candy.Core.ChatRoster();

	/** Function: setUser
	 * Set user of this room.
	 *
	 * Parameters:
	 *   (Candy.Core.ChatUser) user - Chat user
	 */
	this.setUser = function(user) {
		this.user = user;
	};

	/** Function: getUser
	 * Get current local user
	 *
	 * Returns:
	 *   (Object) - Candy.Core.ChatUser instance or null
	 */
	this.getUser = function() {
		return this.user;
	};

	/** Function: getJid
	 * Get room jid
	 *
	 * Returns:
	 *   (String) - Room jid
	 */
	this.getJid = function() {
		return this.room.jid;
	};

	/** Function: setName
	 * Set room name
	 *
	 * Parameters:
	 *   (String) name - Room name
	 */
	this.setName = function(name) {
		this.room.name = name;
	};

	/** Function: getName
	 * Get room name
	 *
	 * Returns:
	 *   (String) - Room name
	 */
	this.getName = function() {
		return this.room.name;
	};

	/** Function: setRoster
	 * Set roster of room
	 *
	 * Parameters:
	 *   (Candy.Core.ChatRoster) roster - Chat roster
	 */
	this.setRoster = function(roster) {
		this.roster = roster;
	};

	/** Function: getRoster
	 * Get roster
	 *
	 * Returns
	 *   (Candy.Core.ChatRoster) - instance
	 */
	this.getRoster = function() {
		return this.roster;
	};
};

/** File: chatRoster.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@gmail.com>
 *   - Michael Weibel <michael.weibel@gmail.com>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 *   (c) 2012, 2013 Patrick Stadler & Michael Weibel. All rights reserved.
 */

/* global Candy */

/** Class: Candy.Core.ChatRoster
 * Chat Roster
 */
Candy.Core.ChatRoster = function () {
	/** Object: items
	 * Roster items
	 */
	this.items = {};

	/** Function: add
	 * Add user to roster
	 *
	 * Parameters:
	 *   (Candy.Core.ChatUser) user - User to add
	 */
	this.add = function(user) {
		this.items[user.getJid()] = user;
	};

	/** Function: remove
	 * Remove user from roster
	 *
	 * Parameters:
	 *   (String) jid - User jid
	 */
	this.remove = function(jid) {
		delete this.items[jid];
	};

	/** Function: get
	 * Get user from roster
	 *
	 * Parameters:
	 *   (String) jid - User jid
	 *
	 * Returns:
	 *   (Candy.Core.ChatUser) - User
	 */
	this.get = function(jid) {
		return this.items[jid];
	};

	/** Function: getAll
	 * Get all items
	 *
	 * Returns:
	 *   (Object) - all roster items
	 */
	this.getAll = function() {
		return this.items;
	};
};

/** File: chatUser.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@gmail.com>
 *   - Michael Weibel <michael.weibel@gmail.com>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 *   (c) 2012, 2013 Patrick Stadler & Michael Weibel. All rights reserved.
 */

/* global Candy, Strophe */

/** Class: Candy.Core.ChatUser
 * Chat User
 */
Candy.Core.ChatUser = function(jid, nick, affiliation, role) {
	/** Constant: ROLE_MODERATOR
	 * Moderator role
	 */
	this.ROLE_MODERATOR    = 'moderator';

	/** Constant: AFFILIATION_OWNER
	 * Affiliation owner
	 */
	this.AFFILIATION_OWNER = 'owner';

	/** Object: data
	 * User data containing:
	 * - jid
	 * - nick
	 * - affiliation
	 * - role
	 * - privacyLists
	 * - customData to be used by e.g. plugins
	 */
	this.data = {
		jid: jid,
		nick: Strophe.unescapeNode(nick),
		affiliation: affiliation,
		role: role,
		privacyLists: {},
		customData: {}
	};

	/** Function: getJid
	 * Gets an unescaped user jid
	 *
	 * See:
	 *   <Candy.Util.unescapeJid>
	 *
	 * Returns:
	 *   (String) - jid
	 */
	this.getJid = function() {
		if(this.data.jid) {
			return Candy.Util.unescapeJid(this.data.jid);
		}
		return;
	};

	/** Function: getEscapedJid
	 * Escapes the user's jid (node & resource get escaped)
	 *
	 * See:
	 *   <Candy.Util.escapeJid>
	 *
	 * Returns:
	 *   (String) - escaped jid
	 */
	this.getEscapedJid = function() {
		return Candy.Util.escapeJid(this.data.jid);
	};

	/** Function: getNick
	 * Gets user nick
	 *
	 * Returns:
	 *   (String) - nick
	 */
	this.getNick = function() {
		return Strophe.unescapeNode(this.data.nick);
	};

	/** Function: getRole
	 * Gets user role
	 *
	 * Returns:
	 *   (String) - role
	 */
	this.getRole = function() {
		return this.data.role;
	};

	/** Function: getAffiliation
	 * Gets user affiliation
	 *
	 * Returns:
	 *   (String) - affiliation
	 */
	this.getAffiliation = function() {
		return this.data.affiliation;
	};

	/** Function: isModerator
	 * Check if user is moderator. Depends on the room.
	 *
	 * Returns:
	 *   (Boolean) - true if user has role moderator or affiliation owner
	 */
	this.isModerator = function() {
		return this.getRole() === this.ROLE_MODERATOR || this.getAffiliation() === this.AFFILIATION_OWNER;
	};

	/** Function: addToOrRemoveFromPrivacyList
	 * Convenience function for adding/removing users from ignore list.
	 *
	 * Check if user is already in privacy list. If yes, remove it. If no, add it.
	 *
	 * Parameters:
	 *   (String) list - To which privacy list the user should be added / removed from. Candy supports curently only the "ignore" list.
	 *   (String) jid  - User jid to add/remove
	 *
	 * Returns:
	 *   (Array) - Current privacy list.
	 */
	this.addToOrRemoveFromPrivacyList = function(list, jid) {
		if (!this.data.privacyLists[list]) {
			this.data.privacyLists[list] = [];
		}
		var index = -1;
		if ((index = this.data.privacyLists[list].indexOf(jid)) !== -1) {
			this.data.privacyLists[list].splice(index, 1);
		} else {
			this.data.privacyLists[list].push(jid);
		}
		return this.data.privacyLists[list];
	};

	/** Function: getPrivacyList
	 * Returns the privacy list of the listname of the param.
	 *
	 * Parameters:
	 *   (String) list - To which privacy list the user should be added / removed from. Candy supports curently only the "ignore" list.
	 *
	 * Returns:
	 *   (Array) - Privacy List
	 */
	this.getPrivacyList = function(list) {
		if (!this.data.privacyLists[list]) {
			this.data.privacyLists[list] = [];
		}
		return this.data.privacyLists[list];
	};

	/** Function: isInPrivacyList
	 * Tests if this user ignores the user provided by jid.
	 *
	 * Parameters:
	 *   (String) list - Privacy list
	 *   (String) jid  - Jid to test for
	 *
	 * Returns:
	 *   (Boolean)
	 */
	this.isInPrivacyList = function(list, jid) {
		if (!this.data.privacyLists[list]) {
			return false;
		}
		return this.data.privacyLists[list].indexOf(jid) !== -1;
	};

	/** Function: setCustomData
	 * Stores custom data
	 *
	 * Parameter:
	 *   (Object) data - Object containing custom data
	 */
	this.setCustomData = function(data) {
		this.data.customData = data;
	};

	/** Function: getCustomData
	 * Retrieve custom data
	 *
	 * Returns:
	 *   (Object) - Object containing custom data
	 */
	this.getCustomData = function() {
		return this.data.customData;
	};
};

/** File: event.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@gmail.com>
 *   - Michael Weibel <michael.weibel@gmail.com>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 *   (c) 2012, 2013 Patrick Stadler & Michael Weibel. All rights reserved.
 */

/* global Candy, Strophe, jQuery */

/** Class: Candy.Core.Event
 * Chat Events
 *
 * Parameters:
 *   (Candy.Core.Event) self - itself
 *   (Strophe) Strophe - Strophe
 *   (jQuery) $ - jQuery
 */
Candy.Core.Event = (function(self, Strophe, $) {
	/** Function: Login
	 * Notify view that the login window should be displayed
	 *
	 * Parameters:
	 *   (String) presetJid - Preset user JID
	 *
	 * Triggers:
	 *   candy:core.login using {presetJid}
	 */
	self.Login = function(presetJid) {
		/** Event: candy:core.login
		 * Triggered when the login window should be displayed
		 *
		 * Parameters:
		 *   (String) presetJid - Preset user JID
		 */
		$(Candy).triggerHandler('candy:core.login', { presetJid: presetJid } );
	};

	/** Class: Candy.Core.Event.Strophe
	 * Strophe-related events
	 */
	self.Strophe = {
		/** Function: Connect
		 * Acts on strophe status events and notifies view.
		 *
		 * Parameters:
		 *   (Strophe.Status) status - Strophe statuses
		 *
		 * Triggers:
		 *   candy:core.chat.connection using {status}
		 */
		Connect: function(status) {
			Candy.Core.setStropheStatus(status);
			switch(status) {
				case Strophe.Status.CONNECTED:
					Candy.Core.log('[Connection] Connected');
					Candy.Core.Action.Jabber.GetJidIfAnonymous();
					/* falls through */
				case Strophe.Status.ATTACHED:
					Candy.Core.log('[Connection] Attached');
					Candy.Core.Action.Jabber.Presence();
					Candy.Core.Action.Jabber.Autojoin();
					Candy.Core.Action.Jabber.GetIgnoreList();
					break;

				case Strophe.Status.DISCONNECTED:
					Candy.Core.log('[Connection] Disconnected');
					break;

				case Strophe.Status.AUTHFAIL:
					Candy.Core.log('[Connection] Authentication failed');
					break;

				case Strophe.Status.CONNECTING:
					Candy.Core.log('[Connection] Connecting');
					break;

				case Strophe.Status.DISCONNECTING:
					Candy.Core.log('[Connection] Disconnecting');
					break;

				case Strophe.Status.AUTHENTICATING:
					Candy.Core.log('[Connection] Authenticating');
					break;

				case Strophe.Status.ERROR:
				case Strophe.Status.CONNFAIL:
					Candy.Core.log('[Connection] Failed (' + status + ')');
					break;

				default:
					Candy.Core.log('[Connection] What?!');
					break;
			}
			/** Event: candy:core.chat.connection
			 * Connection status updates
			 *
			 * Parameters:
			 *   (Strophe.Status) status - Strophe status
			 */
			$(Candy).triggerHandler('candy:core.chat.connection', { status: status } );
		}
	};

	/** Class: Candy.Core.Event.Jabber
	 * Jabber related events
	 */
	self.Jabber = {
		/** Function: Version
		 * Responds to a version request
		 *
		 * Parameters:
		 *   (String) msg - Raw XML Message
		 *
		 * Returns:
		 *   (Boolean) - true
		 */
		Version: function(msg) {
			Candy.Core.log('[Jabber] Version');
			Candy.Core.Action.Jabber.Version($(msg));
			return true;
		},

		/** Function: Presence
		 * Acts on a presence event
		 *
		 * Parameters:
		 *   (String) msg - Raw XML Message
		 *
		 * Triggers:
		 *   candy:core.presence using {from, stanza}
		 *
		 * Returns:
		 *   (Boolean) - true
		 */
		Presence: function(msg) {
			Candy.Core.log('[Jabber] Presence');
			msg = $(msg);
			if(msg.children('x[xmlns^="' + Strophe.NS.MUC + '"]').length > 0) {
				if (msg.attr('type') === 'error') {
					self.Jabber.Room.PresenceError(msg);
				} else {
					self.Jabber.Room.Presence(msg);
				}
			} else {
				/** Event: candy:core.presence
				 * Presence updates. Emitted only when not a muc presence.
				 *
				 * Parameters:
				 *   (JID) from - From Jid
				 *   (String) stanza - Stanza
				 */
				$(Candy).triggerHandler('candy:core.presence', {'from': msg.attr('from'), 'stanza': msg});
			}
			return true;
		},

		/** Function: Bookmarks
		 * Acts on a bookmarks event. When a bookmark has the attribute autojoin set, joins this room.
		 *
		 * Parameters:
		 *   (String) msg - Raw XML Message
		 *
		 * Returns:
		 *   (Boolean) - true
		 */
		Bookmarks: function(msg) {
			Candy.Core.log('[Jabber] Bookmarks');
			// Autojoin bookmarks (Openfire)
			$('conference', msg).each(function() {
				var item = $(this);
				if(item.attr('autojoin')) {
					Candy.Core.Action.Jabber.Room.Join(item.attr('jid'));
				}
			});
			return true;
		},

		/** Function: PrivacyList
		 * Acts on a privacy list event and sets up the current privacy list of this user.
		 *
		 * If no privacy list has been added yet, create the privacy list and listen again to this event.
		 *
		 * Parameters:
		 *   (String) msg - Raw XML Message
		 *
		 * Returns:
		 *   (Boolean) - false to disable the handler after first call.
		 */
		PrivacyList: function(msg) {
			Candy.Core.log('[Jabber] PrivacyList');
			var currentUser = Candy.Core.getUser();

			$('list[name="ignore"] item', msg).each(function() {
				var item = $(this);
				if (item.attr('action') === 'deny') {
					currentUser.addToOrRemoveFromPrivacyList('ignore', item.attr('value'));
				}
			});
			Candy.Core.Action.Jabber.SetIgnoreListActive();
			return false;
		},

		/** Function: PrivacyListError
		 * Acts when a privacy list error has been received.
		 *
		 * Currently only handles the case, when a privacy list doesn't exist yet and creates one.
		 *
		 * Parameters:
		 *   (String) msg - Raw XML Message
		 *
		 * Returns:
		 *   (Boolean) - false to disable the handler after first call.
		 */
		PrivacyListError: function(msg) {
			Candy.Core.log('[Jabber] PrivacyListError');
			// check if msg says that privacyList doesn't exist
			if ($('error[code="404"][type="cancel"] item-not-found', msg)) {
				Candy.Core.Action.Jabber.ResetIgnoreList();
				Candy.Core.Action.Jabber.SetIgnoreListActive();
			}
			return false;
		},

		/** Function: Message
		 * Acts on room, admin and server messages and notifies the view if required.
		 *
		 * Parameters:
		 *   (String) msg - Raw XML Message
		 *
		 * Triggers:
		 *   candy:core.chat.message.admin using {type, message}
		 *   candy:core.chat.message.server {type, subject, message}
		 *
		 * Returns:
		 *   (Boolean) - true
		 */
		Message: function(msg) {
			Candy.Core.log('[Jabber] Message');
			msg = $(msg);

			var fromJid = msg.attr('from'),
				type = msg.attr('type'),
				toJid = msg.attr('to');
			// Room message
			if(fromJid !== Strophe.getDomainFromJid(fromJid) && (type === 'groupchat' || type === 'chat' || type === 'error' || type === 'normal')) {
				self.Jabber.Room.Message(msg);
			// Admin message
			} else if(!toJid && fromJid === Strophe.getDomainFromJid(fromJid)) {
				/** Event: candy:core.chat.message.admin
				 * Admin message
				 *
				 * Parameters:
				 *   (String) type - Type of the message [default: message]
				 *   (String) message - Message text
				 */
				$(Candy).triggerHandler('candy:core.chat.message.admin', { type: (type || 'message'), message: msg.children('body').text() });
			// Server Message
			} else if(toJid && fromJid === Strophe.getDomainFromJid(fromJid)) {
				/** Event: candy:core.chat.message.server
				 * Server message (e.g. subject)
				 *
				 * Parameters:
				 *   (String) type - Message type [default: message]
				 *   (String) subject - Subject text
				 *   (String) message - Message text
				 */
				$(Candy).triggerHandler('candy:core.chat.message.server', {
					type: (type || 'message'),
					subject: msg.children('subject').text(),
					message: msg.children('body').text()
				});
			}
			return true;
		},

		/** Class: Candy.Core.Event.Jabber.Room
		 * Room specific events
		 */
		Room: {
			/** Function: Leave
			 * Leaves a room and cleans up related data and notifies view.
			 *
			 * Parameters:
			 *   (String) msg - Raw XML Message
			 *
			 * Triggers:
			 *   candy:core.presence.leave using {roomJid, roomName, type, reason, actor, user}
			 *
			 * Returns:
			 *   (Boolean) - true
			 */
			Leave: function(msg) {
				Candy.Core.log('[Jabber:Room] Leave');
				msg = $(msg);
				var from = msg.attr('from'),
					roomJid = Strophe.getBareJidFromJid(from);

				// if room is not joined yet, ignore.
				if (!Candy.Core.getRoom(roomJid)) {
					return false;
				}

				var roomName = Candy.Core.getRoom(roomJid).getName(),
					item = msg.find('item'),
					type = 'leave',
					reason,
					actor;

				delete Candy.Core.getRooms()[roomJid];
				// if user gets kicked, role is none and there's a status code 307
				if(item.attr('role') === 'none') {
					if(msg.find('status').attr('code') === '307') {
						type = 'kick';
					} else if(msg.find('status').attr('code') === '301') {
						type = 'ban';
					}
					reason = item.find('reason').text();
					actor  = item.find('actor').attr('jid');
				}

				var user = new Candy.Core.ChatUser(from, Strophe.getResourceFromJid(from), item.attr('affiliation'), item.attr('role'));

				/** Event: candy:core.presence.leave
				 * When the local client leaves a room
				 *
				 * Also triggered when the local client gets kicked or banned from a room.
				 *
				 * Parameters:
				 *   (String) roomJid - Room
				 *   (String) roomName - Name of room
				 *   (String) type - Presence type [kick, ban, leave]
				 *   (String) reason - When type equals kick|ban, this is the reason the moderator has supplied.
				 *   (String) actor - When type equals kick|ban, this is the moderator which did the kick
				 *   (Candy.Core.ChatUser) user - user which leaves the room
				 */
				$(Candy).triggerHandler('candy:core.presence.leave', {
					'roomJid': roomJid,
					'roomName': roomName,
					'type': type,
					'reason': reason,
					'actor': actor,
					'user': user
				});
				return true;
			},

			/** Function: Disco
			 * Sets informations to rooms according to the disco info received.
			 *
			 * Parameters:
			 *   (String) msg - Raw XML Message
			 *
			 * Returns:
			 *   (Boolean) - true
			 */
			Disco: function(msg) {
				Candy.Core.log('[Jabber:Room] Disco');
				msg = $(msg);
				var roomJid = Strophe.getBareJidFromJid(msg.attr('from'));

				// Client joined a room
				if(!Candy.Core.getRooms()[roomJid]) {
					Candy.Core.getRooms()[roomJid] = new Candy.Core.ChatRoom(roomJid);
				}
				// Room existed but room name was unknown
				var roomName = msg.find('identity').attr('name'),
					room = Candy.Core.getRoom(roomJid);
				if(room.getName() === null) {
					room.setName(roomName);
				// Room name changed
				}/*else if(room.getName() !== roomName && room.getUser() !== null) {
					// NOTE: We want to notify the View here but jabber doesn't send anything when the room name changes :-(
				}*/
				return true;
			},

			/** Function: Presence
			 * Acts on various presence messages (room leaving, room joining, error presence) and notifies view.
			 *
			 * Parameters:
			 *   (Object) msg - jQuery object of XML message
			 *
			 * Triggers:
			 *   candy:core.presence.room using {roomJid, roomName, user, action, currentUser}
			 *
			 * Returns:
			 *   (Boolean) - true
			 */
			Presence: function(msg) {
				Candy.Core.log('[Jabber:Room] Presence');
				var from = Candy.Util.unescapeJid(msg.attr('from')),
					roomJid = Strophe.getBareJidFromJid(from),
					presenceType = msg.attr('type');

				// Client left a room
				if(Strophe.getResourceFromJid(from) === Candy.Core.getUser().getNick() && presenceType === 'unavailable') {
					self.Jabber.Room.Leave(msg);
					return true;
				}

				// Client joined a room
				var room = Candy.Core.getRoom(roomJid);
				if(!room) {
					Candy.Core.getRooms()[roomJid] = new Candy.Core.ChatRoom(roomJid);
					room = Candy.Core.getRoom(roomJid);
				}

				var roster = room.getRoster(),
					action, user,
					item = msg.find('item');
				// User joined a room
				if(presenceType !== 'unavailable') {
					var nick = Strophe.getResourceFromJid(from);
					user = new Candy.Core.ChatUser(from, nick, item.attr('affiliation'), item.attr('role'));
					// Room existed but client (myself) is not yet registered
					if(room.getUser() === null && Candy.Core.getUser().getNick() === nick) {
						room.setUser(user);
					}
					roster.add(user);
					action = 'join';
				// User left a room
				} else {
					action = 'leave';
					if(item.attr('role') === 'none') {
						if(msg.find('status').attr('code') === '307') {
							action = 'kick';
						} else if(msg.find('status').attr('code') === '301') {
							action = 'ban';
						}
					}
					user = roster.get(from);
					roster.remove(from);
				}

				/** Event: candy:core.presence.room
				 * Room presence updates
				 *
				 * Parameters:
				 *   (String) roomJid - Room JID
				 *   (String) roomName - Room name
				 *   (Candy.Core.ChatUser) user - User which does the presence update
				 *   (String) action - Action [kick, ban, leave, join]
				 *   (Candy.Core.ChatUser) currentUser - Current local user
				 */
				$(Candy).triggerHandler('candy:core.presence.room', {
					'roomJid': roomJid,
					'roomName': room.getName(),
					'user': user,
					'action': action,
					'currentUser': Candy.Core.getUser()
				});
				return true;
			},

			/** Function: PresenceError
			 * Acts when a presence of type error has been retrieved.
			 *
			 * Parameters:
			 *   (Object) msg - jQuery object of XML message
			 *
			 * Triggers:
			 *   candy:core.presence.error using {msg, type, roomJid, roomName}
			 *
			 * Returns:
			 *   (Boolean) - true
			 */
			PresenceError: function(msg) {
				Candy.Core.log('[Jabber:Room] Presence Error');
				var from = Candy.Util.unescapeJid(msg.attr('from')),
					roomJid = Strophe.getBareJidFromJid(from),
					room = Candy.Core.getRooms()[roomJid],
					roomName = room.getName();

				// Presence error: Remove room from array to prevent error when disconnecting
				Candy.Core.removeRoom(roomJid);
				room = undefined;

				/** Event: candy:core.presence.error
				 * Triggered when a presence error happened
				 *
				 * Parameters:
				 *   (Object) msg - jQuery object of XML message
				 *   (String) type - Error type
				 *   (String) roomJid - Room jid
				 *   (String) roomName - Room name
				 */
				$(Candy).triggerHandler('candy:core.presence.error', {
					'msg' : msg,
					'type': msg.children('error').children()[0].tagName.toLowerCase(),
					'roomJid': roomJid,
					'roomName': roomName
				});
			},

			/** Function: Message
			 * Acts on various message events (subject changed, private chat message, multi-user chat message)
			 * and notifies view.
			 *
			 * Parameters:
			 *   (String) msg - jQuery object of XML message
			 *
			 * Triggers:
			 *   candy:core.message using {roomJid, message, timestamp}
			 *
			 * Returns:
			 *   (Boolean) - true
			 */
			Message: function(msg) {
				Candy.Core.log('[Jabber:Room] Message');
				// Room subject
				var roomJid, message;
				if(msg.children('subject').length > 0) {
					roomJid = Candy.Util.unescapeJid(Strophe.getBareJidFromJid(msg.attr('from')));
					message = { name: Strophe.getNodeFromJid(roomJid), body: msg.children('subject').text(), type: 'subject' };
				// Error messsage
				} else if(msg.attr('type') === 'error') {
					var error = msg.children('error');
					if(error.children('text').length > 0) {
						roomJid = msg.attr('from');
						message = { type: 'info', body: error.children('text').text() };
					}
				// Chat message
				} else if(msg.children('body').length > 0) {
					// Private chat message
					if(msg.attr('type') === 'chat' || msg.attr('type') === 'normal') {
						roomJid = Candy.Util.unescapeJid(msg.attr('from'));
						var bareRoomJid = Strophe.getBareJidFromJid(roomJid),
							// if a 3rd-party client sends a direct message to this user (not via the room) then the username is the node and not the resource.
							isNoConferenceRoomJid = !Candy.Core.getRoom(bareRoomJid),
							name = isNoConferenceRoomJid ? Strophe.getNodeFromJid(roomJid) : Strophe.getResourceFromJid(roomJid);
						message = { name: name, body: msg.children('body').text(), type: msg.attr('type'), isNoConferenceRoomJid: isNoConferenceRoomJid };
					// Multi-user chat message
					} else {
						roomJid = Candy.Util.unescapeJid(Strophe.getBareJidFromJid(msg.attr('from')));
						var resource = Strophe.getResourceFromJid(msg.attr('from'));
						// Message from a user
						if(resource) {
							resource = Strophe.unescapeNode(resource);
							message = { name: resource, body: msg.children('body').text(), type: msg.attr('type') };
						// Message from server (XEP-0045#registrar-statuscodes)
						} else {
							// we are not yet present in the room, let's just drop this message (issue #105)
							if(!Candy.View.Pane.Chat.rooms[msg.attr('from')]) {
								return true;
							}
							message = { name: '', body: msg.children('body').text(), type: 'info' };
						}
					}
				// Unhandled message
				} else {
					return true;
				}

				// besides the delayed delivery (XEP-0203), there exists also XEP-0091 which is the legacy delayed delivery.
				// the x[xmlns=jabber:x:delay] is the format in XEP-0091.
				var delay = msg.children('delay') ? msg.children('delay') : msg.children('x[xmlns="' + Strophe.NS.DELAY +'"]'),
					timestamp = delay !== undefined ? delay.attr('stamp') : null;

				/** Event: candy:core.message
				 * Triggers on various message events (subject changed, private chat message, multi-user chat message).
				 *
				 * The resulting message object can contain different key-value pairs as stated in the documentation
				 * of the parameters itself.
				 *
				 * The following lists explain those parameters:
				 *
				 * Message Object Parameters:
				 *   (String) name - Room name
				 *   (String) body - Message text
				 *   (String) type - Message type ([normal, chat, groupchat])
				 *                   or 'info' which is used internally for displaying informational messages
				 *   (Boolean) isNoConferenceRoomJid - if a 3rd-party client sends a direct message to
				 *                                     this user (not via the room) then the username is the node
				 *                                     and not the resource.
				 *                                     This flag tells if this is the case.
				 *
				 * Parameters:
				 *   (String) roomJid - Room jid
				 *   (Object) message - Depending on what kind of message, the object consists of different key-value pairs:
				 *                        - Room Subject: {name, body, type}
				 *                        - Error message: {type = 'info', body}
				 *                        - Private chat message: {name, body, type, isNoConferenceRoomJid}
				 *                        - MUC msg from a user: {name, body, type}
				 *                        - MUC msg from server: {name = '', body, type = 'info'}
				 *   (String) timestamp - Timestamp, only when it's an offline message
				 *
				 * TODO:
				 *   Streamline those events sent and rename the parameters.
				 */
				$(Candy).triggerHandler('candy:core.message', {
					roomJid: roomJid,
					message: message,
					timestamp: timestamp
				});
				return true;
			}
		}
	};

	return self;
}(Candy.Core.Event || {}, Strophe, jQuery));

/** File: event.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@gmail.com>
 *   - Michael Weibel <michael.weibel@gmail.com>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 *   (c) 2012, 2013 Patrick Stadler & Michael Weibel
 */

/* global Candy */
/* jshint unused:false */

/** Class: Candy.View.Event
 * Empty hooks to capture events and inject custom code.
 *
 * Deprecated:
 *   Don't use this anymore. Bind on the triggered events on Candy.View.*
 *
 * Parameters:
 *   (Candy.View.Event) self - itself
 *   (jQuery) $ - jQuery
 */
Candy.View.Event = (function(self) {
	/** Class: Candy.View.Event.Chat
	 * Chat-related events
	 */
	self.Chat = {
		/** Function: onAdminMessage
		 * Called when receiving admin messages
		 *
		 * Parameters:
		 *   (Object) args - {subject, message}
		 */
		onAdminMessage: function(args) {
			return;
		},

		/** Function: onDisconnect
		 * Called when client disconnects
		 */
		onDisconnect: function() {
			return;
		},

		/** Function: onAuthfail
		 * Called when authentication fails
		 */
		onAuthfail: function() {
			return;
		}
	};

	/** Class: Candy.View.Event.Room
	 * Room-related events
	 */
	self.Room = {
		/** Function: onAdd
		 * Called when a new room gets added
		 *
		 * Parameters:
		 *   (Object) args - {roomJid, type=chat|groupchat, element}
		 */
		onAdd: function(args) {
			return;
		},

		/** Function: onShow
		 * Called when a room gets shown
		 *
		 * Parameters:
		 *   (Object) args - {roomJid, element}
		 */
		onShow: function(args) {
			return;
		},

		/** Function: onHide
		 * Called when a room gets hidden
		 *
		 * Parameters:
		 *   (Object) args - {roomJid, element}
		 */
		onHide: function(args) {
			return;
		},

		/** Function: onSubjectChange
		 * Called when a subject of a room gets changed
		 *
		 * Parameters:
		 *   (Object) args - {roomJid, element, subject}
		 */
		onSubjectChange: function(args) {
			return;
		},

		/** Function: onClose
		 * Called after a room has been left/closed
		 *
		 * Parameters:
		 *   (Object) args - {roomJid}
		 */
		onClose: function(args) {
			return;
		},

		/** Function: onPresenceChange
		 * Called when presence of user changes (kick, ban)
		 *
		 * Parameters:
		 *   (Object) args - {roomJid, user, reason, type}
		 */
		onPresenceChange: function(args) {
			return;
		}
	};

	/** Class: Candy.View.Event.Roster
	 * Roster-related events
	 */
	self.Roster = {
		/** Function: onUpdate
		 * Called after a user have been added to the roster
		 *
		 * Parameters:
		 *   (Object) args - {roomJid, user, action, element}
		 */
		onUpdate: function(args) {
			return;
		},

		/** Function: onContextMenu
		 * Called when a user clicks on the action menu arrow.
		 * The return value is getting appended to the menulinks.
		 *
		 * Parameters:
		 *   (Object) args - {roomJid, user}
		 *
		 * Returns:
		 *   (Object) - containing menulinks
		 */
		onContextMenu: function(args) {
			return {};
		},

		/** Function: afterContextMenu
		 * Called when after a the context menu is rendered
		 *
		 * Parameters:
		 *   (Object) args - {roomJid, element, user}
		 */
		afterContextMenu: function(args) {
			return;
		}
	};

	/** Class: Candy.View.Event.Message
	 * Message-related events
	 */
	self.Message = {
		/** Function: beforeShow
		 * Called before a new message will be shown.
		 *
		 * Parameters:
		 *   (Object) args - {roomJid, nick, message}
		 *
		 * Returns:
		 *   (String) message
		 */
		beforeShow: function(args) {
			return args.message;
		},

		/** Function: onShow
		 * Called after a new message has been shown
		 *
		 * Parameters:
		 *   (Object) args - {roomJid, element, nick, message}
		 */
		onShow: function(args) {
			return;
		},

		/** Function: beforeSend
		 * Called before a message get sent
		 *
		 * Parameters:
		 *   (String) message
		 *
		 * Returns:
		 *   (String) message
		 */
		beforeSend: function(message) {
			return message;
		}
	};

	return self;
}(Candy.View.Event || {}));
/** File: observer.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@gmail.com>
 *   - Michael Weibel <michael.weibel@gmail.com>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 *   (c) 2012, 2013 Patrick Stadler & Michael Weibel
 */

/* global Candy, Strophe, Mustache, jQuery */

/** Class: Candy.View.Observer
 * Observes Candy core events
 *
 * Parameters:
 *   (Candy.View.Observer) self - itself
 *   (jQuery) $ - jQuery
 */
Candy.View.Observer = (function(self, $) {
	/** PrivateVariable: _showConnectedMessageModal
	 * Ugly way to determine if the 'connected' modal should be shown.
	 * Is set to false in case no autojoin param is set.
	 */
	var _showConnectedMessageModal = true;

	/** Class: Candy.View.Observer.Chat
	 * Chat events
	 */
	self.Chat = {
		/** Function: Connection
		 * The update method gets called whenever an event to which "Chat" is subscribed.
		 *
		 * Currently listens for connection status updates
		 *
		 * Parameters:
		 *   (jQuery.Event) event - jQuery Event object
		 *   (Object) args - {status (Strophe.Status.*)}
		 */
		Connection: function(event, args) {
			switch(args.status) {
				case Strophe.Status.CONNECTING:
				case Strophe.Status.AUTHENTICATING:
					Candy.View.Pane.Chat.Modal.show($.i18n._('statusConnecting'), false, true);
					break;
				case Strophe.Status.ATTACHED:
				case Strophe.Status.CONNECTED:
					if(_showConnectedMessageModal === true) {
						// only show 'connected' if the autojoin error is not shown
						// which is determined by having a visible modal in this stage.
						Candy.View.Pane.Chat.Modal.show($.i18n._('statusConnected'));
						Candy.View.Pane.Chat.Modal.hide();
					}
					break;

				case Strophe.Status.DISCONNECTING:
					Candy.View.Pane.Chat.Modal.show($.i18n._('statusDisconnecting'), false, true);
					break;

				case Strophe.Status.DISCONNECTED:
					var presetJid = Candy.Core.isAnonymousConnection() ? Strophe.getDomainFromJid(Candy.Core.getUser().getJid()) : null;
					Candy.View.Pane.Chat.Modal.showLoginForm($.i18n._('statusDisconnected'), presetJid);
					Candy.View.Event.Chat.onDisconnect();
					break;

				case Strophe.Status.AUTHFAIL:
					Candy.View.Pane.Chat.Modal.showLoginForm($.i18n._('statusAuthfail'));
					Candy.View.Event.Chat.onAuthfail();
					break;

				default:
					Candy.View.Pane.Chat.Modal.show($.i18n._('status', args.status));
					break;
			}
		},

		/** Function: Message
		 * Dispatches admin and info messages
		 *
		 * Parameters:
		 *   (jQuery.Event) event - jQuery Event object
		 *   (Object) args - {type (message/chat/groupchat), subject (if type = message), message}
		 */
		Message: function(event, args) {
			if(args.type === 'message') {
				Candy.View.Pane.Chat.adminMessage((args.subject || ''), args.message);
			} else if(args.type === 'chat' || args.type === 'groupchat') {
				// use onInfoMessage as infos from the server shouldn't be hidden by the infoMessage switch.
				Candy.View.Pane.Chat.onInfoMessage(Candy.View.getCurrent().roomJid, (args.subject || ''), args.message);
			}
		}
	};

	/** Class: Candy.View.Observer.Presence
	 * Presence update events
	 */
	self.Presence = {
		/** Function: update
		 * Every presence update gets dispatched from this method.
		 *
		 * Parameters:
		 *   (jQuery.Event) event - jQuery.Event object
		 *   (Object) args - Arguments differ on each type
		 *
		 * Uses:
		 *   - <notifyPrivateChats>
		 */
		update: function(event, args) {
			// Client left
			if(args.type === 'leave') {
				var user = Candy.View.Pane.Room.getUser(args.roomJid);
				Candy.View.Pane.Room.close(args.roomJid);
				self.Presence.notifyPrivateChats(user, args.type);
			// Client has been kicked or banned
			} else if (args.type === 'kick' || args.type === 'ban') {
				var actorName = args.actor ? Strophe.getNodeFromJid(args.actor) : null,
					actionLabel,
					translationParams = [args.roomName];

				if (actorName) {
					translationParams.push(actorName);
				}

				switch(args.type) {
					case 'kick':
						actionLabel = $.i18n._((actorName ? 'youHaveBeenKickedBy' : 'youHaveBeenKicked'), translationParams);
						break;
					case 'ban':
						actionLabel = $.i18n._((actorName ? 'youHaveBeenBannedBy' : 'youHaveBeenBanned'), translationParams);
						break;
				}
				Candy.View.Pane.Chat.Modal.show(Mustache.to_html(Candy.View.Template.Chat.Context.adminMessageReason, {
					reason: args.reason,
					_action: actionLabel,
					_reason: $.i18n._('reasonWas', [args.reason])
				}));
				setTimeout(function() {
					Candy.View.Pane.Chat.Modal.hide(function() {
						Candy.View.Pane.Room.close(args.roomJid);
						self.Presence.notifyPrivateChats(args.user, args.type);
					});
				}, 5000);

				var evtData = { type: args.type, reason: args.reason, roomJid: args.roomJid, user: args.user };
				Candy.View.Event.Room.onPresenceChange(evtData);

				/** Event: candy:view.presence
				 * Presence update when kicked or banned
				 *
				 * Parameters:
				 *   (String) type - Presence type [kick, ban]
				 *   (String) reason - Reason for the kick|ban [optional]
				 *   (String) roomJid - Room JID
				 *   (Candy.Core.ChatUser) user - User which has been kicked or banned
				 */
				$(Candy).triggerHandler('candy:view.presence', [evtData]);

			// A user changed presence
			} else if(args.roomJid) {
				// Initialize room if not yet existing
				if(!Candy.View.Pane.Chat.rooms[args.roomJid]) {
					Candy.View.Pane.Room.init(args.roomJid, args.roomName);
					Candy.View.Pane.Room.show(args.roomJid);
				}
				Candy.View.Pane.Roster.update(args.roomJid, args.user, args.action, args.currentUser);
				// Notify private user chats if existing
				if(Candy.View.Pane.Chat.rooms[args.user.getJid()]) {
					Candy.View.Pane.Roster.update(args.user.getJid(), args.user, args.action, args.currentUser);
					Candy.View.Pane.PrivateRoom.setStatus(args.user.getJid(), args.action);
				}
			} else {
				// Unhandled type of presence
			}
		},

		/** Function: notifyPrivateChats
		 * Notify private user chats if existing
		 *
		 * Parameters:
		 *   (Candy.Core.ChatUser) user - User which has done the event
		 *   (String) type - Event type (leave, join, kick/ban)
		 */
		notifyPrivateChats: function(user, type) {
			Candy.Core.log('[View:Observer] notify Private Chats');
			var roomJid;
			for(roomJid in Candy.View.Pane.Chat.rooms) {
				if(Candy.View.Pane.Chat.rooms.hasOwnProperty(roomJid) && Candy.View.Pane.Room.getUser(roomJid) && user.getJid() === Candy.View.Pane.Room.getUser(roomJid).getJid()) {
					Candy.View.Pane.Roster.update(roomJid, user, type, user);
					Candy.View.Pane.PrivateRoom.setStatus(roomJid, type);
				}
			}
		}
	};

	/** Function: Candy.View.Observer.PresenceError
	 * Presence errors get handled in this method
	 *
	 * Parameters:
	 *   (jQuery.Event) event - jQuery.Event object
	 *   (Object) args - {msg, type, roomJid, roomName}
	 */
	self.PresenceError = function(obj, args) {
		switch(args.type) {
			case 'not-authorized':
				var message;
				if (args.msg.children('x').children('password').length > 0) {
					message = $.i18n._('passwordEnteredInvalid', [args.roomName]);
				}
				Candy.View.Pane.Chat.Modal.showEnterPasswordForm(args.roomJid, args.roomName, message);
				break;
			case 'conflict':
				Candy.View.Pane.Chat.Modal.showNicknameConflictForm(args.roomJid);
				break;
			case 'registration-required':
				Candy.View.Pane.Chat.Modal.showError('errorMembersOnly', [args.roomName]);
				break;
			case 'service-unavailable':
				Candy.View.Pane.Chat.Modal.showError('errorMaxOccupantsReached', [args.roomName]);
				break;
		}
	};

	/** Function: Candy.View.Observer.Message
	 * Messages received get dispatched from this method.
	 *
	 * Parameters:
	 *   (jQuery.Event) event - jQuery Event object
	 *   (Object) args - {message, roomJid}
	 */
	self.Message = function(event, args) {
		if(args.message.type === 'subject') {
			if (!Candy.View.Pane.Chat.rooms[args.roomJid]) {
				Candy.View.Pane.Room.init(args.roomJid, args.message.name);
				Candy.View.Pane.Room.show(args.roomJid);
			}
			Candy.View.Pane.Room.setSubject(args.roomJid, args.message.body);
		} else if(args.message.type === 'info') {
			Candy.View.Pane.Chat.infoMessage(args.roomJid, args.message.body);
		} else {
			// Initialize room if it's a message for a new private user chat
			if(args.message.type === 'chat' && !Candy.View.Pane.Chat.rooms[args.roomJid]) {
				Candy.View.Pane.PrivateRoom.open(args.roomJid, args.message.name, false, args.message.isNoConferenceRoomJid);
			}
			Candy.View.Pane.Message.show(args.roomJid, args.message.name, args.message.body, args.timestamp);
		}
	};

	/** Function: Candy.View.Observer.Login
	 * The login event gets dispatched to this method
	 *
	 * Parameters:
	 *   (jQuery.Event) event - jQuery Event object
	 *   (Object) args - {presetJid}
	 */
	self.Login = function(event, args) {
		Candy.View.Pane.Chat.Modal.showLoginForm(null, args.presetJid);
	};

	/** Class: Candy.View.Observer.AutojoinMissing
	 * Displays an error about missing autojoin information
	 */
	self.AutojoinMissing = function() {
		_showConnectedMessageModal = false;
		Candy.View.Pane.Chat.Modal.showError('errorAutojoinMissing');
	};

	return self;
}(Candy.View.Observer || {}, jQuery));
/** File: pane.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@gmail.com>
 *   - Michael Weibel <michael.weibel@gmail.com>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 *   (c) 2012, 2013 Patrick Stadler & Michael Weibel. All rights reserved.
 */

/* global Candy, document, Mustache, Strophe, Audio, jQuery */

/** Class: Candy.View.Pane
 * Candy view pane handles everything regarding DOM updates etc.
 *
 * Parameters:
 *   (Candy.View.Pane) self - itself
 *   (jQuery) $ - jQuery
 */
Candy.View.Pane = (function(self, $) {

	/** Class: Candy.View.Pane.Window
	 * Window related view updates
	 */
	self.Window = {
		/** PrivateVariable: _hasFocus
		 * Window has focus
		 */
		_hasFocus: true,
		/** PrivateVariable: _plainTitle
		 * Document title
		 */
		_plainTitle: document.title,
		/** PrivateVariable: _unreadMessagesCount
		 * Unread messages count
		 */
		_unreadMessagesCount: 0,

		/** Variable: autoscroll
		 * Boolean whether autoscroll is enabled
		 */
		autoscroll: true,

		/** Function: hasFocus
		 * Checks if window has focus
		 *
		 * Returns:
		 *   (Boolean)
		 */
		hasFocus: function() {
			return self.Window._hasFocus;
		},

		/** Function: increaseUnreadMessages
		 * Increases unread message count in window title by one.
		 */
		increaseUnreadMessages: function() {
			self.Window.renderUnreadMessages(++self.Window._unreadMessagesCount);
		},

		/** Function: reduceUnreadMessages
		 * Reduce unread message count in window title by `num`.
		 *
		 * Parameters:
		 *   (Integer) num - Unread message count will be reduced by this value
		 */
		reduceUnreadMessages: function(num) {
			self.Window._unreadMessagesCount -= num;
			if(self.Window._unreadMessagesCount <= 0) {
				self.Window.clearUnreadMessages();
			} else {
				self.Window.renderUnreadMessages(self.Window._unreadMessagesCount);
			}
		},

		/** Function: clearUnreadMessages
		 * Clear unread message count in window title.
		 */
		clearUnreadMessages: function() {
			self.Window._unreadMessagesCount = 0;
			document.title = self.Window._plainTitle;
		},

		/** Function: renderUnreadMessages
		 * Update window title to show message count.
		 *
		 * Parameters:
		 *   (Integer) count - Number of unread messages to show in window title
		 */
		renderUnreadMessages: function(count) {
			document.title = Candy.View.Template.Window.unreadmessages.replace('{{count}}', count).replace('{{title}}', self.Window._plainTitle);
		},

		/** Function: onFocus
		 * Window focus event handler.
		 */
		onFocus: function() {
			self.Window._hasFocus = true;
			if (Candy.View.getCurrent().roomJid) {
				self.Room.setFocusToForm(Candy.View.getCurrent().roomJid);
				self.Chat.clearUnreadMessages(Candy.View.getCurrent().roomJid);
			}
		},

		/** Function: onBlur
		 * Window blur event handler.
		 */
		onBlur: function() {
			self.Window._hasFocus = false;
		}
	};

	/** Class: Candy.View.Pane.Chat
	 * Chat-View related view updates
	 */
	self.Chat = {
		/** Variable: rooms
		 * Contains opened room elements
		 */
		rooms: [],

		/** Function: addTab
		 * Add a tab to the chat pane.
		 *
		 * Parameters:
		 *   (String) roomJid - JID of room
		 *   (String) roomName - Tab label
		 *   (String) roomType - Type of room: `groupchat` or `chat`
		 */
		addTab: function(roomJid, roomName, roomType) {
			var roomId = Candy.Util.jidToId(roomJid),
				html = Mustache.to_html(Candy.View.Template.Chat.tab, {
					roomJid: roomJid,
					roomId: roomId,
					name: roomName || Strophe.getNodeFromJid(roomJid),
					privateUserChat: function() {return roomType === 'chat';},
					roomType: roomType
				}),
				tab = $(html).appendTo('#chat-tabs');

			tab.click(self.Chat.tabClick);
			// TODO: maybe we find a better way to get the close element.
			$('a.close', tab).click(self.Chat.tabClose);

			self.Chat.fitTabs();
		},

		/** Function: getTab
		 * Get tab by JID.
		 *
		 * Parameters:
		 *   (String) roomJid - JID of room
		 *
		 * Returns:
		 *   (jQuery object) - Tab element
		 */
		getTab: function(roomJid) {
			return $('#chat-tabs').children('li[data-roomjid="' + roomJid + '"]');
		},

		/** Function: removeTab
		 * Remove tab element.
		 *
		 * Parameters:
		 *   (String) roomJid - JID of room
		 */
		removeTab: function(roomJid) {
			self.Chat.getTab(roomJid).remove();
			self.Chat.fitTabs();
		},

		/** Function: setActiveTab
		 * Set the active tab.
		 *
		 * Add CSS classname `active` to the choosen tab and remove `active` from all other.
		 *
		 * Parameters:
		 *   (String) roomJid - JID of room
		 */
		setActiveTab: function(roomJid) {
			$('#chat-tabs').children().each(function() {
				var tab = $(this);
				if(tab.attr('data-roomjid') === roomJid) {
					tab.addClass('active');
				} else {
					tab.removeClass('active');
				}
			});
		},

		/** Function: increaseUnreadMessages
		 * Increase unread message count in a tab by one.
		 *
		 * Parameters:
		 *   (String) roomJid - JID of room
		 *
		 * Uses:
		 *   - <Window.increaseUnreadMessages>
		 */
		increaseUnreadMessages: function(roomJid) {
			var unreadElem = this.getTab(roomJid).find('.unread');
			unreadElem.show().text(unreadElem.text() !== '' ? parseInt(unreadElem.text(), 10) + 1 : 1);
			// only increase window unread messages in private chats
			if (self.Chat.rooms[roomJid].type === 'chat') {
				self.Window.increaseUnreadMessages();
			}
		},

		/** Function: clearUnreadMessages
		 * Clear unread message count in a tab.
		 *
		 * Parameters:
		 *   (String) roomJid - JID of room
		 *
		 * Uses:
		 *   - <Window.reduceUnreadMessages>
		 */
		clearUnreadMessages: function(roomJid) {
			var unreadElem = self.Chat.getTab(roomJid).find('.unread');
			self.Window.reduceUnreadMessages(unreadElem.text());
			unreadElem.hide().text('');
		},

		/** Function: tabClick
		 * Tab click event: show the room associated with the tab and stops the event from doing the default.
		 */
		tabClick: function(e) {
			// remember scroll position of current room
			var currentRoomJid = Candy.View.getCurrent().roomJid;
			self.Chat.rooms[currentRoomJid].scrollPosition = self.Room.getPane(currentRoomJid, '.message-pane-wrapper').scrollTop();

			self.Room.show($(this).attr('data-roomjid'));
			e.preventDefault();
		},

		/** Function: tabClose
		 * Tab close (click) event: Leave the room (groupchat) or simply close the tab (chat).
		 *
		 * Parameters:
		 *   (DOMEvent) e - Event triggered
		 *
		 * Returns:
		 *   (Boolean) - false, this will stop the event from bubbling
		 */
		tabClose: function() {
			var roomJid = $(this).parent().attr('data-roomjid');
			// close private user tab
			if(self.Chat.rooms[roomJid].type === 'chat') {
				self.Room.close(roomJid);
			// close multi-user room tab
			} else {
				Candy.Core.Action.Jabber.Room.Leave(roomJid);
			}
			return false;
		},

		/** Function: allTabsClosed
		 * All tabs closed event: Disconnect from service. Hide sound control.
		 *
		 * TODO: Handle window close
		 *
		 * Returns:
		 *   (Boolean) - false, this will stop the event from bubbling
		 */
		allTabsClosed: function() {
			Candy.Core.disconnect();
			self.Chat.Toolbar.hide();
			return;
		},

		/** Function: fitTabs
		 * Fit tab size according to window size
		 */
		fitTabs: function() {
			var availableWidth = $('#chat-tabs').innerWidth(),
				tabsWidth = 0,
				tabs = $('#chat-tabs').children();
			tabs.each(function() {
				tabsWidth += $(this).css({width: 'auto', overflow: 'visible'}).outerWidth(true);
			});
			if(tabsWidth > availableWidth) {
				// tabs.[outer]Width() measures the first element in `tabs`. It's no very readable but nearly two times faster than using :first
				var tabDiffToRealWidth = tabs.outerWidth(true) - tabs.width(),
					tabWidth = Math.floor((availableWidth) / tabs.length) - tabDiffToRealWidth;
				tabs.css({width: tabWidth, overflow: 'hidden'});
			}
		},

		/** Function: adminMessage
		 * Display admin message
		 *
		 * Parameters:
		 *   (String) subject - Admin message subject
		 *   (String) message - Message to be displayed
		 *
		 * Triggers:
		 *   candy:view.chat.admin-message using {subject, message}
		 */
		adminMessage: function(subject, message) {
			if(Candy.View.getCurrent().roomJid) { // Simply dismiss admin message if no room joined so far. TODO: maybe we should show those messages on a dedicated pane?
				var html = Mustache.to_html(Candy.View.Template.Chat.adminMessage, {
					subject: subject,
					message: message,
					sender: $.i18n._('administratorMessageSubject'),
					time: Candy.Util.localizedTime(new Date().toGMTString())
				});
				$('#chat-rooms').children().each(function() {
					self.Room.appendToMessagePane($(this).attr('data-roomjid'), html);
				});
				self.Room.scrollToBottom(Candy.View.getCurrent().roomJid);

				var evtData = {'subject' : subject, 'message' : message};

				// deprecated
				Candy.View.Event.Chat.onAdminMessage(evtData);

				/** Event: candy:view.chat.admin-message
				 * After admin message display
				 *
				 * Parameters:
				 *   (String) presetJid - Preset user JID
				 */
				$(Candy).triggerHandler('candy:view.chat.admin-message', evtData);
			}
		},

		/** Function: infoMessage
		 * Display info message. This is a wrapper for <onInfoMessage> to be able to disable certain info messages.
		 *
		 * Parameters:
		 *   (String) roomJid - Room JID
		 *   (String) subject - Subject
		 *   (String) message - Message
		 */
		infoMessage: function(roomJid, subject, message) {
			self.Chat.onInfoMessage(roomJid, subject, message);
		},

		/** Function: onInfoMessage
		 * Display info message. Used by <infoMessage> and several other functions which do not wish that their info message
		 * can be disabled (such as kick/ban message or leave/join message in private chats).
		 *
		 * Parameters:
		 *   (String) roomJid - Room JID
		 *   (String) subject - Subject
		 *   (String) message - Message
		 */
		onInfoMessage: function(roomJid, subject, message) {
			if(Candy.View.getCurrent().roomJid) { // Simply dismiss info message if no room joined so far. TODO: maybe we should show those messages on a dedicated pane?
				var html = Mustache.to_html(Candy.View.Template.Chat.infoMessage, {
					subject: subject,
					message: $.i18n._(message),
					time: Candy.Util.localizedTime(new Date().toGMTString())
				});
				self.Room.appendToMessagePane(roomJid, html);
				if (Candy.View.getCurrent().roomJid === roomJid) {
					self.Room.scrollToBottom(Candy.View.getCurrent().roomJid);
				}
			}
		},

		/** Class: Candy.View.Pane.Toolbar
		 * Chat toolbar for things like emoticons toolbar, room management etc.
		 */
		Toolbar: {
			_supportsNativeAudio: false,

			/** Function: init
			 * Register handler and enable or disable sound and status messages.
			 */
			init: function() {
				$('#emoticons-icon').click(function(e) {
				self.Chat.Context.showEmoticonsMenu(e.currentTarget);
					e.stopPropagation();
				});
				$('#chat-autoscroll-control').click(self.Chat.Toolbar.onAutoscrollControlClick);

				var a = document.createElement('audio');
				self.Chat.Toolbar._supportsNativeAudio = !!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, ''));
				$('#chat-sound-control').click(self.Chat.Toolbar.onSoundControlClick);
				if(Candy.Util.cookieExists('candy-nosound')) {
					$('#chat-sound-control').click();
				}
				$('#chat-statusmessage-control').click(self.Chat.Toolbar.onStatusMessageControlClick);
				if(Candy.Util.cookieExists('candy-nostatusmessages')) {
					$('#chat-statusmessage-control').click();
				}
			},

			/** Function: show
			 * Show toolbar.
			 */
			show: function() {
				$('#chat-toolbar').show();
			},

			/** Function: hide
			 * Hide toolbar.
			 */
			hide: function() {
				$('#chat-toolbar').hide();
			},

			/* Function: update
			 * Update toolbar for specific room
			 */
			update: function(roomJid) {
				var context = $('#chat-toolbar').find('.context'),
					me = self.Room.getUser(roomJid);
				if(!me || !me.isModerator()) {
					context.hide();
				} else {
					context.show().click(function(e) {
						self.Chat.Context.show(e.currentTarget, roomJid);
						e.stopPropagation();
					});
				}
				self.Chat.Toolbar.updateUsercount(self.Chat.rooms[roomJid].usercount);
			},

			/** Function: playSound
			 * Play sound (default method).
			 */
			playSound: function() {
				self.Chat.Toolbar.onPlaySound();
			},

			/** Function: onPlaySound
			 * Sound play event handler. Uses native (HTML5) audio if supported
			 *
			 * Don't call this method directly. Call `playSound()` instead.
			 * `playSound()` will only call this method if sound is enabled.
			 */
			onPlaySound: function() {
				try {
					if(self.Chat.Toolbar._supportsNativeAudio) {
						new Audio(Candy.View.getOptions().resources + 'notify.mp3').play();
					} else {
						var chatSoundPlayer = document.getElementById('chat-sound-player');
						chatSoundPlayer.SetVariable('method:stop', '');
						chatSoundPlayer.SetVariable('method:play', '');
					}
				} catch (e) {}
			},

			/** Function: onSoundControlClick
			 * Sound control click event handler.
			 *
			 * Toggle sound (overwrite `playSound()`) and handle cookies.
			 */
			onSoundControlClick: function() {
				var control = $('#chat-sound-control');
				if(control.hasClass('checked')) {
					self.Chat.Toolbar.playSound = function() {};
					Candy.Util.setCookie('candy-nosound', '1', 365);
				} else {
					self.Chat.Toolbar.playSound = function() {
						self.Chat.Toolbar.onPlaySound();
					};
					Candy.Util.deleteCookie('candy-nosound');
				}
				control.toggleClass('checked');
			},

			/** Function: onAutoscrollControlClick
			 * Autoscroll control event handler.
			 *
			 * Toggle autoscroll
			 */
			onAutoscrollControlClick: function() {
				var control = $('#chat-autoscroll-control');
				if(control.hasClass('checked')) {
					self.Room.scrollToBottom = function(roomJid) {
						self.Room.onScrollToStoredPosition(roomJid);
					};
					self.Window.autoscroll = false;
				} else {
					self.Room.scrollToBottom = function(roomJid) {
						self.Room.onScrollToBottom(roomJid);
					};
					self.Room.scrollToBottom(Candy.View.getCurrent().roomJid);
					self.Window.autoscroll = true;
				}
				control.toggleClass('checked');
			},

			/** Function: onStatusMessageControlClick
			 * Status message control event handler.
			 *
			 * Toggle status message
			 */
			onStatusMessageControlClick: function() {
				var control = $('#chat-statusmessage-control');
				if(control.hasClass('checked')) {
					self.Chat.infoMessage = function() {};
					Candy.Util.setCookie('candy-nostatusmessages', '1', 365);
				} else {
					self.Chat.infoMessage = function(roomJid, subject, message) {
						self.Chat.onInfoMessage(roomJid, subject, message);
					};
					Candy.Util.deleteCookie('candy-nostatusmessages');
				}
				control.toggleClass('checked');
			},

			/** Function: updateUserCount
			 * Update usercount element with count.
			 *
			 * Parameters:
			 *   (Integer) count - Current usercount
			 */
			updateUsercount: function(count) {
				$('#chat-usercount').text(count);
			}
		},

		/** Class: Candy.View.Pane.Modal
		 * Modal window
		 */
		Modal: {
			/** Function: show
			 * Display modal window
			 *
			 * Parameters:
			 *   (String) html - HTML code to put into the modal window
			 *   (Boolean) showCloseControl - set to true if a close button should be displayed [default false]
			 *   (Boolean) showSpinner - set to true if a loading spinner should be shown [default false]
			 */
			show: function(html, showCloseControl, showSpinner) {
				if(showCloseControl) {
					self.Chat.Modal.showCloseControl();
				} else {
					self.Chat.Modal.hideCloseControl();
				}
				if(showSpinner) {
					self.Chat.Modal.showSpinner();
				} else {
					self.Chat.Modal.hideSpinner();
				}
				$('#chat-modal').stop(false, true);
				$('#chat-modal-body').html(html);
				$('#chat-modal').fadeIn('fast');
				$('#chat-modal-overlay').show();
			},

			/** Function: hide
			 * Hide modal window
			 *
			 * Parameters:
			 *   (Function) callback - Calls the specified function after modal window has been hidden.
			 */
			hide: function(callback) {
				$('#chat-modal').fadeOut('fast', function() {
					$('#chat-modal-body').text('');
					$('#chat-modal-overlay').hide();
				});
				// restore initial esc handling
				$(document).keydown(function(e) {
					if(e.which === 27) {
						e.preventDefault();
					}
				});
				if (callback) {
					callback();
				}
			},

			/** Function: showSpinner
			 * Show loading spinner
			 */
			showSpinner: function() {
				$('#chat-modal-spinner').show();
			},

			/** Function: hideSpinner
			 * Hide loading spinner
			 */
			hideSpinner: function() {
				$('#chat-modal-spinner').hide();
			},

			/** Function: showCloseControl
			 * Show a close button
			 */
			showCloseControl: function() {
				$('#admin-message-cancel').show().click(function(e) {
					self.Chat.Modal.hide();
					// some strange behaviour on IE7 (and maybe other browsers) triggers onWindowUnload when clicking on the close button.
					// prevent this.
					e.preventDefault();
				});

				// enable esc to close modal
				$(document).keydown(function(e) {
					if(e.which === 27) {
						self.Chat.Modal.hide();
						e.preventDefault();
					}
				});
			},

			/** Function: hideCloseControl
			 * Hide the close button
			 */
			hideCloseControl: function() {
				$('#admin-message-cancel').hide().click(function() {});
			},

			/** Function: showLoginForm
			 * Show the login form modal
			 *
			 * Parameters:
			 *  (String) message - optional message to display above the form
			 *	(String) presetJid - optional user jid. if set, the user will only be prompted for password.
			 */
			showLoginForm: function(message, presetJid) {
				self.Chat.Modal.show((message ? message : '') + Mustache.to_html(Candy.View.Template.Login.form, {
					_labelUsername: $.i18n._('labelUsername'),
					_labelPassword: $.i18n._('labelPassword'),
					_loginSubmit: $.i18n._('loginSubmit'),
					displayPassword: !Candy.Core.isAnonymousConnection(),
					displayUsername: !presetJid,
					displayNickname: Candy.Core.isAnonymousConnection(),
					presetJid: presetJid ? presetJid : false
				}));
				$('#login-form').children(':input:first').focus();

				// register submit handler
				$('#login-form').submit(function() {
					var username = $('#username').val(),
						password = $('#password').val();

					if (!Candy.Core.isAnonymousConnection()) {
						// guess the input and create a jid out of it
						var jid = Candy.Core.getUser() && username.indexOf("@") < 0 ?
							username + '@' + Strophe.getDomainFromJid(Candy.Core.getUser().getJid()) : username;

						if(jid.indexOf("@") < 0 && !Candy.Core.getUser()) {
							Candy.View.Pane.Chat.Modal.showLoginForm($.i18n._('loginInvalid'));
						} else {
							//Candy.View.Pane.Chat.Modal.hide();
							Candy.Core.connect(jid, password);
						}
					} else { // anonymous login
						Candy.Core.connect(presetJid, null, username);
					}
					return false;
				});
			},

			/** Function: showEnterPasswordForm
			 * Shows a form for entering room password
			 *
			 * Parameters:
			 *   (String) roomJid - Room jid to join
			 *   (String) roomName - Room name
			 *   (String) message - [optional] Message to show as the label
			 */
			showEnterPasswordForm: function(roomJid, roomName, message) {
				self.Chat.Modal.show(Mustache.to_html(Candy.View.Template.PresenceError.enterPasswordForm, {
					roomName: roomName,
					_labelPassword: $.i18n._('labelPassword'),
					_label: (message ? message : $.i18n._('enterRoomPassword', [roomName])),
					_joinSubmit: $.i18n._('enterRoomPasswordSubmit')
				}), true);
				$('#password').focus();

				// register submit handler
				$('#enter-password-form').submit(function() {
					var password = $('#password').val();

					self.Chat.Modal.hide(function() {
						Candy.Core.Action.Jabber.Room.Join(roomJid, password);
					});
					return false;
				});
			},

			/** Function: showNicknameConflictForm
			 * Shows a form indicating that the nickname is already taken and
			 * for chosing a new nickname
			 *
			 * Parameters:
			 *   (String) roomJid - Room jid to join
			 */
			showNicknameConflictForm: function(roomJid) {
				self.Chat.Modal.show(Mustache.to_html(Candy.View.Template.PresenceError.nicknameConflictForm, {
					_labelNickname: $.i18n._('labelUsername'),
					_label: $.i18n._('nicknameConflict'),
					_loginSubmit: $.i18n._('loginSubmit')
				}));
				$('#nickname').focus();

				// register submit handler
				$('#nickname-conflict-form').submit(function() {
					var nickname = $('#nickname').val();

					self.Chat.Modal.hide(function() {
						Candy.Core.getUser().data.nick = nickname;
						Candy.Core.Action.Jabber.Room.Join(roomJid);
					});
					return false;
				});
			},

			/** Function: showError
			 * Show modal containing error message
			 *
			 * Parameters:
			 *   (String) message - key of translation to display
			 *   (Array) replacements - array containing replacements for translation (%s)
			 */
			showError: function(message, replacements) {
				self.Chat.Modal.show(Mustache.to_html(Candy.View.Template.PresenceError.displayError, {
					_error: $.i18n._(message, replacements)
				}), true);
			}
		},

		/** Class: Candy.View.Pane.Tooltip
		 * Class to display tooltips over specific elements
		 */
		Tooltip: {
			/** Function: show
			 * Show a tooltip on event.currentTarget with content specified or content within the target's attribute data-tooltip.
			 *
			 * On mouseleave on the target, hide the tooltip.
			 *
			 * Parameters:
			 *   (Event) event - Triggered event
			 *   (String) content - Content to display [optional]
			 */
			show: function(event, content) {
				var tooltip = $('#tooltip'),
					target = $(event.currentTarget);

				if(!content) {
					content = target.attr('data-tooltip');
				}

				if(tooltip.length === 0) {
					var html = Mustache.to_html(Candy.View.Template.Chat.tooltip);
					$('#chat-pane').append(html);
					tooltip = $('#tooltip');
				}

				$('#context-menu').hide();

				tooltip.stop(false, true);
				tooltip.children('div').html(content);

				var pos = target.offset(),
						posLeft = Candy.Util.getPosLeftAccordingToWindowBounds(tooltip, pos.left),
						posTop  = Candy.Util.getPosTopAccordingToWindowBounds(tooltip, pos.top);

				tooltip
					.css({'left': posLeft.px, 'top': posTop.px})
					.removeClass('left-top left-bottom right-top right-bottom')
					.addClass(posLeft.backgroundPositionAlignment + '-' + posTop.backgroundPositionAlignment)
					.fadeIn('fast');

				target.mouseleave(function(event) {
					event.stopPropagation();
					$('#tooltip').stop(false, true).fadeOut('fast', function() {$(this).css({'top': 0, 'left': 0});});
				});
			}
		},

		/** Class: Candy.View.Pane.Context
		 * Context menu for actions and settings
		 */
		Context: {
			/** Function: init
			 * Initialize context menu and setup mouseleave handler.
			 */
			init: function() {
				if ($('#context-menu').length === 0) {
					var html = Mustache.to_html(Candy.View.Template.Chat.Context.menu);
					$('#chat-pane').append(html);
					$('#context-menu').mouseleave(function() {
						$(this).fadeOut('fast');
					});
				}
			},

			/** Function: show
			 * Show context menu (positions it according to the window height/width)
			 *
			 * Parameters:
			 *   (Element) elem - On which element it should be shown
			 *   (String) roomJid - Room Jid of the room it should be shown
			 *   (Candy.Core.chatUser) user - User
			 *
			 * Uses:
			 *   <getMenuLinks> for getting menulinks the user has access to
			 *   <Candy.Util.getPosLeftAccordingToWindowBounds> for positioning
			 *   <Candy.Util.getPosTopAccordingToWindowBounds> for positioning
			 *
			 * Triggers:
			 *   candy:view.roster.after-context-menu using {roomJid, user, elements}
			 */
			show: function(elem, roomJid, user) {
				elem = $(elem);
				var roomId = self.Chat.rooms[roomJid].id,
					menu = $('#context-menu'),
					links = $('ul li', menu);

				$('#tooltip').hide();

				// add specific context-user class if a user is available (when context menu should be opened next to a user)
				if(!user) {
					user = Candy.Core.getUser();
				}

				links.remove();

				var menulinks = this.getMenuLinks(roomJid, user, elem),
					id,
					clickHandler = function(roomJid, user) {
						return function(event) {
							event.data.callback(event, roomJid, user);
							$('#context-menu').hide();
						};
					};

				for(id in menulinks) {
					if(menulinks.hasOwnProperty(id)) {
						var link = menulinks[id],
							html = Mustache.to_html(Candy.View.Template.Chat.Context.menulinks, {
								'roomId'   : roomId,
								'class'    : link['class'],
								'id'       : id,
								'label'    : link.label
							});
						$('ul', menu).append(html);
						$('#context-menu-' + id).bind('click', link, clickHandler(roomJid, user));
					}
				}
				// if `id` is set the menu is not empty
				if(id) {
					var pos = elem.offset(),
						posLeft = Candy.Util.getPosLeftAccordingToWindowBounds(menu, pos.left),
						posTop  = Candy.Util.getPosTopAccordingToWindowBounds(menu, pos.top);

					menu
						.css({'left': posLeft.px, 'top': posTop.px})
						.removeClass('left-top left-bottom right-top right-bottom')
						.addClass(posLeft.backgroundPositionAlignment + '-' + posTop.backgroundPositionAlignment)
						.fadeIn('fast');

					var evtData = {'roomJid' : roomJid, 'user' : user, 'element': menu};

					// deprecated
					Candy.View.Event.Roster.afterContextMenu(evtData);

					/** Event: candy:view.roster.after-context-menu
					 * After context menu display
					 *
					 * Parameters:
					 *   (String) roomJid - room where the context menu has been triggered
					 *   (Candy.Core.ChatUser) user - User
					 *   (jQuery.Element) element - Menu element
					 */
					$(Candy).triggerHandler('candy:view.roster.after-context-menu', evtData);

					return true;
				}
			},

			/** Function: getMenuLinks
			 * Extends <initialMenuLinks> with menu links gathered from candy:view.roster.contextmenu
			 *
			 * Parameters:
			 *   (String) roomJid - Room in which the menu will be displayed
			 *   (Candy.Core.ChatUser) user - User
			 *   (jQuery.Element) elem - Parent element of the context menu
			 *
			 * Triggers:
			 *   candy:view.roster.context-menu using {roomJid, user, elem}
			 *
			 * Returns:
			 *   (Object) - object containing the extended menulinks.
			 */
			getMenuLinks: function(roomJid, user, elem) {
				var menulinks, extramenulinks, id;

				var evtData = {'roomJid' : roomJid, 'user' : user, 'elem': elem};
				// deprecated
				extramenulinks = Candy.View.Event.Roster.onContextMenu(evtData);

				evtData.menulinks = $.extend(this.initialMenuLinks(elem), extramenulinks);

				/** Event: candy:view.roster.context-menu
				 * Modify existing menu links (add links)
				 *
				 * In order to modify the links you need to change the object passed with an additional
				 * key "menulinks" containing the menulink object.
				 *
				 * Parameters:
				 *   (String) roomJid - Room on which the menu should be displayed
				 *   (Candy.Core.ChatUser) user - User
				 *   (jQuery.Element) elem - Parent element of the context menu
				 */
				$(Candy).triggerHandler('candy:view.roster.context-menu', evtData);

				menulinks = evtData.menulinks;

				for(id in menulinks) {
					if(menulinks.hasOwnProperty(id) && menulinks[id].requiredPermission !== undefined && !menulinks[id].requiredPermission(user, self.Room.getUser(roomJid), elem)) {
						delete menulinks[id];
					}
				}
				return menulinks;
			},

			/** Function: initialMenuLinks
			 * Returns initial menulinks. The following are initial:
			 *
			 * - Private Chat
			 * - Ignore
			 * - Unignore
			 * - Kick
			 * - Ban
			 * - Change Subject
			 *
			 * Returns:
			 *   (Object) - object containing those menulinks
			 */
			initialMenuLinks: function() {
				return {
					'private': {
						requiredPermission: function(user, me) {
							return me.getNick() !== user.getNick() && Candy.Core.getRoom(Candy.View.getCurrent().roomJid) && !Candy.Core.getUser().isInPrivacyList('ignore', user.getJid());
						},
						'class' : 'private',
						'label' : $.i18n._('privateActionLabel'),
						'callback' : function(e, roomJid, user) {
							$('#user-' + Candy.Util.jidToId(roomJid) + '-' + Candy.Util.jidToId(user.getJid())).click();
						}
					},
					'ignore': {
						requiredPermission: function(user, me) {
							return me.getNick() !== user.getNick() && !Candy.Core.getUser().isInPrivacyList('ignore', user.getJid());
						},
						'class' : 'ignore',
						'label' : $.i18n._('ignoreActionLabel'),
						'callback' : function(e, roomJid, user) {
							Candy.View.Pane.Room.ignoreUser(roomJid, user.getJid());
						}
					},
					'unignore': {
						requiredPermission: function(user, me) {
							return me.getNick() !== user.getNick() && Candy.Core.getUser().isInPrivacyList('ignore', user.getJid());
						},
						'class' : 'unignore',
						'label' : $.i18n._('unignoreActionLabel'),
						'callback' : function(e, roomJid, user) {
							Candy.View.Pane.Room.unignoreUser(roomJid, user.getJid());
						}
					},
					'kick': {
						requiredPermission: function(user, me) {
							return me.getNick() !== user.getNick() && me.isModerator() && !user.isModerator();
						},
						'class' : 'kick',
						'label' : $.i18n._('kickActionLabel'),
						'callback' : function(e, roomJid, user) {
							self.Chat.Modal.show(Mustache.to_html(Candy.View.Template.Chat.Context.contextModalForm, {
								_label: $.i18n._('reason'),
								_submit: $.i18n._('kickActionLabel')
							}), true);
							$('#context-modal-field').focus();
							$('#context-modal-form').submit(function() {
								Candy.Core.Action.Jabber.Room.Admin.UserAction(roomJid, user.getJid(), 'kick', $('#context-modal-field').val());
								self.Chat.Modal.hide();
								return false; // stop propagation & preventDefault, as otherwise you get disconnected (wtf?)
							});
						}
					},
					'ban': {
						requiredPermission: function(user, me) {
							return me.getNick() !== user.getNick() && me.isModerator() && !user.isModerator();
						},
						'class' : 'ban',
						'label' : $.i18n._('banActionLabel'),
						'callback' : function(e, roomJid, user) {
							self.Chat.Modal.show(Mustache.to_html(Candy.View.Template.Chat.Context.contextModalForm, {
								_label: $.i18n._('reason'),
								_submit: $.i18n._('banActionLabel')
							}), true);
							$('#context-modal-field').focus();
							$('#context-modal-form').submit(function() {
								Candy.Core.Action.Jabber.Room.Admin.UserAction(roomJid, user.getJid(), 'ban', $('#context-modal-field').val());
								self.Chat.Modal.hide();
								return false; // stop propagation & preventDefault, as otherwise you get disconnected (wtf?)
							});
						}
					},
					'subject': {
						requiredPermission: function(user, me) {
							return me.getNick() === user.getNick() && me.isModerator();
						},
						'class': 'subject',
						'label' : $.i18n._('setSubjectActionLabel'),
						'callback': function(e, roomJid) {
							self.Chat.Modal.show(Mustache.to_html(Candy.View.Template.Chat.Context.contextModalForm, {
								_label: $.i18n._('subject'),
								_submit: $.i18n._('setSubjectActionLabel')
							}), true);
							$('#context-modal-field').focus();
							$('#context-modal-form').submit(function(e) {
								Candy.Core.Action.Jabber.Room.Admin.SetSubject(roomJid, $('#context-modal-field').val());
								self.Chat.Modal.hide();
								e.preventDefault();
							});
						}
					}
				};
			},

			/** Function: showEmoticonsMenu
			 * Shows the special emoticons menu
			 *
			 * Parameters:
			 *   (Element) elem - Element on which it should be positioned to.
			 *
			 * Returns:
			 *   (Boolean) - true
			 */
			showEmoticonsMenu: function(elem) {
				elem = $(elem);
				var pos = elem.offset(),
					menu = $('#context-menu'),
					content = $('ul', menu),
					emoticons = '',
					i;

				$('#tooltip').hide();

				for(i = Candy.Util.Parser.emoticons.length-1; i >= 0; i--) {
					emoticons = '<img src="' + Candy.Util.Parser._emoticonPath + Candy.Util.Parser.emoticons[i].image + '" alt="' + Candy.Util.Parser.emoticons[i].plain + '" />' + emoticons;
				}
				content.html('<li class="emoticons">' + emoticons + '</li>');
				content.find('img').click(function() {
					var input = Candy.View.Pane.Room.getPane(Candy.View.getCurrent().roomJid, '.message-form').children('.field'),
						value = input.val(),
						emoticon = $(this).attr('alt') + ' ';
					input.val(value ? value + ' ' + emoticon : emoticon).focus();
				});

				var posLeft = Candy.Util.getPosLeftAccordingToWindowBounds(menu, pos.left),
					posTop  = Candy.Util.getPosTopAccordingToWindowBounds(menu, pos.top);

				menu
					.css({'left': posLeft.px, 'top': posTop.px})
					.removeClass('left-top left-bottom right-top right-bottom')
					.addClass(posLeft.backgroundPositionAlignment + '-' + posTop.backgroundPositionAlignment)
					.fadeIn('fast');

				return true;
			}
		}
	};

	/** Class: Candy.View.Pane.Room
	 * Everything which belongs to room view things belongs here.
	 */
	self.Room = {
		/** Function: init
		 * Initialize a new room and inserts the room html into the DOM
		 *
		 * Parameters:
		 *   (String) roomJid - Room JID
		 *   (String) roomName - Room name
		 *   (String) roomType - Type: either "groupchat" or "chat" (private chat)
		 *
		 * Uses:
		 *   - <Candy.Util.jidToId>
		 *   - <Candy.View.Pane.Chat.addTab>
		 *   - <getPane>
		 *
		 * Triggers:
		 *   candy:view.room.after-add using {roomJid, type, element}
		 *
		 * Returns:
		 *   (String) - the room id of the element created.
		 */
		init: function(roomJid, roomName, roomType) {
			roomType = roomType || 'groupchat';
			// First room, show sound control
			if(Candy.Util.isEmptyObject(self.Chat.rooms)) {
				self.Chat.Toolbar.show();
			}

			var roomId = Candy.Util.jidToId(roomJid);
			self.Chat.rooms[roomJid] = {id: roomId, usercount: 0, name: roomName, type: roomType, messageCount: 0, scrollPosition: -1};

			$('#chat-rooms').append(Mustache.to_html(Candy.View.Template.Room.pane, {
				roomId: roomId,
				roomJid: roomJid,
				roomType: roomType,
				form: {
					_messageSubmit: $.i18n._('messageSubmit')
				},
				roster: {
					_userOnline: $.i18n._('userOnline')
				}
			}, {
				roster: Candy.View.Template.Roster.pane,
				messages: Candy.View.Template.Message.pane,
				form: Candy.View.Template.Room.form
			}));
			self.Chat.addTab(roomJid, roomName, roomType);
			self.Room.getPane(roomJid, '.message-form').submit(self.Message.submit);

			var evtData = {'roomJid': roomJid, 'type': roomType, 'element': self.Room.getPane(roomJid)};

			// deprecated
			Candy.View.Event.Room.onAdd(evtData);

			/** Event: candy:view.room.after-add
			 * After initialising a room
			 *
			 * Parameters:
			 *   (String) roomJid - Room JID
			 *   (String) type - Room Type
			 *   (jQuery.Element) element - Room element
			 */
			$(Candy).triggerHandler('candy:view.room.after-add', evtData);

			return roomId;
		},

		/** Function: show
		 * Show a specific room and hides the other rooms (if there are any)
		 *
		 * Parameters:
		 *   (String) roomJid - room jid to show
		 *
		 * Triggers:
		 *   candy:view.room.after-show using {roomJid, element}
		 *   candy:view.room.after-hide using {roomJid, element}
		 */
		show: function(roomJid) {
			var roomId = self.Chat.rooms[roomJid].id,
				evtData;

			$('.room-pane').each(function() {
				var elem = $(this);
				if(elem.attr('id') === ('chat-room-' + roomId)) {
					elem.show();
					Candy.View.getCurrent().roomJid = roomJid;
					self.Chat.setActiveTab(roomJid);
					self.Chat.Toolbar.update(roomJid);
					self.Chat.clearUnreadMessages(roomJid);
					self.Room.setFocusToForm(roomJid);
					self.Room.scrollToBottom(roomJid);

					evtData = {'roomJid': roomJid, 'element' : elem};

					// deprecated
					Candy.View.Event.Room.onShow(evtData);

					/** Event: candy:view.room.after-show
					 * After showing a room
					 *
					 * Parameters:
					 *   (String) roomJid - Room JID
					 *   (jQuery.Element) element - Room element
					 */
					$(Candy).triggerHandler('candy:view.room.after-show', evtData);

				} else {
					elem.hide();

					evtData = {'roomJid': roomJid, 'element' : elem};
					// deprecated
					Candy.View.Event.Room.onHide(evtData);

					/** Event: candy:view.room.after-hide
					 * After hiding a room
					 *
					 * Parameters:
					 *   (String) roomJid - Room JID
					 *   (jQuery.Element) element - Room element
					 */
					$(Candy).triggerHandler('candy:view.room.after-hide', evtData);
				}
			});
		},

		/** Function: setSubject
		 * Called when someone changes the subject in the channel
		 *
		 * Triggers:
		 *   candy:view.room.after-subject-change using {roomJid, element, subject}
		 *
		 * Parameters:
		 *   (String) roomJid - Room Jid
		 *   (String) subject - The new subject
		 */
		setSubject: function(roomJid, subject) {
			subject = Candy.Util.Parser.linkify(Candy.Util.Parser.escape(subject));
			var html = Mustache.to_html(Candy.View.Template.Room.subject, {
				subject: subject,
				roomName: self.Chat.rooms[roomJid].name,
				_roomSubject: $.i18n._('roomSubject'),
				time: Candy.Util.localizedTime(new Date().toGMTString())
			});
			self.Room.appendToMessagePane(roomJid, html);
			self.Room.scrollToBottom(roomJid);

			var evtData = {'roomJid': roomJid, 'element' : self.Room.getPane(roomJid), 'subject' : subject};

			// deprecated
			Candy.View.Event.Room.onSubjectChange(evtData);

			/** Event: candy:view.room.after-subject-change
			 * After changing the subject of a room
			 *
			 * Parameters:
			 *   (String) roomJid - Room JID
			 *   (jQuery.Element) element - Room element
			 *   (String) subject - New subject
			 */
			$(Candy).triggerHandler('candy:view.room.after-subject-change', evtData);
		},

		/** Function: close
		 * Close a room and remove everything in the DOM belonging to this room.
		 *
		 * NOTICE: There's a rendering bug in Opera when all rooms have been closed.
		 *         (Take a look in the source for a more detailed description)
		 *
		 * Triggers:
		 *   candy:view.room.after-close using {roomJid}
		 *
		 * Parameters:
		 *   (String) roomJid - Room to close
		 */
		close: function(roomJid) {
			self.Chat.removeTab(roomJid);
			self.Window.clearUnreadMessages();

			/* TODO:
				There's a rendering bug in Opera which doesn't redraw (remove) the message form.
				Only a cosmetical issue (when all tabs are closed) but it's annoying...
				This happens when form has no focus too. Maybe it's because of CSS positioning.
			*/
			self.Room.getPane(roomJid).remove();
			var openRooms = $('#chat-rooms').children();
			if(Candy.View.getCurrent().roomJid === roomJid) {
				Candy.View.getCurrent().roomJid = null;
				if(openRooms.length === 0) {
					self.Chat.allTabsClosed();
				} else {
					self.Room.show(openRooms.last().attr('data-roomjid'));
				}
			}
			delete self.Chat.rooms[roomJid];

			var evtData = {'roomJid' : roomJid};

			// deprecated
			Candy.View.Event.Room.onClose(evtData);

			/** Event: candy:view.room.after-close
			 * After closing a room
			 *
			 * Parameters:
			 *   (String) roomJid - Room JID
			 */
			$(Candy).triggerHandler('candy:view.room.after-close', evtData);
		},

		/** Function: appendToMessagePane
		 * Append a new message to the message pane.
		 *
		 * Parameters:
		 *   (String) roomJid - Room JID
		 *   (String) html - rendered message html
		 */
		appendToMessagePane: function(roomJid, html) {
			self.Room.getPane(roomJid, '.message-pane').append(html);
			self.Chat.rooms[roomJid].messageCount++;
			self.Room.sliceMessagePane(roomJid);
		},

		/** Function: sliceMessagePane
		 * Slices the message pane after the max amount of messages specified in the Candy View options (limit setting).
		 *
		 * This is done to hopefully prevent browsers from getting slow after a certain amount of messages in the DOM.
		 *
		 * The slice is only done when autoscroll is on, because otherwise someone might lose exactly the message he want to look for.
		 *
		 * Parameters:
		 *   (String) roomJid - Room JID
		 */
		sliceMessagePane: function(roomJid) {
			// Only clean if autoscroll is enabled
			if(self.Window.autoscroll) {
				var options = Candy.View.getOptions().messages;
				if(self.Chat.rooms[roomJid].messageCount > options.limit) {
					self.Room.getPane(roomJid, '.message-pane').children().slice(0, options.remove).remove();
					self.Chat.rooms[roomJid].messageCount -= options.remove;
				}
			}
		},

		/** Function: scrollToBottom
		 * Scroll to bottom wrapper for <onScrollToBottom> to be able to disable it by overwriting the function.
		 *
		 * Parameters:
		 *   (String) roomJid - Room JID
		 *
		 * Uses:
		 *   - <onScrollToBottom>
		 */
		scrollToBottom: function(roomJid) {
			self.Room.onScrollToBottom(roomJid);
		},

		/** Function: onScrollToBottom
		 * Scrolls to the latest message received/sent.
		 *
		 * Parameters:
		 *   (String) roomJid - Room JID
		 */
		onScrollToBottom: function(roomJid) {
			var messagePane = self.Room.getPane(roomJid, '.message-pane-wrapper');
			messagePane.scrollTop(messagePane.prop('scrollHeight'));
		},

		/** Function: onScrollToStoredPosition
		 * When autoscroll is off, the position where the scrollbar is has to be stored for each room, because it otherwise
		 * goes to the top in the message window.
		 *
		 * Parameters:
		 *   (String) roomJid - Room JID
		 */
		onScrollToStoredPosition: function(roomJid) {
			// This should only apply when entering a room...
			// ... therefore we set scrollPosition to -1 after execution.
			if(self.Chat.rooms[roomJid].scrollPosition > -1) {
				var messagePane = self.Room.getPane(roomJid, '.message-pane-wrapper');
				messagePane.scrollTop(self.Chat.rooms[roomJid].scrollPosition);
				self.Chat.rooms[roomJid].scrollPosition = -1;
			}
		},

		/** Function: setFocusToForm
		 * Set focus to the message input field within the message form.
		 *
		 * Parameters:
		 *   (String) roomJid - Room JID
		 */
		setFocusToForm: function(roomJid) {
			var pane = self.Room.getPane(roomJid, '.message-form');
			if (pane) {
				// IE8 will fail maybe, because the field isn't there yet.
				try {
					pane.children('.field')[0].focus();
				} catch(e) {
					// fail silently
				}
			}
		},

		/** Function: setUser
		 * Sets or updates the current user in the specified room (called by <Candy.View.Pane.Roster.update>) and set specific informations
		 * (roles and affiliations) on the room tab (chat-pane).
		 *
		 * Parameters:
		 *   (String) roomJid - Room in which the user is set to.
		 *   (Candy.Core.ChatUser) user - The user
		 */
		setUser: function(roomJid, user) {
			self.Chat.rooms[roomJid].user = user;
			var roomPane = self.Room.getPane(roomJid),
				chatPane = $('#chat-pane');

			roomPane.attr('data-userjid', user.getJid());
			// Set classes based on user role / affiliation
			if(user.isModerator()) {
				if (user.getRole() === user.ROLE_MODERATOR) {
					chatPane.addClass('role-moderator');
				}
				if (user.getAffiliation() === user.AFFILIATION_OWNER) {
					chatPane.addClass('affiliation-owner');
				}
			} else {
				chatPane.removeClass('role-moderator affiliation-owner');
			}
			self.Chat.Context.init();
		},

		/** Function: getUser
		 * Get the current user in the room specified with the jid
		 *
		 * Parameters:
		 *   (String) roomJid - Room of which the user should be returned from
		 *
		 * Returns:
		 *   (Candy.Core.ChatUser) - user
		 */
		getUser: function(roomJid) {
			return self.Chat.rooms[roomJid].user;
		},

		/** Function: ignoreUser
		 * Ignore specified user and add the ignore icon to the roster item of the user
		 *
		 * Parameters:
		 *   (String) roomJid - Room in which the user should be ignored
		 *   (String) userJid - User which should be ignored
		 */
		ignoreUser: function(roomJid, userJid) {
			Candy.Core.Action.Jabber.Room.IgnoreUnignore(userJid);
			Candy.View.Pane.Room.addIgnoreIcon(roomJid, userJid);
		},

		/** Function: unignoreUser
		 * Unignore an ignored user and remove the ignore icon of the roster item.
		 *
		 * Parameters:
		 *   (String) roomJid - Room in which the user should be unignored
		 *   (String) userJid - User which should be unignored
		 */
		unignoreUser: function(roomJid, userJid) {
			Candy.Core.Action.Jabber.Room.IgnoreUnignore(userJid);
			Candy.View.Pane.Room.removeIgnoreIcon(roomJid, userJid);
		},

		/** Function: addIgnoreIcon
		 * Add the ignore icon to the roster item of the specified user
		 *
		 * Parameters:
		 *   (String) roomJid - Room in which the roster item should be updated
		 *   (String) userJid - User of which the roster item should be updated
		 */
		addIgnoreIcon: function(roomJid, userJid) {
			if (Candy.View.Pane.Chat.rooms[userJid]) {
				$('#user-' + Candy.View.Pane.Chat.rooms[userJid].id + '-' + Candy.Util.jidToId(userJid)).addClass('status-ignored');
			}
			if (Candy.View.Pane.Chat.rooms[Strophe.getBareJidFromJid(roomJid)]) {
				$('#user-' + Candy.View.Pane.Chat.rooms[Strophe.getBareJidFromJid(roomJid)].id + '-' + Candy.Util.jidToId(userJid)).addClass('status-ignored');
			}
		},

		/** Function: removeIgnoreIcon
		 * Remove the ignore icon to the roster item of the specified user
		 *
		 * Parameters:
		 *   (String) roomJid - Room in which the roster item should be updated
		 *   (String) userJid - User of which the roster item should be updated
		 */
		removeIgnoreIcon: function(roomJid, userJid) {
			if (Candy.View.Pane.Chat.rooms[userJid]) {
				$('#user-' + Candy.View.Pane.Chat.rooms[userJid].id + '-' + Candy.Util.jidToId(userJid)).removeClass('status-ignored');
			}
			if (Candy.View.Pane.Chat.rooms[Strophe.getBareJidFromJid(roomJid)]) {
				$('#user-' + Candy.View.Pane.Chat.rooms[Strophe.getBareJidFromJid(roomJid)].id + '-' + Candy.Util.jidToId(userJid)).removeClass('status-ignored');
			}
		},

		/** Function: getPane
		 * Get the chat room pane or a subPane of it (if subPane is specified)
		 *
		 * Parameters:
		 *   (String) roomJid - Room in which the pane lies
		 *   (String) subPane - Sub pane of the chat room pane if needed [optional]
		 */
		getPane: function(roomJid, subPane) {
			if (self.Chat.rooms[roomJid]) {
				if(subPane) {
					if(self.Chat.rooms[roomJid]['pane-' + subPane]) {
						return self.Chat.rooms[roomJid]['pane-' + subPane];
					} else {
						self.Chat.rooms[roomJid]['pane-' + subPane] = $('#chat-room-' + self.Chat.rooms[roomJid].id).find(subPane);
						return self.Chat.rooms[roomJid]['pane-' + subPane];
					}
				} else {
					return $('#chat-room-' + self.Chat.rooms[roomJid].id);
				}
			}
		}
	};

	/** Class: Candy.View.Pane.PrivateRoom
	 * Private room handling
	 */
	self.PrivateRoom = {
		/** Function: open
		 * Opens a new private room
		 *
		 * Parameters:
		 *   (String) roomJid - Room jid to open
		 *   (String) roomName - Room name
		 *   (Boolean) switchToRoom - If true, displayed room switches automatically to this room
		 *                            (e.g. when user clicks itself on another user to open a private chat)
		 *   (Boolean) isNoConferenceRoomJid - true if a 3rd-party client sends a direct message to this user (not via the room)
		 *										then the username is the node and not the resource. This param addresses this case.
		 *
		 * Triggers:
		 *   candy:view.private-room.after-open using {roomJid, type, element}
		 */
		open: function(roomJid, roomName, switchToRoom, isNoConferenceRoomJid) {
			var user = isNoConferenceRoomJid ? Candy.Core.getUser() : self.Room.getUser(Strophe.getBareJidFromJid(roomJid));
			// if target user is in privacy list, don't open the private chat.
			if (Candy.Core.getUser().isInPrivacyList('ignore', roomJid)) {
				return false;
			}
			if(!self.Chat.rooms[roomJid]) {
				self.Room.init(roomJid, roomName, 'chat');
			}
			if(switchToRoom) {
				self.Room.show(roomJid);
			}

			self.Roster.update(roomJid, new Candy.Core.ChatUser(roomJid, roomName), 'join', user);
			self.Roster.update(roomJid, user, 'join', user);
			self.PrivateRoom.setStatus(roomJid, 'join');



			// We can't track the presence of a user if it's not a conference jid
			if(isNoConferenceRoomJid) {
				self.Chat.infoMessage(roomJid, $.i18n._('presenceUnknownWarningSubject'), $.i18n._('presenceUnknownWarning'));
			}

			var evtData = {'roomJid': roomJid, type: 'chat', 'element': self.Room.getPane(roomJid)};

			// deprecated
			Candy.View.Event.Room.onAdd(evtData);

			/** Event: candy:view.private-room.after-open
			 * After opening a new private room
			 *
			 * Parameters:
			 *   (String) roomJid - Room JID
			 *   (String) type - 'chat'
			 *   (jQuery.Element) element - User element
			 */
			$(Candy).triggerHandler('candy:view.private-room.after-open', evtData);
		},

		/** Function: setStatus
		 * Set offline or online status for private rooms (when one of the participants leaves the room)
		 *
		 * Parameters:
		 *   (String) roomJid - Private room jid
		 *   (String) status - "leave"/"join"
		 */
		setStatus: function(roomJid, status) {
			var messageForm = self.Room.getPane(roomJid, '.message-form');
			if(status === 'join') {
				self.Chat.getTab(roomJid).addClass('online').removeClass('offline');

				messageForm.children('.field').removeAttr('disabled');
				messageForm.children('.submit').removeAttr('disabled');

				self.Chat.getTab(roomJid);
			} else {
				self.Chat.getTab(roomJid).addClass('offline').removeClass('online');

				messageForm.children('.field').attr('disabled', true);
				messageForm.children('.submit').attr('disabled', true);
			}
		}
	};

	/** Class: Candy.View.Pane.Message
	 * Message submit/show handling
	 */
	self.Message = {
		/** Function: submit
		 * on submit handler for message field sends the message to the server and if it's a private chat, shows the message
		 * immediately because the server doesn't send back those message.
		 *
		 * Parameters:
		 *   (Event) event - Triggered event
		 *
		 * Triggers:
		 *   candy:view.message.before-send using {message}
		 */
		submit: function(event) {
			var roomType = Candy.View.Pane.Chat.rooms[Candy.View.getCurrent().roomJid].type,
				message = $(this).children('.field').val().substring(0, Candy.View.getOptions().crop.message.body);

			// deprecated
			message = Candy.View.Event.Message.beforeSend(message);

			var evtData = {message: message};

			/** Event: candy:view.message.before-send
			 * Before sending a message
			 *
			 * Parameters:
			 *   (String) message - Message text
			 */
			$(Candy).triggerHandler('candy:view.message.before-send', evtData);

			message = evtData.message;

			Candy.Core.Action.Jabber.Room.Message(Candy.View.getCurrent().roomJid, message, roomType);
			// Private user chat. Jabber won't notify the user who has sent the message. Just show it as the user hits the button...
			if(roomType === 'chat' && message) {
				self.Message.show(Candy.View.getCurrent().roomJid, self.Room.getUser(Candy.View.getCurrent().roomJid).getNick(), message);
			}
			// Clear input and set focus to it
			$(this).children('.field').val('').focus();
			event.preventDefault();
		},

		/** Function: show
		 * Show a message in the message pane
		 *
		 * Parameters:
		 *   (String) roomJid - room in which the message has been sent to
		 *   (String) name - Name of the user which sent the message
		 *   (String) message - Message
		 *   (String) timestamp - [optional] Timestamp of the message, if not present, current date.
		 *
		 * Triggers:
		 *   candy:view.message.before-show using {roomJid, name, message}
		 *   candy.view.message.before-render using {template, templateData}
		 *   candy:view.message.after-show using {roomJid, name, message, element}
		 */
		show: function(roomJid, name, message, timestamp) {
			message = Candy.Util.Parser.all(message.substring(0, Candy.View.getOptions().crop.message.body));

			var evtData = {'roomJid': roomJid, 'name': name, 'message': message};
			// deprecated
			evtData.message = Candy.View.Event.Message.beforeShow(evtData);

			/** Event: candy:view.message.before-show
			 * Before showing a new message
			 *
			 * Parameters:
			 *   (String) roomJid - Room JID
			 *   (String) name - Name of the sending user
			 *   (String) message - Message text
			 */
			$(Candy).triggerHandler('candy:view.message.before-show', evtData);

			message = evtData.message;

			if(!message) {
				return;
			}

			var renderEvtData = {
				template: Candy.View.Template.Message.item,
				templateData: {
					name: name,
					displayName: Candy.Util.crop(name, Candy.View.getOptions().crop.message.nickname),
					message: message,
					time: Candy.Util.localizedTime(timestamp || new Date().toGMTString())
				}
			};

			/** Event: candy:view.message.before-render
			 * Before rendering the message element
			 *
			 * Parameters:
			 *   (String) template - Template to use
			 *   (Object) templateData - Template data consists of:
			 *                           - (String) name - Name of the sending user
			 *                           - (String) displayName - Cropped name of the sending user
			 *                           - (String) message - Message text
			 *                           - (String) time - Localized time
			 */
			$(Candy).triggerHandler('candy:view.message.before-render', renderEvtData);

			var html = Mustache.to_html(renderEvtData.template, renderEvtData.templateData);
			self.Room.appendToMessagePane(roomJid, html);
			var elem = self.Room.getPane(roomJid, '.message-pane').children().last();
			// click on username opens private chat
			elem.find('a.label').click(function(event) {
				event.preventDefault();
				// Check if user is online and not myself
				var room = Candy.Core.getRoom(roomJid);
				if(room && name !== self.Room.getUser(Candy.View.getCurrent().roomJid).getNick() && room.getRoster().get(roomJid + '/' + name)) {
					Candy.View.Pane.PrivateRoom.open(roomJid + '/' + name, name, true);
				}
			});

			// Notify the user about a new private message
			if(Candy.View.getCurrent().roomJid !== roomJid || !self.Window.hasFocus()) {
				self.Chat.increaseUnreadMessages(roomJid);
				if(Candy.View.Pane.Chat.rooms[roomJid].type === 'chat' && !self.Window.hasFocus()) {
					self.Chat.Toolbar.playSound();
				}
			}
			if(Candy.View.getCurrent().roomJid === roomJid) {
				self.Room.scrollToBottom(roomJid);
			}

			evtData = {'roomJid': roomJid, 'element': elem, 'name': name, 'message': message};

			// deprecated
			Candy.View.Event.Message.onShow(evtData);

			/** Event: candy:view.message.after-show
			 * Triggered after showing a message
			 *
			 * Parameters:
			 *   (String) roomJid - Room JID
			 *   (jQuery.Element) element - User element
			 *   (String) name - Name of the sending user
			 *   (String) message - Message text
			 */
			$(Candy).triggerHandler('candy:view.message.after-show', evtData);
		}
	};

	return self;
}(Candy.View.Pane || {}, jQuery));

/** File: roster.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@gmail.com>
 *   - Michael Weibel <michael.weibel@gmail.com>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 *   (c) 2012, 2013 Patrick Stadler & Michael Weibel
 */

/* global Candy */
/* jshint unused:false */

/** Class: Candy.View.Pane.Roster
 * Handles everyhing regarding roster updates.
 *
 * Parameters:
 *   (Candy.View.Pane.Roster) self - itself
 */
Candy.View.Pane.Roster = (function(self, parent) {
	/** PrivateFunction: join
	 * Called by <Candy.View.Pane.Roster.update> if a user joined the room.
	 *
	 * TODO: Refactoring, this method has too much LOC.
	 *
	 * Parameters:
	 *   (String) roomId - Generated id of the room (hash)
	 *   (String) roomJid - Room JID in which the update happens
	 *   (String) userId - Generated id of the user (hash)
	 *   (Candy.Core.ChatUser) user - User on which the update happens
	 *   (jQuery.Element) userElem - User element (if existing)
	 *   (Candy.Core.ChatUser) currentUser - Current user
	 */
	var join = function join(roomId, roomJid, userId, user, userElem, currentUser) {
		var usercountDiff = 1,
			html = Mustache.to_html(Candy.View.Template.Roster.user, {
				roomId: roomId,
				userId : userId,
				userJid: user.getJid(),
				nick: user.getNick(),
				displayNick: Candy.Util.crop(user.getNick(), Candy.View.getOptions().crop.roster.nickname),
				role: user.getRole(),
				affiliation: user.getAffiliation(),
				me: currentUser !== undefined && user.getNick() === currentUser.getNick(),
				tooltipRole: $.i18n._('tooltipRole'),
				tooltipIgnored: $.i18n._('tooltipIgnored')
			});

		if(userElem.length < 1) {
			var userInserted = false,
				rosterPane = parent.Room.getPane(roomJid, '.roster-pane'),
				userCount = rosterPane.children().length,
				disableSortingThreshold = Candy.View.getOption('bigroom').disableSortingThreshold;
			// there are already users in the roster
			if(userCount > 0 && (disableSortingThreshold === -1 || disableSortingThreshold >= userCount)) {
				// insert alphabetically
				var userSortCompare = user.getNick().toUpperCase();
				rosterPane.children().each(function() {
					var elem = $(this);
					if(elem.attr('data-nick').toUpperCase() > userSortCompare) {
						elem.before(html);
						userInserted = true;
						return false;
					}
					return true;
				});
			}
			// first user in roster or if sorting is disabled
			if(!userInserted) {
				rosterPane.append(html);
			}

			self.joinAnimation('user-' + roomId + '-' + userId);
			// only show other users joining & don't show if there's no message in the room.
			if(currentUser !== undefined && user.getNick() !== currentUser.getNick() && parent.Room.getUser(roomJid)) {
				// always show join message in private room, even if status messages have been disabled
				if (parent.Chat.rooms[roomJid].type === 'chat') {
					parent.Chat.onInfoMessage(roomJid, $.i18n._('userJoinedRoom', [user.getNick()]));
				} else {
					parent.Chat.infoMessage(roomJid, $.i18n._('userJoinedRoom', [user.getNick()]));
				}
			}
		// user is in room but maybe the affiliation/role has changed
		} else {
			usercountDiff = 0;
			userElem.replaceWith(html);
			$('#user-' + roomId + '-' + userId).css({opacity: 1}).show();
			// it's me, update the toolbar
			if(currentUser !== undefined && user.getNick() === currentUser.getNick() && parent.Room.getUser(roomJid)) {
				parent.Chat.Toolbar.update(roomJid);
			}
		}

		// Presence of client
		if (currentUser !== undefined && currentUser.getNick() === user.getNick()) {
			parent.Room.setUser(roomJid, user);
		// add click handler for private chat
		} else {
			$('#user-' + roomId + '-' + userId).click(self.userClick);
		}

		$('#user-' + roomId + '-' + userId + ' .context').click(function(e) {
			parent.Chat.Context.show(e.currentTarget, roomJid, user);
			e.stopPropagation();
		});

		// check if current user is ignoring the user who has joined.
		if (currentUser !== undefined && currentUser.isInPrivacyList('ignore', user.getJid())) {
			Candy.View.Pane.Room.addIgnoreIcon(roomJid, user.getJid());
		}

		return usercountDiff;
	};

	/** Function: update
	 * Called by <Candy.View.Observer.Presence.update> to update the roster if needed.
	 * Adds/removes users from the roster list or updates informations on their items (roles, affiliations etc.)
	 *
	 * TODO: Refactoring, this method has too much LOC.
	 *
	 * Parameters:
	 *   (String) roomJid - Room JID in which the update happens
	 *   (Candy.Core.ChatUser) user - User on which the update happens
	 *   (String) action - one of "join", "leave", "kick" and "ban"
	 *   (Candy.Core.ChatUser) currentUser - Current user
	 *
	 * Triggers:
	 *   candy:view.roster.before-update using {roomJid, user, action, element}
	 *   candy:view.roster.after-update using {roomJid, user, action, element}
	 */
	self.update = function update(roomJid, user, action, currentUser) {
		var roomId = parent.Chat.rooms[roomJid].id,
			userId = Candy.Util.jidToId(user.getJid()),
			usercountDiff = -1,
			userElem = $('#user-' + roomId + '-' + userId);

		var evtData = {'roomJid': roomJid, type: null, 'user': user};

		/** Event: candy:view.roster.before-update
		 * Before updating the roster of a room
		 *
		 * Parameters:
		 *   (String) roomJid - Room JID
		 *   (Candy.Core.ChatUser) user - User
		 *   (String) action - [join, leave, kick, ban]
		 *   (jQuery.Element) element - User element
		 */
		$(Candy).triggerHandler('candy:view.roster.before-update', {
			'roomJid' : roomJid,
			'user' : user,
			'action': action,
			'element': userElem
		});

		// a user joined the room
		if(action === 'join') {
			usercountDiff += join(roomId, roomJid, userId, user, userElem, currentUser);
		// a user left the room
		} else if(action === 'leave') {
			self.leaveAnimation('user-' + roomId + '-' + userId);
			// always show leave message in private room, even if status messages have been disabled
			if (parent.Chat.rooms[roomJid].type === 'chat') {
				parent.Chat.onInfoMessage(roomJid, $.i18n._('userLeftRoom', [user.getNick()]));
			} else {
				parent.Chat.infoMessage(roomJid, $.i18n._('userLeftRoom', [user.getNick()]));
			}
		// user has been kicked
		} else if(action === 'kick') {
			self.leaveAnimation('user-' + roomId + '-' + userId);
			parent.Chat.onInfoMessage(roomJid, $.i18n._('userHasBeenKickedFromRoom', [user.getNick()]));
		// user has been banned
		} else if(action === 'ban') {
			self.leaveAnimation('user-' + roomId + '-' + userId);
			parent.Chat.onInfoMessage(roomJid, $.i18n._('userHasBeenBannedFromRoom', [user.getNick()]));
		}

		// Update user count
		Candy.View.Pane.Chat.rooms[roomJid].usercount += usercountDiff;

		if(roomJid === Candy.View.getCurrent().roomJid) {
			Candy.View.Pane.Chat.Toolbar.updateUsercount(Candy.View.Pane.Chat.rooms[roomJid].usercount);
		}

		evtData = {
			'roomJid' : roomJid,
			'user' : user,
			'action': action,
			'element': $('#user-' + roomId + '-' + userId)
		};

		// deprecated
		Candy.View.Event.Roster.onUpdate(evtData);

		/** Event: candy:view.roster.after-update
		 * After updating a room's roster
		 *
		 * Parameters:
		 *   (String) roomJid - Room JID
		 *   (Candy.Core.ChatUser) user - User
		 *   (String) action - [join, leave, kick, ban]
		 *   (jQuery.Element) element - User element
		 */
		$(Candy).triggerHandler('candy:view.roster.after-update', evtData);
	};

	/** Function: userClick
	 * Click handler for opening a private room
	 */
	self.userClick = function userClick() {
		var elem = $(this);
		parent.PrivateRoom.open(elem.attr('data-jid'), elem.attr('data-nick'), true);
	};

	/** Function: joinAnimation
	 * Animates specified elementId on join
	 *
	 * Parameters:
	 *   (String) elementId - Specific element to do the animation on
	 */
	self.joinAnimation = function joinAnimation(elementId) {
		var roomJid = Candy.View.getCurrent().roomJid;
		var roomUserCount = Candy.View.Pane.Chat.rooms[roomJid].usercount;

		if(roomUserCount >= Candy.View.getOption('bigroom').disableAnimationThreshold) {
			$('#' + elementId).show().css("opacity", 1);
		} else {
			$('#' + elementId).stop(true).slideDown('normal', function() { $(this).animate({ opacity: 1 }); });
		}
	};

	/** Function: leaveAnimation
	 * Leave animation for specified element id and removes the DOM element on completion.
	 *
	 * Parameters:
	 *   (String) elementId - Specific element to do the animation on
	 */
	self.leaveAnimation = function leaveAnimation(elementId) {
		var roomJid = Candy.View.getCurrent().roomJid;
		var roomUserCount = Candy.View.Pane.Chat.rooms[roomJid].usercount;

		if(roomUserCount >= Candy.View.getOption('bigroom').disableAnimationThreshold) {
			$('#' + elementId).stop(true).remove();
		} else {
			$('#' + elementId).stop(true).attr('id', '#' + elementId + '-leaving').animate({ opacity: 0 }, {
				complete: function() {
					$(this).slideUp('normal', function() { $(this).remove(); });
				}
			});
		}
	};

	return self;
}(Candy.View.Pane.Roster || {}, Candy.View.Pane));
/** File: template.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@gmail.com>
 *   - Michael Weibel <michael.weibel@gmail.com>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 *   (c) 2012, 2013 Patrick Stadler & Michael Weibel. All rights reserved.
 */

/* global Candy */

/** Class: Candy.View.Template
 * Contains mustache.js templates
 */
Candy.View.Template = (function(self){
	self.Window = {
		/**
		 * Unread messages - used to extend the window title
		 */
		unreadmessages: '({{count}}) {{title}}'
	};

	self.Chat = {
		pane: '<div id="chat-pane">{{> tabs}}{{> toolbar}}{{> rooms}}</div>{{> modal}}',
		rooms: '<div id="chat-rooms" class="rooms"></div>',
		tabs: '<ul id="chat-tabs"></ul>',
		tab: '<li class="roomtype-{{roomType}}" data-roomjid="{{roomJid}}" data-roomtype="{{roomType}}">' +
				'<a href="#" class="label">{{#privateUserChat}}@{{/privateUserChat}}{{name}}</a>' +
				'<a href="#" class="transition"></a><a href="#" class="close">\u00D7</a>' +
				'<small class="unread"></small></li>',
		modal: '<div id="chat-modal"><a id="admin-message-cancel" class="close" href="#">\u00D7</a>' +
				'<span id="chat-modal-body"></span>' +
				'<img src="{{resourcesPath}}img/modal-spinner.gif" id="chat-modal-spinner" />' +
				'</div><div id="chat-modal-overlay"></div>',
		adminMessage: '<li><small>{{time}}</small><div class="adminmessage">' +
				'<span class="label">{{sender}}</span>' +
				'<span class="spacer">▸</span>{{subject}} {{message}}</div></li>',
		infoMessage: '<li><small>{{time}}</small><div class="infomessage">' +
				'<span class="spacer">•</span>{{subject}} {{message}}</div></li>',
		toolbar: '<ul id="chat-toolbar">' +
				'<li id="emoticons-icon" data-tooltip="{{tooltipEmoticons}}"></li>' +
				'<li id="chat-sound-control" class="checked" data-tooltip="{{tooltipSound}}">{{> soundcontrol}}</li>' +
				'<li id="chat-autoscroll-control" class="checked" data-tooltip="{{tooltipAutoscroll}}"></li>' +
				'<li class="checked" id="chat-statusmessage-control" data-tooltip="{{tooltipStatusmessage}}">' +
				'</li><li class="context" data-tooltip="{{tooltipAdministration}}"></li>' +
				'<li class="usercount" data-tooltip="{{tooltipUsercount}}">' +
				'<span id="chat-usercount"></span></li></ul>',
		soundcontrol: '<script type="text/javascript">var audioplayerListener = new Object();' +
						' audioplayerListener.onInit = function() { };' +
						'</script><object id="chat-sound-player" type="application/x-shockwave-flash" data="{{resourcesPath}}audioplayer.swf"' +
						' width="0" height="0"><param name="movie" value="{{resourcesPath}}audioplayer.swf" /><param name="AllowScriptAccess"' +
						' value="always" /><param name="FlashVars" value="listener=audioplayerListener&amp;mp3={{resourcesPath}}notify.mp3" />' +
						'</object>',
		Context: {
			menu: '<div id="context-menu"><i class="arrow arrow-top"></i>' +
				'<ul></ul><i class="arrow arrow-bottom"></i></div>',
			menulinks: '<li class="{{class}}" id="context-menu-{{id}}">{{label}}</li>',
			contextModalForm: '<form action="#" id="context-modal-form">' +
							'<label for="context-modal-label">{{_label}}</label>' +
							'<input type="text" name="contextModalField" id="context-modal-field" />' +
							'<input type="submit" class="button" name="send" value="{{_submit}}" /></form>',
			adminMessageReason: '<a id="admin-message-cancel" class="close" href="#">×</a>' +
							'<p>{{_action}}</p>{{#reason}}<p>{{_reason}}</p>{{/reason}}'
		},
		tooltip: '<div id="tooltip"><i class="arrow arrow-top"></i>' +
					'<div></div><i class="arrow arrow-bottom"></i></div>'
	};

	self.Room = {
		pane: '<div class="room-pane roomtype-{{roomType}}" id="chat-room-{{roomId}}" data-roomjid="{{roomJid}}" data-roomtype="{{roomType}}">' +
			'{{> roster}}{{> messages}}{{> form}}</div>',
		subject: '<li><small>{{time}}</small><div class="subject">' +
				'<span class="label">{{roomName}}</span>' +
				'<span class="spacer">▸</span>{{_roomSubject}} {{{subject}}}</div></li>',
		form: '<div class="message-form-wrapper">' +
				'<form method="post" class="message-form">' +
				'<input name="message" class="field" type="text" aria-label="Message Form Text Field" autocomplete="off" maxlength="1000" />' +
				'<input type="submit" class="submit" name="submit" value="{{_messageSubmit}}" /></form></div>'
	};

	self.Roster = {
		pane: '<div class="roster-pane"></div>',
		user: '<div class="user role-{{role}} affiliation-{{affiliation}}{{#me}} me{{/me}}"' +
				' id="user-{{roomId}}-{{userId}}" data-jid="{{userJid}}"' +
				' data-nick="{{nick}}" data-role="{{role}}" data-affiliation="{{affiliation}}">' +
				'<div class="label">{{displayNick}}</div><ul>' +
				'<li class="context" id="context-{{roomId}}-{{userId}}">&#x25BE;</li>' +
				'<li class="role role-{{role}} affiliation-{{affiliation}}" data-tooltip="{{tooltipRole}}"></li>' +
				'<li class="ignore" data-tooltip="{{tooltipIgnored}}"></li></ul></div>'
	};

	self.Message = {
		pane: '<div class="message-pane-wrapper"><ul class="message-pane"></ul></div>',
		item: '<li><small>{{time}}</small><div>' +
				'<a class="label" href="#" class="name">{{displayName}}</a>' +
				'<span class="spacer">▸</span>{{{message}}}</div></li>'
	};

	self.Login = {
		form: '<form method="post" id="login-form" class="login-form">' +
			'{{#displayNickname}}<label for="username">{{_labelNickname}}</label><input type="text" id="username" name="username"/>{{/displayNickname}}' +
			'{{#displayUsername}}<label for="username">{{_labelUsername}}</label>' +
			'<input type="text" id="username" name="username"/>{{/displayUsername}}' +
			'{{#presetJid}}<input type="hidden" id="username" name="username" value="{{presetJid}}"/>{{/presetJid}}' +
			'{{#displayPassword}}<label for="password">{{_labelPassword}}</label>' +
			'<input type="password" id="password" name="password" />{{/displayPassword}}' +
			'<input type="submit" class="button" value="{{_loginSubmit}}" /></form>'
	};

	self.PresenceError = {
		enterPasswordForm: '<strong>{{_label}}</strong>' +
			'<form method="post" id="enter-password-form" class="enter-password-form">' +
			'<label for="password">{{_labelPassword}}</label><input type="password" id="password" name="password" />' +
			'<input type="submit" class="button" value="{{_joinSubmit}}" /></form>',
		nicknameConflictForm: '<strong>{{_label}}</strong>' +
			'<form method="post" id="nickname-conflict-form" class="nickname-conflict-form">' +
			'<label for="nickname">{{_labelNickname}}</label><input type="text" id="nickname" name="nickname" />' +
			'<input type="submit" class="button" value="{{_loginSubmit}}" /></form>',
		displayError: '<strong>{{_error}}</strong>'
	};

	return self;
}(Candy.View.Template || {}));

/** File: translation.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@gmail.com>
 *   - Michael Weibel <michael.weibel@gmail.com>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 *   (c) 2012, 2013 Patrick Stadler & Michael Weibel. All rights reserved.
 */

/* global Candy */

/** Class: Candy.View.Translation
 * Contains translations
 */
Candy.View.Translation = {
	'en' : {
		'status': 'Status: %s',
		'statusConnecting': 'Connecting...',
		'statusConnected' : 'Connected',
		'statusDisconnecting': 'Disconnecting...',
		'statusDisconnected' : 'Disconnected',
		'statusAuthfail': 'Authentication failed',

		'roomSubject'  : 'Subject:',
		'messageSubmit': 'Send',

		'labelUsername': 'Username:',
		'labelNickname': 'Nickname:',
		'labelPassword': 'Password:',
		'loginSubmit'  : 'Login',
		'loginInvalid'  : 'Invalid JID',

		'reason'				: 'Reason:',
		'subject'				: 'Subject:',
		'reasonWas'				: 'Reason was: %s.',
		'kickActionLabel'		: 'Kick',
		'youHaveBeenKickedBy'   : 'You have been kicked from %2$s by %1$s',
		'youHaveBeenKicked'     : 'You have been kicked from %s',
		'banActionLabel'		: 'Ban',
		'youHaveBeenBannedBy'   : 'You have been banned from %1$s by %2$s',
		'youHaveBeenBanned'     : 'You have been banned from %s',

		'privateActionLabel' : 'Private chat',
		'ignoreActionLabel'  : 'Ignore',
		'unignoreActionLabel' : 'Unignore',

		'setSubjectActionLabel': 'Change Subject',

		'administratorMessageSubject' : 'Administrator',

		'userJoinedRoom'           : '%s joined the room.',
		'userLeftRoom'             : '%s left the room.',
		'userHasBeenKickedFromRoom': '%s has been kicked from the room.',
		'userHasBeenBannedFromRoom': '%s has been banned from the room.',

		'presenceUnknownWarningSubject': 'Notice:',
		'presenceUnknownWarning'       : 'This user might be offline. We can\'t track his presence.',

		'dateFormat': 'dd.mm.yyyy',
		'timeFormat': 'HH:MM:ss',

		'tooltipRole'			: 'Moderator',
		'tooltipIgnored'		: 'You ignore this user',
		'tooltipEmoticons'		: 'Emoticons',
		'tooltipSound'			: 'Play sound for new private messages',
		'tooltipAutoscroll'		: 'Autoscroll',
		'tooltipStatusmessage'	: 'Display status messages',
		'tooltipAdministration'	: 'Room Administration',
		'tooltipUsercount'		: 'Room Occupants',

		'enterRoomPassword' : 'Room "%s" is password protected.',
		'enterRoomPasswordSubmit' : 'Join room',
		'passwordEnteredInvalid' : 'Invalid password for room "%s".',

		'nicknameConflict': 'Username already in use. Please choose another one.',

		'errorMembersOnly': 'You can\'t join room "%s": Insufficient rights.',
		'errorMaxOccupantsReached': 'You can\'t join room "%s": Too many occupants.',
		'errorAutojoinMissing': 'No autojoin parameter set in configuration. Please set one to continue.',

		'antiSpamMessage' : 'Please do not spam. You have been blocked for a short-time.'
	},
	'de' : {
		'status': 'Status: %s',
		'statusConnecting': 'Verbinden...',
		'statusConnected' : 'Verbunden',
		'statusDisconnecting': 'Verbindung trennen...',
		'statusDisconnected' : 'Verbindung getrennt',
		'statusAuthfail': 'Authentifizierung fehlgeschlagen',

		'roomSubject'  : 'Thema:',
		'messageSubmit': 'Senden',

		'labelUsername': 'Benutzername:',
		'labelNickname': 'Spitzname:',
		'labelPassword': 'Passwort:',
		'loginSubmit'  : 'Anmelden',
		'loginInvalid'  : 'Ungültige JID',

		'reason'				: 'Begründung:',
		'subject'				: 'Titel:',
		'reasonWas'				: 'Begründung: %s.',
		'kickActionLabel'		: 'Kick',
		'youHaveBeenKickedBy'   : 'Du wurdest soeben aus dem Raum %1$s gekickt (%2$s)',
		'youHaveBeenKicked'     : 'Du wurdest soeben aus dem Raum %s gekickt',
		'banActionLabel'		: 'Ban',
		'youHaveBeenBannedBy'   : 'Du wurdest soeben aus dem Raum %1$s verbannt (%2$s)',
		'youHaveBeenBanned'     : 'Du wurdest soeben aus dem Raum %s verbannt',

		'privateActionLabel' : 'Privater Chat',
		'ignoreActionLabel'  : 'Ignorieren',
		'unignoreActionLabel' : 'Nicht mehr ignorieren',

		'setSubjectActionLabel': 'Thema ändern',

		'administratorMessageSubject' : 'Administrator',

		'userJoinedRoom'           : '%s hat soeben den Raum betreten.',
		'userLeftRoom'             : '%s hat soeben den Raum verlassen.',
		'userHasBeenKickedFromRoom': '%s ist aus dem Raum gekickt worden.',
		'userHasBeenBannedFromRoom': '%s ist aus dem Raum verbannt worden.',

		'presenceUnknownWarningSubject': 'Hinweis:',
		'presenceUnknownWarning'       : 'Dieser Benutzer könnte bereits abgemeldet sein. Wir können seine Anwesenheit nicht verfolgen.',

		'dateFormat': 'dd.mm.yyyy',
		'timeFormat': 'HH:MM:ss',

		'tooltipRole'			: 'Moderator',
		'tooltipIgnored'		: 'Du ignorierst diesen Benutzer',
		'tooltipEmoticons'		: 'Smileys',
		'tooltipSound'			: 'Ton abspielen bei neuen privaten Nachrichten',
		'tooltipAutoscroll'		: 'Autoscroll',
		'tooltipStatusmessage'	: 'Statusnachrichten anzeigen',
		'tooltipAdministration'	: 'Raum Administration',
		'tooltipUsercount'		: 'Anzahl Benutzer im Raum',

		'enterRoomPassword' : 'Raum "%s" ist durch ein Passwort geschützt.',
		'enterRoomPasswordSubmit' : 'Raum betreten',
		'passwordEnteredInvalid' : 'Inkorrektes Passwort für Raum "%s".',

		'nicknameConflict': 'Der Benutzername wird bereits verwendet. Bitte wähle einen anderen.',

		'errorMembersOnly': 'Du kannst den Raum "%s" nicht betreten: Ungenügende Rechte.',
		'errorMaxOccupantsReached': 'Du kannst den Raum "%s" nicht betreten: Benutzerlimit erreicht.',
		'errorAutojoinMissing': 'Keine "autojoin" Konfiguration gefunden. Bitte setze eine konfiguration um fortzufahren.',

		'antiSpamMessage' : 'Bitte nicht spammen. Du wurdest für eine kurze Zeit blockiert.'
	},
	'fr' : {
		'status': 'Status : %s',
		'statusConnecting': 'Connexion…',
		'statusConnected' : 'Connecté.',
		'statusDisconnecting': 'Déconnexion…',
		'statusDisconnected' : 'Déconnecté.',
		'statusAuthfail': 'L\'authentification a échoué',

		'roomSubject'  : 'Sujet :',
		'messageSubmit': 'Envoyer',

		'labelUsername': 'Nom d\'utilisateur :',
		'labelPassword': 'Mot de passe :',
		'loginSubmit'  : 'Connexion',
		'loginInvalid'  : 'JID invalide',

		'reason'				: 'Motif :',
		'subject'				: 'Titre :',
		'reasonWas'				: 'Motif : %s.',
		'kickActionLabel'		: 'Kick',
		'youHaveBeenKickedBy'   : 'Vous avez été expulsé du salon %1$s (%2$s)',
		'youHaveBeenKicked'     : 'Vous avez été expulsé du salon %s',
		'banActionLabel'		: 'Ban',
		'youHaveBeenBannedBy'   : 'Vous avez été banni du salon %1$s (%2$s)',
		'youHaveBeenBanned'     : 'Vous avez été banni du salon %s',

		'privateActionLabel' : 'Chat privé',
		'ignoreActionLabel'  : 'Ignorer',
		'unignoreActionLabel' : 'Ne plus ignorer',

		'setSubjectActionLabel': 'Changer le sujet',

		'administratorMessageSubject' : 'Administrateur',

		'userJoinedRoom'           : '%s vient d\'entrer dans le salon.',
		'userLeftRoom'             : '%s vient de quitter le salon.',
		'userHasBeenKickedFromRoom': '%s a été expulsé du salon.',
		'userHasBeenBannedFromRoom': '%s a été banni du salon.',

		'presenceUnknownWarningSubject': 'Note :',
		'presenceUnknownWarning'       : 'Cet utilisateur n\'est malheureusement plus connecté, le message ne sera pas envoyé.',

		'dateFormat': 'dd/mm/yyyy',
		'timeFormat': 'HH:MM:ss',

		'tooltipRole'			: 'Modérateur',
		'tooltipIgnored'		: 'Vous ignorez cette personne',
		'tooltipEmoticons'		: 'Smileys',
		'tooltipSound'			: 'Jouer un son lors de la réception de nouveaux messages privés',
		'tooltipAutoscroll'		: 'Défilement automatique',
		'tooltipStatusmessage'	: 'Messages d\'état',
		'tooltipAdministration'	: 'Administration du salon',
		'tooltipUsercount'		: 'Nombre d\'utilisateurs dans le salon',

		'enterRoomPassword' : 'Le salon "%s" est protégé par un mot de passe.',
		'enterRoomPasswordSubmit' : 'Entrer dans le salon',
		'passwordEnteredInvalid' : 'Le mot de passe pour le salon "%s" est invalide.',

		'nicknameConflict': 'Le nom d\'utilisateur est déjà utilisé. Veuillez en choisir un autre.',

		'errorMembersOnly': 'Vous ne pouvez pas entrer dans le salon "%s" : droits insuffisants.',
		'errorMaxOccupantsReached': 'Vous ne pouvez pas entrer dans le salon "%s": Limite d\'utilisateur atteint.',

		'antiSpamMessage' : 'Merci de ne pas envoyer de spam. Vous avez été bloqué pendant une courte période..'
	},
	'nl' : {
		'status': 'Status: %s',
		'statusConnecting': 'Verbinding maken...',
		'statusConnected' : 'Verbinding is gereed',
		'statusDisconnecting': 'Verbinding verbreken...',
		'statusDisconnected' : 'Verbinding is verbroken',
		'statusAuthfail': 'Authenticatie is mislukt',

		'roomSubject'  : 'Onderwerp:',
		'messageSubmit': 'Verstuur',

		'labelUsername': 'Gebruikersnaam:',
		'labelPassword': 'Wachtwoord:',
		'loginSubmit'  : 'Inloggen',
		'loginInvalid'  : 'JID is onjuist',

		'reason'				: 'Reden:',
		'subject'				: 'Onderwerp:',
		'reasonWas'				: 'De reden was: %s.',
		'kickActionLabel'		: 'Verwijderen',
		'youHaveBeenKickedBy'   : 'Je bent verwijderd van %1$s door %2$s',
		'youHaveBeenKicked'     : 'Je bent verwijderd van %s',
		'banActionLabel'		: 'Blokkeren',
		'youHaveBeenBannedBy'   : 'Je bent geblokkeerd van %1$s door %2$s',
		'youHaveBeenBanned'     : 'Je bent geblokkeerd van %s',

		'privateActionLabel' : 'Prive gesprek',
		'ignoreActionLabel'  : 'Negeren',
		'unignoreActionLabel' : 'Niet negeren',

		'setSubjectActionLabel': 'Onderwerp wijzigen',

		'administratorMessageSubject' : 'Beheerder',

		'userJoinedRoom'           : '%s komt de chat binnen.',
		'userLeftRoom'             : '%s heeft de chat verlaten.',
		'userHasBeenKickedFromRoom': '%s is verwijderd.',
		'userHasBeenBannedFromRoom': '%s is geblokkeerd.',

		'presenceUnknownWarningSubject': 'Mededeling:',
		'presenceUnknownWarning'       : 'Deze gebruiker is waarschijnlijk offline, we kunnen zijn/haar aanwezigheid niet vaststellen.',

		'dateFormat': 'dd.mm.yyyy',
		'timeFormat': 'HH:MM:ss',

		'tooltipRole'			: 'Moderator',
		'tooltipIgnored'		: 'Je negeert deze gebruiker',
		'tooltipEmoticons'		: 'Emotie-iconen',
		'tooltipSound'			: 'Speel een geluid af bij nieuwe privé berichten.',
		'tooltipAutoscroll'		: 'Automatisch scrollen',
		'tooltipStatusmessage'	: 'Statusberichten weergeven',
		'tooltipAdministration'	: 'Instellingen',
		'tooltipUsercount'		: 'Gebruikers',

		'enterRoomPassword' : 'De Chatroom "%s" is met een wachtwoord beveiligd.',
		'enterRoomPasswordSubmit' : 'Ga naar Chatroom',
		'passwordEnteredInvalid' : 'Het wachtwoord voor de Chatroom "%s" is onjuist.',

		'nicknameConflict': 'De gebruikersnaam is reeds in gebruik. Probeer a.u.b. een andere gebruikersnaam.',

		'errorMembersOnly': 'Je kunt niet deelnemen aan de Chatroom "%s": Je hebt onvoldoende rechten.',
		'errorMaxOccupantsReached': 'Je kunt niet deelnemen aan de Chatroom "%s": Het maximum aantal gebruikers is bereikt.',

		'antiSpamMessage' : 'Het is niet toegestaan om veel berichten naar de server te versturen. Je bent voor een korte periode geblokkeerd.'
	},
	'es': {
		'status': 'Estado: %s',
		'statusConnecting': 'Conectando...',
		'statusConnected' : 'Conectado',
		'statusDisconnecting': 'Desconectando...',
		'statusDisconnected' : 'Desconectado',
		'statusAuthfail': 'Falló la autenticación',

		'roomSubject'  : 'Asunto:',
		'messageSubmit': 'Enviar',

		'labelUsername': 'Usuario:',
		'labelPassword': 'Clave:',
		'loginSubmit'  : 'Entrar',
		'loginInvalid'  : 'JID no válido',

		'reason'				: 'Razón:',
		'subject'				: 'Asunto:',
		'reasonWas'				: 'La razón fue: %s.',
		'kickActionLabel'		: 'Expulsar',
		'youHaveBeenKickedBy'   : 'Has sido expulsado de %1$s por %2$s',
		'youHaveBeenKicked'     : 'Has sido expulsado de %s',
		'banActionLabel'		: 'Prohibir',
		'youHaveBeenBannedBy'   : 'Has sido expulsado permanentemente de %1$s por %2$s',
		'youHaveBeenBanned'     : 'Has sido expulsado permanentemente de %s',

		'privateActionLabel' : 'Chat privado',
		'ignoreActionLabel'  : 'Ignorar',
		'unignoreActionLabel' : 'No ignorar',

		'setSubjectActionLabel': 'Cambiar asunto',

		'administratorMessageSubject' : 'Administrador',

		'userJoinedRoom'           : '%s se ha unido a la sala.',
		'userLeftRoom'             : '%s ha dejado la sala.',
		'userHasBeenKickedFromRoom': '%s ha sido expulsado de la sala.',
		'userHasBeenBannedFromRoom': '%s ha sido expulsado permanentemente de la sala.',

		'presenceUnknownWarningSubject': 'Atención:',
		'presenceUnknownWarning'       : 'Éste usuario podría estar desconectado..',

		'dateFormat': 'dd.mm.yyyy',
		'timeFormat': 'HH:MM:ss',

		'tooltipRole'			: 'Moderador',
		'tooltipIgnored'		: 'Ignoras a éste usuario',
		'tooltipEmoticons'		: 'Emoticonos',
		'tooltipSound'			: 'Reproducir un sonido para nuevos mensajes privados',
		'tooltipAutoscroll'		: 'Desplazamiento automático',
		'tooltipStatusmessage'	: 'Mostrar mensajes de estado',
		'tooltipAdministration'	: 'Administración de la sala',
		'tooltipUsercount'		: 'Usuarios en la sala',

		'enterRoomPassword' : 'La sala "%s" está protegida mediante contraseña.',
		'enterRoomPasswordSubmit' : 'Unirse a la sala',
		'passwordEnteredInvalid' : 'Contraseña incorrecta para la sala "%s".',

		'nicknameConflict': 'El nombre de usuario ya está siendo utilizado. Por favor elija otro.',

		'errorMembersOnly': 'No se puede unir a la sala "%s": no tiene privilegios suficientes.',
		'errorMaxOccupantsReached': 'No se puede unir a la sala "%s": demasiados participantes.',

		'antiSpamMessage' : 'Por favor, no hagas spam. Has sido bloqueado temporalmente.'
	},
	'cn': {
		'status': '状态: %s',
		'statusConnecting': '连接中...',
		'statusConnected': '已连接',
		'statusDisconnecting': '断开连接中...',
		'statusDisconnected': '已断开连接',
		'statusAuthfail': '认证失败',

		'roomSubject': '主题:',
		'messageSubmit': '发送',

		'labelUsername': '用户名:',
		'labelPassword': '密码:',
		'loginSubmit': '登录',
		'loginInvalid': '用户名不合法',

		'reason': '原因:',
		'subject': '主题:',
		'reasonWas': '原因是: %s.',
		'kickActionLabel': '踢除',
		'youHaveBeenKickedBy': '你在 %1$s 被管理者 %2$s 请出房间',
		'banActionLabel': '禁言',
		'youHaveBeenBannedBy': '你在 %1$s 被管理者 %2$s 禁言',

		'privateActionLabel': '单独对话',
		'ignoreActionLabel': '忽略',
		'unignoreActionLabel': '不忽略',

		'setSubjectActionLabel': '变更主题',

		'administratorMessageSubject': '管理员',

		'userJoinedRoom': '%s 加入房间',
		'userLeftRoom': '%s 离开房间',
		'userHasBeenKickedFromRoom': '%s 被请出这个房间',
		'userHasBeenBannedFromRoom': '%s 被管理者禁言',

		'presenceUnknownWarningSubject': '注意:',
		'presenceUnknownWarning': '这个会员可能已经下线，不能追踪到他的连接信息',

		'dateFormat': 'dd.mm.yyyy',
		'timeFormat': 'HH:MM:ss',

		'tooltipRole': '管理',
		'tooltipIgnored': '你忽略了这个会员',
		'tooltipEmoticons': '表情',
		'tooltipSound': '新消息发音',
		'tooltipAutoscroll': '滚动条',
		'tooltipStatusmessage': '禁用状态消息',
		'tooltipAdministration': '房间管理',
		'tooltipUsercount': '房间占有者',

		'enterRoomPassword': '登录房间 "%s" 需要密码.',
		'enterRoomPasswordSubmit': '加入房间',
		'passwordEnteredInvalid': '登录房间 "%s" 的密码不正确',

		'nicknameConflict': '用户名已经存在，请另选一个',

		'errorMembersOnly': '您的权限不够，不能登录房间 "%s" ',
		'errorMaxOccupantsReached': '房间 "%s" 的人数已达上限，您不能登录',

		'antiSpamMessage': '因为您在短时间内发送过多的消息 服务器要阻止您一小段时间。'
	},
	'ja' : {
		'status'        : 'ステータス: %s',
		'statusConnecting'  : '接続中…',
		'statusConnected'   : '接続されました',
		'statusDisconnecting'   : 'ディスコネクト中…',
		'statusDisconnected'    : 'ディスコネクトされました',
		'statusAuthfail'    : '認証に失敗しました',

		'roomSubject'       : 'トピック：',
		'messageSubmit'     : '送信',

		'labelUsername'     : 'ユーザーネーム：',
		'labelPassword'     : 'パスワード：',
		'loginSubmit'       : 'ログイン',
		'loginInvalid'      : 'ユーザーネームが正しくありません',

		'reason'        : '理由：',
		'subject'       : 'トピック：',
		'reasonWas'     : '理由: %s。',
		'kickActionLabel'   : 'キック',
		'youHaveBeenKickedBy'   : 'あなたは%2$sにより%1$sからキックされました。',
		'youHaveBeenKicked'     : 'あなたは%sからキックされました。',
		'banActionLabel'    : 'アカウントバン',
		'youHaveBeenBannedBy'   : 'あなたは%2$sにより%1$sからアカウントバンされました。',
		'youHaveBeenBanned'     : 'あなたは%sからアカウントバンされました。',

		'privateActionLabel'    : 'プライベートメッセージ',
		'ignoreActionLabel' : '無視する',
		'unignoreActionLabel'   : '無視をやめる',

		'setSubjectActionLabel'     : 'トピックを変える',

		'administratorMessageSubject'   : '管理者',

		'userJoinedRoom'        : '%sは入室しました。',
		'userLeftRoom'          : '%sは退室しました。',
		'userHasBeenKickedFromRoom' : '%sは部屋からキックされました。',
		'userHasBeenBannedFromRoom' : '%sは部屋からアカウントバンされました。',

		'presenceUnknownWarningSubject' : '忠告：',
		'presenceUnknownWarning'    : 'このユーザーのステータスは不明です。',

		'dateFormat'        : 'dd.mm.yyyy',
		'timeFormat'        : 'HH:MM:ss',

		'tooltipRole'       : 'モデレーター',
		'tooltipIgnored'    : 'このユーザーを無視設定にしている',
		'tooltipEmoticons'  : '絵文字',
		'tooltipSound'      : '新しいメッセージが届くたびに音を鳴らす',
		'tooltipAutoscroll' : 'オートスクロール',
		'tooltipStatusmessage'  : 'ステータスメッセージを表示',
		'tooltipAdministration' : '部屋の管理',
		'tooltipUsercount'  : 'この部屋の参加者の数',

		'enterRoomPassword'     : '"%s"の部屋に入るにはパスワードが必要です。',
		'enterRoomPasswordSubmit'   : '部屋に入る',
		'passwordEnteredInvalid'    : '"%s"のパスワードと異なるパスワードを入力しました。',

		'nicknameConflict'  : 'このユーザーネームはすでに利用されているため、別のユーザーネームを選んでください。',

		'errorMembersOnly'      : '"%s"の部屋に入ることができません: 利用権限を満たしていません。',
		'errorMaxOccupantsReached'  : '"%s"の部屋に入ることができません: 参加者の数はすでに上限に達しました。',

		'antiSpamMessage'   : 'スパムなどの行為はやめてください。あなたは一時的にブロックされました。'
	},
	'sv' : {
		'status': 'Status: %s',
		'statusConnecting': 'Ansluter...',
		'statusConnected' : 'Ansluten',
		'statusDisconnecting': 'Kopplar från...',
		'statusDisconnected' : 'Frånkopplad',
		'statusAuthfail': 'Autentisering misslyckades',

		'roomSubject'  : 'Ämne:',
		'messageSubmit': 'Skicka',

		'labelUsername': 'Användarnamn:',
		'labelPassword': 'Lösenord:',
		'loginSubmit'  : 'Logga in',
		'loginInvalid'  : 'Ogiltigt JID',

		'reason'                : 'Anledning:',
		'subject'               : 'Ämne:',
		'reasonWas'             : 'Anledningen var: %s.',
		'kickActionLabel'       : 'Sparka ut',
		'youHaveBeenKickedBy'   : 'Du har blivit utsparkad från %2$s av %1$s',
		'youHaveBeenKicked'     : 'Du har blivit utsparkad från %s',
		'banActionLabel'        : 'Bannlys',
		'youHaveBeenBannedBy'   : 'Du har blivit bannlyst från %1$s av %2$s',
		'youHaveBeenBanned'     : 'Du har blivit bannlyst från %s',

		'privateActionLabel' : 'Privat chatt',
		'ignoreActionLabel'  : 'Blockera',
		'unignoreActionLabel' : 'Avblockera',

		'setSubjectActionLabel': 'Ändra ämne',

		'administratorMessageSubject' : 'Administratör',

		'userJoinedRoom'           : '%s kom in i rummet.',
		'userLeftRoom'             : '%s har lämnat rummet.',
		'userHasBeenKickedFromRoom': '%s har blivit utsparkad ur rummet.',
		'userHasBeenBannedFromRoom': '%s har blivit bannlyst från rummet.',

		'presenceUnknownWarningSubject': 'Notera:',
		'presenceUnknownWarning'       : 'Denna användare kan vara offline. Vi kan inte följa dennes närvaro.',

		'dateFormat': 'yyyy-mm-dd',
		'timeFormat': 'HH:MM:ss',

		'tooltipRole'           : 'Moderator',
		'tooltipIgnored'        : 'Du blockerar denna användare',
		'tooltipEmoticons'      : 'Smilies',
		'tooltipSound'          : 'Spela upp ett ljud vid nytt privat meddelande',
		'tooltipAutoscroll'     : 'Autoskrolla',
		'tooltipStatusmessage'  : 'Visa statusmeddelanden',
		'tooltipAdministration' : 'Rumadministrering',
		'tooltipUsercount'      : 'Antal användare i rummet',

		'enterRoomPassword' : 'Rummet "%s" är lösenordsskyddat.',
		'enterRoomPasswordSubmit' : 'Anslut till rum',
		'passwordEnteredInvalid' : 'Ogiltigt lösenord för rummet "%s".',

		'nicknameConflict': 'Upptaget användarnamn. Var god välj ett annat.',

		'errorMembersOnly': 'Du kan inte ansluta till rummet "%s": Otillräckliga rättigheter.',
		'errorMaxOccupantsReached': 'Du kan inte ansluta till rummet "%s": Rummet är fullt.',

		'antiSpamMessage' : 'Var god avstå från att spamma. Du har blivit blockerad för en kort stund.'
	},
	'it' : {
		'status': 'Stato: %s',
		'statusConnecting': 'Connessione...',
		'statusConnected' : 'Connessione',
		'statusDisconnecting': 'Disconnessione...',
		'statusDisconnected' : 'Disconnesso',
		'statusAuthfail': 'Autenticazione fallita',

		'roomSubject'  : 'Oggetto:',
		'messageSubmit': 'Invia',

		'labelUsername': 'Nome utente:',
		'labelPassword': 'Password:',
		'loginSubmit'  : 'Login',
		'loginInvalid'  : 'JID non valido',

		'reason'                : 'Ragione:',
		'subject'               : 'Oggetto:',
		'reasonWas'             : 'Ragione precedente: %s.',
		'kickActionLabel'       : 'Espelli',
		'youHaveBeenKickedBy'   : 'Sei stato espulso da %2$s da %1$s',
		'youHaveBeenKicked'     : 'Sei stato espulso da %s',
		'banActionLabel'        : 'Escluso',
		'youHaveBeenBannedBy'   : 'Sei stato escluso da %1$s da %2$s',
		'youHaveBeenBanned'     : 'Sei stato escluso da %s',

		'privateActionLabel' : 'Stanza privata',
		'ignoreActionLabel'  : 'Ignora',
		'unignoreActionLabel' : 'Non ignorare',

		'setSubjectActionLabel': 'Cambia oggetto',

		'administratorMessageSubject' : 'Amministratore',

		'userJoinedRoom'           : '%s si è unito alla stanza.',
		'userLeftRoom'             : '%s ha lasciato la stanza.',
		'userHasBeenKickedFromRoom': '%s è stato espulso dalla stanza.',
		'userHasBeenBannedFromRoom': '%s è stato escluso dalla stanza.',

		'presenceUnknownWarningSubject': 'Nota:',
		'presenceUnknownWarning'       : 'Questo utente potrebbe essere offline. Non possiamo tracciare la sua presenza.',

		'dateFormat': 'dd/mm/yyyy',
		'timeFormat': 'HH:MM:ss',

		'tooltipRole'           : 'Moderatore',
		'tooltipIgnored'        : 'Stai ignorando questo utente',
		'tooltipEmoticons'      : 'Emoticons',
		'tooltipSound'          : 'Riproduci un suono quando arrivano messaggi privati',
		'tooltipAutoscroll'     : 'Autoscroll',
		'tooltipStatusmessage'  : 'Mostra messaggi di stato',
		'tooltipAdministration' : 'Amministrazione stanza',
		'tooltipUsercount'      : 'Partecipanti alla stanza',

		'enterRoomPassword' : 'La stanza "%s" è protetta da password.',
		'enterRoomPasswordSubmit' : 'Unisciti alla stanza',
		'passwordEnteredInvalid' : 'Password non valida per la stanza "%s".',

		'nicknameConflict': 'Nome utente già in uso. Scegline un altro.',

		'errorMembersOnly': 'Non puoi unirti alla stanza "%s": Permessi insufficienti.',
		'errorMaxOccupantsReached': 'Non puoi unirti alla stanza "%s": Troppi partecipanti.',

		'antiSpamMessage' : 'Per favore non scrivere messaggi pubblicitari. Sei stato bloccato per un po\' di tempo.'
	},
	'pt': {
		'status': 'Status: %s',
		'statusConnecting': 'Conectando...',
		'statusConnected' : 'Conectado',
		'statusDisconnecting': 'Desligando...',
		'statusDisconnected' : 'Desligado',
		'statusAuthfail': 'Falha na autenticação',

		'roomSubject'  : 'Assunto:',
		'messageSubmit': 'Enviar',

		'labelUsername': 'Usuário:',
		'labelPassword': 'Senha:',
		'loginSubmit'  : 'Entrar',
		'loginInvalid'  : 'JID inválido',

		'reason'				: 'Motivo:',
		'subject'				: 'Assunto:',
		'reasonWas'				: 'O motivo foi: %s.',
		'kickActionLabel'		: 'Excluir',
		'youHaveBeenKickedBy'   : 'Você foi excluido de %1$s por %2$s',
		'youHaveBeenKicked'     : 'Você foi excluido de %s',
		'banActionLabel'		: 'Bloquear',
		'youHaveBeenBannedBy'   : 'Você foi excluido permanentemente de %1$s por %2$s',
		'youHaveBeenBanned'     : 'Você foi excluido permanentemente de %s',

		'privateActionLabel' : 'Bate-papo privado',
		'ignoreActionLabel'  : 'Ignorar',
		'unignoreActionLabel' : 'Não ignorar',

		'setSubjectActionLabel': 'Trocar Assunto',

		'administratorMessageSubject' : 'Administrador',

		'userJoinedRoom'           : '%s entrou na sala.',
		'userLeftRoom'             : '%s saiu da sala.',
		'userHasBeenKickedFromRoom': '%s foi excluido da sala.',
		'userHasBeenBannedFromRoom': '%s foi excluido permanentemente da sala.',

		'presenceUnknownWarning'       : 'Este usuário pode estar desconectado. Não é possível determinar o status.',

		'dateFormat': 'dd.mm.yyyy',
		'timeFormat': 'HH:MM:ss',

		'tooltipRole'			: 'Moderador',
		'tooltipIgnored'		: 'Você ignora este usuário',
		'tooltipEmoticons'		: 'Emoticons',
		'tooltipSound'			: 'Reproduzir o som para novas mensagens privados',
		'tooltipAutoscroll'		: 'Deslocamento automático',
		'tooltipStatusmessage'	: 'Mostrar mensagens de status',
		'tooltipAdministration'	: 'Administração da sala',
		'tooltipUsercount'		: 'Usuários na sala',

		'enterRoomPassword' : 'A sala "%s" é protegida por senha.',
		'enterRoomPasswordSubmit' : 'Junte-se à sala',
		'passwordEnteredInvalid' : 'Senha incorreta para a sala "%s".',

		'nicknameConflict': 'O nome de usuário já está em uso. Por favor, escolha outro.',

		'errorMembersOnly': 'Você não pode participar da sala "%s":  privilégios insuficientes.',
		'errorMaxOccupantsReached': 'Você não pode participar da sala "%s": muitos participantes.',

		'antiSpamMessage' : 'Por favor, não envie spam. Você foi bloqueado temporariamente.'
	},
	'pt_br' : {
		'status': 'Estado: %s',
		'statusConnecting': 'Conectando...',
		'statusConnected' : 'Conectado',
		'statusDisconnecting': 'Desconectando...',
		'statusDisconnected' : 'Desconectado',
		'statusAuthfail': 'Autenticação falhou',

		'roomSubject' : 'Assunto:',
		'messageSubmit': 'Enviar',

		'labelUsername': 'Usuário:',
		'labelPassword': 'Senha:',
		'loginSubmit' : 'Entrar',
		'loginInvalid' : 'JID inválido',

		'reason'                                : 'Motivo:',
		'subject'                                : 'Assunto:',
		'reasonWas'                                : 'Motivo foi: %s.',
		'kickActionLabel'                : 'Derrubar',
		'youHaveBeenKickedBy' : 'Você foi derrubado de %2$s por %1$s',
		'youHaveBeenKicked' : 'Você foi derrubado de %s',
		'banActionLabel'                : 'Banir',
		'youHaveBeenBannedBy' : 'Você foi banido de %1$s por %2$s',
		'youHaveBeenBanned' : 'Você foi banido de %s',

		'privateActionLabel' : 'Conversa privada',
		'ignoreActionLabel' : 'Ignorar',
		'unignoreActionLabel' : 'Não ignorar',

		'setSubjectActionLabel': 'Mudar Assunto',

		'administratorMessageSubject' : 'Administrador',

		'userJoinedRoom' : '%s entrou na sala.',
		'userLeftRoom' : '%s saiu da sala.',
		'userHasBeenKickedFromRoom': '%s foi derrubado da sala.',
		'userHasBeenBannedFromRoom': '%s foi banido da sala.',

		'presenceUnknownWarningSubject': 'Aviso:',
		'presenceUnknownWarning' : 'Este usuário pode estar desconectado.. Não conseguimos rastrear sua presença..',

		'dateFormat': 'dd.mm.yyyy',
		'timeFormat': 'HH:MM:ss',

		'tooltipRole'                        : 'Moderador',
		'tooltipIgnored'                : 'Você ignora este usuário',
		'tooltipEmoticons'                : 'Emoticons',
		'tooltipSound'                        : 'Tocar som para novas mensagens privadas',
		'tooltipAutoscroll'                : 'Auto-rolagem',
		'tooltipStatusmessage'        : 'Exibir mensagens de estados',
		'tooltipAdministration'        : 'Administração de Sala',
		'tooltipUsercount'                : 'Participantes da Sala',

		'enterRoomPassword' : 'Sala "%s" é protegida por senha.',
		'enterRoomPasswordSubmit' : 'Entrar na sala',
		'passwordEnteredInvalid' : 'Senha inváida para sala "%s".',

		'nicknameConflict': 'Nome de usuário já em uso. Por favor escolha outro.',

		'errorMembersOnly': 'Você não pode entrar na sala "%s": privilégios insuficientes.',
		'errorMaxOccupantsReached': 'Você não pode entrar na sala "%s": máximo de participantes atingido.',

		'antiSpamMessage' : 'Por favor, não faça spam. Você foi bloqueado temporariamente.'
	},
	'ru' : {
		'status': 'Статус: %s',
		'statusConnecting': 'Подключение...',
		'statusConnected' : 'Подключено',
		'statusDisconnecting': 'Отключение...',
		'statusDisconnected' : 'Отключено',
		'statusAuthfail': 'Неверный логин',

		'roomSubject'  : 'Топик:',
		'messageSubmit': 'Послать',

		'labelUsername': 'Имя:',
		'labelPassword': 'Пароль:',
		'loginSubmit'  : 'Логин',
		'loginInvalid'  : 'Неверный JID',

		'reason'				: 'Причина:',
		'subject'				: 'Топик:',
		'reasonWas'				: 'Причина была: %s.',
		'kickActionLabel'		: 'Выбросить',
		'youHaveBeenKickedBy'   : 'Пользователь %1$s выбросил вас из чата %2$s',
		'youHaveBeenKicked'     : 'Вас выбросили из чата %s',
		'banActionLabel'		: 'Запретить доступ',
		'youHaveBeenBannedBy'   : 'Пользователь %1$s запретил вам доступ в чат %2$s',
		'youHaveBeenBanned'     : 'Вам запретили доступ в чат %s',

		'privateActionLabel' : 'Один-на-один чат',
		'ignoreActionLabel'  : 'Игнорировать',
		'unignoreActionLabel' : 'Отменить игнорирование',

		'setSubjectActionLabel': 'Изменить топик',

		'administratorMessageSubject' : 'Администратор',

		'userJoinedRoom'           : '%s вошёл в чат.',
		'userLeftRoom'             : '%s вышел из чата.',
		'userHasBeenKickedFromRoom': '%s выброшен из чата.',
		'userHasBeenBannedFromRoom': '%s запрещён доступ в чат.',

		'presenceUnknownWarningSubject': 'Уведомление:',
		'presenceUnknownWarning'       : 'Этот пользователь вероятнее всего оффлайн.',

		'dateFormat': 'mm.dd.yyyy',
		'timeFormat': 'HH:MM:ss',

		'tooltipRole'			: 'Модератор',
		'tooltipIgnored'		: 'Вы игнорируете этого пользователя.',
		'tooltipEmoticons'		: 'Смайлики',
		'tooltipSound'			: 'Озвучивать новое частное сообщение',
		'tooltipAutoscroll'		: 'Авто-прокручивание',
		'tooltipStatusmessage'	: 'Показывать статус сообщения',
		'tooltipAdministration'	: 'Администрирование чат комнаты',
		'tooltipUsercount'		: 'Участники чата',

		'enterRoomPassword' : 'Чат комната "%s" защищена паролем.',
		'enterRoomPasswordSubmit' : 'Войти в чат',
		'passwordEnteredInvalid' : 'Неверный пароль для комнаты "%s".',

		'nicknameConflict': 'Это имя уже используется. Пожалуйста выберите другое имя.',

		'errorMembersOnly': 'Вы не можете войти в чат "%s": Недостаточно прав доступа.',
		'errorMaxOccupantsReached': 'Вы не можете войти в чат "%s": Слишком много участников.',

		'antiSpamMessage' : 'Пожалуйста не рассылайте спам. Вас заблокировали на короткое время.'
	},
	'ca': {
		'status': 'Estat: %s',
		'statusConnecting': 'Connectant...',
		'statusConnected' : 'Connectat',
		'statusDisconnecting': 'Desconnectant...',
		'statusDisconnected' : 'Desconnectat',
		'statusAuthfail': 'Ha fallat la autenticació',

		'roomSubject'  : 'Assumpte:',
		'messageSubmit': 'Enviar',

		'labelUsername': 'Usuari:',
		'labelPassword': 'Clau:',
		'loginSubmit'  : 'Entrar',
		'loginInvalid'  : 'JID no vàlid',

		'reason'                : 'Raó:',
		'subject'               : 'Assumpte:',
		'reasonWas'             : 'La raó ha estat: %s.',
		'kickActionLabel'       : 'Expulsar',
		'youHaveBeenKickedBy'   : 'Has estat expulsat de %1$s per %2$s',
		'youHaveBeenKicked'     : 'Has estat expulsat de %s',
		'banActionLabel'        : 'Prohibir',
		'youHaveBeenBannedBy'   : 'Has estat expulsat permanentment de %1$s per %2$s',
		'youHaveBeenBanned'     : 'Has estat expulsat permanentment de %s',

		'privateActionLabel' : 'Xat privat',
		'ignoreActionLabel'  : 'Ignorar',
		'unignoreActionLabel' : 'No ignorar',

		'setSubjectActionLabel': 'Canviar assumpte',

		'administratorMessageSubject' : 'Administrador',

		'userJoinedRoom'           : '%s ha entrat a la sala.',
		'userLeftRoom'             : '%s ha deixat la sala.',
		'userHasBeenKickedFromRoom': '%s ha estat expulsat de la sala.',
		'userHasBeenBannedFromRoom': '%s ha estat expulsat permanentment de la sala.',

		'presenceUnknownWarningSubject': 'Atenció:',
		'presenceUnknownWarning'       : 'Aquest usuari podria estar desconnectat ...',

		'dateFormat': 'dd.mm.yyyy',
		'timeFormat': 'HH:MM:ss',

		'tooltipRole'           : 'Moderador',
		'tooltipIgnored'        : 'Estàs ignorant aquest usuari',
		'tooltipEmoticons'      : 'Emoticones',
		'tooltipSound'          : 'Reproduir un so per a nous missatges',
		'tooltipAutoscroll'     : 'Desplaçament automàtic',
		'tooltipStatusmessage'  : 'Mostrar missatges d\'estat',
		'tooltipAdministration' : 'Administració de la sala',
		'tooltipUsercount'      : 'Usuaris dins la sala',

		'enterRoomPassword' : 'La sala "%s" està protegida amb contrasenya.',
		'enterRoomPasswordSubmit' : 'Entrar a la sala',
		'passwordEnteredInvalid' : 'Contrasenya incorrecta per a la sala "%s".',

		'nicknameConflict': 'El nom d\'usuari ja s\'està utilitzant. Si us plau, escolleix-ne un altre.',

		'errorMembersOnly': 'No pots unir-te a la sala "%s": no tens prous privilegis.',
		'errorMaxOccupantsReached': 'No pots unir-te a la sala "%s": hi ha masses participants.',

		'antiSpamMessage' : 'Si us plau, no facis spam. Has estat bloquejat temporalment.'
	}
};
