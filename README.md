<img src="docs/img/beam-wrt-logo.svg" alt="" width="72" height="72" align="left">
Beam WRT
基于 OpenWrt 的小米 BE7000 固件。
<br clear="left">

<a href="#support-the-project"><img alt="支持项目" src="https://img.shields.io/badge/Support%20the%20project-Boosty%20%C2%B7%20crypto-F15F2C?style=flat-square"></a>

Beam WRT 是为小米 BE7000（RC06 主板，IPQ9554 SoC）提供的最新 OpenWrt 主线固件，内核版本 6.18，无 kexec。在 1.3.1 版本之前，该构建仅被称为 be7000-openwrt（与仓库名相同）。系统直接从闪存启动，原厂固件保留在另一个分区，你可以随时回退到原厂固件。

它基于 kravasuper 的移植（分支 xiaomi_be7000，提交 790d036a）。在此基础上，我添加了以太网驱动的修复，没有这些修复，我主板上的系统根本无法连接到网络（patches.en.md），以及一系列使双分区和原厂引导加载程序变得可预测的服务。

当前版本是 1.3.1。镜像位于 Releases，校验和位于 sha256sums.txt。安装方法见 安装、更新、回滚 部分。

目录
测试情况

已知问题

安装、更新、回滚

镜像中包含的内容

文档

主题

许可证

致谢

支持项目

测试情况
我自己的主板：RC06，IPQ9554 rev 1.1，原厂固件 1.1.38，1 GB 内存。

系统在 25 秒内启动并进入 LuCI 和 SSH。

千兆端口使用 iperf3 双向测速约为 940 Mbit/s，无 CRC 错误，无丢包。

2.5 Gbit/s 端口：有一位用户的 2500 Mbit/s 链路成功运行，单向传输 72 GB，另一向 30 GB，无错误。在我自己的主板上，我只测试了 100 和 1000 兆。

Wi-Fi 2.4 和 5 GHz 以 Wi-Fi 6 模式工作，ART 分区的校准数据能被正确读取，5 GHz 的 TLMM6 和 TLMM7 修复已应用。

Wi-Fi 7 (EHT80) 在接入点模式下工作，使用笔记本电脑测试：macOS 显示 PHY Mode 802.11be，信道 36，频宽 80 MHz，iperf3 速率 945 Mbit/s。5 GHz 的自动信道选择也能正常工作。

使用国家代码 RU 时，QCN9274 射频固件本身禁止 802.11be（在 iw reg get 中显示 NO-EHT），EHT80 无法启用。这是射频固件的决定，而非驱动的问题。

实际线路上的 PPPoE，sysupgrade 保留设置和已启用服务列表，WireGuard 和 AmneziaWG（模块和 awg 工具均针对此内核构建）。

已知问题
1.3.0 之前部分主板上的以太网问题。 端口能建立链路，但路由器收不到任何数据帧。原因是内核 RPM 对 l2 稳压器的请求，已在 1.3.0 中修复，详情见 patches.en.md。如果你的主板网线仍无法工作，请在 issue #1 或 4PDA 帖子中留言，你可以通过 Wi-Fi 进入（网络 OpenWrt-BE7000，密码 be7000openwrt）。

5 GHz 默认是整个频段一个射频。可以在“网络” -> “无线”顶部的 5 GHz 模式块中将其拆分为两个独立射频，就像原厂的 5G-1 和 5G-2（36-64 和 149-165），或者使用 be7000-5g-split 命令，详情见 patches.en.md。

/overlay 有 19.4 MB 空间；对于大型软件，最好使用 be7000-extroot 命令将其移动到 USB。

内核使用主线 qcom-ppe 而非供应商的 NSS，因此加速仅在 PPE 层面。

该移植落后于 OpenWrt 主线，更新基础版本可能需要重做补丁。

安装、更新、回滚
分步指南见 docs/instruction，发布压缩包中包含相同的文件：

从原厂固件安装

更新，包括从“系统”页面中的“Обновление сборки”（固件更新）进行更新

回滚到原厂固件以及出错时的处理方法

固件特性：软件包、Wi-Fi、USB 存储、Docker

在任何情况下都不要触碰引导加载程序（0:APPSBL 和 0:APPSBL_1），这是主板唯一可能永久变砖的地方。

