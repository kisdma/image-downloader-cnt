(function () {
  /* globals chrome */
  'use strict';

  const imageDownloader = {
    // Source: https://support.google.com/webmasters/answer/2598805?hl=en
    imageRegex: /(?:([^:/?#=]+):)?(?:\/\/([^/?#]*))?([^?#=]*\.(?:bmp|gif|jpe?g|png|svg|svgz|webp))(?:\?([^#]*))?(?:#(.*))?/i,
    urlRegexp: /(?:url\(\'?\"?)([^"'()]*)(?:\'?\"?\))/g,
    umageUrlFromStyleRegexp: /url\(['"]?([^)]*?\.(bmp|gif|jpe?g|png|svg|svgz|webp))['"]?\)/g,

    extractImagesFromTags() {
	
      var arr = [].slice.apply(document.querySelectorAll('img, a, svg, link, video, style')).map(imageDownloader.extractImageFromElement);
      arr = arr.flat();
	 
      return arr;
    },

    extractImagesFromStyles() {
      const imagesFromStyles = [];
      const cssPropertiesArr = ['background-image','background'];
      
      var url, B = [], A= document.getElementsByTagName('*');
      A = B.slice.call(A, 0, A.length);
      while(A.length){
        for (let i = 0; i < cssPropertiesArr.length; i++) {
          url= imageDownloader.deepCss(A.shift(),cssPropertiesArr[i]);
          if(/url\(['"]?([^)"']+)["']?\)/i.test(url)) {
            url=/url\(['"]?([^)"']+)["']?\)/.exec(url) || [];
            url= url[1];
            if (url.indexOf('data:image/svg+xml;utf8,') === 0) {
              url = imageDownloader.svgElementToBase64(imageDownloader.htmlToElement(url.slice('data:image/svg+xml;utf8,'.length).replace(/\\"/g, '"')));
            }
            imagesFromStyles.push(url);
          }
        }
      } 
      return imagesFromStyles;
    },
    
    deepCss (who, css){
      var dv, sty, val;
      if(who && who.style){
        css= css.toLowerCase();
        sty= css.replace(/\-([a-z])/g, function(a, b){
          return b.toUpperCase();
        });
        val= who.style[sty];
        if(!val){
          dv= document.defaultView || window;
          if(dv.getComputedStyle){
            val= dv.getComputedStyle(who,'').getPropertyValue(css);
          }
          else if(who.currentStyle){
            val= who.currentStyle[sty];
          }
        }
      }
      return val || '';
    },
    
    htmlToElement(html) {
      var template = document.createElement('template');
      html = html.trim(); // Never return a text node of whitespace as the result
      template.innerHTML = html;
      return template.content.firstChild;
    },

    extractImageFromElement(element) {
    
      if (element.tagName.toLowerCase() === 'style') {
        const html = element.innerHTML;
        const href = document.location.href;
        var arr = [],
          item;
        while (item = imageDownloader.umageUrlFromStyleRegexp.exec(html))
          if (item) {
            const url = item[1];
            if ((! /gstatic/i.test(url)) && (arr.indexOf(url) === -1)) {
              console.log(url);
              if (imageDownloader.isImageURL(url)) {
                if (url.indexOf('data:image/svg+xml;utf8,') === 0 ) {
                  arr.push(imageDownloader.svgElementToBase64(imageDownloader.htmlToElement(url.slice('data:image/svg+xml;utf8,'.length).replace(/\\"/g, '"'))));
                }
                else if (url.indexOf('data:') === 0 ) {
                  // URL is data
                  arr.push(url);
                }
                else if (url.indexOf('://') > 0) { 
                  // URL is absolute
                  arr.push(url);
                }
                else if (url.indexOf('//') === 0 ) {
                  arr.push(href.split("/")[0] + url);
                }
                else if (url.indexOf('/') === 0 ) {
                  arr.push(imageDownloader.relativeUrlToAbsolute(url));
                }
                else {
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
          }
        return arr;
      }
      
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
                  if (url.indexOf('data:image/svg+xml;utf8,') === 0 ) {
                    arr.push(imageDownloader.svgElementToBase64(imageDownloader.htmlToElement(url.slice('data:image/svg+xml;utf8,'.length).replace(/\\"/g, '"'))));
                  }
                  else if (url.indexOf('data:') === 0 ) {
                    // URL is data
                    arr.push(url);
                  }
                  else if (url.indexOf('://') > 0) { 
                    // URL is absolute
                    arr.push(url);
                  }
                  else if (url.indexOf('//') === 0 ) {
                    arr.push(href.split("/")[0] + url);
                  }
                  else if (url.indexOf('/') === 0 ) {
                    arr.push(imageDownloader.relativeUrlToAbsolute(url));
                  }
                  else {
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
        return imageDownloader.svgElementToBase64(element)
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
          if (parsedURL.indexOf('data:image/svg+xml;utf8,') === 0) {            
            return imageDownloader.svgElementToBase64(imageDownloader.htmlToElement(parsedURL.slice('data:image/svg+xml;utf8,'.length).replace(/\\"/g, '"')));
          }
          else {
            return parsedURL;
          }
        }
      }

      return '';
    },

    svgElementToBase64(element) {
      var s = new XMLSerializer().serializeToString(element);
      if (s.length < 15000) {
        if (/[^\u0000-\u00ff]/.test(s)) {
          var encodedData = window.btoa(unescape(encodeURIComponent(s)));
          return 'data:image/svg+xml;base64,' + encodedData;
        } 
        else {
          var encodedData = window.btoa(s);
          return 'data:image/svg+xml;base64,' + encodedData;
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
