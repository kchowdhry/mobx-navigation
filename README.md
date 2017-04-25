# mobx-navigation

`mobx-navigation` is a relatively unopinionated navigation which is geared largely for applications
that require high performance navigation and leverage `mobx` for state management.

## Goals

- *Tunable high performance* navigation
- Leverage mobx state management to power rendering state changes instead of React lifecycle events
- Full extensibility for all navigation components
- Flexible navigation state mutation for scenarios of varying degrees of complexity

## Summary

At the top level, we have a `SceneContainer` which renders a `Scene`. The container is responsible for
managing the `NavState`, which may change as a result of user interaction. Digging into each of these
things in more detail:

### `NavState`

This class is driven by a instances of a `NavMotion`. A motion, when executed, mutates the state
according to parameters defined by the user. The `NavState` is responsible for determining which
components can be reclaimed in memory by maintaining a cache with a modified LRU eviction policy.
The `NavState` is accessible globally and can be used to make decisions about routing and rendering.

### `SceneContainer`

The scene container is responsible for reading the `NavState` and rendering the correct scene. It listens
to changes in the `NavState` and performs a transition plan to animate scene changes smoothly (where
appropriate). Components rendered by the `SceneContainer` live on the `NavState`. This container also
houses default options for things like the nav bar component, tab bar component, animation timings,
transition callbacks, and more.

### `Scene`

A scene is a purely visual component that encapsulates common navigation elements such as a navigation
bar, a tab bar, and FAB (floating action button). The user will generally nest a component inside a
`Scene` and may optionally provide a static function `initSceneState` which takes the props the scene is
about to be initialized with. This state is also passed in as props to the component later and contains
a number of `mobx` observables which may be modified to affect the rendered state of the various
navigation properties. All the default options specified by the `SceneContainer` can be overridden by
the `Scene` as needed.

### Motions

Unlike many other navigation libraries, mobx-navigation is *scene data driven* instead of *scene
graph data driven*. What this means is that the scene graph is not determined upfront but all scenes
declare as static properties all the data necessary to determine how to transition to the scene. This
data can be overridden at runtime, depending on what is desired. From this configuration, the `NavState`
and subsequently the `SceneContainer` is mutated declaratively. The benefit of doing things this way
is that the data about a scene is housed as close to the scene itself instead of somewhere else.
