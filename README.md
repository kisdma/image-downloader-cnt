Image Downloader Continued (IDC)
================
This is a fork of Image Downloader by Vlad Sabev (vdsabev). Original extension isn't updated and this projects aims to fill the gap. The goal is to fix bugs, support more websites (as many as possible), add new features and enhancements. Suggestions are welcome - please file an issue on github! IDC is not for sale, and will always be free, open-source, and without ads or tracking algorithms of any kind! You can find the source code here: https://github.com/kisdma/image-downloader-cnt

Description
================
If you need to bulk download images from a web page, with this extension you can:
- See images that the page contains and links to
- Filter them by width, height, and URL; supports wildcard and regex
- Select images to download by clicking on the image
- Use dedicated buttons to download or open individual images in new tabs
- Customize image display width, columns, border size, and colour
- Hide filters, buttons and notifications you don't need

When you press the "Download" button, all selected images are saved to the default download directory of Chrome, or to a directory inside it if you specify a subfolder name.

WARNING: If you haven't set up a default download directory, you will have to manually choose the save location for each image, which might open a lot of popup windows. It is not recommended to attempt to download too many images at once without a default download directory.

Change Log
================
2.9
- Fixed a bug in relative url restoration
- Added higher resolution images discovery for cloudfront.net 
- Restored parsing of 'link rel="mask-icon"' (previously disabled)
2.8:  
Improved image discovery and collection, many bugfixes
- Added injection script to prevent pages from closing shadowDOM (that made images inside undiscoverable). Note: websites use this to circumvent adblockers
- Added image discovery in shadowDOM
- Added css style insertion to prevent adblocking of images added by IDC (affects only elements with class 'idc-image')
- Added a listener to track DOM changes and discover intermittent images like webp (moving gif-like images) from youtube, or continuously added/deleted images like in instagram scrolling
- Added saving the list of discovered images into serialized array in hidden tag on the page (disappears when page is updated)
- Fixed bug in number of submitted downloads (was +1)
- Improved regexp for better image discovery in 'style' tags (was missing some data:image urls)
- Cleaned and moved to a function the code that checks and translates (if needed) relative urls to absolute. Used this function for tags where this check was missing
- Improved an observer to make it discover more images from temporal elements like popups (extended the attribute filter list)
- Improved image discovery in 'svg' tag - if it contains image tag(s), then returns images from them, instead of building base64 svg
- Removed encodeURI() from the code that populates and accesses the image cache. Not sure what was the purpose of it since incoming links are extracted from tags where they're supposed to be already encoded. This was breaking links that were already encoded and had special characters escaped (discovered this on wikipedia - links with parenthesis)
- Fixed a bug in parsing 'source' tag - added support of list with different resolutions in 'srcset' (1x, 2x, etc.)
- Fixed a bug: duplicate youtube images addition in popup.js
- Fixed a bug: incorrect urls were constructed when base url were ending with backslash
- Fixed a bug in parsing img tag
- Fixed a bug in relativeUrlToAbsolute - was returning "undefined" if empty input
- Added discovery of links with "resize" command for a server in the query part of url - addition of links without the command provides images with higher resolution

2.7:  
Improved image discovery, bug fixes in code and design
- Added parsing of the attribute 'srcset' and 'lowsrc' in 'img' tags
- Added parsing of the attribute 'srcset' in 'source' tags (inside of html5 'picture' tag) 
- Added canvas to image conversion - powerful technique to extract highly protected images (not even showing in Resources tab of Dev Tools). Note: at this time added images will pile up each time the extension button is clicked. They can be removed by updating the page.
- Added check for long image urls (most probably data:image) and placement of them on top of the page instead of sending to the popup (to be coherent with canvas-to-image conversion which can produce large strings of data:image/jpeg)
- Added selection of text info-shortcuts' colour (combined in one option with image selection colour) on options page. Icons are colourized accordingly too
- Commented out an obsolete code to open Options page after install and check for versions before 2.1 (in defaults.js)
- Commented out the minimum width option since it's currently broken (not sure if it's useful) (in options.html)
- Made max-height to follow max-width option (to work better if small image preview is selected)
- Replaced zepto.js with original unobfuscated source code
- Fixed flashing animation for download message (apparently it was broken since the switch from jquery to zepto)

2.6:  
Major redesign and improved image discovery
- Modernized the popup look, images are placed on tiles with more image info, added tile color selection to options 
- Fixed several bugs, improved image discovery for many cases, including deep css parsing instead of broken styleSheets api
- Added shortcuts to Reverse Image Search sites (Google, Bing, Yandex, TinEye) for each image

