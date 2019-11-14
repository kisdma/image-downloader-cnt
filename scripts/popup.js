// Extending Zepto library
// Source: https://github.com/madrobby/zepto/blob/master/src/fx.js#files
(function($, undefined){
  var prefix = '', eventPrefix,
    vendors = { Webkit: 'webkit', Moz: '', O: 'o' },
    testEl = document.createElement('div'),
    supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
    transform,
    transitionProperty, transitionDuration, transitionTiming, transitionDelay,
    animationName, animationDuration, animationTiming, animationDelay,
    cssReset = {}

  function dasherize(str) { return str.replace(/([A-Z])/g, '-$1').toLowerCase() }
  function normalizeEvent(name) { return eventPrefix ? eventPrefix + name : name.toLowerCase() }

  if (testEl.style.transform === undefined) $.each(vendors, function(vendor, event){
    if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
      prefix = '-' + vendor.toLowerCase() + '-'
      eventPrefix = event
      return false
    }
  })

  transform = prefix + 'transform'
  cssReset[transitionProperty = prefix + 'transition-property'] =
  cssReset[transitionDuration = prefix + 'transition-duration'] =
  cssReset[transitionDelay    = prefix + 'transition-delay'] =
  cssReset[transitionTiming   = prefix + 'transition-timing-function'] =
  cssReset[animationName      = prefix + 'animation-name'] =
  cssReset[animationDuration  = prefix + 'animation-duration'] =
  cssReset[animationDelay     = prefix + 'animation-delay'] =
  cssReset[animationTiming    = prefix + 'animation-timing-function'] = ''

  $.fx = {
    off: (eventPrefix === undefined && testEl.style.transitionProperty === undefined),
    speeds: { _default: 400, fast: 200, slow: 600 },
    cssPrefix: prefix,
    transitionEnd: normalizeEvent('TransitionEnd'),
    animationEnd: normalizeEvent('AnimationEnd')
  }

  $.fn.animate = function(properties, duration, ease, callback, delay){
    if ($.isFunction(duration))
      callback = duration, ease = undefined, duration = undefined
    if ($.isFunction(ease))
      callback = ease, ease = undefined
    if ($.isPlainObject(duration))
      ease = duration.easing, callback = duration.complete, delay = duration.delay, duration = duration.duration
    if (duration) duration = (typeof duration == 'number' ? duration :
                    ($.fx.speeds[duration] || $.fx.speeds._default)) / 1000
    if (delay) delay = parseFloat(delay) / 1000
    return this.anim(properties, duration, ease, callback, delay)
  }

  $.fn.anim = function(properties, duration, ease, callback, delay){
    var key, cssValues = {}, cssProperties, transforms = '',
        that = this, wrappedCallback, endEvent = $.fx.transitionEnd,
        fired = false

    if (duration === undefined) duration = $.fx.speeds._default / 1000
    if (delay === undefined) delay = 0
    if ($.fx.off) duration = 0

    if (typeof properties == 'string') {
      // keyframe animation
      cssValues[animationName] = properties
      cssValues[animationDuration] = duration + 's'
      cssValues[animationDelay] = delay + 's'
      cssValues[animationTiming] = (ease || 'linear')
      endEvent = $.fx.animationEnd
    } else {
      cssProperties = []
      // CSS transitions
      for (key in properties)
        if (supportedTransforms.test(key)) transforms += key + '(' + properties[key] + ') '
        else cssValues[key] = properties[key], cssProperties.push(dasherize(key))

      if (transforms) cssValues[transform] = transforms, cssProperties.push(transform)
      if (duration > 0 && typeof properties === 'object') {
        cssValues[transitionProperty] = cssProperties.join(', ')
        cssValues[transitionDuration] = duration + 's'
        cssValues[transitionDelay] = delay + 's'
        cssValues[transitionTiming] = (ease || 'linear')
      }
    }

    wrappedCallback = function(event){
      if (typeof event !== 'undefined') {
        if (event.target !== event.currentTarget) return // makes sure the event didn't bubble from "below"
        $(event.target).unbind(endEvent, wrappedCallback)
      } else
        $(this).unbind(endEvent, wrappedCallback) // triggered by setTimeout

      fired = true
      $(this).css(cssReset)
      callback && callback.call(this)
    }
    if (duration > 0){
      this.bind(endEvent, wrappedCallback)
      // transitionEnd is not always firing on older Android phones
      // so make sure it gets fired
      setTimeout(function(){
        if (fired) return
        wrappedCallback.call(that)
      }, ((duration + delay) * 1000) + 25)
    }

    // trigger page reflow so new elements can animate
    this.size() && this.get(0).clientLeft

    this.css(cssValues)

    if (duration <= 0) setTimeout(function() {
      that.each(function(){ wrappedCallback.call(this) })
    }, 0)

    return this
  }

  testEl = null
})(Zepto);

