/** File: translation.js
 * Candy - Chats are not dead yet.
 *
 * Legal: See the LICENSE file at the top-level directory of this distribution and at https://github.com/candy-chat/candy/blob/master/LICENSE
 */
'use strict';

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
		'userChangedNick': '%1$s is now known as %2$s.',

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
		'userChangedNick': '%1$s hat den Nicknamen zu %2$s geändert.',

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
		'status': 'Status&thinsp;: %s',
		'statusConnecting': 'Connexion…',
		'statusConnected' : 'Connecté',
		'statusDisconnecting': 'Déconnexion…',
		'statusDisconnected' : 'Déconnecté',
		'statusAuthfail': 'L’identification a échoué',

		'roomSubject'  : 'Sujet&thinsp;:',
		'messageSubmit': 'Envoyer',

		'labelUsername': 'Nom d’utilisateur&thinsp;:',
		'labelNickname': 'Pseudo&thinsp;:',
		'labelPassword': 'Mot de passe&thinsp;:',
		'loginSubmit'  : 'Connexion',
		'loginInvalid' : 'JID invalide',

		'reason'				: 'Motif&thinsp;:',
		'subject'				: 'Titre&thinsp;:',
		'reasonWas'				: 'Motif&thinsp;: %s.',
		'kickActionLabel'		: 'Kick',
		'youHaveBeenKickedBy'   : 'Vous avez été expulsé du salon %1$s (%2$s)',
		'youHaveBeenKicked'     : 'Vous avez été expulsé du salon %s',
		'banActionLabel'		: 'Ban',
		'youHaveBeenBannedBy'   : 'Vous avez été banni du salon %1$s (%2$s)',
		'youHaveBeenBanned'     : 'Vous avez été banni du salon %s',

		'privateActionLabel' : 'Chat privé',
		'ignoreActionLabel'  : 'Ignorer',
		'unignoreActionLabel': 'Ne plus ignorer',

		'setSubjectActionLabel': 'Changer le sujet',

		'administratorMessageSubject' : 'Administrateur',

		'userJoinedRoom'           : '%s vient d’entrer dans le salon.',
		'userLeftRoom'             : '%s vient de quitter le salon.',
		'userHasBeenKickedFromRoom': '%s a été expulsé du salon.',
		'userHasBeenBannedFromRoom': '%s a été banni du salon.',

		'dateFormat': 'dd/mm/yyyy',
		'timeFormat': 'HH:MM:ss',

		'tooltipRole'			: 'Modérateur',
		'tooltipIgnored'		: 'Vous ignorez cette personne',
		'tooltipEmoticons'		: 'Smileys',
		'tooltipSound'			: 'Jouer un son lors de la réception de messages privés',
		'tooltipAutoscroll'		: 'Défilement automatique',
		'tooltipStatusmessage'	: 'Afficher les changements d’état',
		'tooltipAdministration'	: 'Administration du salon',
		'tooltipUsercount'		: 'Nombre d’utilisateurs dans le salon',

		'enterRoomPassword'			: 'Le salon %s est protégé par un mot de passe.',
		'enterRoomPasswordSubmit'	: 'Entrer dans le salon',
		'passwordEnteredInvalid'	: 'Le mot de passe pour le salon %s est invalide.',

		'nicknameConflict': 'Ce nom d’utilisateur est déjà utilisé. Veuillez en choisir un autre.',

		'errorMembersOnly': 'Vous ne pouvez pas entrer dans le salon %s&thinsp;: droits insuffisants.',
		'errorMaxOccupantsReached': 'Vous ne pouvez pas entrer dans le salon %s&thinsp;: limite d’utilisateurs atteinte.',

		'antiSpamMessage' : 'Merci de ne pas spammer. Vous avez été bloqué pendant une courte période.'
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
	'fi' : {
		'status': 'Status: %s',
		'statusConnecting': 'Muodostetaan yhteyttä...',
		'statusConnected' : 'Yhdistetty',
		'statusDisconnecting': 'Katkaistaan yhteyttä...',
		'statusDisconnected' : 'Yhteys katkaistu',
		'statusAuthfail': 'Autentikointi epäonnistui',

		'roomSubject'  : 'Otsikko:',
		'messageSubmit': 'Lähetä',

		'labelUsername': 'Käyttäjätunnus:',
		'labelNickname': 'Nimimerkki:',
		'labelPassword': 'Salasana:',
		'loginSubmit'  : 'Kirjaudu sisään',
		'loginInvalid'  : 'Virheellinen JID',

		'reason'				: 'Syy:',
		'subject'				: 'Otsikko:',
		'reasonWas'				: 'Syy oli: %s.',
		'kickActionLabel'		: 'Potkaise',
		'youHaveBeenKickedBy'   : 'Nimimerkki %1$s potkaisi sinut pois huoneesta %2$s',
		'youHaveBeenKicked'     : 'Sinut potkaistiin pois huoneesta %s',
		'banActionLabel'		: 'Porttikielto',
		'youHaveBeenBannedBy'   : 'Nimimerkki %2$s antoi sinulle porttikiellon huoneeseen %1$s',
		'youHaveBeenBanned'     : 'Sinulle on annettu porttikielto huoneeseen %s',

		'privateActionLabel' : 'Yksityinen keskustelu',
		'ignoreActionLabel'  : 'Hiljennä',
		'unignoreActionLabel' : 'Peruuta hiljennys',

		'setSubjectActionLabel': 'Vaihda otsikkoa',

		'administratorMessageSubject' : 'Ylläpitäjä',

		'userJoinedRoom'           : '%s tuli huoneeseen.',
		'userLeftRoom'             : '%s lähti huoneesta.',
		'userHasBeenKickedFromRoom': '%s potkaistiin pois huoneesta.',
		'userHasBeenBannedFromRoom': '%s sai porttikiellon huoneeseen.',
		'userChangedNick': '%1$s vaihtoi nimimerkikseen %2$s.',

		'dateFormat': 'dd.mm.yyyy',
		'timeFormat': 'HH:MM:ss',

		'tooltipRole'			: 'Ylläpitäjä',
		'tooltipIgnored'		: 'Olet hiljentänyt tämän käyttäjän',
		'tooltipEmoticons'		: 'Hymiöt',
		'tooltipSound'			: 'Soita äänimerkki uusista yksityisviesteistä',
		'tooltipAutoscroll'		: 'Automaattinen vieritys',
		'tooltipStatusmessage'	: 'Näytä statusviestit',
		'tooltipAdministration'	: 'Huoneen ylläpito',
		'tooltipUsercount'		: 'Huoneen jäsenet',

		'enterRoomPassword' : 'Huone "%s" on suojattu salasanalla.',
		'enterRoomPasswordSubmit' : 'Liity huoneeseen',
		'passwordEnteredInvalid' : 'Virheelinen salasana huoneeseen "%s".',

		'nicknameConflict': 'Käyttäjätunnus oli jo käytössä. Valitse jokin toinen käyttäjätunnus.',

		'errorMembersOnly': 'Et voi liittyä huoneeseen "%s": ei oikeuksia.',
		'errorMaxOccupantsReached': 'Et voi liittyä huoneeseen "%s": liian paljon jäseniä.',
		'errorAutojoinMissing': 'Parametria "autojoin" ei ole määritelty asetuksissa. Tee määrittely jatkaaksesi.',

		'antiSpamMessage' : 'Ethän spämmää. Sinut on nyt väliaikaisesti pistetty jäähylle.'
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
	'pl' : {
		'status': 'Status: %s',
		'statusConnecting': 'Łączę...',
		'statusConnected' : 'Połączone',
		'statusDisconnecting': 'Rozłączam...',
		'statusDisconnected' : 'Rozłączone',
		'statusAuthfail': 'Nieprawidłowa autoryzacja',

		'roomSubject'  : 'Temat:',
		'messageSubmit': 'Wyślij',

		'labelUsername': 'Nazwa użytkownika:',
		'labelNickname': 'Ksywka:',
		'labelPassword': 'Hasło:',
		'loginSubmit'  : 'Zaloguj',
		'loginInvalid'  : 'Nieprawidłowy JID',

		'reason'				: 'Przyczyna:',
		'subject'				: 'Temat:',
		'reasonWas'				: 'Z powodu: %s.',
		'kickActionLabel'		: 'Wykop',
		'youHaveBeenKickedBy'   : 'Zostałeś wykopany z %2$s przez %1$s',
		'youHaveBeenKicked'     : 'Zostałeś wykopany z %s',
		'banActionLabel'		: 'Ban',
		'youHaveBeenBannedBy'   : 'Zostałeś zbanowany na %1$s przez %2$s',
		'youHaveBeenBanned'     : 'Zostałeś zbanowany na %s',

		'privateActionLabel' : 'Rozmowa prywatna',
		'ignoreActionLabel'  : 'Zignoruj',
		'unignoreActionLabel' : 'Przestań ignorować',

		'setSubjectActionLabel': 'Zmień temat',

		'administratorMessageSubject' : 'Administrator',

		'userJoinedRoom'           : '%s wszedł do pokoju.',
		'userLeftRoom'             : '%s opuścił pokój.',
		'userHasBeenKickedFromRoom': '%s został wykopany z pokoju.',
		'userHasBeenBannedFromRoom': '%s został zbanowany w pokoju.',
		'userChangedNick': '%1$s zmienił ksywkę na %2$s.',

		'presenceUnknownWarningSubject': 'Uwaga:',
		'presenceUnknownWarning'       : 'Rozmówca może nie być połączony. Nie możemy ustalić jego obecności.',

		'dateFormat': 'dd.mm.yyyy',
		'timeFormat': 'HH:MM:ss',

		'tooltipRole'			: 'Moderator',
		'tooltipIgnored'		: 'Ignorujesz tego rozmówcę',
		'tooltipEmoticons'		: 'Emoty',
		'tooltipSound'			: 'Sygnał dźwiękowy przy otrzymaniu wiadomości',
		'tooltipAutoscroll'		: 'Autoprzewijanie',
		'tooltipStatusmessage'		: 'Wyświetl statusy',
		'tooltipAdministration'		: 'Administrator pokoju',
		'tooltipUsercount'		: 'Obecni rozmówcy',

		'enterRoomPassword' : 'Pokój "%s" wymaga hasła.',
		'enterRoomPasswordSubmit' : 'Wejdź do pokoju',
		'passwordEnteredInvalid' : 'Niewłaściwie hasło do pokoju "%s".',

		'nicknameConflict': 'Nazwa w użyciu. Wybierz inną.',

		'errorMembersOnly': 'Nie możesz wejść do pokoju "%s": Niepełne uprawnienia.',
		'errorMaxOccupantsReached': 'Nie możesz wejść do pokoju "%s": Siedzi w nim zbyt wielu ludzi.',
		'errorAutojoinMissing': 'Konfiguracja nie zawiera parametru automatycznego wejścia do pokoju. Wskaż pokój do którego chcesz wejść.',

		'antiSpamMessage' : 'Please do not spam. You have been blocked for a short-time.'
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
		'labelNickname': 'Ник:',
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
		'userChangedNick': '%1$s сменил имя на %2$s.',

		'presenceUnknownWarningSubject': 'Уведомление:',
		'presenceUnknownWarning'       : 'Этот пользователь вероятнее всего оффлайн.',

		'dateFormat': 'dd.mm.yyyy',
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
		'errorAutojoinMissing': 'Параметры автовхода не устновлены. Настройте их для продолжения.',

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
	},
    'cs' : {
        'status': 'Stav: %s',
        'statusConnecting': 'Připojování...',
        'statusConnected': 'Připojeno',
        'statusDisconnecting': 'Odpojování...',
        'statusDisconnected': 'Odpojeno',
        'statusAuthfail': 'Přihlášení selhalo',

        'roomSubject': 'Předmět:',
        'messageSubmit': 'Odeslat',

        'labelUsername': 'Už. jméno:',
        'labelNickname': 'Přezdívka:',
        'labelPassword': 'Heslo:',
        'loginSubmit': 'Přihlásit se',
        'loginInvalid': 'Neplatné JID',

        'reason': 'Důvod:',
        'subject': 'Předmět:',
        'reasonWas': 'Důvod byl: %s.',
        'kickActionLabel': 'Vykopnout',
        'youHaveBeenKickedBy': 'Byl jsi vyloučen z %2$s uživatelem %1$s',
        'youHaveBeenKicked': 'Byl jsi vyloučen z %s',
        'banActionLabel': 'Ban',
        'youHaveBeenBannedBy': 'Byl jsi trvale vyloučen z %1$s uživatelem %2$s',
        'youHaveBeenBanned': 'Byl jsi trvale vyloučen z %s',

        'privateActionLabel': 'Soukromý chat',
        'ignoreActionLabel': 'Ignorovat',
        'unignoreActionLabel': 'Neignorovat',

        'setSubjectActionLabel': 'Změnit předmět',

        'administratorMessageSubject': 'Adminitrátor',

        'userJoinedRoom': '%s vešel do místnosti.',
        'userLeftRoom': '%s opustil místnost.',
        'userHasBeenKickedFromRoom': '%s byl vyloučen z místnosti.',
        'userHasBeenBannedFromRoom': '%s byl trvale vyloučen z místnosti.',
        'userChangedNick': '%1$s si změnil přezdívku na  %2$s.',

        'presenceUnknownWarningSubject': 'Poznámka:',
        'presenceUnknownWarning': 'Tento uživatel může být offiline. Nemůžeme sledovat jeho přítmonost..',

        'dateFormat': 'dd.mm.yyyy',
        'timeFormat': 'HH:MM:ss',

        'tooltipRole': 'Moderátor',
        'tooltipIgnored': 'Tento uživatel je ignorován',
        'tooltipEmoticons': 'Emotikony',
        'tooltipSound': 'Přehrát zvuk při nové soukromé zprávě',
        'tooltipAutoscroll': 'Automaticky rolovat',
        'tooltipStatusmessage': 'Zobrazovat stavové zprávy',
        'tooltipAdministration': 'Správa místnosti',
        'tooltipUsercount': 'Uživatelé',

        'enterRoomPassword': 'Místnost "%s" je chráněna heslem.',
        'enterRoomPasswordSubmit': 'Připojit se do místnosti',
        'passwordEnteredInvalid': 'Neplatné heslo pro místnost "%s".',

        'nicknameConflict': 'Takové přihlašovací jméno je již použito. Vyberte si prosím jiné.',

        'errorMembersOnly': 'Nemůžete se připojit do místnosti "%s": Nedostatečné oprávnění.',
        'errorMaxOccupantsReached': 'Nemůžete se připojit do místnosti "%s": Příliš mnoho uživatelů.',
        'errorAutojoinMissing': 'Není nastaven parametr autojoin. Nastavte jej prosím.',

        'antiSpamMessage': 'Nespamujte prosím. Váš účet byl na chvilku zablokován.'
    },
	'he' : {
		'status': 'מצב: %s',
		'statusConnecting': 'כעת מתחבר...',
		'statusConnected' : 'מחובר',
		'statusDisconnecting': 'כעת מתנתק...',
		'statusDisconnected' : 'מנותק',
		'statusAuthfail': 'אימות נכשל',

		'roomSubject'  : 'נושא:',
		'messageSubmit': 'שלח',

		'labelUsername': 'שם משתמש:',
		'labelNickname': 'שם כינוי:',
		'labelPassword': 'סיסמה:',
		'loginSubmit'  : 'כניסה',
		'loginInvalid'  : 'JID לא תקני',

		'reason'				: 'סיבה:',
		'subject'				: 'נושא:',
		'reasonWas'				: 'סיבה היתה: %s.',
		'kickActionLabel'		: 'בעט',
		'youHaveBeenKickedBy'   : 'נבעטת מתוך %2$s על ידי %1$s',
		'youHaveBeenKicked'     : 'נבעטת מתוך %s',
		'banActionLabel'		: 'אסור',
		'youHaveBeenBannedBy'   : 'נאסרת מתוך %1$s על ידי %2$s',
		'youHaveBeenBanned'     : 'נאסרת מתוך %s',

		'privateActionLabel' : 'שיחה פרטית',
		'ignoreActionLabel'  : 'התעלם',
		'unignoreActionLabel' : 'בטל התעלמות',

		'setSubjectActionLabel': 'שנה נושא',

		'administratorMessageSubject' : 'מנהל',

		'userJoinedRoom'           : '%s נכנס(ה) לחדר.',
		'userLeftRoom'             : '%s עזב(ה) את החדר.',
		'userHasBeenKickedFromRoom': '%s נבעט(ה) מתוך החדר.',
		'userHasBeenBannedFromRoom': '%s נאסר(ה) מתוך החדר.',
		'userChangedNick': '%1$s מוכר(ת) כעת בתור %2$s.',

		'dateFormat': 'dd.mm.yyyy',
		'timeFormat': 'HH:MM:ss',

		'tooltipRole'			: 'אחראי',
		'tooltipIgnored'		: 'אתה מתעלם ממשתמש זה',
		'tooltipEmoticons'		: 'רגשונים',
		'tooltipSound'			: 'נגן צליל עבור הודעות פרטיות חדשות',
		'tooltipAutoscroll'		: 'גלילה אוטומטית',
		'tooltipStatusmessage'	: 'הצג הודעות מצב',
		'tooltipAdministration'	: 'הנהלת חדר',
		'tooltipUsercount'		: 'משתתפי חדר',

		'enterRoomPassword' : 'חדר "%s" הינו מוגן סיסמה.',
		'enterRoomPasswordSubmit' : 'הצטרף לחדר',
		'passwordEnteredInvalid' : 'סיסמה שגויה לחדר "%s".',

		'nicknameConflict': 'שם משתמש כבר מצוי בשימוש. אנא בחר אחד אחר.',

		'errorMembersOnly': 'אין באפשרותך להצטרף לחדר "%s": הרשאות לקויות.',
		'errorMaxOccupantsReached': 'אין באפשרותך להצטרף לחדר "%s": יותר מדי משתתפים.',
		'errorAutojoinMissing': 'לא נקבע פרמטר הצטרפות אוטומטית בתצורה. אנא הזן כזה כדי להמשיך.',

		'antiSpamMessage' : 'אנא אל תשלח ספאם. נחסמת למשך זמן קצר.'
    },
	'fa' : {
		'status': 'وضعیت: %s',
		'statusConnecting': 'درحال اتصال...',
		'statusConnected' : 'متصل',
		'statusDisconnecting': 'در حال قطع اتصال...',
		'statusDisconnected' : 'متصل نیست',
		'statusAuthfail': 'اعتبار سنجی ناموفق',

		'roomSubject'  : 'موضوع:',
		'messageSubmit': 'ارسال',

		'labelUsername': 'نام کاربری:',
		'labelNickname': 'نام مستعار:',
		'labelPassword': 'گذرواژه:',
		'loginSubmit'  : 'ورود',
		'loginInvalid'  : ' نامعتبر JID',

		'reason'				: 'دلیل:',
		'subject'				: 'موضوع:',
		'reasonWas'				: 'دلیل: %s.',
		'kickActionLabel'		: 'بیرون راندن',
		'youHaveBeenKickedBy'   : 'شما اخراج شدید از %2$s توسط %1$s',
		'youHaveBeenKicked'     : 'شما اخراج شدید از %s',
		'banActionLabel'		: 'منع',
		'youHaveBeenBannedBy'   : 'شما منع شدید از %1$s by %2$s',
		'youHaveBeenBanned'     : 'شما منع شدید از %s',

		'privateActionLabel' : ' گفتگو خصوصی',
		'ignoreActionLabel'  : 'چشم پوشی',
		'unignoreActionLabel' : 'عدم چشم پوشی',

		'setSubjectActionLabel': ' تغییر موضوع',

		'administratorMessageSubject' : 'مدیر',

		'userJoinedRoom'           : '%s وارد چت شد.',
		'userLeftRoom'             : '%s از چت خارج شد.',
		'userHasBeenKickedFromRoom': '%s از چت اخراج شد.',
		'userHasBeenBannedFromRoom': '%s منع شد.',
		'userChangedNick': '%1$s حالا این هست %2$s.',

		'dateFormat': 'dd.mm.yyyy',
		'timeFormat': 'HH:MM:ss',

		'tooltipRole'			: 'ناظم',
		'tooltipIgnored'		: 'شما این کاربر را چشم پوشی کردید',
		'tooltipEmoticons'		: 'استیکر',
		'tooltipSound'			: 'منتظر یک پیام خصوصی جدید',
		'tooltipAutoscroll'		: 'قلطک اتوماتیک',
		'tooltipStatusmessage'	: 'نمایش پیام وضعیت',
		'tooltipAdministration'	: 'مدیریت چت گروهی',
		'tooltipUsercount'		: 'اعضای گروه',

		'enterRoomPassword' : 'اتاق "%s" توسط رمز محافظت میشه.',
		'enterRoomPasswordSubmit' : 'وارد شدن به چت',
		'passwordEnteredInvalid' : 'رمز نامعتبر "%s".',

		'nicknameConflict': 'نام کاربری از پیش مورد استفاده است',

		'errorMembersOnly': 'شما نمیتوانید به  "%s" وارد شوید چون اجازه ندارید',
		'errorMaxOccupantsReached': 'شما نمیتوانید وارد شوید به "%s": تعداد اعضا بیش از حد',
		'errorAutojoinMissing': 'ورود خودکار امکان پذیر نیست',

		'antiSpamMessage' : 'اسپم نکنید. فعلن غیر فعال شدین'
	}
};
