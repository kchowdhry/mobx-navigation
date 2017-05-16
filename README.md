# mobx-navigation

`mobx-navigation` is a relatively unopinionated navigation which is geared largely for applications
that require high performance navigation and leverage `mobx` for state management.

## Goals

- *Tunable high performance* navigation
- Leverage mobx state management to power rendering state changes instead of React lifecycle events
- Full extensibility for all navigation components
- Flexible navigation state mutation for scenarios of varying degrees of complexity

This library was created to solve a number of use cases that were not met by other navigation libraries,
including the most recent `react-navigation` library. It is definitely geared towards users who favor
`mobx` over `redux`, where state changes are not debounced indiscriminantly and are direct. Using `mobx`,
while not strictly necessary, is preferred but you are free to use the library in conjunction with any
state-management library you like.

Some scenarios this library was designed to make easy:

1. Changing elements in the navigation bar (header at the top) dynamically as a result of some action
   taken in the scene itself.
2. Caching scenes that would have otherwise been completely unmounted
3. Issuing fairly complicated deep-link scenarios (back + switch tab + push 3 different pages)
4. Executing code before and after a transition occurs
5. Convenient configuration of scenes via templates and configuration merging
6. Flexible navigation with respect to things like a scene that can belong to multiple tabs, a scene
   that can only belong to one tab, a scene that should be unique in the stack that it's on, etc

From an implementation standpoint, the library provides a number of tools to give the library-user
flexibility in rendering scenes to make things as performant as possible.

## Usage

The bulk of the documentation is actually housed as code in the example project located in this repo
[here](https://github.com/PlexChat/mobx-navigation/tree/master/example/src). The scenes and classes
in there could use some organization (difficult because the feature set is so large), so changes to
help shuffle and rename things would be appreciated. For additional exposition, or to get the gist of
the library, keep reading.

To get started with the library, you will need a `NavContainer` component somewhere near or at the
top of the application render tree. If you wish to embed the `NavContainer` inside some other component,
you may. This component, should have declared, as children, any `NavTab` elements you wish to exist
at some point in the application.

```js
import React from 'react';
import { NavContainer } from 'mobx-navigation';
import Tab1 from './Tab1';
import Tab2 from './Tab2';

export default class MyApp extends React.Component {
  render() {
    return (
      <NavContainer>
        <NavTab initialScene={Tab1} name="tab1" isInitial />
        <NavTab initialScene={Tab2} name="tab2" />
      </NavContainer>
    );
  };
}
```

If you want to register a scene, you should do it on the scene itself.

```js
import { scene } from 'mobx-navigation';

@scene('sceneExample')
export default class SceneExample {
  static navConfig = {
    // Insert custom scene configuration here
  }
}
```

Later on, a person could push this scene by doing something like

```js
this.props.navState.push('sceneExample'); // Can take props to the scene as the second object
```

The `navState` is provided as a prop to scenes that are mounted by this library underneath the
parent `NavContainer`.

### Configuration

The full default configuration is defined below:

```js
export const defaultConfig = {
  // You are free to put any data in here that you like and the library will merge the contents
  // for you as appropriate. It may be accessed through the navState
  custom: {},

  navBarVisible: false,
  tabBarVisible: false,
  cardStyle: {
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    position: 'absolute',
    backgroundColor: 'white',
  },
  initNavProps: null,
  navBarStyle: {
    backgroundColor: 'white',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#828287',
    height: 68 - STATUSBAR_HEIGHT,
  },
  navBarBackImage: null,
  navBarBackImageStyle: {
    width: 13,
    height: 21,
  },
  navBarCenter: null,
  navBarCenterProps: null,
  navBarCenterStyle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: STATUSBAR_HEIGHT,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  navBarLeftDisabled: false, // Remove default back button
  navBarLeft: null,
  navBarLeftProps: null,
  navBarLeftStyle: {
    position: 'absolute',
    justifyContent: 'center',
    paddingTop: STATUSBAR_HEIGHT,
    width: 100,
    top: 0,
    left: 0,
    bottom: 0,
    paddingLeft: 15,
  },
  navBarRight: null,
  navBarRightProps: null,
  navBarRightStyle: {
    position: 'absolute',
    justifyContent: 'center',
    paddingTop: STATUSBAR_HEIGHT,
    width: 100,
    top: 0,
    right: 0,
    bottom: 0,
    paddingRight: 15,
  },
  navBarTitleStyle: {
    alignItems: 'center',
  },
  navBarSubtitleStyle: {

  },
  navBarTransparent: false,
  statusBarStyle: 'default', // One of default, light-content, or dark-content
  tabBarStyle: {
    height: 50,
  },
  tabBarTransparent: false,
  unique: false, // If true, pushing this scene onto the stack will pop all scenes below to the first occurence of this scene if it exists
}
```

To understand these keys in more detail and see usages, the example app provided by the project is the best
way to do so.

Each one of these keys can be overridden by individual scenes in a number of ways. The values are
merged according to the following scheme:

- If the override is an object and the parent is an object, perform a shallow merge with the override taking precedence
- If the parent is an object and the override isn't, construct an array with the parent and child as elements in that order
- If the parent is an array and the child is not, prepend the child to the parent
- If the parent and child are arrays, merge them
- If the parent is set and the child is set to null, assign null to the value
- If the parent is set and the child is `undefined`, keep the parent as is

Part of the reason for the array merging is because the React native `StyleSheet` object is merged by consuming arrays,
and it's possible for a user to wish to merge object styles with `StyleSheet` styles (which are, in Javascript, nothing
more than numerical references).

