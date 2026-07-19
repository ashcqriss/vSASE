#!/usr/bin/env bash
# Inline every stylesheet and script of index.html into a single
# self-contained preview.html — one file, zero dependencies, works in
# any browser or HTML previewer that only fetches a single document.
set -euo pipefail
cd "$(dirname "$0")/.."

python3 - <<'PY'
import re

html = open("index.html", encoding="utf-8").read()

def inline_css(m):
    body = open(m.group(1), encoding="utf-8").read()
    return "<style>\n" + body + "\n</style>"

def inline_js(m):
    body = open(m.group(1), encoding="utf-8").read()
    # a literal </script> inside JS source would end the inline tag early
    body = body.replace("</script>", "<\\/script>")
    return "<script>\n" + body + "\n</script>"

html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', inline_css, html)
html = re.sub(r'<script src="([^"]+)"></script>', inline_js, html)

banner = ("<!-- GENERATED FILE - do not edit. Built by tools/build-standalone.sh "
          "from index.html + css/ + js/. -->\n")
html = re.sub(r"(<!doctype html>)", r"\1\n" + banner, html, count=1, flags=re.I)

open("preview.html", "w", encoding="utf-8").write(html)
print("preview.html written:", len(html), "bytes")
PY
