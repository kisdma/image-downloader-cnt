(function () {
  /* globals chrome */
  'use strict';

  const imageDownloader = {
    // Source: https://support.google.com/webmasters/answer/2598805?hl=en
    imageRegex: /(?:([^:\/?#=]+):)?(?:\/\/([^\/?#]*))?([^?#=]*\.(?:bmp|gif|jpe?g|png|svg|svgz|webp))(?:\?([^#]*))?(?:#(.*))?/i,
	urlRegexp: /(?:url\(\'?\"?)([^\'\(\)]*)(?:\'?\"?\))/g,

    extractImagesFromTags() {
	
	  var arr = [].slice.apply(document.querySelectorAll('img, a, svg, link, video, [style]')).map(imageDownloader.extractImageFromElement);
	  
	  // Adding high-resolution links for Google Map/Street Photos
	  var arr1 = [];
	  var regex = RegExp('(.*(ggpht|googleusercontent).*?)(=|$)','i');
      for (let i = 0; i < arr.length; i++) {
		if (regex.test(arr[i])) {
			arr1.push(regex.exec(arr[i])[1] + '=s16383');
		}
	  }
	  
	  // Adding high-resolution links for Youtube previews
	  var arr2 = [];
	  regex = RegExp('(ytimg|youtube).*(\\/vi\\/|\\?v=)([^\\/=]*)(\\/|=|$)','i');
	  if (regex.test(window.location.href)) {
	    arr2.push('https://img.youtube.com/vi/' + regex.exec(window.location.href)[3] + '/maxresdefault.jpg');
		for (let i = 0; i < 4; i++) {
			arr2.push('https://img.youtube.com/vi/' + regex.exec(window.location.href)[3] + '/' + i + '.jpg');
		}
	  }
      for (let i = 0; i < arr.length; i++) {
		if (regex.test(arr[i])) {
			arr2.push('https://img.youtube.com/vi/' + regex.exec(arr[i])[3] + '/maxresdefault.jpg');
		}
	  }
	  
      return arr.concat(arr1).concat(arr2);
    },

    extractImagesFromStyles() {
      const imagesFromStyles = [];
      for (let i = 0; i < document.styleSheets.length; i++) {
        const styleSheet = document.styleSheets[i];
		//console.log(styleSheet);
        // Prevents `Failed to read the 'cssRules' property from 'CSSStyleSheet': Cannot access rules` error. Also see:
        // https://github.com/vdsabev/image-downloader/issues/37
        // https://github.com/odoo/odoo/issues/22517
        if (styleSheet.hasOwnProperty('cssRules')) {{
		  //console.log('here');
          const { cssRules } = styleSheet;
          for (let j = 0; j < cssRules.length; j++) {
			rules = rules +'\n'+ sheet.cssRules[j].cssText;
            const style = cssRules[j].style;
            if (style && style.backgroundImage) {
              const url = imageDownloader.extractURLFromStyle(style.backgroundImage);
              if (imageDownloader.isImageURL(url)) 
                imagesFromStyles.push(url);
              }
            }
          }
        }
      }

      return imagesFromStyles;
    },

    extractImageFromElement(element) {
      if (element.tagName.toLowerCase() === 'img') {
        let src = element.src;
        const hashIndex = src.indexOf('#');
        if (hashIndex >= 0) {
          src = src.substr(0, hashIndex);
        }
        return src;
      }	  
	  
      if (element.tagName.toLowerCase() === 'link') {
        const href = element.href;
        if (imageDownloader.isImageURL(href)) {
          imageDownloader.linkedImages[href] = '0';
          return imageDownloader.relativeUrlToAbsolute(href);
        }
		
		if (element.rel === 'stylesheet') {
			fetch(href).then(r => r.text()).then(result => {
				var arr = [],
					item;
				while (item = imageDownloader.urlRegexp.exec(result))
					if (item) {
						const url = item[1];
						if (imageDownloader.isImageURL(url)) {
							if (url.indexOf('data:') === 0 ) {
								// URL is data
								arr.push(url);
							} else if (url.indexOf('://') > 0) { 
								// URL is absolute
								arr.push(url);
							} else if (url.indexOf('//') === 0 ) {
								arr.push(href.split("/")[0] + url);
							} else if (url.indexOf('/') === 0 ) {
								arr.push(imageDownloader.relativeUrlToAbsolute(url));
							} else {
								// URL is relative
								arr.push(
									imageDownloader.relativeWithBaseUrlToAbsolute(
										href, 
										url
									)
								);
							}
						}
					}
				chrome.runtime.sendMessage({
					linkedImages: {},
					images: arr
				});
			})
		}
      }
	  
      if (element.tagName.toLowerCase() === 'video') {
        return element.poster;
      }
	  
      if (element.tagName.toLowerCase() === 'svg') {
	    var s = new XMLSerializer().serializeToString(element);
		if (s.length < 15000) {
			if (/[^\u0000-\u00ff]/.test(s)) {
				var encodedData = window.btoa(unescape(encodeURIComponent(s)));
				return 'ENCODEDdata:image/svg+xml;base64,' + encodedData;
			} else {
				var encodedData = window.btoa(s);
				return 'data:image/svg+xml;base64,' + encodedData;
			}
		}
      }

      if (element.tagName.toLowerCase() === 'a') {
        const href = element.href;
        if (imageDownloader.isImageURL(href)) {
          imageDownloader.linkedImages[href] = '0';
          return imageDownloader.imageRegex.exec(href)[0];
        }
      }

      const backgroundImage = window.getComputedStyle(element).backgroundImage;
      if (backgroundImage) {
        const parsedURL = imageDownloader.extractURLFromStyle(backgroundImage);
        if (imageDownloader.isImageURL(parsedURL)) {
          return parsedURL;
        }
      }

      return '';
    },

    extractURLFromStyle(url) {
      return url.replace(/.*url\(["']?/, '').replace(/["']?\)$/, '');
    },

    isImageURL(url) {
      return url.indexOf('data:image') === 0 || imageDownloader.imageRegex.test(url);
    },

    relativeUrlToAbsolute(url) {
      return url.indexOf('/') === 0 ? `${window.location.origin}${url}` : url;
    },

    relativeWithBaseUrlToAbsolute(base, relative) {
		var stack = base.split("/"),
			parts = relative.split("/");
		stack.pop(); // remove current file name (or empty string)
					 // (omit if "base" is the current folder without trailing slash)
		for (var i=0; i<parts.length; i++) {
			if (parts[i] == ".")
				continue;
			if (parts[i] == "..")
				stack.pop();
			else
				stack.push(parts[i]);
		}
		return stack.join("/");
	},

    removeDuplicateOrEmpty(images) {
      const hash = {};
      for (let i = 0; i < images.length; i++) {
        hash[images[i]] = 0;
      }

      const result = [];
      for (let key in hash) {
        if (key !== '') {
          result.push(key);
        }
      }

      return result;
    }
  };

  imageDownloader.linkedImages = {}; // TODO: Avoid mutating this object in `extractImageFromElement`
  imageDownloader.images = imageDownloader.removeDuplicateOrEmpty(
    [].concat(
      imageDownloader.extractImagesFromTags(),
      imageDownloader.extractImagesFromStyles()
    ).map(imageDownloader.relativeUrlToAbsolute)
  );

  chrome.runtime.sendMessage({
    linkedImages: imageDownloader.linkedImages,
    images: imageDownloader.images
  });

  imageDownloader.linkedImages = null;
  imageDownloader.images = null;
}());
