# OpenWrt for Xiaomi BE7000

[Русская версия](README.md) · <a href="#support-the-project"><img alt="Support the project" src="https://img.shields.io/badge/Support%20the%20project-Boosty%20%C2%B7%20crypto-F15F2C?style=flat-square"></a>

Fresh OpenWrt from main for the Xiaomi BE7000 (RC06 board, IPQ9554 SoC), kernel 6.18, no kexec. The system boots straight from flash, the stock firmware stays in the other slot, and you can go back to it at any time.

It is based on the kravasuper port (branch xiaomi_be7000, commit 790d036a). On top of it I added fixes to the Ethernet driver, without which the system on my board never got as far as the network ([patches.en.md](docs/patches.en.md)), and a set of services that make life with two slots and the factory bootloader predictable.

The current version is **1.3.1**. Images are in [Releases](../../releases), checksums in sha256sums.txt. How to install it is in the section [Installation, updating, rollback](#installation-updating-rollback).

## Contents

- [What has been tested](#what-has-been-tested)
- [Known issues](#known-issues)
- [Installation, updating, rollback](#installation-updating-rollback)
- [What is in the image](#what-is-in-the-image)
- [Documentation](#documentation)
- [Theme](#theme)
- [License](#license)
- [Thanks](#thanks)
- [Support the project](#support-the-project)

## What has been tested

My own board: RC06, IPQ9554 rev 1.1, stock firmware 1.1.38, 1 GB of RAM.

- The system boots in 25 seconds and gets to LuCI and SSH.
- The gigabit port gives about 940 Mbit/s in both directions with iperf3, no CRC errors and no loss.
- The 2.5 Gbit/s ports: for one owner a 2500 Mbit/s link worked, 72 GB went through the port in one direction and 30 in the other without errors. On my own board I only tested 100 and 1000.
- Wi-Fi 2.4 and 5 GHz work as Wi-Fi 6, calibration from the ART partition is picked up, the TLMM6 and TLMM7 fix for 5 GHz is applied.
- Wi-Fi 7 (EHT80) in access point mode works, tested with a laptop: macOS shows PHY Mode 802.11be, channel 36 at 80 MHz, iperf3 945 Mbit/s. Automatic channel selection on 5 GHz also works.
- With country RU the QCN9274 radio firmware itself forbids 802.11be (NO-EHT shows up in `iw reg get`), and EHT80 does not come up. This is a decision of the radio firmware, not the driver.
- PPPoE on a live line, sysupgrade keeping settings and the list of enabled services, WireGuard and AmneziaWG (the module and the awg utility are built for this kernel).

## Known issues

- **Ethernet on some boards before 1.3.0.** The ports brought up a link, but the router did not receive a single frame. The cause was the kernel's RPM request for the l2 regulator, fixed in 1.3.0, details in [patches.en.md](docs/patches.en.md#ethernet-reception-on-some-boards). If the cable still does not work on your board, write in [issue #1](https://github.com/timofey-maykov/be7000-openwrt/issues/1) or in the 4PDA thread, you can get in over Wi-Fi (network OpenWrt-BE7000, password be7000openwrt).
- 5 GHz is one radio for the whole band by default. It can be split into two independent ones, like 5G-1 and 5G-2 on stock (36-64 and 149-165), in the 5 GHz mode block at the top of Network, Wireless or with be7000-5g-split on, details in [patches.en.md](docs/patches.en.md#5-ghz-two-radios).
- There is 19.4 MB of space for /overlay; for anything large it is better to move it to USB with the be7000-extroot command.
- The kernel uses the mainline qcom-ppe rather than the vendor NSS, so acceleration is only at the PPE level.
- The port lags behind OpenWrt main, updating the base may require reworking the patches.

## Installation, updating, rollback

Step by step in [docs/instruction](docs/instruction), the release archive contains the same files:

- [installing from stock](docs/instruction/1-install-en.txt)
- [updating](docs/instruction/2-update-en.txt), including from the page System, "Обновление сборки" (firmware update)
- [rollback to stock and what to do if something went wrong](docs/instruction/3-rollback-and-problems-en.txt)
- [firmware features](docs/instruction/4-features-en.txt): packages, Wi-Fi, USB storage, Docker

Do not touch the bootloader (0:APPSBL and 0:APPSBL_1) under any circumstances, it is the only place where the board can be killed for good.

## What is in the image

OpenWrt SNAPSHOT r20260623-790d036a, kernel 6.18.36, architecture aarch64_cortex-a73, apk packages. The feeds are pinned to the same date (feeds-pins.txt). The exact package list is in the manifest file, the build config in config.buildinfo.

Notable items: the qcom-ppe module with PPE acceleration, firewall4 and nftables, PPPoE, dnsmasq-full, WireGuard and AmneziaWG, tc and ifb for shaping, the ath11k (2.4 GHz) and ath12k (5 GHz) drivers with firmware, full wpad, LuCI with https and Russian language, USB storage support, iperf3. The kmod-ath11k-ahb package was not in the port's profile, I added it; without it the built-in 2.4 GHz radio is left without a driver.

Services that are not in regular OpenWrt live in overlay-files:

| Service | What it does |
|--------|-----------|
| be7000-bootconfirm | at the end of boot confirms the slot to the bootloader and resets the attempt counters |
| bigoverlay | on first boot moves /overlay to the stock settings partition, see [storage.en.md](docs/storage.en.md) |
| be7000-wifi-defaults | on a clean install enables both radios with the OpenWrt-BE7000 network |
| be7000-feeds | brings the kernel modules feed path in line with the hash of the kernel in ROM |
| be7000-romsync | after an image change resets the copy of the apk database in overlay and reinstalls the user's packages |
| be7000-bootlog | writes a boot log to flash (crash_syslog), see [debugging.en.md](docs/debugging.en.md) |
| 79_be7000_stale_modules | in preinit moves aside kernel modules from the previous image so they do not shadow the modules from ROM |

Packages install out of the box. The official mirror builds qualcommbe for cortex-a53, while this build targets cortex-a73, so there is no aarch64_cortex-a73 directory on the mirror and all the common feeds return 404. The image has its own feed configured, built from the same tree and signed with a key the image already trusts. After `apk update` there are 658 packages available, including nano, htop, tcpdump, strace, tmux, rsync, jq, modemmanager with USB modem drivers, ksmbd and ttyd. Kernel modules are in a separate feed, because on the mirror they are built for a different kernel.

## Documentation

- [patches.en.md](docs/patches.en.md): what was added to the port and why, patches in progress
- [bootloader.en.md](docs/bootloader.en.md): flash slots, how the bootloader picks a slot, when it brings up the network
- [storage.en.md](docs/storage.en.md): space for settings and packages, the volume shared with stock, moving to USB
- [building.en.md](docs/building.en.md): how the firmware is built in CI and how to build it yourself
- [debugging.en.md](docs/debugging.en.md): how to find the cause without UART, the boot log in flash
- [CHANGELOG.en.md](CHANGELOG.en.md): what changed from version to version

## Theme

I made my own theme for LuCI, Nimbus: menu on the left, quick search across pages, light and dark schemes, looks fine on a phone. Sources, screenshots and installation instructions are in the [luci-theme-nimbus](luci-theme-nimbus) folder, a ready package is in the releases. The theme is not tied to the BE7000 and installs on any OpenWrt with LuCI 23.05 and newer.

![Nimbus](luci-theme-nimbus/screenshots/overview-dark.png)

## License

The patches in patches are distributed under GPL-2.0-only, like the Linux kernel. The scripts and text can be used however you like. The images are built from OpenWrt sources, the kravasuper port, these patches and packages from awg-feed; versions and config are listed in config.buildinfo and feeds-pins.txt.

## Thanks

The full list with links is on the System, Credits page in LuCI, and the same list is in the SSH login greeting. Special thanks to zerc00l, who gave remote access to his router: the cause of the dead Ethernet was found on his board. And to kravasuper for the port everything stands on.

## Support the project

The build is made in spare time: debugging on other people's boards, dozens of test images, CI. If it was useful to you, you can support the work. Thank you!

<a href="https://boosty.to/itnitro"><img alt="Boosty" src="https://img.shields.io/badge/Boosty-itnitro-F15F2C?style=for-the-badge&logo=boosty&logoColor=white"></a>

| Method | Details |
|------|-----------|
| <img alt="USDT TON" src="https://img.shields.io/badge/USDT-TON-26A17B?style=for-the-badge&logo=tether&logoColor=white"> | `UQBZhwBuZCgQOtrgRGMu4PKiiOcf9dTKxRpapZt1oDn0m3yH` |
| <img alt="USDT ETH ERC-20" src="https://img.shields.io/badge/USDT%20%2F%20ETH-ERC--20-627EEA?style=for-the-badge&logo=ethereum&logoColor=white"> | `0xeb05803030afB64C903C7BfB79d18957efD6bcCd` |
| <img alt="SOL" src="https://img.shields.io/badge/SOL-Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white"> | `GcKxgUeSfKnsPL9iEaYKJArosfYKMtE4W5wVDdHrRVTu` |
| <img alt="BTC" src="https://img.shields.io/badge/BTC-Bitcoin-F7931A?style=for-the-badge&logo=bitcoin&logoColor=white"> | `bc1qcyd3kaa3y2cv2yn90rsa628y3ptz56zs05z2jq` |
| <img alt="WeChat" src="https://img.shields.io/badge/WeChat-itnitro-07C160?style=for-the-badge&logo=wechat&logoColor=white"> | `itnitro` |

<img src="docs/img/wechat-itnitro-qr.jpg" alt="WeChat itnitro" width="200">
