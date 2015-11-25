# List -- Shows type parameters -- part of type for purposes of function dispatching.
object List(T): native
when add (obj T) to (list List): native
when insert (obj T) into (list List) before (befObj T): native
when at (index number): native

# Map
object Map(K, V): native
when set (key K) (val V) in (map Map): native
when contains (key K) -> boolean: native
when remove (key K) -> V: native
when get (key K) from (map Map) -> V: native
