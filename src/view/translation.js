/** File: translation.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@amiadogroup.com>
 *   - Michael Weibel <michael.weibel@amiadogroup.com>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 */

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
		'labelPassword': 'Password:',
		'loginSubmit'  : 'Login',
		'loginInvalid'  : 'Invalid JID',

		'reason'				: 'Reason:',
		'subject'				: 'Subject:',
		'reasonWas'				: 'Reason was: %s.',
		'kickActionLabel'		: 'Kick',
		'youHaveBeenKickedBy'   : 'You have been kicked from %s by %s',
		'banActionLabel'		: 'Ban',
		'youHaveBeenBannedBy'   : 'You have been banned from %s by %s',

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
		'labelPassword': 'Passwort:',
		'loginSubmit'  : 'Anmelden',
		'loginInvalid'  : 'Ungültige JID',

		'reason'				: 'Begründung:',
		'subject'				: 'Titel:',
		'reasonWas'				: 'Begründung: %s.',
		'kickActionLabel'		: 'Kick',
		'youHaveBeenKickedBy'   : 'Du wurdest soeben aus dem Raum %s gekickt (%s)',
		'banActionLabel'		: 'Ban',
		'youHaveBeenBannedBy'   : 'Du wurdest soeben aus dem Raum %s verbannt (%s)',

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

		'antiSpamMessage' : 'Bitte nicht spammen. Du wurdest für eine kurze Zeit blockiert.'
	},
	'fr' : {
		'status': 'Status: %s',
		'statusConnecting': 'Connecter...',
		'statusConnected' : 'Connecté.',
		'statusDisconnecting': 'Déconnecter....',
		'statusDisconnected' : 'Déconnecté.',
		'statusAuthfail': 'Authentification a échoué',

		'roomSubject'  : 'Sujet:',
		'messageSubmit': 'Envoyer',

		'labelUsername': 'Nom d\'utilisateur:',
		'labelPassword': 'Mot de passe:',
		'loginSubmit'  : 'Inscription',
		'loginInvalid'  : 'JID invalide',

		'reason'				: 'Justification:',
		'subject'				: 'Titre:',
		'reasonWas'				: 'Justification: %s.',
		'kickActionLabel'		: 'Kick',
		'youHaveBeenKickedBy'   : 'Tu as été expulsé (%s)',
		'banActionLabel'		: 'Ban',
		'youHaveBeenBannedBy'   : 'Tu as été banni (%s)',

		'privateActionLabel' : 'Chat privé',
		'ignoreActionLabel'  : 'Ignorer',
		'unignoreActionLabel' : 'Ne plus ignorer',

		'setSubjectActionLabel': 'Changer le sujet',

		'administratorMessageSubject' : 'Administrateur',

		'userJoinedRoom'           : '%s vient d\'entrer dans le salon.',
		'userLeftRoom'             : '%s vient de quitter le salon.',
		'userHasBeenKickedFromRoom': '%s a été expulsé du salon.',
		'userHasBeenBannedFromRoom': '%s a été banni du salon.',

		'presenceUnknownWarningSubject': 'Note:',
		'presenceUnknownWarning'       : 'Cet utilisateur n\'est malheureusement plus connecté, le message ne sera pas envoyé.',

		'dateFormat': 'dd.mm.yyyy',
		'timeFormat': 'HH:MM:ss',

		'tooltipRole'			: 'Modérateur',
		'tooltipIgnored'		: 'Tu ignores cette personne',
		'tooltipEmoticons'		: 'Smileys',
		'tooltipSound'			: 'Jouer un son lorsque tu reçois de nouveaux messages privés',
		'tooltipAutoscroll'		: 'Auto-defilement',
		'tooltipStatusmessage'	: 'Messages d\'état',
		'tooltipAdministration'	: 'Administrer le salon',
		'tooltipUsercount'		: 'Nombre d\'utilisateurs dans le salon',

		'antiSpamMessage' : 'S\'il te plaît, pas de spam. Tu as été bloqué pendant une courte période..'
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
		'youHaveBeenKickedBy'   : 'Je bent verwijderd van %s door %s',
		'banActionLabel'		: 'Blokkeren',
		'youHaveBeenBannedBy'   : 'Je bent geblokkeerd van %s door %s',

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
		'youHaveBeenKickedBy'   : 'Has sido expulsado de %s por %s',
		'banActionLabel'		: 'Prohibir',
		'youHaveBeenBannedBy'   : 'Has sido expulsado permanentemente de %s por %s',

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

		'antiSpamMessage' : 'Por favor, no hagas spam. Has sido bloqueado temporalmente.'
	}
};