2.5:  
- Added display of image size and image file name (can be turned off in settings)
- Added ordering images by size - two new options: 1) to order by width only (default) or by width+height, 2) largest-to-smallest (default) or reverse
- Added scaling images vertically if they taller than 200px
- SVG format wasn't being read from 'svg' tag - fixed 
- Added reading image from 'poster' of 'video' tag
- Fixed background images being non-recognized. Reading styleSheets doesn't seem to work (to read from cssRules). Workaround implemented: fetching CSS files with links obtained from 'link' tags. Note: some sites use different second-level domain to store CSS, in this case fetch won't work if extension doesn't have permission for 'all_urls' (or particular domain). This just results in some images not showing up. Remove permission in Chrome Extensions if this is a concern.
- Added maximum-resolution images discovery on Google Maps and Street View Photos (discovered undocumented api) 
- Added high-resolution previews for youtube thumbnails (including video of the current page)
- Corrected regexp for 'a' tag's link parsing to prevent non-image links discovery

2.4.2:
- Workaround for Chrome disallowing access to cross-domain CSS rules

2.4.1:
- Fixed an issue where invalid URLs would break the extension - https://github.com/vdsabev/image-downloader/issues/23
- Updated Zepto.js to 1.2.0

2.4:
- Added an option for renaming files before downloading

2.3:
- Added support for BMP, SVG, and WebP images
- Added support for relative URLs
- Improved popup loading speed by searching through less elements
- Replaced deprecated `chrome.extension` calls with `chrome.runtime`

2.2:
- Removed the unnecessary permission to access tabs
- Removed the donation prompt due to complains from some users that it doesn't disappear after the first time as it should; now, the options page will be opened on first install instead
- Save the value of the URL filter
- Another attempt to fix some sizing issues

2.1:
- Added image width / height filters
- Added a one-time reset of all settings due to some people having sizing issues
- Removed the sort by URL option

2.0:
- Added the ability to save the files to a subfolder
- Utilized the Google Chrome downloads API
- Implemented a cleaner, grid-based design
- Clicking on an image URL textbox will now automatically select the text so users can copy it
- Fixed a few minor display issues
- Added settings for number of columns, removed border style setting
- Added donation buttons on the options page

1.3:
- Images used in a style tag will now also be included at the end of the list. Only images from inline style attributes of elements used to be included.
- Added support for data URI
- Several bug fixes and optimizations

1.2:
- Changed the URL above the image to be displayed in a read-only textbox
- Moved the image checkboxes to the top and added open & download buttons below each
- Initially disabled the "Download" button and "All" checkbox
- Introduced a few new options to hide filters, buttons and notification
- Removed the body width option; the width of the popup now resizes relatively to the maximum image width option
- Streamlined the design

1.1:
- Fixed saving of minimum and maximum image width
- Added the URL above the image itself and an option to toggle it
- Added wildcard filter mode (alongside normal and regex)
- The state of the selected filters will now be saved
- Moved the "Sort by URL" option back to the filters
- Added a "Clear Data" button to options page. While the extension does not use a lot of local storage yet, someone might appreciate the option.
- Refactored a lot of code, especially the use of local storage

1.0.13:
- Added a notification to let the user know that download has started
- Added some animations and polished the options notifications a bit more
- Fixed some event handlers that were being attached multiple times

1.0.12:
- Migrated to jQuery
- Implemented indeterminate state for "All" checkbox
- The "Download" button will now be disabled if no images are checked
- Fixed a bug with reseting options - now the user can choose to save the reset values or simply cancel the reset by reloading the page - just like it says in the notification

1.0.11:
- Changed the download mechanism to support Chrome v21+
- Added an "Only show linked images" filter option that can be useful when you only want to download images that are in a URL on the page.

1.0.10:
- Added a download confirmation

1.0.9:
- The number of images will now be displayed next to the "All" checkbox

1.0.8:
- Added detection of image URLs in anchor tags; note that this feature will not detect URLs that don't have .jpg, .jpeg, .gif or .png file extensions - it relies on a regular expression as to avoid possibly sending hundreds of requests to external servers

1.0.7:
- Removed the desktop notification system that popped up when you press "Download" in favor of a text description that should feel easier to control (through Options) and less intrusive; this should also require less permissions for the extension
- Added an option to hide the download notification; most people should understand the download process after only reading it once
- Made some minor UI tweaks

1.0.6:
- Fixed an issue with multiple unnecessary empty images

1.0.5:
- Elements that display an image using the "background-image" CSS property will now also be extracted

1.0.4:
- Added a notification that alerts the user when the download process has begun and explains where to look for the files

Credits
================
Based on the Google Chrome Extension sample "Download Selected Links": https://developer.chrome.com/extensions/examples/api/downloads/download_links.zip

Uses the tiny, but awesome JSS library: https://github.com/Box9/jss

And Zepto.js: http://zeptojs.com

Images:
download.svg licensed by CC BY 3.0 from oNline Web Fonts http://www.onlinewebfonts.com/icon
open.svg licensed by CC BY 3.0 from oNline Web Fonts http://www.onlinewebfonts.com/icon

License
================
Copyright (c) 2019 Dmitry Kislitsyn, Vladimir Sabev

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.