//Source: http://onezeronull.com/2013/08/09/extend-zepto-with-fadein-and-fadeout-effects/
(function($)
{    
  $.extend($.fn,
  {
    fadeIn: function(ms, callback)
    {
      if(typeof(ms) === 'undefined') ms = 500;
      
      $(this).css(
      {
        display: 'block',
        opacity: 0
      }).animate({
        opacity: 1
      }, ms, 'linear', callback);
      
      return this;
    },
    
    fadeOut: function(ms, callback)
    {
      if(typeof(ms) === 'undefined') ms = 500;
      
      $(this).css(
      {
        opacity: 1
      }).animate({
        opacity: 0
      }, ms, 'linear', callback);
      
      return this;
    }
  })
})(Zepto);

(function (ls) {
  /* globals $, jss, chrome */
  /* jshint multistr: true */
  'use strict';

  function initializePopup() {
    // Register download folder name listener
    $('#folder_name_textbox')
      .val(ls.folder_name)
      .on('change', function () {
        ls.folder_name = $.trim(this.value);
      });

    // Register file renaming listener
    $('#file_renaming_textbox')
      .val(ls.new_file_name)
      .on('change', function () {
        ls.new_file_name = $.trim(this.value);
      });

    // Register filter URL listener
    $('#filter_textbox')
      .val(ls.filter_url)
      .on('change', function () {
        ls.filter_url = $.trim(this.value);
      });

    chrome.downloads.onDeterminingFilename.addListener(suggestNewFilename);

    $('#download_button').on('click', downloadImages);

    if (ls.show_url_filter === 'true') {
      $('#filter_textbox').on('keyup', filterImages);
      $('#filter_url_mode_input').val(ls.filter_url_mode).on('change', function () {
        ls.filter_url_mode = this.value;
        filterImages();
      });
    }

    if (ls.show_image_width_filter === 'true' || ls.show_image_height_filter === 'true') {
      // Image dimension filters
      var serializeSliderValue = function (label, option) {
        return $.Link({
          target: function (value) {
            $('#' + label).html(value + 'px');
            ls[option] = value;
            filterImages();
          }
        });
      };

      var toggleDimensionFilter = function (label, option, value) {
        if (value !== undefined) ls[option] = value;
        $('#' + label).toggleClass('light', ls[option] !== 'true');
        filterImages();
      };

      var initializeFilter = function (dimension) {
        $('#image_' + dimension + '_filter_slider').noUiSlider({
          behaviour: 'extend-tap',
          connect: true,
          range: { min: parseInt(ls['filter_min_' + dimension + '_default']), max: parseInt(ls['filter_max_' + dimension + '_default']) },
          step: 10,
          start: [ls['filter_min_' + dimension], ls['filter_max_' + dimension]],
          serialization: {
            lower: [serializeSliderValue('image_' + dimension + '_filter_min', 'filter_min_' + dimension)],
            upper: [serializeSliderValue('image_' + dimension + '_filter_max', 'filter_max_' + dimension)],
            format: { decimals: 0 }
          }
        });

        toggleDimensionFilter('image_' + dimension + '_filter_min', 'filter_min_' + dimension + '_enabled');
        $('#image_' + dimension + '_filter_min_checkbox')
          .prop('checked', ls['filter_min_' + dimension + '_enabled'] === 'true')
          .on('change', function () {
            toggleDimensionFilter('image_' + dimension + '_filter_min', 'filter_min_' + dimension + '_enabled', this.checked);
          });

        toggleDimensionFilter('image_' + dimension + '_filter_max', 'filter_max_' + dimension + '_enabled');
        $('#image_' + dimension + '_filter_max_checkbox')
          .prop('checked', ls['filter_max_' + dimension + '_enabled'] === 'true')
          .on('change', function () {
            toggleDimensionFilter('image_' + dimension + '_filter_max', 'filter_max_' + dimension + '_enabled', this.checked);
          });
      };

      // Image width filter
      if (ls.show_image_width_filter === 'true') {
        initializeFilter('width');
      }

      // Image height filter
      if (ls.show_image_height_filter === 'true') {
        initializeFilter('height');
      }
    }

    // Other filters
    if (ls.show_only_images_from_links === 'true') {
      $('#only_images_from_links_checkbox')
        .prop('checked', ls.only_images_from_links === 'true')
        .on('change', function () {
          ls.only_images_from_links = this.checked;
          filterImages();
        });
    }
    if (ls.show_sort_images_by_width === 'true') {
      $('#sort_by_size_checkbox')
        .prop('checked', ls.sort_by_size === 'true')
        .on('change', function () {
          ls.sort_by_size = this.checked;
          filterImages();
        });
    }
    if (ls.show_sort_order === 'true') {
      $('#sort_order_checkbox')
        .prop('checked', ls.sort_order === 'true')
        .on('change', function () {
          ls.sort_order = this.checked;
          filterImages();
        });
    }

    $('#images_table')
      .on('change', '#toggle_all_checkbox', function () {
        $('#download_button').prop('disabled', !this.checked);
        for (var i = 0; i < visibleImages.length; i++) {
          $('#image' + i).toggleClass('checked', this.checked);
        }
      })
      .on('click', 'img', function () {
        $(this).toggleClass('checked', !$(this).hasClass('checked'));

        var allAreChecked = true;
        var allAreUnchecked = true;
        for (var i = 0; i < visibleImages.length; i++) {
          if ($('#image' + i).hasClass('checked')) {
            allAreUnchecked = false;
          }
          else {
            allAreChecked = false;
          }
          // Exit the loop early
          if (!(allAreChecked || allAreUnchecked)) break;
        }

        $('#download_button').prop('disabled', allAreUnchecked);

        var toggle_all_checkbox = $('#toggle_all_checkbox');
        toggle_all_checkbox.prop('indeterminate', !(allAreChecked || allAreUnchecked));
        if (allAreChecked) {
          toggle_all_checkbox.prop('checked', true);
        }
        else if (allAreUnchecked) {
          toggle_all_checkbox.prop('checked', false);
        }
      })
        .on('click', '.image_url_textbox', function () {
        //Create a textbox field where we can insert text to. 
        var copyFrom = document.createElement("textarea");
        
        //Set the text content to be the text you wished to copy.
        copyFrom.textContent = $(this).data('url');
        
        //Append the textbox field into the body as a child. 
        //"execCommand()" only works when there exists selected text, and the text is inside 
        //document.body (meaning the text is part of a valid rendered HTML element).
        document.body.appendChild(copyFrom);
        
        //Select all the text!
        copyFrom.select();
        
        //Execute command
        document.execCommand('copy');
        
        //(Optional) De-select the text using blur(). 
        copyFrom.blur();
        
        //Remove the textbox field from the document.body, so no other JavaScript nor 
        //other elements can get access to this.
        document.body.removeChild(copyFrom);
    })
    .on('click', '.image_size_textbox', function () {
      var dimension = ['width', 'height'];
      for (var i = 0; i < dimension.length; i++) {
        $('#image_' + dimension[i] + '_filter_slider').val([10*Math.floor($(this).data(dimension[i])/10),10*Math.ceil($(this).data(dimension[i])/10)]);
      }
    })
      .on('click', '.download_image_button', function () {
        chrome.downloads.download({ url: $(this).data('url') });
      })
      .on('click', '.open_image_button', function () {
        chrome.tabs.create({ url: $(this).data('url'), active: false });
    })
    .on('click', '.image_gris_textbox', function () {
      chrome.tabs.create({ url: 'https://www.google.com/searchbyimage?hl=en&safe=off&site=search&image_url=' + $(this).data('url'), active: false });
    })
    .on('click', '.image_teris_textbox', function () {
      chrome.tabs.create({ url: 'http://tineye.com/search?pluginver=bookmark_1.0&url=' + $(this).data('url'), active: false });
    })
    .on('click', '.image_biris_textbox', function () {
      chrome.tabs.create({ url: 'http://www.bing.com/images/searchbyimage?cbir=sbi&imgurl=' + $(this).data('url'), active: false });
    })
    .on('click', '.image_yaris_textbox', function () {
      chrome.tabs.create({ url: 'https://yandex.com/images/search?rpt=imageview&img_url=' + $(this).data('url'), active: false });
      });

    // Get images on the page
    chrome.windows.getCurrent(function (currentWindow) {
      chrome.tabs.query({ active: true, windowId: currentWindow.id }, function (activeTabs) {
        chrome.webNavigation.getAllFrames({
          tabId: activeTabs[0].id,
          }, function(frames) {
            for (var frame of frames) {
              chrome.webNavigation.getAllFrames({
                tabId: frame.frameId,
                }, function(frames1) {
                  if (frames1) {
                    for (var frame1 of frames1) {
                      console.log(frame1.frameId);
                    }
                  }
              });
            }
        });
        chrome.tabs.executeScript(activeTabs[0].id, { file: '/scripts/send_images.js', allFrames: true });
        chrome.tabs.insertCSS(activeTabs[0].id, {
          code: '.idc-image { display: table !important; }',
          cssOrigin: "user",
          runAt: "document_idle",
          allFrames: true 
        });
      });
    });
  }

  function suggestNewFilename(item, suggest) {
    var newFilename = '';
    if (ls.folder_name) {
      newFilename = ls.folder_name + '/';
    }
    if (ls.new_file_name) {
      var regex = /(?:\.([^.]+))?$/;
      var extension = regex.exec(item.filename)[1];
      if (parseInt(ls.image_count, 10) === 1) {
        newFilename += ls.new_file_name + '.' + extension;
      }
      else {
        newFilename += ls.new_file_name + ls.image_number + '.' + extension;
        ls.image_number++;
      }
    }
    else {
      newFilename += item.filename;
    }
    suggest({ filename: newFilename });
  }

  function initializeStyles() {
    // General
    $('#file_renaming_textbox').toggle(ls.show_file_renaming === 'true');

    // Filters
    $('#image_url_filter').toggle(ls.show_url_filter === 'true');
    $('#image_width_filter').toggle(ls.show_image_width_filter === 'true');
    $('#image_height_filter').toggle(ls.show_image_height_filter === 'true');
    $('#only_images_from_links_container').toggle(ls.show_only_images_from_links === 'true');
    $('#sort_by_size').toggle(ls.show_sort_images_by_width === 'true');
    $('#sort_order').toggle(ls.show_sort_order === 'true');

    // Images
    jss.set('.image_buttons_container', {
      'margin-top': (ls.show_image_url === 'true' ? 3 : -3) + 'px'
    });

    jss.set('img', {
      // 'min-width': ls.image_min_width + 'px',
      'max-width': ls.image_max_width + 'px',
      'border-width': ls.image_border_width + 'px',
      'border-style': 'solid',
      'border-color': ls.image_tile_color
    });
    jss.set('img.checked', {
      'border-color': ls.image_border_color
    });
    jss.set('.filename_textbox', {
      'background-color': ls.image_tile_color
    });

    // Periodically set the body padding to offset the height of the fixed position filters
    setInterval(function () {
      $('body').css('padding-top', $('#filters_container').height());
    }, 200);
  }

  var allImages = [];
  var imSizes = [];
  var imTypes = [];
  var visibleImages = [];
  var linkedImages = {};

  // Add images to `allImages` and trigger filtration
  // `send_images.js` is injected into all frames of the active tab, so this listener may be called multiple times
  chrome.runtime.onMessage.addListener(function (result) {
    $.extend(linkedImages, result.linkedImages);
    const l = allImages.length;
    for (var i = 0; i < result.images.length; i++) {
      if (allImages.indexOf(result.images[i]) === -1) {
        allImages.push(result.images[i]);
      }
    }
    // Adding high-resolution links for Google Map/Street Photos
	  var arr1 = [];
    var newIm = '';
	  var regex = RegExp('(.*(ggpht|googleusercontent).*?)(=|$)','i');
    for (let i = l; i < allImages.length; i++) {
      if (regex.test(allImages[i])) {
        var temp_elem = allImages[i];
        allImages.splice(i,1) 
        i--;
        newIm = regex.exec(temp_elem)[1] + '=s16383';
        if ((arr1.indexOf(newIm) === -1)&&(allImages.indexOf(newIm) === -1)) {
          arr1.push(newIm);
        } else {
        //do nothing
        }
      }
    }
    // Adding high-resolution links for reduced images (by resize command)
	  regex = RegExp('(.*[\?&])resize=[^&]+($|&)(.*)','i');
    for (let i = l; i < allImages.length; i++) {
      if (regex.test(allImages[i])) {
        var re = regex.exec(allImages[i]);
        newIm = re[1]+re[3];
        if (newIm[newIm.length-1] === '?') {
          newIm = newIm.slice(0, newIm.length - 1);
        }
        if ((arr1.indexOf(newIm) === -1)&&(allImages.indexOf(newIm) === -1)) {
          arr1.push(newIm);
        } else {
        //do nothing
        }
      }
    }
    // Adding high-resolution links for cloudfront.net
	  regex = RegExp('(.*\.cloudfront\.net\/.*)\/m\/(.*)','i');
    for (let i = l; i < allImages.length; i++) {
      if (regex.test(allImages[i])) {
        var re = regex.exec(allImages[i]);
        newIm = re[1]+'/3x/'+re[2];
        if ((arr1.indexOf(newIm) === -1)&&(allImages.indexOf(newIm) === -1)) {
          arr1.push(newIm);
        } else {
        //do nothing
        }
      }
    }
	  
	  // Adding high-resolution previews and thumbnails for Youtube links
	  var arr2 = [];
    var yid = '';
	  regex = RegExp('(ytimg|youtube).*(\\/vi\\/|\\?v=)([^\\/=]*)(\\/|=|$)','i');
    for (let i = l; i < allImages.length; i++) {
      if (regex.test(allImages[i])) {
        yid = regex.exec(allImages[i])[3];
        newIm = 'https://img.youtube.com/vi/' + yid + '/maxresdefault.jpg';
        if ((arr2.indexOf(newIm) === -1)&&(allImages.indexOf(newIm) === -1)) {
          arr2.push(newIm);
        }
        for (let i = 0; i < 4; i++) {
          newIm = 'https://img.youtube.com/vi/' + yid + '/' + i + '.jpg';
          if ((arr2.indexOf(newIm) === -1)&&(allImages.indexOf(newIm) === -1)) {
            arr2.push(newIm);
          }
        }
      }
    }
    allImages = allImages.concat(arr1).concat(arr2);
	  
    filterImages();
  });

  var timeoutID;
  function filterImages() {
    clearTimeout(timeoutID); // Cancel pending filtration
    timeoutID = setTimeout(function () {
      var images_cache = $('#images_cache');
      if (ls.show_image_width_filter === 'true' || ls.show_image_height_filter === 'true') {
        var cached_images = images_cache.children().length;
        if (cached_images < allImages.length) {
          for (var i = cached_images; i < allImages.length; i++) {
            // Refilter the images after they're loaded in cache
            images_cache.append($('<img src="' + (allImages[i]) + '" />').on('load', filterImages));
          }
        }
      }

      // Copy all images initially
      visibleImages = allImages.slice(0);

      if (ls.show_url_filter === 'true') {
        var filterValue = $('#filter_textbox').val();
        if (filterValue) {
          switch (ls.filter_url_mode) {
            case 'normal':
              var terms = filterValue.split(' ');
              visibleImages = visibleImages.filter(function (url) {
                for (var i = 0; i < terms.length; i++) {
                  var term = terms[i];
                  if (term.length !== 0) {
                    var expected = (term[0] !== '-');
                    if (!expected) {
                      term = term.substr(1);
                      if (term.length === 0) {
                        continue;
                      }
                    }
                    var found = (url.indexOf(term) !== -1);
                    if (found !== expected) {
                      return false;
                    }
                  }
                }
                return true;
              });
              break;
            case 'wildcard':
              filterValue = filterValue.replace(/([.^$[\]\\(){}|-])/g, '\\$1').replace(/([?*+])/, '.$1');
              /* fall through */
            case 'regex':
              visibleImages = visibleImages.filter(function (url) {
                try {
                  return url.match(filterValue);
                }
                catch (e) {
                  return false;
                }
              });
              break;
          }
        }
      }

      if (ls.show_only_images_from_links === 'true' && ls.only_images_from_links === 'true') {
        visibleImages = visibleImages.filter(function (url) {
          return linkedImages[url];
        });
      }

      if (ls.show_image_width_filter === 'true' || ls.show_image_height_filter === 'true') {
        visibleImages = visibleImages.filter(function (url) {
          var image = images_cache.children('img[src="' + (url) + '"]')[0];
          return (ls.show_image_width_filter !== 'true' ||
                   (ls.filter_min_width_enabled !== 'true' || ls.filter_min_width <= image.naturalWidth) &&
                   (ls.filter_max_width_enabled !== 'true' || image.naturalWidth <= ls.filter_max_width)
                 ) &&
                 (ls.show_image_height_filter !== 'true' ||
                   (ls.filter_min_height_enabled !== 'true' || ls.filter_min_height <= image.naturalHeight) &&
                   (ls.filter_max_height_enabled !== 'true' || image.naturalHeight <= ls.filter_max_height)
                 );
        });
      }
  
      if (ls.show_sort_images_by_width === 'true' && ls.sort_by_size === 'true'){
        visibleImages = visibleImages.sort(function (url1, url2) {
          var image1 = images_cache.children('img[src="' + (url1) + '"]')[0];
          var image2 = images_cache.children('img[src="' + (url2) + '"]')[0];
          return (image2.naturalWidth + image2.naturalHeight) - (image1.naturalWidth + image1.naturalHeight);
        });
      } else {
        visibleImages = visibleImages.sort(function (url1, url2) {
          var image1 = images_cache.children('img[src="' + (url1) + '"]')[0];
          var image2 = images_cache.children('img[src="' + (url2) + '"]')[0];
          return  image2.naturalWidth - image1.naturalWidth;
        });
      }
      
      if (ls.show_sort_order === 'true' && ls.sort_order === 'true'){
        visibleImages = visibleImages.reverse();
      }
        
      imSizes = [];
      for (var i = 0; i < visibleImages.length; i++) {
        var image = images_cache.children('img[src="' + (visibleImages[i]) + '"]')[0];
          imSizes.push(image.naturalWidth + ' x ' + image.naturalHeight);
      }
        
      imTypes = [];
      for (var i = 0; i < visibleImages.length; i++) {
        var imageType = '---';
        var ext="unknown";
        try{
          if(visibleImages[i].indexOf("data:image/")==0){
            ext=/data:image\/(.*?)(\+|\;)/i.exec(visibleImages[i])[1];
          }else{
            ext = /^[^?]+\.([^.#&?=:/]*)([#&?=].*$|$)/i.exec(visibleImages[i])[1];
          }
        }catch(e){
          //console.log('Error in determining the type of ' + visibleImages[i] + '; error: ' + e);
        }
        if(/^(png|jpg|jpeg|gif|bmp|ico|tiff|svg|svgz|webp)$/i.test(ext))
          imageType=ext.toUpperCase();
        imTypes.push(imageType);
      }
    
      displayImages();
    }, 200);
  }

  function displayImages() {
    $('#download_button').prop('disabled', true);
  
    var images_table = $('#images_table').empty();

    var toggle_all_checkbox_row = '<tr><th align="left" colspan="' + ls.columns + '"><label><input type="checkbox" id="toggle_all_checkbox" />Select all (' + visibleImages.length + ')</label></th></tr>';
    images_table.append(toggle_all_checkbox_row);

    var columns = parseInt(ls.columns);
    var columnWidth = (Math.round(100 * 100 / columns) / 100) + '%';
    var rows = Math.ceil(visibleImages.length / columns);

    // Tools row
    var show_image_url = ls.show_image_url === 'true';
    var show_image_filename = ls.show_image_filename === 'true';
    var show_open_image_button = ls.show_open_image_button === 'true';
    var show_download_image_button = ls.show_download_image_button === 'true';

    // Append dummy image row to keep the popup width constant
    var dummy_row = $('<tr></tr>');
    var colspan = ((show_image_url ? 1 : 0) + (show_open_image_button ? 1 : 0) + (show_download_image_button ? 1 : 0)) || 1;
    for (var columnIndex = 0; columnIndex < columns; columnIndex++) {
      var dummy_cell = '<td colspan="' + colspan + '" style="min-width: ' + ls.image_max_width + 'px; width: ' + columnWidth + '; vertical-align: top;"></td>';
      dummy_row.append(dummy_cell);
    }
    images_table.append(dummy_row);

    for (var rowIndex = 0; rowIndex < rows; rowIndex++) {
      var conainer_row = $('<tr></tr>');
      for (var columnIndex = 0; columnIndex < columns; columnIndex++) {
        var conainer_td = $('<td colspan="' + colspan + '" style="min-width: ' + ls.image_max_width + 'px; width: ' + columnWidth + '; vertical-align: top;"></td>');
        var conainer_div = $('<div style = "background-color:' + ls.image_tile_color + '; box-shadow: 5px 5px 5px rgba(3,0,3,0.3); margin:5px 5px 5px 5px;"></div>');
        var conainer_table = $('<table></table>');
        var index = rowIndex * columns + columnIndex;
        if (index === visibleImages.length) break;
          
        // Tools row
        if (show_image_url || show_open_image_button || show_download_image_button) {
          var tools_row = $('<tr></tr>');
          var links_row = $('<div></div>');
          if (show_image_url) {
            links_row.append('<td><div class="image_url_textbox" data-url="' + visibleImages[index] + '" style="margin: 3px 0px 3px 2px; background:' + ls.image_border_color + '" title="Click to copy: ' + visibleImages[index] + '">link</div></td>');
          
            links_row.append('<td style="padding: 0px 0px;"><div class="image_gris_textbox" data-url="' + visibleImages[index] + '" style="margin: 3px 0px 3px 0px; background:' + ls.image_border_color + '" title="RIS with Google Image">GI</div></td>');
          
            links_row.append('<td style="padding: 0px 0px;"><div class="image_teris_textbox" data-url="' + visibleImages[index] + '" style="margin: 3px 0px 3px 0px; background:' + ls.image_border_color + '" title="RIS with TinEye">TE</div></td>');
          
            links_row.append('<td style="padding: 0px 0px;"><div class="image_biris_textbox" data-url="' + visibleImages[index] + '" style="margin: 3px 0px 3px 0px; background:' + ls.image_border_color + '" title="RIS with Bing">BI</div></td>');
          
            links_row.append('<td style="padding: 0px 0px;"><div class="image_yaris_textbox" data-url="' + visibleImages[index] + '" style="margin: 3px 0px 3px 0px; background:' + ls.image_border_color + '" title="RIS with Yandex">YA</div></td>');
            
            tools_row.append(links_row);
          }
          
          if (show_open_image_button) {
            tools_row.append('<td class="open_image_button" style="background:' + ls.image_border_color + '" data-url="' + visibleImages[index] + '" title="Open in new tab">&nbsp;</td>');
          }
          
          if (show_download_image_button) {
            tools_row.append('<td class="download_image_button" style="background:' + ls.image_border_color + '" data-url="' + visibleImages[index] + '" title="Download">&nbsp;</td>');
          }
          conainer_table.append(tools_row);
        }
          
        // Images row
        var images_row = $('<tr></tr>');
        if (/base64/i.test(visibleImages[index])) {
          var filename = 'base64';
        } else {
          var arr = visibleImages[index].split('/');
          var filename = /^([^#&?=]*)([#&?=].*$|$)/i.exec(arr[arr.length-1])[1];
        }
        var image = '<td colspan="' + colspan + '" style="padding: 0px 2px; min-width: ' + ls.image_max_width + 'px; width: ' + columnWidth + '; vertical-align: top; text-align: center;"><img id="image' + index + '" loading="lazy" src="' + visibleImages[index] + '" style="max-height:' + ls.image_max_width + 'px;" title = "' + filename + '"/></td>';
        images_row.append(image);
        conainer_table.append(images_row);    
        
        if (show_image_filename) {
          // Image filenames row
          var filenames_row = $('<tr></tr>');
          var filenames_txt = '<td colspan="' + colspan + '" style="min-width: ' + ls.image_max_width + 'px; width: ' + columnWidth + '; vertical-align: top;">' + 
          '<input type="text" class="filename_textbox" value="' + filename + '" readonly />' + '</td>';
          filenames_row.append(filenames_txt);
          conainer_table.append(filenames_row);  
        }
        
        if (show_image_url) {
          // Sizes row
          var size_row = $('<tr></tr>');
          var size_txt = '<td colspan="' + colspan + '" style="min-width: ' + ls.image_max_width + 'px; width: ' + columnWidth + '; vertical-align: top;"><div class="image_url_textbox" data-url="' + filename + '"  title="Click to copy: ' + filename + '" style = "background:' + ls.image_border_color + '">' + imTypes[index] + '</div><div class = "image_size_textbox" data-width = "' + imSizes[index].split(' ')[0] + '" data-height = "' + imSizes[index].split(' ')[2] + '" style="float: right; background:' + ls.image_border_color + '" title="Click to set size filters">' + imSizes[index] + '</div></td>';
          size_row.append(size_txt);
          conainer_table.append(size_row);  
        }
          
        conainer_div.append(conainer_table);
        conainer_td.append(conainer_div);
        
        conainer_row.append(conainer_td);
          
        images_table.append(conainer_row);      
      }
    }
  }

  function downloadImages() {
    if (ls.show_download_confirmation === 'true') {
      showDownloadConfirmation(startDownload);
    }
    else {
      startDownload();
    }

    function startDownload() {
      var checkedImages = [];
      for (var i = 0; i < visibleImages.length; i++) {
        if ($('#image' + i).hasClass('checked')) {
          checkedImages.push(visibleImages[i]);
        }
      }
      ls.image_count = checkedImages.length;
      ls.image_number = 1;
      
      var downloading_notification = $('<div class="success">Downloading ' + checkedImages.length + ' image' + (checkedImages.length > 1 ? 's' : '') + '...</div>').appendTo('#filters_container');
      
      for (var i = 0; i < checkedImages.length; i++) {
        chrome.downloads.download({ url: checkedImages[i] });
        downloading_notification.html("Downloading, DO NOT close popup. " + (i+1) + "out of " + checkedImages.length + " images submitted");
      }
      downloading_notification.html("All " + i + " downloads submitted");

      //flashDownloadingNotification(ls.image_count);
      flash(downloading_notification, 3.5, 0, function () { downloading_notification.remove(); });
    }
  }

  function showDownloadConfirmation(startDownload) {
    var notification_container =
      $(
        '<div>\
          <div>\
            <hr/>\
            Take a quick look at your Chrome settings and search for the <b>download location</b>.\
            <span class="danger">If the <b>Ask where to save each file before downloading</b> option is checked, proceeding might open a lot of popup windows. Are you sure you want to do this?</span>\
          </div>\
          <input type="button" id="yes_button" class="success" value="YES" />\
          <input type="button" id="no_button" class="danger" value="NO" />\
          <label><input type="checkbox" id="dont_show_again_checkbox" />Don\'t show this again</label>\
        </div>'
      )
      .appendTo('#filters_container');

    $('#yes_button, #no_button').on('click', function () {
      ls.show_download_confirmation = !$('#dont_show_again_checkbox').prop('checked');
      notification_container.remove();
    });
    $('#yes_button').on('click', startDownload);
  }

  function flashDownloadingNotification(imageCount) {
    if (ls.show_download_notification !== 'true') return;

    var downloading_notification = $('<div class="success">Downloading ' + imageCount + ' image' + (imageCount > 1 ? 's' : '') + '...</div>').appendTo('#filters_container');
    flash(downloading_notification, 3.5, 0, function () { downloading_notification.remove(); });
  }

  function flash(element, flashes, interval, callback) {
    if (!interval) interval = parseInt(ls.animation_duration);

    var fade = function (fadeIn, flashes) {
      if (flashes > 0) {
        flashes -= 0.5;
        if (fadeIn) {
          element.fadeIn(interval, function() { fade(false, flashes) });
        }
        else {
          element.fadeOut(interval, function() { fade(true, flashes) });
        }
      }
      else if (callback) {
        callback(element);
      }
    };
    fade(false, flashes);
  }

  $(function () {
    initializePopup();
    initializeStyles();
  });
}(localStorage));
