# Emphasis

Basic message formatting, with xhtml conversion, compatible with XEP-0071. Standard messages are converted to Textile-style formatting.

Textile, BBCode, and Html Variants are supported:

**bold**
```
*bold*
[b]bold[/b]
<b>bold</b>
<strong>bold</strong>
```

_italic_
```
_italic_
[i]italic[/i]
<i>italic</i>
<em>italic</em>
```

<ins>underlined</ins>
```
+underlined+
[u]underlined[/u]
<u>underlined</u>
<ins>underlined</ins>
```

~~strikethrough~~
```
-strikethrough-
[s]strikethrough[/s]
<s>strinkethough</s>
<del>strikethrough</del>
```

Textile can be escaped like so:

```
==-strikethrough-==
```

This plugin is compatible with colors-xhtml.



## Usage
Include the JavaScript file:

```HTML
<script type="text/javascript" src="candyshop/emphasis/candy.js"></script>
```

Call its `init()` method after Candy has been initialized:

```javascript
Candy.init('/http-bind/', {});

// enable basic textile/BBCode/Html handling
CandyShop.Emphasis.init();

Candy.Core.connect();
```

Optionally, different formats can be disabled.


```javascript
CandyShop.Emphasis.init({ textile: false, bbcode: true, html: true });
```

Or just

```javascript
CandyShop.Emphasis.init({ textile: false });
```
