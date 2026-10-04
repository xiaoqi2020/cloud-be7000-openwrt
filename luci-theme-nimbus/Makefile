#
# Nimbus - a modern LuCI theme
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-theme-nimbus
PKG_LICENSE:=Apache-2.0
# luci.mk puts the version into the stylesheet URL (cascade.css?v=...), so
# browsers fetch the new CSS after an upgrade. Without it the version comes
# from git, which this copied-in package does not have, and stays 0 forever.
# Bump it with every change to the theme.
PKG_VERSION:=0.261001.4

LUCI_TITLE:=Nimbus Theme (modern, sidebar layout, light/dark)
LUCI_DEPENDS:=+luci-base

define Package/luci-theme-nimbus/postrm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	uci -q delete luci.themes.Nimbus
	uci commit luci
}
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
