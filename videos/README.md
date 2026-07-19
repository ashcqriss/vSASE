# videos/ — real video drop-in

Put video files named `v1` through `v8` (`.mp4` or `.webm`) in this folder
and they appear automatically under **My Videos** in the Videos app,
playing in the real `<video>` element with sound — no code changes needed.
H.264/MP4 is the safest format across the browser demo and the installed
device.

    videos/v1.mp4
    videos/v2.webm
    …
    videos/v8.mp4

Where to get clips: download them yourself onto your machine. **Keep them
local.** Third-party video (ads, keynote footage, etc.) is copyrighted by
its owners, so this folder is gitignored — files you place here are used by
the OS but are never committed or pushed. The repo ships only the built-in
procedurally-generated "films," which are original work.

You can also record your own clips right on the device: Camera → flip the
switch to video mode. Those show up under Camera Roll.
