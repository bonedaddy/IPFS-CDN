/* globals validate, resources */
'use strict';

var cache = {};

function badge (tabId) {
	if (!cache[tabId]) {
		return;
	}
	chrome.browserAction.setBadgeText({
		tabId,
		text: (cache[tabId].length || '') + ''
	});
	let title = cache[tabId].map((o, i) => (i + 1) + '. ' + o.hostname + ' -> ' + o.pathname.split('/').pop()).join('\n');
	title = 'IPFS CDN' + (title ? '\n\n' + title : '');
	chrome.browserAction.setTitle({
		tabId,
		title
	});
}

function observe (details) {
	let url = new URL(details.url);

	if (url.host + url.pathname in resources) {
		if (cache[details.tabId]) {
			cache[details.tabId].push({hostname: url.hostname, pathname: url.pathname});
			badge(details.tabId);
		} else {
			console.log('resource is redirected but no tab is found');
		}
		return {
			redirectUrl: 'https://ipfs.io/ipfs/' + resources[url.host + url.pathname]
		}
	} else {
		console.log("not found")
	}
}

chrome.webRequest.onBeforeRequest.addListener(observe, {
		urls: domainFilters,
		types: ['script', 'xmlhttprequest']
	},
	['blocking']
);

// resetting toolbar badge
chrome.webRequest.onBeforeRequest.addListener(d => {
	if (cache[d.tabId]) {
		cache[d.tabId] = [];
		badge(d.tabId);
	}
}, {
	urls: ['<all_urls>'],
	types: ['main_frame']
}, []);
// badge
chrome.tabs.query({}, tabs => tabs.forEach(t => cache[t.id] = []));
chrome.tabs.onCreated.addListener((tab) => cache[tab.id] = []);
chrome.browserAction.setBadgeBackgroundColor({
	color: '#818181'
});
// cleanup
chrome.tabs.onRemoved.addListener((tabId) => delete cache[tabId]);
