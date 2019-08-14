const injectedScript = document.createElement('script');
injectedScript.src = chrome.extension.getURL('/scripts/injected.js');
(document.head || document.documentElement).appendChild(injectedScript);