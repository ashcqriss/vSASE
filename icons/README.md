# icons/ — real artwork drop-in

Any PNG placed here **automatically replaces** the built-in SVG icon of the
matching app on the home screen — no code changes needed. Square art
(114×114 or 57×57) works best; corners are rounded by the shell.

Recognized filenames (one per app):

    messages.png  calendar.png  photos.png    camera.png     videos.png
    weather.png   passbook.png  notes.png     reminders.png  clock.png
    maps.png      stocks.png    newsstand.png itunes.png     appstore.png
    gamecenter.png settings.png contacts.png  calculator.png compass.png
    voicememos.png terminal.png phone.png     mail.png       safari.png
    music.png

To use original-era artwork (for example the images inside The OldOS
Project's `OldOS/Assets.xcassets`, github.com/zzanehip/The-OldOS-Project),
download it yourself on your own machine, rename the files to the names
above and drop them in this folder. **Keep them local** — that artwork is
Apple's, so this folder is gitignored and files you place here are used by
the OS but never committed or pushed. Missing files simply keep the
built-in SVG recreation — mixing the two is fine.
