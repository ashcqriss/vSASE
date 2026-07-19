#!/usr/bin/env bash
# Build a UEFI-bootable Arch Linux ARM disk image (qcow2) of the iOS 6
# shell, for native virtualization in UTM on Apple Silicon Macs.
#
# Must run as root on an aarch64 host (e.g. GitHub's ubuntu-24.04-arm
# runners) — the Arch ARM rootfs is entered with a plain chroot, no
# binfmt emulation involved. Requires: curl, tar, sgdisk, mkfs.vfat,
# mkfs.ext4, losetup, rsync, qemu-img.
set -euxo pipefail

OUT="${1:-/build}"
ROOT="$OUT/rootfs"
ALARM_TARBALL="http://os.archlinuxarm.org/os/ArchLinuxARM-aarch64-latest.tar.gz"
IMG="$OUT/disk.raw"
QCOW="$OUT/ios6-arch-aarch64.qcow2"

[[ $(uname -m) == aarch64 ]] || { echo "error: must run on an aarch64 host" >&2; exit 1; }
[[ $EUID -eq 0 ]] || { echo "error: must run as root" >&2; exit 1; }

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
mkdir -p "$ROOT"

echo ":: fetching Arch Linux ARM rootfs"
curl -fL "$ALARM_TARBALL" -o "$OUT/alarm.tar.gz"
tar --numeric-owner -xpzf "$OUT/alarm.tar.gz" -C "$ROOT"

echo ":: entering chroot"
mount --bind /dev  "$ROOT/dev"
mount --bind /proc "$ROOT/proc"
mount --bind /sys  "$ROOT/sys"
# the ALARM tarball ships resolv.conf as a dangling symlink — replace it
# with real nameservers (resolved's stub 127.0.0.53 also won't do)
rm -f "$ROOT/etc/resolv.conf"
if [[ -f /run/systemd/resolve/resolv.conf ]]; then
    cp /run/systemd/resolve/resolv.conf "$ROOT/etc/resolv.conf"
elif grep -qv 127.0.0.53 /etc/resolv.conf 2>/dev/null; then
    cp --dereference /etc/resolv.conf "$ROOT/etc/resolv.conf"
else
    printf 'nameserver 1.1.1.1\nnameserver 8.8.8.8\n' > "$ROOT/etc/resolv.conf"
fi
trap 'umount -l "$ROOT/dev" "$ROOT/proc" "$ROOT/sys" 2>/dev/null || true' EXIT

run() { chroot "$ROOT" /bin/bash -c "$*"; }

echo ":: initializing pacman and updating"
# in a plain chroot the rootfs is not a mount point, so pacman's disk
# space check cannot resolve the cachedir — disable it (pacstrap does too)
sed -i 's/^CheckSpace/#CheckSpace/' "$ROOT/etc/pacman.conf"
run "pacman-key --init && pacman-key --populate archlinuxarm"
run "pacman -Syu --noconfirm"

echo ":: installing the shell stack"
run "pacman -S --noconfirm --needed cage seatd python ttf-dejavu noto-fonts dosfstools \
     pipewire pipewire-pulse pipewire-alsa wireplumber"
run "pacman -S --noconfirm --needed chromium || pacman -S --noconfirm --needed epiphany"
run "pacman -S --noconfirm --needed firefox || true"

echo ":: installing SpringBoard"
mkdir -p "$ROOT/usr/share/ios6"
cp -r "$REPO/index.html" "$REPO/css" "$REPO/js" "$REPO/icons" "$ROOT/usr/share/ios6/"
# wallpapers drop-in folder rides along when present (gitignored in the repo)
[ -d "$REPO/wallpapers" ] && cp -r "$REPO/wallpapers" "$ROOT/usr/share/ios6/" || true
install -Dm755 "$REPO/os/bin/ios6-shell" "$ROOT/usr/bin/ios6-shell"
install -Dm755 "$REPO/os/bin/ios6d"      "$ROOT/usr/bin/ios6d"
install -Dm644 "$REPO/os/systemd/ios6d.service" "$ROOT/etc/systemd/system/ios6d.service"

