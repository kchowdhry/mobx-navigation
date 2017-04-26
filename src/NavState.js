import { Atom, action, computed, observable } from 'mobx';
import React from 'react';
import { Animated } from 'react-native';

// Conceptually, a scene graph looks like a acyclic graph with a single root. The data structure defined
// by this class needs to support the following operations:

// 1. push - from the current position, push a new scene onto the current one
// 2. replace - replace the currently mounted scene with a new one
// 3. pop - remove the current scene and move to the scene under it
// 4. hop - move the current position to a different position on the graph
// 5. some combination of the above

// No animations happen except in the cases of push and pop. As a result, these two cases are "special".
// Of course, if you modify the state, you can perform the equivalent operation as a push or pop but this
// would result in a scene change without animation (potentially desired in some cases)

// Keep this many orphaned instances around before starting to relaim scene instances in memory
const INSTANCE_FREE_WATERMARK = 20;

class InstancePool {
  // Mobx observable maps do not allow object keys so we make the instance pool a custom observable
  atom = new Atom('Nav instance pool');
  // Map from string or node to object with instance, refcount, and key
  nodes = new Map();
  // Set of keys that are currently orphaned
  orphanedNodes = new Set();

  counter: number = 0;

  instances(): Array<React.Component> {
    this.atom.reportObserved();
    const onscreen = [];
    const offscreen = [];
    this.nodes.forEach((element) => {
      if (element.refCount > 0) {
        if (element.node.isFront) {
          onscreen.push(element);
        } else if (element.node.isBack) {
          onscreen.unshift(element);
        } else {
          offscreen.push(element);
        }
      }
    });
    return onscreen.concat(offscreen);
  }

  // The hint is intended to be an object reference to a set of props used to define
  retain(node: NavNode): React.Component {
    // The instance returned by this function will either be created inline or was cached already by a previous
    // nav node sharing the same hint as this one
    let instance = null;
    let id = node.hint || node;

    const value = this.nodes.get(id);
    if (value) {
      value.refCount += 1;
      instance = value.instance;
    } else {
      this.atom.reportChanged();
      const navProps = (node.component.navConfig && node.component.navConfig.initNavProps) ?
        node.component.navConfig.initNavProps(node.props) : null;
      instance = node.createInstance(navProps);
      this.counter += 1;
      this.nodes.set(id, {
        refCount: 1,
        instance,
        key: this.counter,
        node,
        navProps,
      });
    }

    if (node.hint) {
      // Noop if this node was not previously orphaned
      this.orphanedNodes.delete(node.hint);
    }

    return instance;
  }

  release(node: NavNode) {
    let id = node.hint || node;
    const value = this.nodes.get(id);
    if (value) {
      value.refCount -= 1;
      if (value.refCount === 0) {
        if (node.hint) {
          this.orphanedNodes.add(node.hint);
        } else {
          this.atom.reportChanged();
          this.nodes.delete(id);
        }
      }
    } else {
      console.error(`Attempted to release node ${node.hint} which was not in the instance pool`);
    }
  }

  flush() {
    this.nodes = new Map();
    this.orphanedNodes = new Set();
    this.atom.reportChanged();
  }
}

export const Motion = {
  NONE: 0,
  SLIDE_ON: 1,
  SLIDE_OFF: 2,
};

export const Position = {
  FRONT: 0,
  BACK: 1,
  OFFSCREEN: 2,
};

export class NavNode {
  // Back reference to root object
  navState: NavState;

  previous: NavNode;
  @observable _next: NavNode;

  instance: React.Component;

  @observable position: number = Position.OFFSCREEN;

  get next() {
    return this._next;
  }

  set next(newNext: NavNode) {
    // All nodes after this one must be orphaned
    let next = this._next;
    while (next) {
      this.navState.instancePool.release(next);
      next = next.next;
    }
    this._next = newNext;
  }

  @observable component;
  @observable props;

  get hint() {
    if (!this.props) {
      return null;
    }
    return this.props.navHint;
  }

  // Configuration may be overridden on a specific instance of a component
  @observable config;

  // If this scene is used as the root of a tab, the configuration governing the tab are housed here
  @observable tabConfig;

  constructor(navState, component = null, props = {}) {
    this.navState = navState;
    this.component = component;
    this.props = props;
    this.instance = navState.instancePool.retain(this);
  }

  @computed get tail() {
    if (!this.next) {
      return this;
    }

    return this.next.tail;
  }

  createInstance(navProps) {
    return React.createElement(this.component, {
      navState: this.navState,
      navProps,
      ...this.props
    });
  }

  get isFront() {
    return this.position === Position.FRONT;
  }

  moveToFront() {
    this.position = Position.FRONT;
  }

  get isBack() {
    return this.position === Position.BACK;
  }

  moveToBack() {
    this.position = Position.BACK;
  }

  get isOffscreen() {
    return this.position === Position.OFFSCREEN;
  }

  moveOffscreen() {
    this.position = Position.OFFSCREEN;
  }

  get tabBarVisible(): boolean {
    return this.component.navConfig && this.component.navConfig.tabBarVisible;
  }

  get navBarVisible(): boolean {
    return this.component.navConfig && this.component.navConfig.navBarVisible;
  }

  get cardStyle(): Object {
    const style = {};
    if (this.component.navConfig) {
      if (this.navBarVisible && !this.component.navConfig.navBarTransparent) {
        style.marginTop = this.navState.config.navBarHeight;
      }
      if (this.tabBarVisible && !this.component.navConfig.tabBarTransparent) {
        style.marginBottom = this.navState.config.tabBarHeight;
      }
    }
    return style;
  }
}

