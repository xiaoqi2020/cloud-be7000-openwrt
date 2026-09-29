'use strict';
'require baseclass';
'require rpc';
'require ui';
'require network';

// 5 GHz split block at the top of Network, Wireless (wireless.js requires
// this module). Mode, what each mode gives, live state of the 5 GHz radios
// and the switch. The switch itself is be7000-5g-split behind the rpcd
// object be7000-wifi5g (/usr/share/rpcd/ucode/be7000-wifi5g).

var callStatus = rpc.declare({ object: 'be7000-wifi5g', method: 'status' });
var callSet = rpc.declare({ object: 'be7000-wifi5g', method: 'set', params: [ 'split' ] });

var PCI = '0002:01:00.0';

var T = {
	ru: {
		title: 'Режим 5 ГГц',
		lead: 'Радиомодуль 5 ГГц (QCN9274) работает как одно радио на весь диапазон или, как 5G-1 и 5G-2 в стоке, как два независимых радио. Режим можно сменить здесь, без перезагрузки роутера.',
		now: 'Сейчас',
		single: 'Одно радио',
		split: 'Два радио',
		singleTag: 'как 5G в стоке',
		splitTag: 'как 5G-1 и 5G-2 в стоке',
		singleItems: [
			'одна точка доступа на весь диапазон 5 ГГц',
			'доступны все каналы, включая DFS 100-144',
			'ширина канала до 160 МГц'
		],
		splitItems: [
			'нижнее радио на каналах 36-64, верхнее от 149 и выше',
			'у каждого свой канал и свои клиенты, работают одновременно',
			'каналы 100-144 в этом режиме недоступны'
		],
		active: 'включён',
		radios: 'Радио 5 ГГц сейчас',
		ch: 'канал',
		low: 'Нижнее',
		high: 'Верхнее',
		one: 'Радио 5 ГГц',
		mhz: 'МГц',
		clients: function(n) {
			var m10 = n % 10, m100 = n % 100;
			if (m10 == 1 && m100 != 11) return 'клиент';
			if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'клиента';
			return 'клиентов';
		},
		off: 'выключено',
		toSplit: 'Разделить на два радио',
		toSingle: 'Вернуть одно радио',
		busy: 'Переключаю режим. Wi-Fi 5 ГГц пропадёт примерно на полминуты, клиенты переподключатся сами.',
		pending: 'Есть неприменённые изменения Wi-Fi. Сначала примените или отмените их.',
		na: 'Недоступно: в этой сборке нет драйвера с поддержкой разделения.',
		confirmTitle: 'Сменить режим 5 ГГц?',
		confirmSplit: 'У нижнего радио появятся копии сетей 5 ГГц с теми же именами и паролями, каналы для начала 36 и 149. Их можно поменять ниже, в списке сетей.',
		confirmSingle: 'Второе радио и его копии сетей будут удалены, останется одно радио на весь диапазон.',
		confirmNote: 'Wi-Fi 5 ГГц пропадёт примерно на полминуты. Выбор переживает перезагрузку и обновление.',
		cancel: 'Отмена',
		go: 'Переключить',
		failed: 'Не получилось',
		done: 'Готово, обновляю страницу'
	},
	en: {
		title: '5 GHz mode',
		lead: 'The 5 GHz module (QCN9274) runs as one radio for the whole band or, like 5G-1 and 5G-2 on stock, as two independent radios. You can change the mode here, the router does not reboot.',
		now: 'Now',
		single: 'One radio',
		split: 'Two radios',
		singleTag: 'like 5G on stock',
		splitTag: 'like 5G-1 and 5G-2 on stock',
		singleItems: [
			'one access point for the whole 5 GHz band',
			'all channels, DFS 100-144 included',
			'channel width up to 160 MHz'
		],
		splitItems: [
			'lower radio on channels 36-64, upper from 149 up',
			'each has its own channel and clients, both run at once',
			'channels 100-144 are not available in this mode'
		],
		active: 'active',
		radios: '5 GHz radios now',
		ch: 'channel',
		low: 'Lower',
		high: 'Upper',
		one: '5 GHz radio',
		mhz: 'MHz',
		clients: function(n) { return n == 1 ? 'client' : 'clients'; },
		off: 'off',
		toSplit: 'Split into two radios',
		toSingle: 'Back to one radio',
		busy: 'Switching. 5 GHz Wi-Fi is down for about half a minute, clients reconnect by themselves.',
		pending: 'There are unapplied Wi-Fi changes. Apply or revert them first.',
		na: 'Not available: this build has no driver support for the split.',
		confirmTitle: 'Change the 5 GHz mode?',
		confirmSplit: 'The lower radio gets copies of the 5 GHz networks with the same names and passwords, channels start at 36 and 149. You can change them below, in the network list.',
		confirmSingle: 'The second radio and its network copies are removed, one radio for the whole band stays.',
		confirmNote: '5 GHz Wi-Fi is down for about half a minute. The choice survives reboots and updates.',
		cancel: 'Cancel',
		go: 'Switch',
		failed: 'Failed',
		done: 'Done, reloading the page'
	}
};

