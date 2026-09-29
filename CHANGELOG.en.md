# Versions

[Русская версия](CHANGELOG.md)

**1.3.1**, September 30, 2026.
- The build got a name, Beam WRT, and its own logo. They are in LuCI (tab icon, sidebar, login page, Project block), in the SSH greeting, on the Credits page and in the version string. The default hostname OpenWrt became BeamWRT, a hostname you set stays. Image files keep their old names, openwrt-qualcommbe-...
- The 5 GHz module can be split into two independent radios, like 5G-1 and 5G-2 on stock. The lower one runs on channels 36-64, the upper one from 149 up, each with its own channel and clients. The mode is changed in the 5 GHz mode block at the top of Network, Wireless or with be7000-5g-split on, the router does not reboot. Like stock, the driver loads the dual-MAC firmware with board data 0x1008, flips the RF lines TLMM6 and TLMM7 and takes a separate calibration from ART. The choice survives reboots and updates. Tested on zerc00l's board, both radios hold MCS 9, cable and USB work as before. Thanks to Quarx, his build showed that stock flips the RF lines.
- With two radios LuCI offers each radio only its own channels.
- The wireless network list is aligned. Badges, descriptions and buttons sit in even columns, networks are marked under their radio.
- The Storage, Build update and Docker: stacks pages are translated to English and follow the LuCI language, like Credits. The be7000-docker and be7000-update console tools follow it too.
- A Project block at the top of Status, Overview with the build version and links to the sources, releases, the 4PDA topic, issues, build update and credits.
- LuCI, /etc/openwrt_release and the SSH greeting show the build version, Beam WRT 1.3.1, not OpenWrt SNAPSHOT.
- The feed gained USB tethering from a phone. Android connects over RNDIS, iPhone over ipheth and usbmuxd. Also Huawei NCM modems and the QMI and 3G protocols for LuCI. All of it installs with apk.
- 12 MB of memory are reserved for the two-radio firmware, free memory is that much lower.

**1.3.0**, September 29, 2026.
- On some boards Ethernet reception did not work after installation: there was a link, but the router did not receive a single frame, on LAN or WAN. The cause was power. The DTS had the l2 regulator from the Qualcomm reference board, the kernel requested it over RPM at boot, and stock never makes such requests. After that request the SoC receiver on the lane to the QCA8084 went silent, although every lane register and clock matched stock. The kernel no longer votes l2, USB gets a fixed 1.8 V supply. On zerc00l's board the cable works, iperf3 941 Mbit/s both ways without a single lane error. Huge thanks to zerc00l for remote access to his router, and to BurmecianKnight, Denchik777, xiaoqi2020, tera2null, kazanova-sgh and fufliks862 for the logs and patience.
- EDMA receive DMA fix from OpenWrt main (0362, by krava): receive buffers were mapped with one DMA direction and unmapped with another, so on IPQ95xx the CPU could read stale data instead of the frame.
- Ethernet reception is no longer moved to a single core. The generic packet-steering sent RPS of all qcom_ppe queues to CPU0, which already handles the 5 GHz Wi-Fi interrupts. EDMA spreads reception over four cores by itself, Wi-Fi is unchanged.
- Rolling back to stock no longer resets stock settings kept in the encrypted sec_cfg.
- A System, Credits page in LuCI: who tested the build on their boards, who found bugs and whose work it stands on, each with a link to their profile or work. The same list is shown in the SSH login greeting.

**1.2.7**, September 26, 2026.
- On boards coming straight from stock, the stock settings volume has number 1 (/dev/ubi1_1), while fstab expected /dev/ubi1_0: fstools searched for the partition for fifteen seconds and fell back to the slot's internal overlay, the shared volume was not used, and bigoverlay rebooted the router twice. Now the device is looked up by volume name and the fstab entry fixes itself. This showed up in the logs from Denchik777 and dima-dior1999.
- Wi-Fi was not enabled on a clean install in 1.2.6: the service treated as an update any installation where /etc/config/wireless already existed, and hotplug generates that file before the service runs. Now an update is detected by a marker from sysupgrade.conf, and for old images by whether the network has a password set. Thanks to Denchik777 for the hint.
- The log in flash is written across the whole partition (480 KB) and contains port state and counters, interrupts, addresses, routes, neighbours, network, Wi-Fi, DHCP and fstab configs, nftables rules, processes, service lines and the tail of the system log. The copy in preinit is still dmesg only. It is written every 15 seconds for five minutes, then at the seventh and tenth minute.
- The instructions and README have been cleaned up, outdated advice about the stock version and wget has been removed.
- The workflow can do debug builds from debug-* tags: a separate overlay, tcpdump-mini, a pre-release without publishing the feed.

