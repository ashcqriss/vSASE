# iOS 6 · Arch Edition — the live ISO autologs root on tty1 (releng default);
# hand the terminal straight to the SpringBoard shell.
if [[ -z $DISPLAY && -z $WAYLAND_DISPLAY && $(tty) == /dev/tty1 ]]; then
    exec ios6-shell
fi