var CSS = `
.b5-wrap{margin:0 0 18px}
.b5-lead{margin:0 0 14px;color:var(--nb-text-2,inherit);max-width:860px}
.b5-modes{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-bottom:14px}
.b5-mode{position:relative;padding:14px 16px;border-radius:12px;border:1px solid var(--nb-border,rgba(128,128,128,.3));
	background:var(--nb-surface-2,rgba(128,128,128,.05))}
.b5-mode.on{border-color:var(--nb-accent,#4f46e5);background:var(--nb-accent-soft,rgba(79,70,229,.08));
	box-shadow:0 0 0 3px var(--nb-accent-ring,rgba(79,70,229,.18))}
.b5-mode h4{margin:0 0 2px;font-size:15px;display:flex;align-items:center;gap:8px}
.b5-tag{font-size:12px;color:var(--nb-muted,#888);margin-bottom:8px}
.b5-badge{font-size:11px;font-weight:600;padding:1px 8px;border-radius:999px;background:var(--nb-accent,#4f46e5);color:var(--nb-on-accent,#fff)}
.b5-mode ul{margin:0;padding-left:18px}
.b5-mode li{margin:3px 0;font-size:13px}
.b5-radios{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}
.b5-radio{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:10px;border:1px solid var(--nb-border,rgba(128,128,128,.3));font-size:13px}
.b5-radio b{font-weight:600}
.b5-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;flex:none}
.b5-dot.off{background:var(--nb-muted,#999)}
.b5-sub{color:var(--nb-muted,#888)}
.b5-act{display:flex;flex-wrap:wrap;align-items:center;gap:12px}
.b5-note{font-size:13px;color:var(--nb-muted,#888)}
`;

function lang() {
	return /^en/i.test(document.documentElement.lang || '') ? 'en' : 'ru';
}

// 5 GHz wifi-devices of the QCN9274 with channel, width and client count
function radioState() {
	return network.getWifiDevices().then(function(devs) {
		devs = devs.filter(function(d) {
			return d.get('band') == '5g' && String(d.get('path') || '').indexOf(PCI) > -1;
		});
		return Promise.all(devs.map(function(d) {
			return d.getWifiNetworks().then(function(nets) {
				return Promise.all(nets.map(function(n) {
					return L.resolveDefault(n.getAssocList(), []);
				})).then(function(lists) {
					var up = nets.some(function(n) { return n.isUp(); });
					var ch = null, width = null;
					nets.forEach(function(n) {
						if (n.isUp()) {
							ch = ch || n.getChannel();
							width = width || n.getActiveChannelWidth?.();
						}
					});
					return {
						name: d.getName(),
						idx: d.get('radio'),
						up: up,
						channel: ch || d.get('channel'),
						width: width,
						htmode: d.get('htmode'),
						clients: lists.reduce(function(a, l) { return a + (l ? l.length : 0); }, 0)
					};
				});
			});
		}));
	}).then(function(list) {
		return list.sort(function(a, b) { return String(a.idx || '').localeCompare(String(b.idx || '')); });
	});
}

function modeCard(tx, key, on) {
	return E('div', { 'class': 'b5-mode' + (on ? ' on' : '') }, [
		E('h4', {}, [ tx[key], on ? E('span', { 'class': 'b5-badge' }, tx.active) : '' ]),
		E('div', { 'class': 'b5-tag' }, tx[key + 'Tag']),
		E('ul', {}, tx[key + 'Items'].map(function(s) { return E('li', {}, s); }))
	]);
}

