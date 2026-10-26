# Array data structure

`com.dzong.dzongkeeper.towerdefense.structures.Array<T>` is an ordered,
resizable array. It accepts null elements and supports stack-style append
and removal as well as insertion and deletion at any valid index.

## Usage and index rules

```java
Array<String> names = new Array<>(0);
names.add("Pema");              // [Pema]
names.add(0, "Karma");          // [Karma, Pema]
names.set(1, "Sonam");          // [Karma, Sonam]
String first = names.get(0);    // Karma
names.delete(0);                // [Sonam]
names.delete();                 // []
names.add("Deki");              // [Deki]: an emptied array remains reusable
```

- `size()` counts stored elements, including nulls, rather than capacity.
- `get`, `set`, and `delete(index)` require `0 <= index < size()`.
- `add(index, value)` permits `0 <= index <= size()`; `size()` means append.
- Invalid indices throw `IndexOutOfBoundsException` before changing contents.
- `set` replaces an element and never appends. Use `add` to append.
- `delete()` removes the last element and throws `IndexOutOfBoundsException`
  when empty.
- Constructors reject negative capacity and capacity smaller than the supplied
  initial array with `IllegalArgumentException`. Zero capacity becomes one.
- Initial elements are copied into independent storage; element objects
  themselves are not deep-copied.

## Fixes and capacity behavior

The initial-array constructor now records the copied element count, so reads
and appends preserve those elements. Previously it reported an empty array
and the next append overwrote the first element.

Capacity never falls below one, including after deleting the last element.
Previously an empty backing array could only grow to another zero-length
array, causing the next append to fail.

Insertion and deletion now shift elements within the existing backing array
instead of constructing slices and concatenating them. Spare capacity is
preserved. Capacity doubles when full and halves after a deletion when the
array is at most one quarter full. Deletion clears the vacated slot to release
the removed reference.

Indexed reads and replacements take O(1) time. Appending and deleting the last
element take amortized O(1) time, with O(n) copies during resizing. Arbitrary
insertion and deletion take O(n) time. Storage takes O(capacity) space.

## Regression checks

`ArrayTests` covers initial copying, invalid capacities and indices, nulls,
insertion and deletion order, reuse after emptying, and repeated growth and
shrink cycles compared with `java.util.ArrayList`.

Run the focused tests with:

```sh
bash mvnw -o -Dtest=ArrayTests test
```

The `-o` flag uses cached Maven dependencies; omit it if dependencies must be
downloaded.
