# Reply Highlighting

To better support conversations in high-activity rooms, this plugin highlights any message that contains "@yourusername" by default.

## Usage

```HTML
<script type="text/javascript" src="candyshop/replies/candy.js"></script>
<link rel="stylesheet" type="text/css" href="candyshop/replies/candy.css" />
```

```JavaScript
CandyShop.Replies.init();
```


```Options
boolean - default true - require @ if true
prefix - strip a prefix while searching
suffix - strip a suffix while searching
```

Prefix & suffix assume generated user names for an anonymous user. For example, say your generated nick is _user533_ , and they change their nickname to _jimbob_. With the options:

```JavaScript
CandyShop.Replies.init(false,'user','');
```

This would highlight lines with _user533_, _533_, and _jimbob_ in them.
