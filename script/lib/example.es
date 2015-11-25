let KeyUp = 1
let KeyDown = 2
let KeyLeft = 3
let KeyRight = 4

var player Player
var animals List(Animal)
var enemies List(Enemy)

object Player:
  x, y   number
  health number
  score  number

object Enemy:
  x, y   number
  health number

object Animal:
  x, y number

when kill (animal Animal):
  [:remove animal :from animals]

when kill (enemy Enemy):
  [:remove enemy :from enemies]

# callable as either [:collision animal player]
# or                 [:collision player animal]
when collision (player Player, animal Animal):
  [:kill animal]
  [player :score] <- [player :score] + 1

when collision (player Player, enemy Enemy):
  [player :health] <- [player :health] - 1
  if [player :health] <= 0:
    [endGame]

when endGame:
  # ... game over ...

when pressed (key string):
  if key = Up:
    [player :y] <- [player :y] - 1
  else if key = Down:
    [player :y] <- [player :y] + 1
  else if key = Left:
    [player :x] <- [player :x] - 1
  else if key = Right:
    [player :x] <- [player :x] + 1

when start:
  player <- [:make Player]
  [:addEnemy]
  [:addAnimal]

when addEnemy:
  var enemy <- [:make Enemy]
  [:enemy x] <- [:random 100]
  [:enemy y] <- [:random 100]
  [:add enemy :to enemies]

when addAnimal:
  var animal <- [:make Animal]
  [animal :x] <- [:random 100]
  [animal :y] <- [:random 100]
  [:add animal :to animals]

[player :collidesWith [enemies :at 0]]
