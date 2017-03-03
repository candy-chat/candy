# Auto-Join Invites

A plugin for Candy Chat to automatically join any and all incoming MUC room invites.

## Integrations/Dependencies
Integrates with the Bookmark plugin.


## Usage
Include the JavaScript file:
```HTML
<script type="text/javascript" src="candyshop/autojoininvites/autojoininvites.js"></script>
```

To enable this plugin, add its `init` method after you `init` Candy:
```JavaScript
CandyShop.AutoJoinInvites.init();
Candy.connect();
```