镜像中包含的内容
OpenWrt SNAPSHOT r20260623-790d036a，内核 6.18.36，架构 aarch64_cortex-a73，apk 软件包。软件源固定在同一日期（feeds-pins.txt）。确切的软件包列表在 manifest 文件中，构建配置在 config.buildinfo 中。

值得注意的项目：带 PPE 加速的 qcom-ppe 模块，firewall4 和 nftables，PPPoE，dnsmasq-full，WireGuard 和 AmneziaWG，用于流量整形的 tc 和 ifb，带固件的 ath11k（2.4 GHz）和 ath12k（5 GHz）驱动，完整版 wpad，带 https 和俄语的 LuCI，USB 存储支持，iperf3。kmod-ath11k-ahb 软件包不在移植的配置中，我添加了它；没有它，内置的 2.4 GHz 射频将没有驱动。

不在常规 OpenWrt 中的服务位于 overlay-files 中：

服务	功能
be7000-bootconfirm	在启动结束时向引导加载程序确认分区并重置尝试计数器
bigoverlay	首次启动时将 /overlay 移动到原厂设置分区，见 storage.en.md
be7000-wifi-defaults	在全新安装时启用两个射频，并使用 OpenWrt-BE7000 网络
be7000-feeds	使内核模块源路径与 ROM 中内核的哈希值保持一致
be7000-romsync	镜像更改后重置 overlay 中 apk 数据库的副本，并重新安装用户的软件包
be7000-bootlog	将启动日志写入闪存（crash_syslog），见 debugging.en.md
79_be7000_stale_modules	在 preinit 阶段将上一个镜像的内核模块移开，以免它们覆盖 ROM 中的模块
软件包开箱即用。官方镜像为 cortex-a53 构建 qualcommbe，而此构建针对 cortex-a73，因此镜像上没有 aarch64_cortex-a73 目录，所有公共软件源都会返回 404。镜像配置了自己的软件源，从同一代码树构建，并使用镜像已信任的密钥签名。执行 apk update 后有 658 个可用软件包，包括 nano、htop、tcpdump、strace、tmux、rsync、jq、带 USB 调制解调器驱动的 modemmanager、ksmbd 和 ttyd。内核模块位于单独的软件源中，因为镜像上的模块是针对不同内核构建的。

文档
patches.en.md：向移植中添加了什么以及为什么，进行中的补丁

bootloader.en.md：闪存分区，引导加载程序如何选择分区，何时启动网络

storage.en.md：设置和软件包的空间，与原厂共享的卷，移动到 USB

building.en.md：固件如何在 CI 中构建以及如何自行构建

debugging.en.md：如何在没有 UART 的情况下找到原因，闪存中的启动日志

CHANGELOG.en.md：版本之间的变化

主题
我为 LuCI 制作了自己的主题 Nimbus：左侧菜单，跨页面快速搜索，浅色和深色方案，在手机上看起来不错。源代码、截图和安装说明在 luci-theme-nimbus 文件夹中，现成的软件包在 releases 中。该主题不绑定 BE7000，可安装在任何 LuCI 23.05 及更新版本的 OpenWrt 上。

https://luci-theme-nimbus/screenshots/overview-dark.png

许可证
patches 中的补丁在 GPL-2.0-only 下分发，与 Linux 内核相同。脚本和文本可随意使用。镜像从 OpenWrt 源代码、kravasuper 移植、这些补丁和 awg-feed 中的软件包构建；版本和配置列在 config.buildinfo 和 feeds-pins.txt 中。

致谢
带链接的完整列表在 LuCI 的“系统” -> “鸣谢”页面，SSH 登录欢迎信息中也有相同列表。特别感谢 zerc00l，他提供了对他路由器的远程访问：以太网故障的原因是在他的主板上找到的。还要感谢 kravasuper 提供了这一切所依赖的移植。

支持项目
该构建是在业余时间完成的：在他人主板上调试、数十个测试镜像、CI。如果它对你有用，你可以支持这项工作。谢谢！

<a href="https://boosty.to/itnitro"><img alt="Boosty" src="https://img.shields.io/badge/Boosty-itnitro-F15F2C?style=for-the-badge&logo=boosty&logoColor=white"></a>
