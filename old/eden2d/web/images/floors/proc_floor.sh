#!/bin/sh
convert $1.png -crop 16x16 +repage $1%d.png
mv $10.png $1_patch_0.png
mv $11.png $1_inner_0.png
mv $12.png $1_inner_1.png
mv $13.png $1_patch_1.png
mv $14.png $1_inner_2.png
mv $15.png $1_inner_3.png
mv $16.png $1_outer_0.png
mv $17.png $1_outer_1.png
mv $18.png $1_outer_2.png
mv $19.png $1_outer_3.png
mv $110.png $1_outer_4.png
mv $111.png $1_outer_5.png
mv $112.png $1_outer_6.png
mv $113.png $1_outer_7.png
mv $114.png $1_outer_8.png
mv $115.png $1_solid_0.png
mv $116.png $1_solid_1.png
mv $117.png $1_solid_2.png