echo ":: configuring autologin -> shell"
mkdir -p "$ROOT/etc/systemd/system/getty@tty1.service.d"
cat > "$ROOT/etc/systemd/system/getty@tty1.service.d/autologin.conf" <<'EOF'
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin root --noclear %I $TERM
Type=idle
EOF
cat > "$ROOT/root/.bash_profile" <<'EOF'
if [[ -z $WAYLAND_DISPLAY && $(tty) == /dev/tty1 ]]; then
    exec ios6-shell
fi
EOF
echo arch-iphone > "$ROOT/etc/hostname"
run "systemctl enable seatd ios6d getty@tty1"
run "echo root:ios6 | chpasswd"

echo ":: initramfs with virtio for UTM/QEMU"
sed -i 's/^MODULES=.*/MODULES=(virtio virtio_blk virtio_pci virtio_mmio virtio_gpu virtio_net)/' \
    "$ROOT/etc/mkinitcpio.conf"
run "mkinitcpio -P"

echo ":: assembling GPT image (ESP + root)"
umount -l "$ROOT/dev" "$ROOT/proc" "$ROOT/sys"; trap - EXIT
rm -f "$IMG"
truncate -s 8G "$IMG"
sgdisk --zap-all "$IMG"
sgdisk -n1:0:+512M -t1:ef00 -c1:ESP -n2:0:0 -t2:8305 -c2:root "$IMG"
LOOP=$(losetup -Pf --show "$IMG")
trap 'umount -R /mnt/ios6 2>/dev/null || true; losetup -d "$LOOP" || true' EXIT
mkfs.vfat -F32 "${LOOP}p1"
mkfs.ext4 -q -F "${LOOP}p2"
mkdir -p /mnt/ios6
mount "${LOOP}p2" /mnt/ios6
mkdir -p /mnt/ios6/boot
mount "${LOOP}p1" /mnt/ios6/boot
rsync -aHAX --numeric-ids "$ROOT/" /mnt/ios6/ \
    --exclude /boot 2>/dev/null || rsync -a --numeric-ids "$ROOT/" /mnt/ios6/ --exclude /boot
cp -r "$ROOT/boot/." /mnt/ios6/boot/ 2>/dev/null || true

echo ":: systemd-boot"
ROOT_PARTUUID=$(blkid -s PARTUUID -o value "${LOOP}p2")
mount --bind /dev /mnt/ios6/dev; mount --bind /proc /mnt/ios6/proc; mount --bind /sys /mnt/ios6/sys
chroot /mnt/ios6 bootctl install --esp-path=/boot --no-variables
umount -l /mnt/ios6/dev /mnt/ios6/proc /mnt/ios6/sys
mkdir -p /mnt/ios6/boot/loader/entries
cat > /mnt/ios6/boot/loader/loader.conf <<'EOF'
default ios6.conf
timeout 0
EOF
cat > /mnt/ios6/boot/loader/entries/ios6.conf <<EOF
title   iOS 6 - Arch Edition
linux   /Image
initrd  /initramfs-linux.img
options root=PARTUUID=$ROOT_PARTUUID rw console=tty1 console=ttyAMA0
EOF
cat > /mnt/ios6/etc/fstab <<EOF
PARTUUID=$ROOT_PARTUUID / ext4 defaults 0 1
PARTUUID=$(blkid -s PARTUUID -o value "${LOOP}p1") /boot vfat defaults 0 2
EOF

umount -R /mnt/ios6
losetup -d "$LOOP"
trap - EXIT

echo ":: converting to qcow2"
qemu-img convert -O qcow2 -c "$IMG" "$QCOW"
rm -f "$IMG" "$OUT/alarm.tar.gz"
ls -lh "$QCOW"
echo UTM-IMAGE-OK
