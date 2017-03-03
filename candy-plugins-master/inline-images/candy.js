/*
 * inline-images
 * @version 1.0
 * @author Manuel Alabor (manuel@alabor.me)
 * @author Jonatan Männchen <jonatan@maennchen.ch>
 *
 * If a user posts a URL to an image, that image gets rendered directly
 * inside of Candy.
 */

/* global Candy, jQuery, Image */

var CandyShop = (function(self) { return self; }(CandyShop || {}));

CandyShop.InlineImages = (function(self, Candy, $) {

  var _options = {
    fileExtensions: ['png','jpg','jpeg','gif']
    , maxImageSize: 100
    , noInlineSizing: false
  };

  /** Function: init
   * Initializes the inline-images plugin with the default settings.
   */
  self.init = function(options) {
    // Apply the supplied options to the defaults specified
    $.extend(true, _options, options);

    $(Candy).on('candy:view.message.before-show', handleBeforeShow);
    $(Candy).on('candy:view.message.after-show', handleOnShow);
  };

  /** Function: initWithFileExtensions
   * Initializes the inline-images plugin with the possibility to pass an
   * array with all the file extensions you want to display as image.
   *
   * Parameters:
   *   (String array) fileExtensions - Array with extensions (jpg, png, ...)
   */
  self.initWithFileExtensions = function(fileExtensions) {
    _options.fileExtensions = fileExtensions;
    self.init();
  };

  /** Function: initWithMaxImageSize
   * Initializes the inline-images plugin with the possibility to pass the
   * maximum image size for displayed images.
   *
   * Parameters:
   *   (int) maxImageSize - Maximum edge size for images
   */
  self.initWithMaxImageSize = function(maxImageSize) {
    _options.maxImageSize = maxImageSize;
    self.init();
  };

  /** Function: initWithFileExtensionsAndMaxImageSize
   * Initializes the inline-images plugin with the possibility to pass an
   * array with all the file extensions you want to display as image and
   * the maximum image size for displayed images.
   *
   * Parameters:
   *   (String array) fileExtensions - Array with extensions (jpg, png, ...)
   *   (int) maxImageSize - Maximum edge size for images
   */
  self.initWithFileExtensionsAndMaxImageSize = function(fileExtensions, maxImageSize) {
    _options.fileExtensions = fileExtensions;
    _options.maxImageSize = maxImageSize;
    self.init();
  };


  /** Function: handleBeforeShow
   * Handles the beforeShow event of a message.
   *
   * Paramteres:
   *   (Object) args - {roomJid, element, nick, message}
   *
   * Returns:
   *   (String)
   */
  var handleBeforeShow = function(e, args) {
    args.message = replaceLinksWithLoaders(args.message);

    if (args.xhtmlMessage) {
      args.xhtmlMessage = replaceLinksWithLoaders(args.xhtmlMessage);
    }

    return true;
  };

  /** Function replaceLinksWithLoaders
   * Replaces anchor tags with image loader elements where applicable
   *
   * Parameters:
   *   (String) message
   *
   * Returns:
   *   (String) the replaced message
   */
  var replaceLinksWithLoaders = function(message) {
    var dummyContainer = document.createElement('div');
    dummyContainer.innerHTML = message;

    $(dummyContainer).find('a').each(function(index, anchor) {
      if (anchorHasMatchingFileExtension(anchor)) {
        anchor.innerHTML = buildImageLoaderSource(anchor.href);
      }
    });

    return dummyContainer.innerHTML;
  };

  /** Function anchorHasMatchingFileExtension
   * Identifies whether or not an anchor tag links to a file with one of the matching extensions we're looking for
   *
   * Parameters:
   *   (Element) element
   *
   * Returns:
   *   (true, false)
   */
  var anchorHasMatchingFileExtension = function(element) {
    var dotPosition = element.pathname.lastIndexOf(".");
    if(dotPosition > -1) {
      if(_options.fileExtensions.indexOf(element.pathname.substr(dotPosition+1)) != -1) {
        return true;
      }
    }
    return false;
  };

  /** Function: handleOnShow
   * Each time a message gets displayed, this method checks for possible
   * image loaders (created by buildImageLoaderSource).
   * If there is one, the image "behind" the loader gets loaded in the
   * background. As soon as the image is loaded, the image loader gets
   * replaced by proper scaled image.
   *
   * Parameters:
   *   (Array) args
   */
  var handleOnShow = function(e, args) {
    $('.inlineimages-loader').each(function(index, element) {
      $(element).removeClass('inlineimages-loader');
      var url = $(element).attr('longdesc');
      var imageLoader = new Image();

      $(imageLoader).load(function() {
        var origWidth = this.width;
        var origHeight = this.height;
        if(origWidth > _options.maxImageSize || origHeight > _options.maxImageSize) {
          var ratio = Math.min(_options.maxImageSize / origWidth, _options.maxImageSize / origHeight);
          var width = Math.round(ratio * origWidth);
          var height = Math.round(ratio * origHeight);
        }

        $(element).replaceWith(buildImageSource(url, width, height))
      });

      imageLoader.src = url;
    });
  };

  /** Function: buildImageLoaderSource
   * Returns a loader indicator. The handleOnShow method fullfills afterwards
   * the effective image loading.
   *
   * Parameters:
   *   (String) url - image url
   *
   * Returns:
   *   (String)
   */
  var buildImageLoaderSource = function(url) {
    return '<img class="inlineimages-loader" longdesc="' + url + '" src="ui/candy-plugins/inline-images/spinner.gif" />';
  };

  /** Function: buildImageSource
   * Returns HTML source to show a URL as an image.
   *
   * Parameters:
   *   (String) url - image url
   *
   * Returns:
   *   (String)
   */
  var buildImageSource = function(url, width, height) {
    if (_options.noInlineSizing) {
      return '<img src="' + url + '" />';
    } else {
      return '<img src="' + url + '" width="' + width + '" height="' + height + '"/>';
    }
  };

  return self;

}(CandyShop.InlineImages || {}, Candy, jQuery));
