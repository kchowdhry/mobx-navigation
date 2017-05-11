# Example Directory

## `Root.js`

Contains the main entrypoint of the application and several root scenes

## `TabOne.js`

First tab which demonstrates navigation to various scenes with and without props,
hopping to a scene on a different tab, resetting the scene graph to the beginning,
and a link to `Circular.js` which demonstrates initializing the `navConfig` to the
static prop of a circularly defined reference (requires late merging of the `navConfig`).

## `TabTwo.js`

This second tab contains a link to a scene with links that reset this tab and the
third tab to the root of that tab and switching to it. It also has two separate
links to `CachedScene.js`, which provides a `cacheHint` in its `navConfig`. The
`CachedScene` has state housed on the component so you can visually see that the
scene is recycled even when its popped off the stack and renavigated to.

## `TabThree.js`

The third tab also contains a link to `CachedScene` which shows that the same cached
component can exist at multiple points in the scenegraph (try navigating to it
on both tab two and tab three and swapping between the two tabs). This tab also
contains links to `ComplexScene.js` which shows how the shared `navProps` in the
`navConfig` can be used to drive changes in the nav bar elements.

## `DeepLink.js`

This is the fourth tab which is named as such because it demonstrates more exotic
links between scenes. The first link pushes two scenes on the stack of a different
tab and navigates to it. The second link goes to `Unique.js` which enables the `unique`
property in its `navConfig`. The `Unique` scene only allows one instance of itself
on the stack and contains several mechanisms to navigate to a self-referential link
to demonstrate that this is in fact what happens.
