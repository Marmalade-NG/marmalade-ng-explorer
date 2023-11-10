#!/bin/sh

convert public/logo.jpg  -background white \
        \( -clone 0 -resize 16x16 -extent 16x16 \) \
        \( -clone 0 -resize 32x32 -extent 32x32 \) \
        \( -clone 0 -resize 48x48 -extent 48x48 \) \
        \( -clone 0 -resize 64x64 -extent 64x64 \) \
        -delete 0 -alpha off -colors 256 public/favicon.ico

convert public/logo.jpg -resize 256x256 src/assets/marm_logo.png