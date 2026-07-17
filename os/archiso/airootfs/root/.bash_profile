# iOS 6 · Arch Edition — start the SpringBoard shell on the first VT
# (kept in sync with .zlogin; whichever login shell runs, the result is iOS 6)
if [[ -z $DISPLAY && -z $WAYLAND_DISPLAY && $(tty) == /dev/tty1 ]]; then
    exec ios6-shell
fi
