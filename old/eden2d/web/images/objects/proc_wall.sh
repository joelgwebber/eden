#!/bin/sh
convert $1.png -crop 16x16 +repage $1%d.png
mv $10.png $1_horz_0.png
mv $11.png $1_horz_1.png
mv $12.png $1_horz_2.png
rm $13.png
mv $14.png $1_vert_0.png
mv $15.png $1_vert_1.png
rm $16.png
rm $17.png
mv $18.png $1_corner_0.png
mv $19.png $1_corner_1.png
rm $110.png
rm $111.png
mv $112.png $1_door_0.png
mv $113.png $1_door_1.png
rm $114.png
rm $115.png
