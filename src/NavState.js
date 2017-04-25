import { action, computed, observable } from 'mobx';
import React from 'react';

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
  // Map from string or node to object with instance, refcount, and key
  nodes = new Map();
  // Set of keys that are currently orphaned
  orphanedNodes = new Set();

  counter: number = 0;

  instances(): Array<React.Component> {
    const result = [];
    this.nodes.forEach((element) => {
      if (element.refCount > 0) {
        result.push(element);
      }
    });
    return result;
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
      instance = node.createInstance();
      this.counter += 1;
      this.nodes.set(id, {
        refCount: 1,
        instance,
        key: this.counter,
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
  }
}

export const Motion = {
  NONE: 0,
  SLIDE_ON: 1,
  SLIDE_OFF: 2,
}

export class NavNode {
  // Back reference to root object
  navState: NavState;

  previous: NavNode;
  @observable _next: NavNode;

  instance: React.Component;

  get next() {
    return this._next;
  }

  set next(newNext: NavNode) {
    if (!newNext) {
      // All nodes after this one must be orphaned
      let next = this._next;
      while (next) {
        if (next._instance) {
          this.navState.instancePool.release(next);
        }
        next = next.next;
      }
    }
    this._next = newNext;
  }

  // If the component is non-null, this is a terminating node that represents an actual scene
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

  // True if this node contains the scene that should be on the foreground
  @observable active: boolean = false;

  // If this is non empty, than this is *not* a tab scene
  // This map maps from tab key to NavNodes
  @observable children = new observable.map();

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

  createInstance() {
    return React.createElement(this.component, {
      navState: this.navState,
      ...this.props
    });
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

  // tabs correspond to a map from tab id to an object of the form
  // {
  //   component: React.Component,
  //   props: object
  // }
  // If a scene advertises that it has a tab affinity
  constructor(config, initialScene: React.Component, initialSceneProps: Object) {
    this.rootNode = new NavNode(this, initialScene, initialSceneProps);

    this.activeNode = this.rootNode;

    this.config = config;
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
    this.activeNode = node;

    if (targetTab !== this.activeTab) {
      this.motion = Motion.NONE;
      this.activeTab = targetTab;
    } else {
      this.motion = Motion.SLIDE_ON;
    }
  }

  @action pop() {
    // check if there is something to pop to
    this.activeNode = this.activeNode.previous;
    this.motion = Motion.SLIDE_OFF;
  }

  @action replace(scene, props) {
    const currentActive = this.activeNode;
    this.activeNode = new NavNode(this, scene, props);
    this.activeNode.next = currentActive.next;
    this.activeNode.previous = currentActive.previous;
    this.motion = Motion.NONE;
  }

  @action tabs() {
    // Calling this function causes a replacement transition to the scene associated to the initial tab
    this.activeNode = this.initialTab;
    this.activeTab = this.activeNode.tabConfig.name;
    this.motion = Motion.NONE;
  }

  @action tab(name: string) {
    if (this.activeTab === name) {
      const root = this.tabNodes.get(name);

      if (root.tabConfig.disableQuickReset) {
        // Exit early if this is already the active tab and quick reset is disabled
        return;
      }

      this.activeNode = root;
      root.next = null;
      // TODO: handle orphaning
    } else {
      this.activeNode = this.tabNodes.get(name).tail;
      this.activeTab = name;
    }
    this.motion = Motion.NONE;
  }
}