For convenience, this library allows you to define a collection of settings as a `template` that a
scene may take wholesale. The `templates` should be defined as an object keyed to the template names and
passed as a prop to the navigation container.

```js
const myTemplates = {
  tallTabBar: {
    tabBarVisible: true,
    tabBarStyle: {
      height: 100,
    },
  },
};
...
<NavContainer templates={myTemplates}>
  ...
</NavContainer>
```

Later on, this template can be applied to a scene with additional keys overridden if desired:

```js
@scene('custom')
class CustomScene extends Component {
  static navConfig = {
    template: 'tallTabBar',
    tabBarStyle: {
      backgroundColor: 'red',
    },
  };
  ...
}
```

This `CustomScene` will end up with a tab bar which is visible, 100 points tall, and with a red background
color. If we want, we can also specify multiple templates to apply by specifiying `templates` in the
`navConfig` and a list of template names. They are applied in order and the other keys in the `navConfig`
are always applied last.

### Caching

To allow a scene to be cached and rendered offscreen, the scene must provide the `cacheHint` property in
its static `navConfig`. This property is a function which takes the scene `props` as an argument and should
return a string. For example:

```js
@scene('user')
class UserProfile extends Component {
  static navConfig = {
    cacheHint: (props) => props.username,
  };
  ...
}
```

Later, if someone performs `this.props.navState.push('user', { username: 'jeremy' })`, the library will
ensure that at most one instance of the scene type `user` which evaluates to the cache hint "jeremy" exists.
In addition, it will retain the scene even after it is replaced or popped off the scene graph until the
cache is full, so that if someone navigates to the same profile again, no work needs to be done. Note that
cache hints are *automatically namespaced* so you should not need to include the scene name or component type
in the cache hint itself.

### Multi-configs

Often, one may wish to have a single component used for multiple scenes but with different navigation configs.
This can be done relatively easily as follows:

```js
@scene
class Snowflake extends Component {
  static multiNavConfig = {
    snowflake: {
      navBarVisible: true,
    },
    snowflakeAlt: {
      tabBarVisible: true,
    }
  };
  ...
}
```

Later, if someone pushes "snowflake", it will render `Snowflake` with a nav bar but no tab bar. If someone
pushes "snowflakeAlt", it will render `Snowflake` as well but with a tab bar instead. Note that the `scene`
decorator does not have any arguments.

A scene may have *both* a `navConfig` and a `multiNavConfig`. In this case, the `navConfig` is treated as
a template that is applied to all configurations passed in the `multiNavConfig`.

### Lifecycle Events

