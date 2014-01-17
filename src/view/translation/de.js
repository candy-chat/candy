/** File: de.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@gmail.com>
 *   - Michael Weibel <michael.weibel@gmail.com>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 *   (c) 2012-2014 Patrick Stadler & Michael Weibel. All rights reserved.
 */
'use strict';

/* global Candy */

/** Variable: Candy.View.Translation.en
 * German translation
 */
Candy.View.Translation.de = {
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
	'userChangedNick': '%1$s hat den Nicknamen zu %2$s geändert.',

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
};