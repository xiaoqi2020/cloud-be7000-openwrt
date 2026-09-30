<img src="docs/img/beam-wrt-logo.svg" alt="" width="72" height="72" align="left">

# Beam WRT

Прошивка для Xiaomi BE7000 на базе OpenWrt.
<br clear="left">

[English](README.en.md) · [Русская версия](README.md) · 中文说明
[English](README.en.md) · <a href="#поддержать-проект"><img alt="Поддержать проект" src="https://img.shields.io/badge/%D0%9F%D0%BE%D0%B4%D0%B4%D0%B5%D1%80%D0%B6%D0%B0%D1%82%D1%8C%20%D0%BF%D1%80%D0%BE%D0%B5%D0%BA%D1%82-Boosty%20%C2%B7%20crypto-F15F2C?style=flat-square"></a>

Beam WRT это свежий OpenWrt из main для Xiaomi BE7000 (плата RC06, процессор IPQ9554), ядро 6.18, без kexec. До версии 1.3.1 сборка называлась просто be7000-openwrt, по имени репозитория. Система грузится прямо с флеша, сток остаётся в соседнем слоте, вернуться на него можно в любой момент.

За основу взят порт kravasuper (ветка xiaomi_be7000, коммит 790d036a). К нему добавлены исправления в драйвер Ethernet, без которых на моей плате система не доходила до сети ([patches.md](docs/patches.md)), и набор служб, которые делают жизнь в двух слотах с заводским загрузчиком предсказуемой.

