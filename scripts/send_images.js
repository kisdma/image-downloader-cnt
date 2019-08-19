(function () {
  /* globals chrome */
  'use strict';

  const imageDownloader = {
    // Source: https://support.google.com/webmasters/answer/2598805?hl=en
    imageRegex: /(?:([^:/?#=]+):)?(?:\/\/([^/?#]*))?([^?#=]*\.(?:bmp|gif|jpe?g|png|svg|svgz|webp))(?:\?([^#]*))?(?:#(.*))?/i,
    urlRegexp: /(?:url\(\'?\"?)([^"'()]*)(?:\'?\"?\))/g,
    umageUrlFromStyleRegexp: /url\(['"]?(([^)]*?\.(bmp|gif|jpe?g|png|svg|svgz|webp))|([^()'"]*data:image[^()'"]*))['"]?\)/g,

    extractImagesFromTags() {
	
      var arr = [].slice.apply(document.querySelectorAll('img, a, svg, link, video, style, canvas, source')).map(imageDownloader.extractImageFromElement);
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
      
      if (element.tagName.toLowerCase() === 'image') {
        const href = element.href;
        return imageDownloader.restoreFullUrl(document.location.href, element.getAttributeNS('http://www.w3.org/1999/xlink', 'href'));
      }
    
      if (element.hasAttribute("data-idc-ext")) {
        if (element.getAttribute("data-idc-ext") === 'donotadd')
          return '';
      }
    
      if (element.tagName.toLowerCase() === 'script') {
        const html = element.innerHTML;
        var regex = /['"]([^)'"]*?\.(bmp|gif|jpe?g|png|svg|svgz|webp)[^)'"]*)['"]/ig;
        var item, arr = [];

        while (item = regex.exec(html)) {
          arr.push(item[1]);
        }
        return arr;
      }
      
      if (element.tagName.toLowerCase() === 'canvas') {
        const str = element.toDataURL('image/jpeg');
        return str;
      }
    
      if (element.tagName.toLowerCase() === 'style') {
        const html = element.innerHTML;
        const href = document.location.href;
        var arr = [],
          item;
        while (item = imageDownloader.umageUrlFromStyleRegexp.exec(html))
          if (item) {
            const url = item[1];
            if ((! /gstatic/i.test(url)) && (arr.indexOf(url) === -1)) {
              if (imageDownloader.isImageURL(url)) {
                arr.push(imageDownloader.restoreFullUrl(document.location.href, url));
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
        const srcset = element.srcset;
        if (('srcset' in element) || ('lowsrc' in element)){
          var arr = [],
            item;
          arr.push(imageDownloader.restoreFullUrl(document.location.href, src));
          if ('lowsrc' in element) {
            arr.push(imageDownloader.restoreFullUrl(document.location.href, element.lowsrc));
          }
          if ('srcset' in element) {
            var srcsetRegex = /(^|\s|,)([^\s,]+)($|\s|,)/ig;
            while (item = srcsetRegex.exec(element.srcset)) {
              arr.push(imageDownloader.restoreFullUrl(document.location.href, item[2]));
            }
          }
          return arr;
        } else {
          return imageDownloader.restoreFullUrl(document.location.href, src);
        }
      }
      
      if (element.tagName.toLowerCase() === 'source') {
        let src = element.srcset;
        const hashIndex = src.indexOf('#');
        if (hashIndex >= 0) {
          src = src.substr(0, hashIndex);
        }
        return imageDownloader.relativeWithBaseUrlToAbsolute(
          document.location.href, src
        );
      }
	  
      if (element.tagName.toLowerCase() === 'link') {
        const href = element.href;
        
        if (element.rel !== 'stylesheet') {
          if (imageDownloader.isImageURL(href)) {
            imageDownloader.linkedImages[href] = '0';
            return imageDownloader.relativeUrlToAbsolute(href);
          }
		
        } else {
          fetch(href).then(r => r.text()).then(result => {
            var arr = [],
              item;
            while (item = imageDownloader.urlRegexp.exec(result))
              if (item) {
                const url = item[1];
                if (imageDownloader.isImageURL(url)) {
                  arr.push(imageDownloader.restoreFullUrl(href.substring(0, href.lastIndexOf("/")), url));
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
        const href = element.href;
        var arr = [];
        for (let el1 of element.getElementsByTagName('image')) {
          if (el1.nodeType === 1) {
            arr.push(imageDownloader.restoreFullUrl(document.location.href, el1.getAttributeNS('http://www.w3.org/1999/xlink', 'href')));
          }
        } 
        if (arr && arr.length) {
          return arr;
        } else {
          return imageDownloader.svgElementToBase64(element);
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
      if (s.length < 150000) {
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
      //stack.pop(); // remove current file name (or empty string)
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
    
    restoreFullUrl(base, url) {
      if (url.indexOf('data:image/svg+xml;utf8,') === 0 ) {
        return imageDownloader.svgElementToBase64(imageDownloader.htmlToElement(url.slice('data:image/svg+xml;utf8,'.length).replace(/\\"/g, '"')));
      }
      else if (url.indexOf('data:') === 0 ) {
        // URL is data
        return (url);
      }
      else if (url.indexOf('://') > 0) { 
        // URL is absolute
        return (url);
      }
      else if (url.indexOf('//') === 0 ) {
        return (base.split("/")[0] + url);
      }
      else if (url.indexOf('/') === 0 ) {
        return (imageDownloader.relativeUrlToAbsolute(url));
      }
      else {
        // URL is relative
        return (
          imageDownloader.relativeWithBaseUrlToAbsolute(
            base, 
            url
          )
        );
      }
    },

    removeDuplicateOrEmpty(images) {
      const hash = {};
      for (let i = 0; i < images.length; i++) {
        hash[images[i]] = 0;
      }

      const result = [];
      for (let key in hash) {
        if (key !== '') {
          if (key.length < 15000) {
            result.push(key);
          } else {
            var div = document.createElement("div");
            div.setAttribute("class", "idc");
            div.setAttribute("style", "background-color:#ffff; float:left; z-index:2147483647; position:relative; border-style: solid; border-width: 0.5px; width:210px; height:210px; box-shadow: 5px 5px 5px rgba(3,0,3,0.3); margin:5px 5px 5px 5px; vertical-align: middle; text-align: center; padding: 5px 5px; display: table;");
            div.setAttribute("scrolling", "no");
            div.setAttribute("frameborder", "0");
            var span = document.createElement("span");
            span.setAttribute("style", "display: table-cell; vertical-align: middle; ");
            var img1 = imageDownloader.htmlToElement('<img style = "max-height:200px; max-width:200px; vertical-align: middle; " src = "'+key+'" data-idc-ext = "donotadd"/>');
            img1.setAttribute("class", "idc-image");
            span.appendChild(img1);
            div.appendChild(span);
            document.body.appendChild(div);
            for (let el1 of div.getElementsByTagName('*')) {
              if (el1.nodeType === 1) {
                el1.setAttribute('style', 'display:table !important');
              }
            } 
          }
        }
      }

      return result;
    }
  };
  
  var foundImages = [];
  var arrayStorage = document.getElementById('idc-array-storage');
  if (arrayStorage) {
    foundImages = JSON.parse(arrayStorage.getAttribute("data-links-array"));
  } else {
    var arrayStorage = document.createElement("div");
    arrayStorage.setAttribute("id", "idc-array-storage");
    arrayStorage.setAttribute("hidden", "true");
    document.body.appendChild(arrayStorage);   
  
    // Create an observer instance.
    var observer = new MutationObserver(function (mutations) {
      for(let mutation of mutations) {
        if (mutation.type === 'childList') {
          //console.log('A child node has been added or removed.');
          for(var j=0; j<mutation.addedNodes.length; ++j) {
            if (mutation.addedNodes[j].nodeType === 1) {
              var arr = [].slice.apply(mutation.addedNodes[j].querySelectorAll('image, img, a, svg, link, video, style, canvas, source')).map(imageDownloader.extractImageFromElement);
              if (arr) {
                arr = arr.flat();
                var arrayStorage = document.getElementById('idc-array-storage');
                if (arrayStorage) {
                  var foundImages = JSON.parse(arrayStorage.getAttribute("data-links-array"));
                  foundImages = [].concat(foundImages, arr);
                  arrayStorage.setAttribute("data-links-array", JSON.stringify(foundImages));
                }
              }
            }
          }
        }
        else if (mutation.type === 'attributes') {
          //console.log('Attributes have been added or removed.');
          const url = mutation.target.getAttribute(mutation.attributeName);
          
          if (imageDownloader.isImageURL(url)) {
            var arrayStorage = document.getElementById('idc-array-storage');
            if (arrayStorage) {
              var foundImages = JSON.parse(arrayStorage.getAttribute("data-links-array"));
            }
            if (!foundImages.includes(url)) {            
              foundImages.push(url);
              arrayStorage.setAttribute("data-links-array", JSON.stringify(foundImages));
            }
          }
        }
      }
    });

    // Config info for the observer.
    var config = {
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: [ "src", "srcset", "image", "svg", "img" ] // May be extended in the future. Didn't make it comprehensive because worry about performance penalty. Needs more testing and/or use cases
    };

    // Observe the body (and its descendants) for `childList` and attribute changes.
    observer.observe(document.body, config);
  }
  // Iterate over all elements in the main DOM.
  for (let el of document.getElementsByTagName('*')) {
   // If element contains shadow root then replace its 
   // content with the HTML of shadow DOM.
    if (el.shadowRoot) {
      var shadowExtr = document.createElement("div");
      shadowExtr.setAttribute("hidden", "true");
      shadowExtr.innerHTML = el.shadowRoot.innerHTML;
      document.body.appendChild(shadowExtr);
    }
  }

  imageDownloader.linkedImages = {}; // TODO: Avoid mutating this object in `extractImageFromElement`
  imageDownloader.images = imageDownloader.removeDuplicateOrEmpty(
    [].concat(
      foundImages,
      imageDownloader.extractImagesFromTags(),
      imageDownloader.extractImagesFromStyles()
    ).map(imageDownloader.relativeUrlToAbsolute)
  );

  chrome.runtime.sendMessage({
    linkedImages: imageDownloader.linkedImages,
    images: imageDownloader.images
  });

  arrayStorage.setAttribute("data-links-array", JSON.stringify(imageDownloader.images));
  imageDownloader.linkedImages = null;
  imageDownloader.images = null;
}());
