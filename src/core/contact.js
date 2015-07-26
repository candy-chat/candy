/** File: contact.js
 * Candy - Chats are not dead yet.
 *
 * Authors:
 *   - Patrick Stadler <patrick.stadler@gmail.com>
 *   - Michael Weibel <michael.weibel@gmail.com>
 *
 * Copyright:
 *   (c) 2011 Amiado Group AG. All rights reserved.
 *   (c) 2012-2014 Patrick Stadler & Michael Weibel. All rights reserved.
 *   (c) 2015 Adhearsion Foundation Inc <info@adhearsion.com>. All rights reserved.
 */
'use strict';

/* global Candy, Strophe, $ */

/** Class: Candy.Core.Contact
 * Roster contact
 */
Candy.Core.Contact = function(stropheRosterItem) {
  /** Object: data
   * Strophe Roster plugin item model containing:
   * - jid
   * - name
   * - subscription
   * - groups
   */
  this.data = stropheRosterItem;
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
Candy.Core.Contact.prototype.getJid = function() {
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
Candy.Core.Contact.prototype.getEscapedJid = function() {
  return Candy.Util.escapeJid(this.data.jid);
};

/** Function: getName
 * Gets user name
 *
 * Returns:
 *   (String) - name
 */
Candy.Core.Contact.prototype.getName = function() {
  if (!this.data.name) {
    return this.getJid();
  }
  return Strophe.unescapeNode(this.data.name);
};

/** Function: getNick
 * Gets user name
 *
 * Returns:
 *   (String) - name
 */
Candy.Core.Contact.prototype.getNick = Candy.Core.Contact.prototype.getName;

/** Function: getSubscription
 * Gets user subscription
 *
 * Returns:
 *   (String) - subscription
 */
Candy.Core.Contact.prototype.getSubscription = function() {
  if (!this.data.subscription) {
    return 'none';
  }
  return this.data.subscription;
};

/** Function: getGroups
 * Gets user groups
 *
 * Returns:
 *   (Array) - groups
 */
Candy.Core.Contact.prototype.getGroups = function() {
  return this.data.groups;
};

/** Function: getStatus
 * Gets user status as an aggregate of all resources
 *
 * Returns:
 *   (String) - aggregate status, one of chat|dnd|available|away|xa|unavailable
 */
Candy.Core.Contact.prototype.getStatus = function() {
  var status = 'unavailable',
    self = this,
    highestResourcePriority;

  $.each(this.data.resources, function(resource, obj) {
    var resourcePriority;
    if (obj.priority === undefined || obj.priority === '') {
      resourcePriority = 0;
    } else {
      resourcePriority = parseInt(obj.priority, 10);
    }

    if (obj.show === '' || obj.show === null || obj.show === undefined) {
      // TODO: Submit this as a bugfix to strophejs-plugins' roster plugin
      obj.show = 'available';
    }

    if (highestResourcePriority === undefined || highestResourcePriority < resourcePriority) {
      // This resource is higher priority than the ones we've checked so far, override with this one
      status = obj.show;
      highestResourcePriority = resourcePriority;
    } else if (highestResourcePriority === resourcePriority) {
      // Two resources with the same priority means we have to weight their status
      if (self._weightForStatus(status) > self._weightForStatus(obj.show)) {
        status = obj.show;
      }
    }
  });

  return status;
};

Candy.Core.Contact.prototype._weightForStatus = function(status) {
  switch (status) {
    case 'chat':
    case 'dnd':
      return 1;
    case 'available':
    case '':
      return 2;
    case 'away':
      return 3;
    case 'xa':
      return 4;
    case 'unavailable':
      return 5;
  }
};