export class NavState {
  instancePool: InstancePool = new InstancePool();

  rootNode: NavNode;

  tabNodes: Map<string, Object> = new Map();

  initialTab: NavNode;

  // {
  //   tabBarHeight: number,
  //   navBarHeight: number,
  // }
  config: Object;

  @observable activeNode;
  @observable activeTab: string = '';

  // These two observables are flags that, when set, being a transition of a scene sliding onto the
  // foreground or sliding off the background respectively
  @observable motion: number = Motion.NONE;

  @observable transitionValue; // React.Native animated value between 0 and 1

  // tabs correspond to a map from tab id to an object of the form
  // {
  //   component: React.Component,
  //   props: object
  // }
  // If a scene advertises that it has a tab affinity
  constructor(config, initialScene: React.Component, initialSceneProps: Object) {
    this.rootNode = new NavNode(this, initialScene, initialSceneProps);

    this.transitionValue = new Animated.Value(1);
    this.startTransition(this.rootNode);

    this.config = config;
  }

  // Returns a promise that resolves when the transition to the new node has completed. In the promise
  // resolution, it is expected that the caller clean up any nodes that are now orphaned
  @action startTransition(node: NavNode): Promise<> {
    if (!node) {
      return Promise.reject();
    }

    // Move nodes to the correct z-index as necessary
    if (this.motion === Motion.NONE) {
      node.moveToFront();
    } else if (this.motion === Motion.SLIDE_ON) {
      this.activeNode.moveToBack();
      node.moveToFront();
    } else if (this.motion === Motion.SLIDE_OFF) {
      this.activeNode.moveToFront();
      node.moveToBack();
    }

    // TODO custom callbacks
    if (this.motion === Motion.NONE) {
      this.endTransition(node);
      return Promise.resolve();
    }

    let start = 0;
    let end = 1;
    if (this.motion === Motion.SLIDE_OFF) {
      start = 1;
      end = 0;
    }
    this.transitionValue = new Animated.Value(start);
    return new Promise((resolve) => {
      Animated.timing(this.transitionValue, {
        toValue: end,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        this.endTransition(node);
        resolve();
      });
    });
  }

  @action endTransition = (node) => {
    if (this.activeNode) {
      this.activeNode.moveOffscreen();
    }
    this.activeNode = node;
  }

  // Nav tab configuration:
  // {
  //   isInitial: boolean,
  //   button: React.component,
  //   name: string,
  //   disableQuickReset: boolean,
  //   initialScene: React.component,
  //   initialProps: Object
  // }
  // This function is not meant to be called directly but is invoked automatically by NavTab components
  // used as children of the NavContainer
  addTab(tabConfig: Object) {
    const tab = new NavNode(this, tabConfig.initialScene, tabConfig.initialProps);
    tab.tabConfig = tabConfig;
    this.tabNodes.set(tabConfig.name, tab);
    if (tabConfig.isInitial) {
      this.initialTab = tab;
    }
  }

  @action push(scene, props) {
    const config = scene.navConfig || {};
    const node = new NavNode(this, scene, props);

    // TODO: handle scene uniqueness
    let tail = null;
    let targetTab = this.activeTab;

    if (config.tabAffinity && config.tabAffinity !== this.activeTab) {
      // This scene has designated that it belongs on a particular tab. Swap to that stack and push this scene on
      tail = this.tabNodes.get(config.tabAffinity).tail;
      this.motion = Motion.SLIDE_ON;
      targetTab = config.tabAffinity;
    } else if (config.isRootScene) {
      // This scene does not belong to any tab and should exist on the root stack
      tail = this.rootNode.tail;
      targetTab = '';
    } else {
      // This scene hasn't specified that it has an affinity for any particular tab. Push it onto the current
      // active tab
      tail = targetTab === '' ? this.rootNode.tail : this.tabNodes.get(targetTab).tail;
    }

    tail.next = node;
    node.previous = tail;

    if (targetTab !== this.activeTab) {
      this.motion = Motion.NONE;
      this.activeTab = targetTab;
    } else {
      this.motion = Motion.SLIDE_ON;
    }

    this.startTransition(node);
  }

  @action pop = () => {
    this.motion = Motion.SLIDE_OFF;
    this.startTransition(this.activeNode.previous).then(() => {
      this.activeNode.next = null;
    });
  }

  @action replace(scene, props) {
    const currentActive = this.activeNode;
    const newActive = new NavNode(this, scene, props);
    newActive.next = currentActive.next;
    newActive.previous = currentActive.previous;
    this.motion = Motion.NONE;
    this.startTransition(newActive).then(() => {
      this.instancePool.release(currentActive);
    });
  }

  @action tabs() {
    // Calling this function causes a replacement transition to the scene associated to the initial tab
    this.activeTab = this.initialTab.tabConfig.name;
    this.motion = Motion.NONE;
    this.startTransition(this.initialTab);
  }

  @action tab(name: string) {
    if (this.activeTab === name) {
      this.motion = Motion.NONE;
      const root = this.tabNodes.get(name);

      if (root.tabConfig.disableQuickReset) {
        // Exit early if this is already the active tab and quick reset is disabled
        return;
      }

      this.startTransition(root).then(() => {
        root.next = null;
      });
      // TODO: handle orphaning
    } else {
      this.activeTab = name;
      this.startTransition(this.tabNodes.get(name).tail);
    }
  }
}