Components decorated with the `@scene` decorator will automatically have access to four additional lifecycle
events: `componentWillShow`, `componentDidShow`, `componentWillHide`, and `componentDidHide`. These events
occur analogously to the standard React lifecycle events at the start and end of navigation transitions. Note
that in all cases, the component will have already rendered, either onscreen or offscreen so `mount` events
are guaranteed to happen first before any `show` events and `unmount` events will always occur after the `hide`
events.

If you want to access these lifecycle events from any child component, you should do so via the `@child`
decorator which should go before any other mobx-react decorators (aka, it should be applied last). This will
cause the decorated child component to register itself with an existing scene in its React context if it exists,
and lifecycle events for that nearest parent scene will automatically trigger lifecycle events defined on the
child.

Note that for both the scene and the child components, you are not required to define all, or any, of the
custom lifecycle events. Only what you need! Examples of these events firing can be seen in the example project.

## Implementation Summary

Conceptually, `mobx-navigation` renders scenes in a relatively straightforward manner:

```
          NavState
         /        \
        /          \
       /            \
      /              \
NavContainer ----- ElementPool
```

The `NavContainer` is the visual component of the library which renders elements contained in the `ElementPool`.
By interacting with elements rendered by the `NavContainer`, the user can than mutate the `NavState` which is
conceptually similar to the scenegraph object in other libraries. The `NavState` in turn retains or releases
references that cause new elements to get added to the `ElementPool`, or old elements to be removed as necessary.

The separation of the `NavState` from the `ElementPool` allows us to more easily cache scenes in memory, regardless
of whether or not the scene is reachable from the current navigation state. For example, loading a user profile
and subsequently hitting the `back` button should ideally not tear down the entire user profile scene in case the
user wanted to load it again relatively soon.

Each of these concepts is presented in more detail below.

### `NavState`

The `NavState` is a collection of `NavNode`s which are attached to each other as you would expect in a tree-like
form. The nodes themselves contain data about the configuration of the node, the props the node was created with,
the React component that the node would render, the `NavElement` instance created for the node, and other metadata.
All actions that would change the navigation state are also defined on this class (which is created when the
`NavContainer` is initially mounted). The `NavState` itself not concerned with caching elements and is a faithful
representation of the current state of the scenegraph. When `NavNode`s are added or removed, the nodes themselves
call `retain` or `release` on the `ElementPool` respectively so that the lifetime of a `NavNode` is decoupled from
the React element that would ultimately be rendered. The `NavState` is also responsible for managing transitions,
and as such, handles the invocation of `mobx-navigation`-specific lifecycle events like `componentDidShow` or
`componentWillHide`.

### `NavContainer`

The scene container is responsible for reading the `ElementPool` and rendering all elements it contains. This
includes elements that are currently unreachable by the current scenegraph as persisting them in the virtual-DOM
pays only an in-memory cost which will greatly accelerate navigating to it in the future. For each `NavElement`
returned from the pool, the `NavContainer` renders a `NavCard` to display it. The `NavCard` determines if it should
render onscreen or offscreen and also whether it should respect any ongoing animations. In addition, the `NavCard`
consumes user provided configuration (which is merged onto default configurations) to determine how to display the
`NavBar`, `NavTabBar`, and forward any shared `navProps` as applicable. The `navProps` which is shared between the
`NavBar` and the scene itself is created at the `NavCard` level and only upon request (via the `initNavProps`
configuration key) and may be an observable object for conveniently sharing reactive state.

### `ElementPool`

The 3rd leg of the tripod, the `ElementPool` is where all instances of React components reside. If the scene
provides a `cacheHint` configuration key, it evaluates this function to determine if the element already exists
in the pool. If so, it recycles existing elements (which would have been rendered offscreen) to accelerate
navigation. Furthermore, an identical scene may be rendered at multiple points in the scenegraph without any
issue. Changes to the element that occur as a result of some user action would persist (see the `CachedScene`
component in the example project). If no `cacheHint` is provided, the element is created as an *anonymous*
element and is guaranteed to be unique within the entire pool. In this case, the `NavNode` that spawned it is,
itself, used as the key. Lifetimes are maintained through a simple reference count, with anonymous elements having
a ref count of at most one.