Текущая версия **1.3.1**. Образы лежат в [Releases](../../releases), суммы в sha256sums.txt. Как поставить, в разделе [Установка, обновление, откат](#установка-обновление-откат).

## Содержание

- [Что проверено](#что-проверено)
- [Известные проблемы](#известные-проблемы)
- [Установка, обновление, откат](#установка-обновление-откат)
- [Что в образе](#что-в-образе)
- [Документация](#документация)
- [Тема оформления](#тема-оформления)
- [Лицензия](#лицензия)
- [Спасибо](#спасибо)
- [Поддержать проект](#поддержать-проект)

## Что проверено

Своя плата: RC06, IPQ9554 rev 1.1, стоковая прошивка 1.1.38, 1 ГБ памяти.

- Система загружается за 25 секунд и доходит до LuCI и SSH.
- Гигабитный порт даёт около 940 Мбит/с в обе стороны по iperf3, ошибок CRC и потерь нет.
- Порты на 2.5 Гбит/с: у одного владельца линк 2500 Мбит/с работал, через порт прошло 72 ГБ в одну сторону и 30 в другую без ошибок. На своей плате я проверял только 100 и 1000.
- Wi-Fi 2.4 и 5 ГГц работают как Wi-Fi 6, калибровка из раздела ART подхватывается, правка TLMM6 и TLMM7 для 5 ГГц применена.
- Wi-Fi 7 (EHT80) в режиме точки доступа работает, проверено ноутбуком: macOS показывает PHY Mode 802.11be, канал 36 на 80 МГц, iperf3 945 Мбит/с. Автовыбор канала на 5 ГГц тоже работает.
- Со страной RU прошивка радиомодуля QCN9274 сама запрещает 802.11be (в `iw reg get` появляется NO-EHT), и EHT80 не поднимается. Это решение прошивки радио, а не драйвера.
- PPPoE на живой линии, sysupgrade с переносом настроек и списка включённых служб, WireGuard и AmneziaWG (модуль и утилита awg собраны под это ядро).

## Известные проблемы

- **Ethernet на части плат до 1.3.0.** Порты поднимали линк, но роутер не принимал ни одного кадра. Причина оказалась в запросе ядра на регулятор l2 через RPM, в 1.3.0 это исправлено, подробности в [patches.md](docs/patches.md#приём-по-ethernet-на-части-плат). Если на вашей плате кабель всё ещё не работает, напишите в [issue #1](https://github.com/timofey-maykov/be7000-openwrt/issues/1) или в тему на 4PDA, заходить можно по Wi-Fi (сеть OpenWrt-BE7000, пароль be7000openwrt).
- 5 ГГц по умолчанию одно радио на весь диапазон. Разделить его на два независимых, как 5G-1 и 5G-2 в стоке (36-64 и 149-165), можно на странице Сеть, Беспроводная сеть (блок Режим 5 ГГц вверху) или командой be7000-5g-split on, подробности в [patches.md](docs/patches.md#5-ггц-два-радио).
- Места под /overlay 19.4 МБ, для чего-то крупного лучше вынести его на USB командой be7000-extroot.
- Ядро использует мейнлайновый qcom-ppe, а не вендорный NSS, так что ускорение только на уровне PPE.
- Порт отстаёт от main OpenWrt, при обновлении базы могут понадобиться правки патчей.

## Установка, обновление, откат

Пошагово в [docs/instruction](docs/instruction), в архиве релиза те же файлы:

- [установка со стока](docs/instruction/1-install.txt)
- [обновление](docs/instruction/2-update.txt), в том числе со страницы Система, Обновление сборки
- [откат на сток и если что-то пошло не так](docs/instruction/3-rollback-and-problems.txt)
- [возможности прошивки](docs/instruction/4-features.txt): пакеты, Wi-Fi, накопитель на USB, Docker

Загрузчик (0:APPSBL и 0:APPSBL_1) не трогайте ни при каких условиях, это единственное место, где плату можно убить насовсем.

## Что в образе

OpenWrt SNAPSHOT r20260623-790d036a, ядро 6.18.36, архитектура aarch64_cortex-a73, пакеты apk. Фиды зафиксированы на ту же дату (feeds-pins.txt). Точный список пакетов в файле manifest, конфиг сборки в config.buildinfo.

Из заметного: модуль qcom-ppe с ускорением PPE, firewall4 и nftables, PPPoE, dnsmasq-full, WireGuard и AmneziaWG, tc и ifb для шейпинга, драйверы ath11k (2.4 ГГц) и ath12k (5 ГГц) с прошивками, полный wpad, LuCI с https и русским языком, поддержка USB-накопителей, iperf3. Пакета kmod-ath11k-ahb в профиле порта не было, я его добавил, без него встроенный радиомодуль 2.4 ГГц остаётся без драйвера.

Службы, которых нет в обычном OpenWrt, лежат в overlay-files:

| Служба | Что делает |
|--------|-----------|
| be7000-bootconfirm | в конце загрузки подтверждает слот загрузчику и обнуляет счётчики попыток |
| bigoverlay | при первой загрузке переносит /overlay на раздел настроек стока, см. [storage.md](docs/storage.md) |
| be7000-wifi-defaults | при чистой установке включает оба радио с сетью OpenWrt-BE7000 |
| be7000-feeds | приводит путь к фиду модулей ядра к хешу ядра из ROM |
| be7000-romsync | после смены образа сбрасывает копию базы apk из overlay и переустанавливает пакеты пользователя |
| be7000-bootlog | пишет журнал загрузки во флеш (crash_syslog), см. [debugging.md](docs/debugging.md) |
| 79_be7000_stale_modules | в preinit откладывает модули ядра от прошлого образа, чтобы они не перекрывали модули из ROM |

Пакеты ставятся из коробки. Официальное зеркало собирает qualcommbe под cortex-a53, а эта сборка идёт под cortex-a73, поэтому каталога aarch64_cortex-a73 на зеркале нет и все общие фиды отдают 404. В образ прописан свой фид, собранный из того же дерева и подписанный ключом, которому образ уже доверяет. После `apk update` доступно 658 пакетов, включая nano, htop, tcpdump, strace, tmux, rsync, jq, modemmanager с драйверами USB-модемов, ksmbd и ttyd. Модули ядра лежат в отдельном фиде, потому что на зеркале они собраны под другое ядро.

## Документация

- [patches.md](docs/patches.md): что и зачем добавлено к порту, патчи в работе
- [bootloader.md](docs/bootloader.md): слоты флеша, как загрузчик выбирает слот, когда он поднимает сеть
- [storage.md](docs/storage.md): место под настройки и пакеты, общий том со стоком, перенос на USB
- [building.md](docs/building.md): как собирается прошивка в CI и как собрать самому
- [debugging.md](docs/debugging.md): как искать причину без UART, журнал загрузки во флеше
- [CHANGELOG.md](CHANGELOG.md): что менялось от версии к версии

## Тема оформления

Для LuCI сделал свою тему Nimbus: меню слева, быстрый поиск по страницам, светлая и тёмная схема, нормально выглядит на телефоне. Исходники, скриншоты и инструкция по установке лежат в папке [luci-theme-nimbus](luci-theme-nimbus), готовый пакет есть в релизах. Тема не привязана к BE7000 и ставится на любой OpenWrt с LuCI 23.05 и новее.

![Nimbus](luci-theme-nimbus/screenshots/overview-dark.png)

## Лицензия

Патчи в patches распространяются на условиях GPL-2.0-only, как ядро Linux. Скрипты и текст можно использовать как угодно. Образы собраны из исходников OpenWrt, порта kravasuper, этих патчей и пакетов из awg-feed, версии и конфиг указаны в config.buildinfo и feeds-pins.txt.

## Спасибо

Полный список с ссылками открывается в LuCI на странице Система, Благодарности, и его же видно в приветствии по SSH. Отдельно zerc00l, который дал удалённый доступ к своему роутеру: на его плате нашлась причина мёртвого Ethernet. И kravasuper за сам порт, на котором всё стоит.

## Поддержать проект

Сборка делается в свободное время: отладка на чужих платах, десятки тестовых образов, CI. Если она вам пригодилась, можно поддержать работу. Спасибо!

<a href="https://boosty.to/itnitro"><img alt="Boosty" src="https://img.shields.io/badge/Boosty-itnitro-F15F2C?style=for-the-badge&logo=boosty&logoColor=white"></a>

| Способ | Реквизиты |
|------|-----------|
| <img alt="USDT TON" src="https://img.shields.io/badge/USDT-TON-26A17B?style=for-the-badge&logo=tether&logoColor=white"> | `UQBZhwBuZCgQOtrgRGMu4PKiiOcf9dTKxRpapZt1oDn0m3yH` |
| <img alt="USDT ETH ERC-20" src="https://img.shields.io/badge/USDT%20%2F%20ETH-ERC--20-627EEA?style=for-the-badge&logo=ethereum&logoColor=white"> | `0xeb05803030afB64C903C7BfB79d18957efD6bcCd` |
| <img alt="SOL" src="https://img.shields.io/badge/SOL-Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white"> | `GcKxgUeSfKnsPL9iEaYKJArosfYKMtE4W5wVDdHrRVTu` |
| <img alt="BTC" src="https://img.shields.io/badge/BTC-Bitcoin-F7931A?style=for-the-badge&logo=bitcoin&logoColor=white"> | `bc1qcyd3kaa3y2cv2yn90rsa628y3ptz56zs05z2jq` |
| <img alt="WeChat" src="https://img.shields.io/badge/WeChat-itnitro-07C160?style=for-the-badge&logo=wechat&logoColor=white"> | `itnitro` |

<img src="docs/img/wechat-itnitro-qr.jpg" alt="WeChat itnitro" width="200">
