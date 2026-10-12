#!/bin/zsh
# encode.sh <png dir> <site static/defex/cobot dir>
set -e
SRC=$1; OUT=$2
mkdir -p $OUT/frames/{1920,960,640,400} $OUT/tmp
enc() { ffmpeg -nostdin -loglevel error -y -i "$1" ${=2} -c:v libsvtav1 -crf $3 -preset 4 -svtav1-params avif=1:tune=0:film-grain=0 -pix_fmt yuv420p -f avif "$4"; }
export -f enc 2>/dev/null || true
for f in $SRC/f*.png; do
  b=$(basename $f .png); n=${b#f}; n=$((10#$n))
  echo "$f $b $n"
done > $OUT/tmp/list.txt
cat $OUT/tmp/list.txt | xargs -P 6 -L 1 zsh -c '
  f=$0; b=$1; n=$2; OUT='"$OUT"'
  ffmpeg -nostdin -loglevel error -y -i $f -c:v libsvtav1 -crf 21 -preset 4 -svtav1-params avif=1:tune=0:film-grain=0 -pix_fmt yuv420p -f avif $OUT/frames/1920/$b.avif
  ffmpeg -nostdin -loglevel error -y -i $f -vf "crop=1080:1080:420:0,scale=960:960:flags=lanczos" -c:v libsvtav1 -crf 24 -preset 4 -svtav1-params avif=1:tune=0:film-grain=0 -pix_fmt yuv420p -f avif $OUT/frames/960/$b.avif
  if [ $((n % 2)) -eq 0 ]; then
    ffmpeg -nostdin -loglevel error -y -i $f -vf "scale=640:360:flags=lanczos" -c:v libsvtav1 -crf 30 -preset 4 -svtav1-params avif=1:tune=0 -pix_fmt yuv420p -f avif $OUT/frames/640/$b.avif
    ffmpeg -nostdin -loglevel error -y -i $f -vf "crop=1080:1080:420:0,scale=400:400:flags=lanczos" -c:v libsvtav1 -crf 30 -preset 4 -svtav1-params avif=1:tune=0 -pix_fmt yuv420p -f avif $OUT/frames/400/$b.avif
  fi'
FIRST=$(ls $SRC/f*.png | head -1); LAST=$(ls $SRC/f*.png | tail -1)
cwebp -quiet -q 78 -m 6 $FIRST -o $OUT/cobot-poster.webp
cwebp -quiet -q 78 -m 6 $LAST -o $OUT/cobot-poster-final.webp
ffmpeg -nostdin -loglevel error -y -framerate 30 -start_number 0 -i $SRC/f%04d.png -c:v libx264 -preset slow -crf 23 -g 6 -keyint_min 6 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart -an $OUT/cobot-film.mp4
ffmpeg -nostdin -loglevel error -y -framerate 30 -start_number 0 -i $SRC/f%04d.png -vf "crop=1080:1080:420:0,scale=960:960:flags=lanczos" -c:v libx264 -preset slow -crf 25 -g 6 -keyint_min 6 -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart -an $OUT/cobot-film-sm.mp4
rm -rf $OUT/tmp
du -sh $OUT/frames/* $OUT/*.webp $OUT/*.mp4
