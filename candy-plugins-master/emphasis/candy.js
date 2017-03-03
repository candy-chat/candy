var CandyShop = (function(self) { return self; }(CandyShop || {}));

CandyShop.Emphasis = (function(self, Candy, $) {

  // textile, bbcode, old html, escaped old html, new html, escaped new html
  var _styles = {
    textile: [
      { plain: '==*bold*==', regex: /((^|\s|\>)==\*(.*?)\*==(\s|\<|$))/gm, plain: "$2*$3*$4", xhtml: "$2*$3*$4" },
      { plain: '==_italic_==', regex: /((^|\s|\>)==\_(.*?)\_==(\s|\<|$))/gm, plain: "$2_$3_$4", xhtml: "$2_$3_$4" },
      { plain: '==-strikethrough-==', regex: /((^|\s|\>)==\-(.*?)\-==(\s|\<|$))/gm, plain: "$2-$3-$4", xhtml: "$2-$3-$4" },
      { plain: '==+underline+==', regex: /((^|\s|\>)==\+(.*?)\+==(\s|\<|$))/gm, plain: "$2+$3+$4", xhtml: "$2+$3+$4" },
      { plain: '*bold*', regex: /((^|\s|\>)\*(.*?)\*(\s|\<|$))/gm, plain: "$2*$3*$4", xhtml: "$2<strong>$3</strong>$4" },
      { plain: '_italic_', regex: /((^|\s|\>)\_(.*?)\_(\s|\<|$))/gm, plain: "$2_$3_$4", xhtml: "$2<em>$3</em>$4" },
      { plain: '-strikethrough-', regex: /((^|\s|\>)\-(.*?)\-(\s|\<|$))/gm, plain: "$2-$3-$4", xhtml: "$2<span style='text-decoration: line-through;'>$3</span>$4" },
      { plain: '+underline+', regex: /((^|\s|\>)\+(.*?)\+(\s|\<|$))/gm, plain: "$2+$3+$4", xhtml: "$2<span style='text-decoration: underline;'>$3</span>$4" }
    ],
    bbcode: [
      { plain: '[b]bold[/b]', regex: /(\[b\](.*?)\[\/b\])/igm, plain: "*$2*", xhtml: "<strong>$2</strong>" },
      { plain: '[i]italic[/i]', regex: /(\[i\](.*?)\[\/i\])/igm, plain: "_$2_", xhtml: "<em>$2</em>" },
      { plain: '[s]strikethrough[/s]', regex: /(\[s\](.*?)\[\/s\])/igm, plain: "-$2-", xhtml: "<span style='text-decoration: line-through;'>$2</span>" },
      { plain: '[u]underline[/u]', regex: /(\[u\](.*?)\[\/u\])/igm, plain: "+$2+", xhtml: "<span style='text-decoration: underline;'>$2</span>" }
    ],
    html: [
      //handling both escaped an unescaped, just in case.
      { plain: '&lt;b&gt;bold&lt;/b&gt;', regex: /(\&lt;b\&gt;(.*?)\&lt;\/b\&gt;)/igm, plain: "*$2*", xhtml: "<strong>$2</strong>" },
      { plain: '&lt;strong&gt;bold&lt;/strong&gt;', regex: /(\&lt;strong\&gt;(.*?)\&lt;\/strong\&gt;)/igm, plain: "*$2*", xhtml: "<strong>$2</strong>" },
      { plain: '&lt;i&gt;italic&lt;/i&gt;', regex: /(\&lt;i\&gt;(.*?)\&lt;\/i\&gt;)/igm, plain: "_$2_", xhtml: "<em>$2</em>" },
      { plain: '&lt;em&gt;italic&lt;/em&gt;', regex: /(\&lt;em\&gt;(.*?)\&lt;\/em\&gt;)/igm, plain: "_$2_", xhtml: "<em>$2</em>" },
      { plain: '&lt;s&gt;strikethrough&lt;/s&gt;', regex: /(\&lt;s\&gt;(.*?)\&lt;\/s\&gt;)/igm, plain: "-$2-", xhtml: "<span style='text-decoration: line-through;'>$2</span>" },
      { plain: '&lt;del&gt;strikethrough&lt;/del&gt;', regex: /(\&lt;del\&gt;(.*?)\&lt;\/del\&gt;)/igm, plain: "-$2-", xhtml: "<span style='text-decoration: line-through;'>$2</span>" },
      { plain: '&lt;u&gt;underline&lt;/u&gt;', regex: /(\&lt;u\&gt;(.*?)\&lt;\/u\&gt;)/igm, plain: "+$2+", xhtml: "<span style='text-decoration: underline;'>$2</span>" },
      { plain: '&lt;ins&gt;underline&lt;/ins&gt;', regex: /(\&lt;ins\&gt;(.*?)\&lt;\/ins\&gt;)/igm, plain: "+$2+", xhtml: "<span style='text-decoration: underline;'>$2</span>" },
      { plain: '<b>bold</b>', regex: /(\<b\>(.*?)\<\/b\>)/igm, plain: "*$2*", xhtml: "<strong>$2</strong>" },
      { plain: '<strong>bold</strong>', regex: /(\<strong\>(.*?)\<\/strong\>)/igm, plain: "*$2*", xhtml: "<strong>$2</strong>" },
      { plain: '<i>italic</i>', regex: /(\<i\>(.*?)\<\/i\>)/igm, plain: "_$2_", xhtml: "<em>$2</em>" },
      { plain: '<em>italic</em>', regex: /(\<em\>(.*?)\<\/em\>)/igm, plain: "_$2_", xhtml: "<em>$2</em>" },
      { plain: '<s>strikethrough</s>', regex: /(\<s\>(.*?)\<\/s\>)/igm, plain: "-$2-", xhtml: "<span style='text-decoration: line-through;'>$2</span>" },
      { plain: '<del>strikethrough</del>', regex: /(\<del\>(.*?)\<\/del\>)/igm, plain: "-$2-", xhtml: "<span style='text-decoration: line-through;'>$2</span>" },
      { plain: '<u>underline</u>', regex: /(\<u\>(.*?)\<\/u\>)/igm, plain: "+$2+", xhtml: "<span style='text-decoration: underline;'>$2</span>" },
      { plain: '<ins>underline</ins>', regex: /(\<ins\>(.*?)\<\/ins\>)/igm, plain: "+$2+", xhtml: "<span style='text-decoration: underline;'>$2</span>" }

    ]
  };

  var _options = {
    textile: true,
    bbcode: true,
    html: true
  };

  self.init = function( options ) {
    // apply the supplied options to the defaults specified
    $.extend( true, _options, options );

    $(Candy).on( 'candy:view.message.before-send', function(e, args) {
      var workingPlainMessage = args.message;
      var workingXhtmlMessage = args.message;
      
      if( args.xhtmlMessage ) {
        var workingXhtmlMessage = args.xhtmlMessage;
      }
      
      $.each( _options, function( optionIndex, optionValue ){
        if( optionValue === true ){
          $.each( _styles[optionIndex], function( styleIndex, styleValue ){
            workingPlainMessage = workingPlainMessage.replace( styleValue.regex, styleValue.plain );
            workingXhtmlMessage = workingXhtmlMessage.replace( styleValue.regex, styleValue.xhtml );
            });
          }
        });

      if( workingPlainMessage != workingXhtmlMessage) {
        // strophe currently requires that xhtml have a root element. Apparently.
        // Force one node, with no external text
        if( !workingXhtmlMessage.match( /^<.*>$/ ) || $( workingXhtmlMessage ).length != 1 ) {
          workingXhtmlMessage = "<span>" + workingXhtmlMessage + "</span>";
        }
        args.message = workingPlainMessage;
        args.xhtmlMessage = workingXhtmlMessage;
      }
    });

  };

  return self;
}(CandyShop.Emphasis || {}, Candy, jQuery));