function radioChip(tx, r) {
	var mhz = r.width || (String(r.htmode || '').match(/(\d+)$/) || [])[1];
	var label = (r.idx == '0') ? tx.low : (r.idx == '1') ? tx.high : tx.one;
	return E('div', { 'class': 'b5-radio', 'title': r.name }, [
		E('span', { 'class': 'b5-dot' + (r.up ? '' : ' off') }),
		E('b', {}, label),
		r.up
			? E('span', { 'class': 'b5-sub' }, '%s %s%s, %d %s'.format(tx.ch, r.channel || '?', mhz ? ', ' + mhz + ' ' + tx.mhz : '', r.clients, tx.clients(r.clients)))
			: E('span', { 'class': 'b5-sub' }, tx.off)
	]);
}

function pendingWifiChanges() {
	var c = ui.changes?.changes?.wireless;
	return Array.isArray(c) && c.length > 0;
}

return baseclass.extend({
	render: function() {
		var tx = T[lang()];
		var root = E('div', { 'class': 'cbi-section b5-wrap' }, E('div', { 'class': 'spinning' }, tx.title));

		if (!document.getElementById('b5-css'))
			document.head.appendChild(E('style', { 'id': 'b5-css' }, CSS));

		Promise.all([ L.resolveDefault(callStatus(), {}), L.resolveDefault(radioState(), []) ]).then(L.bind(function(res) {
			this.draw(root, tx, res[0], res[1]);
		}, this));

		return root;
	},

	draw: function(root, tx, st, radios) {
		var split = !!st.split;
		var btn = E('button', {
			'class': 'cbi-button ' + (split ? 'cbi-button-neutral' : 'cbi-button-action important'),
			'click': ui.createHandlerFn(this, 'confirm', tx, split)
		}, split ? tx.toSingle : tx.toSplit);
		var note = '';

		if (!st.available) {
			btn.disabled = true;
			note = tx.na;
		}
		else if (st.running) {
			btn.disabled = true;
			note = tx.busy;
		}
		else if (pendingWifiChanges()) {
			btn.disabled = true;
			note = tx.pending;
		}

		L.dom.content(root, [
			E('h3', {}, tx.title),
			E('p', { 'class': 'b5-lead' }, tx.lead),
			E('div', { 'class': 'b5-modes' }, [ modeCard(tx, 'single', !split), modeCard(tx, 'split', split) ]),
			radios.length ? E('div', { 'class': 'b5-radios' }, radios.map(function(r) { return radioChip(tx, r); })) : '',
			E('div', { 'class': 'b5-act' }, [ btn, note ? E('span', { 'class': 'b5-note' }, note) : '' ])
		]);

		if (st.running)
			window.setTimeout(L.bind(this.wait, this, root, tx, split), 3000);
	},

	confirm: function(tx, split) {
		return new Promise(L.bind(function(resolve) {
			ui.showModal(tx.confirmTitle, [
				E('p', {}, split ? tx.confirmSingle : tx.confirmSplit),
				E('p', {}, tx.confirmNote),
				E('div', { 'class': 'right' }, [
					E('button', { 'class': 'cbi-button', 'click': function() { ui.hideModal(); resolve(); } }, tx.cancel),
					' ',
					E('button', { 'class': 'cbi-button cbi-button-action important', 'click': L.bind(function() {
						ui.showModal(tx.confirmTitle, [ E('p', { 'class': 'spinning' }, tx.busy) ]);
						callSet(!split).then(L.bind(function() {
							this.wait(null, tx, split);
						}, this));
						resolve();
					}, this) }, tx.go)
				])
			]);
		}, this));
	},

	// poll until the switch is done, then reload: the wireless config has
	// new or removed radios and the list below has to be built again
	wait: function(root, tx, was) {
		var tries = 0;
		var tick = function() {
			L.resolveDefault(callStatus(), {}).then(function(st) {
				if (!st.running && tries > 1) {
					if (!!st.split == was) {
						ui.showModal(tx.failed, [
							E('pre', {}, st.log || '-'),
							E('div', { 'class': 'right' }, E('button', { 'class': 'cbi-button', 'click': function() { location.reload(); } }, 'OK'))
						]);
						return;
					}
					ui.showModal(tx.done, [ E('p', { 'class': 'spinning' }, tx.done) ]);
					window.setTimeout(function() { location.reload(); }, 1500);
					return;
				}
				tries++;
				window.setTimeout(tick, 3000);
			});
		};
		tick();
	}
});
