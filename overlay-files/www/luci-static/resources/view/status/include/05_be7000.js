'use strict';
'require baseclass';
'require rpc';

// Project card at the top of Status, Overview: build version and links to
// the repository, releases, the 4PDA topic and the build's own pages.

var REPO = 'https://github.com/timofey-maykov/be7000-openwrt';
var FORUM = 'https://4pda.to/forum/index.php?showtopic=1070166';

var callSystemBoard = rpc.declare({ object: 'system', method: 'board' });

var TEXT = {
	ru: {
		sub: 'OpenWrt для Xiaomi BE7000 на ядре 6.18',
		version: 'Версия',
		github: 'Исходники на GitHub',
		releases: 'Релизы',
		forum: 'Тема на 4PDA',
		issues: 'Сообщить об ошибке',
		update: 'Обновление сборки',
		credits: 'Благодарности'
	},
	en: {
		sub: 'OpenWrt for the Xiaomi BE7000 on kernel 6.18',
		version: 'Version',
		github: 'Sources on GitHub',
		releases: 'Releases',
		forum: '4PDA topic',
		issues: 'Report a problem',
		update: 'Build update',
		credits: 'Credits'
	}
};

var ICONS = {
	code: 'M8 6l-6 6 6 6M16 6l6 6-6 6',
	tag: 'M3 12V4h8l10 10-8 8L3 12zM7.5 8.5h.01',
	chat: 'M4 5h16v11H9l-5 4V5z',
	bug: 'M12 3v2M5 8l2 1M19 8l-2 1M4 14h3M17 14h3M5 20l2-2M19 20l-2-2M8 10a4 4 0 0 1 8 0v5a4 4 0 0 1-8 0v-5z',
	update: 'M4 12a8 8 0 0 1 14-5.3M20 4v5h-5M20 12a8 8 0 0 1-14 5.3M4 20v-5h5',
	heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z'
};

var CSS = `
.be7k-card{display:flex;flex-wrap:wrap;align-items:center;gap:14px 20px;padding:4px 2px 2px}
.be7k-logo{flex:none;width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;
	background:linear-gradient(135deg,var(--nb-accent,#4f46e5),var(--nb-accent-2,#06b6d4));color:#fff}
.be7k-head{flex:1 1 220px;min-width:0}
.be7k-name{font-size:17px;font-weight:650;letter-spacing:-.01em;color:var(--nb-text,inherit);text-decoration:none}
.be7k-name:hover{text-decoration:underline}
.be7k-sub{margin-top:2px;font-size:13px;color:var(--nb-text-2,inherit);opacity:.9}
.be7k-ver{display:inline-block;margin-top:8px;padding:2px 9px;border-radius:999px;font:12px/1.6 var(--font-mono,ui-monospace,Menlo,Consolas,monospace);
	background:var(--nb-accent-soft,rgba(79,70,229,.09));color:var(--nb-accent-strong,var(--nb-accent,#4f46e5))}
.be7k-links{flex:1 1 360px;display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}
.be7k-links a{display:inline-flex;align-items:center;gap:7px;padding:7px 12px;border-radius:9px;font-size:13px;line-height:1.2;white-space:nowrap;
	text-decoration:none;color:var(--nb-text,inherit);background:var(--nb-surface-2,rgba(128,128,128,.08));
	border:1px solid var(--nb-border,rgba(128,128,128,.25));transition:border-color .15s,background .15s,color .15s}
.be7k-links a:hover{border-color:var(--nb-accent,#4f46e5);color:var(--nb-accent,#4f46e5);background:var(--nb-accent-soft,rgba(79,70,229,.09))}
.be7k-links a.be7k-main{background:var(--nb-accent,#4f46e5);border-color:var(--nb-accent,#4f46e5);color:var(--nb-on-accent,#fff)}
.be7k-links a.be7k-main:hover{background:var(--nb-accent-strong,#4338ca);color:var(--nb-on-accent,#fff)}
.be7k-links svg{width:15px;height:15px;flex:none}
@media (max-width:640px){.be7k-links{justify-content:flex-start}}
`;

function icon(name) {
	var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	svg.setAttribute('viewBox', '0 0 24 24');
	svg.setAttribute('fill', 'none');
	svg.setAttribute('stroke', 'currentColor');
	svg.setAttribute('stroke-width', '2');
	svg.setAttribute('stroke-linecap', 'round');
	svg.setAttribute('stroke-linejoin', 'round');
	svg.setAttribute('aria-hidden', 'true');
	path.setAttribute('d', ICONS[name]);
	svg.appendChild(path);
	return svg;
}

function link(href, name, text, cls) {
	var ext = /^https?:/.test(href);
	return E('a', {
		'href': href,
		'class': cls || '',
		'target': ext ? '_blank' : null,
		'rel': ext ? 'noopener' : null
	}, [ icon(name), text ]);
}

return baseclass.extend({
	title: /^en/i.test(document.documentElement.lang || '') ? 'Project' : 'Проект',

	load: function() {
		return L.resolveDefault(callSystemBoard(), {});
	},

	render: function(board) {
		var tx = TEXT[/^en/i.test(document.documentElement.lang || '') ? 'en' : 'ru'];
		var ver = (L.isObject(board.release) ? board.release.version : '') || '';

		ver = ver.replace(/^BE7000\s+/, '');

		if (!document.getElementById('be7k-css'))
			document.head.appendChild(E('style', { 'id': 'be7k-css' }, CSS));

		return E('div', { 'class': 'be7k-card' }, [
			E('div', { 'class': 'be7k-logo' }, [ icon('code') ]),
			E('div', { 'class': 'be7k-head' }, [
				E('a', { 'class': 'be7k-name', 'href': REPO, 'target': '_blank', 'rel': 'noopener' }, 'be7000-openwrt'),
				E('div', { 'class': 'be7k-sub' }, tx.sub),
				ver ? E('span', { 'class': 'be7k-ver' }, tx.version + ' ' + ver) : ''
			]),
			E('div', { 'class': 'be7k-links' }, [
				link(REPO, 'code', tx.github, 'be7k-main'),
				link(REPO + '/releases', 'tag', tx.releases),
				link(FORUM, 'chat', tx.forum),
				link(REPO + '/issues', 'bug', tx.issues),
				link(L.url('admin/system/be7000-update'), 'update', tx.update),
				link(L.url('admin/system/credits'), 'heart', tx.credits)
			])
		]);
	}
});
