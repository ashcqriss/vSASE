#!/usr/bin/env bash
# Build a bootable "iOS 6 · Arch Edition" live ISO.
#
# Requirements: an Arch Linux system (bare metal, VM or container) with the
# `archiso` package installed, run as root:
#
#     pacman -S archiso
#     sudo os/archiso/build-iso.sh [workdir]
#
# The profile is derived from archiso's official `releng` profile (the one
# that builds the real monthly Arch ISO), overlaid with the iOS 6 shell:
# root autologin on tty1 execs cage+chromium in kiosk mode, ios6d exposes
# battery/Wi-Fi/modem state, NetworkManager and ModemManager are enabled.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
WORK="${1:-/tmp/ios6-archiso}"
RELENG=/usr/share/archiso/configs/releng

[[ -d $RELENG ]] || { echo "error: archiso is not installed (pacman -S archiso)" >&2; exit 1; }
[[ $EUID -eq 0 ]] || { echo "error: run as root — mkarchiso requires it" >&2; exit 1; }

PROFILE="$WORK/profile"
rm -rf "$PROFILE"
mkdir -p "$WORK"
cp -r "$RELENG" "$PROFILE"

echo ":: adding shell packages"
cat "$HERE/packages.extra" >> "$PROFILE/packages.x86_64"

echo ":: overlaying airootfs"
cp -r "$HERE/airootfs/." "$PROFILE/airootfs/"
install -Dm755 "$REPO/os/bin/ios6-shell" "$PROFILE/airootfs/usr/bin/ios6-shell"
install -Dm755 "$REPO/os/bin/ios6d"      "$PROFILE/airootfs/usr/bin/ios6d"
install -Dm644 "$REPO/os/systemd/ios6d.service" \
    "$PROFILE/airootfs/etc/systemd/system/ios6d.service"

echo ":: installing the SpringBoard UI"
mkdir -p "$PROFILE/airootfs/usr/share/ios6"
cp -r "$REPO/index.html" "$REPO/css" "$REPO/js" "$PROFILE/airootfs/usr/share/ios6/"
# local artwork drop-ins ride along into YOUR image (gitignored in the repo)
for d in icons wallpapers; do
  [ -d "$REPO/$d" ] && cp -r "$REPO/$d" "$PROFILE/airootfs/usr/share/ios6/"
done

echo ":: enabling services"
WANTS="$PROFILE/airootfs/etc/systemd/system/multi-user.target.wants"
mkdir -p "$WANTS"
ln -sf /etc/systemd/system/ios6d.service              "$WANTS/ios6d.service"
ln -sf /usr/lib/systemd/system/NetworkManager.service "$WANTS/NetworkManager.service"
ln -sf /usr/lib/systemd/system/ModemManager.service   "$WANTS/ModemManager.service"

echo ":: registering file permissions"
# profiledef.sh is sourced by mkarchiso, so appending to the assoc array works
cat >> "$PROFILE/profiledef.sh" <<'EOF'

file_permissions+=(
  ["/usr/bin/ios6-shell"]="0:0:755"
  ["/usr/bin/ios6d"]="0:0:755"
)
EOF

echo ":: building ISO (this takes a while and needs ~6 GB in $WORK)"
mkarchiso -v -w "$WORK/work" -o "$WORK/out" "$PROFILE"

echo
echo "Done. Boot it:  qemu-system-x86_64 -m 3G -enable-kvm -cdrom $WORK/out/archlinux-*.iso"
