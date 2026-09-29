'use strict';
'require view';
'require request';
'require fs';

// Names, links and texts live in be7000-credits/credits.json, the SSH
// banner is built from the same file (/usr/libexec/be7000-banner).

var LOGO = [
	' ______                         ________ ______ _______',
	'|   __ \\.-----.---.-.--------. |  |  |  |   __ \\_     _|',
	'|   __ <|  -__|  _  |        | |  |  |  |      < |   |',
	'|______/|_____|___._|__|__|__| |________|___|__| |___|',
	'          W I - F I   7   F O R   B E 7 0 0 0'
].join('\n');

var TEXT = {
	ru: {
		hello: 'Спасибо всем, без кого этой сборки бы не было.',
		star: 'на его плате нашлась причина',
		more: 'исходники, релизы и обсуждение',
		support: 'поддержать проект',
		crypto: 'криптовалюта и WeChat'
	},
	en: {
		hello: 'Thanks to everyone this build would not exist without.',
		star: 'the fix was found on his board',
		more: 'sources, releases and discussion',
		support: 'support the project',
		crypto: 'crypto and WeChat'
	}
};

var CSS = `
.bct{max-width:1000px;margin:6px auto 28px;border-radius:12px;overflow:hidden;background:#0d1117;
	box-shadow:0 22px 50px -24px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.04)}
.bct-bar{height:36px;background:#161b22;display:flex;align-items:center;gap:8px;padding:0 14px;border-bottom:1px solid #21262d}
.bct-bar i{width:12px;height:12px;border-radius:50%;display:inline-block}
.bct-bar span{margin-left:10px;color:#8b949e;font:12px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.bct-in{padding:22px 26px 26px;font:13.5px/1.62 ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;color:#c9d1d9;overflow-x:auto}
.bct-logo{color:#58a6ff;white-space:pre;margin:0 0 14px;line-height:1.25}
.bct-hi{color:#7ee787}
.bct-dim{color:#8b949e}
.bct-gt{color:#8b949e;margin:20px 0 6px}
.bct-p{margin:0 0 9px}
.bct-pr{color:#7ee787;user-select:none}
.bct a{color:#58a6ff!important;text-decoration:none!important}
.bct a:hover{text-decoration:underline!important}
.bct-site{color:#6e7681;font-size:12px}
.bct-star{color:#f2cc60}
.bct-d{color:#8b949e;padding-left:18px}
.bct-cur{display:inline-block;width:8px;height:16px;background:#c9d1d9;vertical-align:-3px;animation:bct-b 1.1s steps(1) infinite}
@keyframes bct-b{50%{opacity:0}}
`;

return view.extend({
	load: function() {
		return Promise.all([
			request.get(L.resource('be7000-credits/credits.json')).then(function(r) { return r.json(); }),
			L.resolveDefault(fs.read('/etc/be7000-release'), '')
		]);
	},

	render: function(data) {
		var d = data[0];
		var ver = (String(data[1]).match(/^VERSION=(.+)$/m) || [])[1];
		var lang = /^en/i.test(document.documentElement.lang || '') ? 'en' : 'ru';
		var tx = TEXT[lang];
		var t = function(o) { return o[lang] || o.ru; };
		var body = [];

		body.push(E('div', { 'class': 'bct-logo' }, LOGO));
		body.push(E('div', { 'class': 'bct-hi' }, 'Beam WRT' + (ver ? ' ' + ver : '') + '. ' + tx.hello));

		d.groups.forEach(function(g) {
			body.push(E('div', { 'class': 'bct-gt' }, '# ' + t(g.title)));
			g.people.forEach(function(p) {
				body.push(E('div', { 'class': 'bct-p' }, [
					E('span', { 'class': 'bct-pr' }, '$ '),
					E('a', { 'href': p.url, 'target': '_blank', 'rel': 'noopener' }, p.name),
					' ',
					E('span', { 'class': 'bct-site' }, '(' + p.site + ')'),
					p.star ? E('span', { 'class': 'bct-star' }, ' [' + tx.star + ']') : '',
					E('div', { 'class': 'bct-d' }, t(p))
				]));
			});
		});

		body.push(E('div', { 'class': 'bct-gt' }, '# ' + tx.more));
		body.push(E('div', { 'class': 'bct-p' }, [
			E('span', { 'class': 'bct-pr' }, '$ '),
			'open ',
			E('a', { 'href': d.project, 'target': '_blank', 'rel': 'noopener' }, d.project.replace('https://', ''))
		]));
		if (d.support) {
			body.push(E('div', { 'class': 'bct-gt' }, '# ' + tx.support));
			body.push(E('div', { 'class': 'bct-p' }, [
				E('span', { 'class': 'bct-pr' }, '$ '),
				'open ',
				E('a', { 'href': d.support.url, 'target': '_blank', 'rel': 'noopener' }, d.support.url.replace('https://', '')),
				' ',
				E('span', { 'class': 'bct-site' }, '(Boosty)')
			]));
			body.push(E('div', { 'class': 'bct-p' }, [
				E('span', { 'class': 'bct-pr' }, '$ '),
				'open ',
				E('a', { 'href': t(d.support.more), 'target': '_blank', 'rel': 'noopener' }, 'README'),
				' ',
				E('span', { 'class': 'bct-site' }, '(' + tx.crypto + ')')
			]));
		}

		body.push(E('div', { 'class': 'bct-p' }, [ E('span', { 'class': 'bct-pr' }, '$ '), E('span', { 'class': 'bct-cur' }) ]));

		return E('div', { 'class': 'bct' }, [
			E('style', {}, CSS),
			E('div', { 'class': 'bct-bar' }, [
				E('i', { 'style': 'background:#ff5f56' }),
				E('i', { 'style': 'background:#ffbd2e' }),
				E('i', { 'style': 'background:#27c93f' }),
				E('span', {}, 'root@BeamWRT: ~/credits')
			]),
			E('div', { 'class': 'bct-in' }, body)
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