**1.2.6**, September 25, 2026.
- bigoverlay no longer formats the stock settings partition: overlay lives as a directory inside stock's own cfg volume, a rollback keeps the stock settings and root over SSH, and going back to OpenWrt keeps the OpenWrt settings. Suggested by FOV5.
- Checking for and installing updates from GitHub Releases: the be7000-update command and the page System, "Обновление сборки" (firmware update).
- be7000-feeds on every boot brings the kernel modules feed path in line with the hash of the kernel in ROM (customfeeds.list is a conffile, sysupgrade kept the old path). be7000-romsync on an image change resets the copy of the apk database in overlay to the database from ROM and reinstalls the user's packages; otherwise apk after an update considered the old kernel installed and refused to install modules.
- Kernel modules installed through apk live in overlay under the same kernel version number as the new image, and after an image change they shadowed the modules from ROM. OpenWrt does not check their compatibility, they got loaded and crashed the kernel about twenty seconds after startup, six times in a row, until the bootloader rolled back to the other slot. The preinit hook 79_be7000_stale_modules, before overlay is mounted, compares the kernel hash in the copy of the apk database with the ROM kernel and, if they differ, moves the modules directory aside to lib/modules.stale-<hash>, and be7000-romsync installs the right modules from the feed again.
- Wi-Fi is enabled on a clean install, network OpenWrt-BE7000 with password be7000openwrt. On two boards after installing 1.2.5 the system booted but did not respond over the cable on 192.168.1.1, and since the system had confirmed the boot, the bootloader will no longer return to stock. Without a second way in, that is a dead end.
- The log in flash, besides dmesg, records ip addr, the network config, the state of board.json and the tail of logread. In 1.2.5 the interfaces block was empty, busybox's ip has no -br option.
- An empty /etc/board.json is removed in preinit so that board_detect rebuilds it.
- The first boot after sysupgrade moves to the shared partition by itself, instead of living once on the slot's internal overlay with factory settings.

**1.2.5**, September 25, 2026.
- A clean install from stock in 1.2.3 and 1.2.4 bounced back to stock: bigoverlay rebooted the router before be7000-bootconfirm confirmed the trial boot. Now bigoverlay re-arms the trial boot before its own reboot.
- The Nimbus theme is back in the image, CI was not building it.
- The image now includes ca-bundle and libustream-mbedtls, without them apk update over https failed with a certificate error, and wget could not do https.

**1.2.4**, September 25, 2026.
- The first release built entirely on GitHub Actions.
- The feed now has packages and modules for Docker, the be7000-docker command and Docker pages in LuCI.
- bigoverlay sets the flag flag_format_overlay=1 for stock. Without it, stock after a return saw a foreign UBI on mtd28, deleted our volume, created an empty one and did not copy its settings, and ended up coming up with an empty /etc/config, without web settings and without SSH (in xmir-patcher this looked like "dropbear is found, but it cannot run"). If you already ran into this: on stock `nvram set restore_defaults=1 && nvram commit && reboot -f`, or reset with the button.
- The image writes a boot log to flash: dmesg to crash_syslog (mtd27), kernel panics through mtdoops to crash (mtd26).

**1.2.3**, September 24, 2026.
- The be7000-bootconfirm service at the end of startup resets the bootloader's attempt counters and marks its slot as good. In images up to 1.2.2 nothing did this, and after seven reboots the router silently went to stock.
- The installer from stock follows the regular OTA path, and if OpenWrt did not come up, the very next power-on returns stock.

**1.2.2**, September 24, 2026. The radios are no longer turned off on update: the first-boot service's marker was not carried over by sysupgrade, and every update looked like a clean install to it.

**1.2.1**, September 24, 2026. The "Накопитель" (Storage) page under System. In 1.2 it ended up by mistake inside the hybrid-failover app, which is not in the public image.

**1.2**, September 24, 2026. sysupgrade writes to the slot it booted from. Services enabled by hand survive an update. /overlay moved to a separate partition, 19.4 MB instead of 7.4. The be7000-extroot command. Own package feed, apk update gives 658 packages instead of 404.

**1.1**, September 22, 2026. The Nimbus LuCI theme by default, UPnP with a LuCI page, and nft_tproxy modules.

**1.0**, September 22, 2026. The first public build with the three Ethernet driver fixes.
