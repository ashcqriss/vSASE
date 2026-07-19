# wallpapers/ — real wallpaper drop-in

Put image files named `wp1` through `wp8` (`.png` or `.jpg`) in this folder
and they appear automatically as extra tiles in
**Settings → Brightness & Wallpaper** — no code changes needed. Portrait
images around 640×960 or larger look best; the shell letterboxes with
`cover` scaling.

    wallpapers/wp1.png
    wallpapers/wp2.jpg
    …
    wallpapers/wp8.png

Where to get the original-era artwork: download it yourself from your own
sources (for example an archive gallery of the stock wallpapers) onto your
machine. **Keep it local.** Apple's wallpapers are copyrighted, so this
folder is gitignored — files you place here are used by the OS but are
never committed or pushed. The repo itself ships only the four built-in
procedural wallpapers, which are original work.

Any photo from the Camera Roll also works without this folder:
Photos → open a photo → sheet → **Use as Wallpaper**.
