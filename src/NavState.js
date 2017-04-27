import { Atom, action, computed, observable, when } from 'mobx';
import React from 'react';
import { Animated } from 'react-native';
import Log from './Logger';

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

class ElementPool {
  navState: NavState;
  // Mobx observable maps do not allow object keys so we make the instance pool a custom observable
  atom = new Atom('Nav instance pool');
  // Map from string or node to object with instance, refcount, and key
  elements = new Map();
  // Set of keys that are currently orphaned
  orphanedElements = new Set();

  constructor(navState: NavState) {
    this.navState = navState;
  }

  // Returns elements in proper z-indexed order for top-level rendering purposes
  orderedElements(): Array<React.Component> {
    this.atom.reportObserved();
    const onscreen = [];
    const offscreen = [];
    this.elements.forEach((element) => {
      if (element.isFront) {
        onscreen.push(element);
      } else if (element.isBack) {
        onscreen.unshift(element);
      } else {
        offscreen.push(element);
      }
    });
    return onscreen.concat(offscreen);
  }

  // The hint is intended to be an object reference to a set of props used to define
  retain(node: NavNode): NavElement {
    // The instance returned by this function will either be created inline or was cached already by a previous
    // nav node sharing the same hint as this one
    let id = node.hint || node;

    let value = this.elements.get(id);
    if (value) {
      Log.trace(`Found cached element for hint ${id}`);
      value.refCount += 1;
    } else {
      if (node.hint) {
        Log.trace(`Creating new cached element for hint ${id}`);
      }

      this.atom.reportChanged();
      const navProps = (node.component.navConfig && node.component.navConfig.initNavProps) ?
        node.component.navConfig.initNavProps(node.props) : null;
      value = new NavElement(this.navState, navProps, node.component.navConfig);
      value.instance = node.createInstance(navProps, value);
      this.elements.set(id, value);
    }

    if (node.hint) {
      // Noop if this node was not previously orphaned
      this.orphanedElements.delete(node.hint);
    }

    return value;
  }

  release(node: NavNode) {
    let id = node.hint || node;
    const value = this.elements.get(id);
    if (value) {
      value.refCount -= 1;
      if (value.refCount === 0) {
        if (node.hint) {
          this.orphanedElements.add(node.hint);
          if (this.orphanedElements.size > INSTANCE_FREE_WATERMARK) {
            // Remove the oldest orphaned element from the pool
            const toRemove = this.orphanedElements.values().next().value;
            this.atom.reportChanged();
            this.elements.delete(toRemove);
            Log.trace('Removing orphaned node ${toRemove}');
          }
        } else {
          Log.trace(`Removing anonymous element ${node.componentName} from the pool`);
          this.atom.reportChanged();
          this.elements.delete(id);
        }
      }
    } else {
      console.error(`Attempted to release node ${node.hint} which was not in the instance pool`);
    }
  }

  // Note, in the same callback as the invocation of this function, new scenes should be added
  // afterwards so that the root nav container has something to display
  flush() {
    Log.info('Flushing all elements from the element pool');
    this.elements = new Map();
    this.orphanedElements = new Set();
    this.atom.reportChanged();
  }
}

export const Motion = {
  NONE: 0,
  SLIDE_ON: 1,
  SLIDE_OFF: 2,
};

const elementCount = 1;

export class NavElement {
  // NOTE: The nav element must not contain any back references to nav nodes so as not
  // to introduce a circular dependency
  refCount: number = 1;
  navState: NavState;
  key: number;
  navProps: object;
  navConfig: object;

  // The instance and ref are set shortly after the NavElement is constructed
  instance: object;
  @observable ref: object = null;

  constructor(navState, navProps, navConfig) {
    this.navState = navState;
    this.navProps = navProps;
    this.navConfig = navConfig;
    this.key = elementCount;
    elementCount += 1;
  }

  get tabBarVisible(): boolean {
    return this.navConfig && this.navConfig.tabBarVisible;
  }

  get navBarVisible(): boolean {
    return this.navConfig && this.navConfig.navBarVisible;
  }

  get cardStyle(): Object {
    const style = {};
    if (this.navConfig) {
      if (this.navBarVisible && !this.navConfig.navBarTransparent) {
        style.marginTop = this.navState.config.navBarHeight;
      }
      if (this.tabBarVisible && !this.navConfig.tabBarTransparent) {
        style.marginBottom = this.navState.config.tabBarHeight;
      }
    }
    return style;
  }

  get isFront(): boolean {
    return this.navState.front.element === this;
  }

  get isBack(): boolean {
    return this.navState.back && this.navState.back.element === this;
  }

  get isOffscreen(): boolean {
    return !this.isFront && !this.isBack;
  }
}

export class NavNode {
  // Back reference to root object
  navState: NavState;

  previous: NavNode;
  @observable _next: NavNode;

  element: NavElement;

  // Created by scenes to reconcile identical content to be shared across nav nodes
  _hint: string = null;

  get next() {
    return this._next;
  }

  set next(newNext: NavNode) {
    // First, determine if this node is truly the one we intend on inserting newNext after.
    // In the event that the new node is marked "unique," we must search the current stack to ensure
    // that exactly one instance of it exists at a time.
    let current = this;
    if (newNext && newNext.isUnique) {
      const prev = current;
      while (prev) {
        if (prev.componentName === newNext.componentName) {
          current = prev.previous;
          break;
        }
        prev = prev.previous;
      }
    }

    // All nodes after this one must be orphaned
    let nextNode = current._next;
    while (nextNode) {
      this.navState.elementPool.release(nextNode);
      nextNode = nextNode._next;
    }
    current._next = newNext;
    if (newNext) {
      newNext.previous = current;
    }
  }

  @observable component;
  @observable props;

  get componentName() {
    return this.component.name;
  }

  get hint() {
    if (this._hint) {
      return this._hint;
    }

    if (this.component.navConfig) {
      if (typeof this.component.navConfig.cacheHint === 'function') {
        this._hint = this.component.navConfig.cacheHint(this.props);
      } else {
        this._hint = this.component.navConfig.cacheHint;
      }
    }

    return this._hint;
  }

  get isUnique() {
    return this.component.navConfig && this.component.navConfig.unique;
  }

  // Configuration may be overridden on a specific instance of a component
  @observable config;

  // If this scene is used as the root of a tab, the configuration governing the tab are housed here
  @observable tabConfig;

  constructor(navState, component = null, props = {}) {
    this.navState = navState;
    this.component = component;
    this.props = props;
    this.element = navState.elementPool.retain(this);
  }

  @computed get tail() {
    if (!this.next) {
      return this;
    }

    return this.next.tail;
  }

  createInstance(navProps, element) {
    // Careful! We want to store a ref to the underlying element but we have to be careful not to
    // prevent the caller from grabbing the ref as well
    // The conditional expression here ensures we don't try to grab the ref of a stateless component
    // as this is disallowed in React
    const ref = this.component.prototype.render ?
      (r) => {
        if (typeof this.props.ref === 'function') {
          this.props.ref(r);
        }
        element.ref = r;
      } : undefined;

    return React.createElement(this.component, {
      navState: this.navState,
      navProps,
      ...this.props,
      ref,
    });
  }
}

export class NavState {
  elementPool: ElementPool = new ElementPool(this);

  rootNode: NavNode;

  tabNodes: Map<string, Object> = new Map();

  initialTab: NavNode;

  // {
  //   tabBarHeight: number,
  //   navBarHeight: number,
  // }
  config: Object;

  @observable front: NavNode = null;
  @observable back: NavNode = null;
  @observable activeTab: string = '';

  // These two observables are flags that, when set, being a transition of a scene sliding onto the
  // foreground or sliding off the background respectively
  @observable motion: number = Motion.NONE;

  @observable transitionValue; // React.Native animated value between 0 and 1

  // If this flag is set, all transitions only modify the node data structure and do not perform any
  // actual operations on the scene animations themselves
  multistepInProgress: boolean = false;

  // See propTypes and default config in NavContainer
  constructor(config) {
    if (!config.initialScene) {
      Log.error('Attempted to construct a NavState without an initial scene');
      return;
    }

    Log.setLogLevel(config.logLevel);

    this.rootNode = new NavNode(this, config.initialScene, config.initialProps);

    this.transitionValue = new Animated.Value(1);
    this.startTransition(this.rootNode);

    this.config = config;
  }

  // Returns a promise that resolves when the transition to the new node has completed. In the promise
  // resolution, it is expected that the caller clean up any nodes that are now orphaned
  @action startTransition(node: NavNode): Promise<> {
    if (!node) {
      Log.error(`Attempting to transition to empty node`);
      return Promise.reject();
    }

    if (this.multistepInProgress) {
      // We're in the middle of executing a multistep transactional transition
      return Promise.resolve();
    }

    if (node.component.prototype.componentWillShow) {
      // We perform the componentWillShow as a mobx reaction because it isn't immediately available
      when('node ref available', () => !!node.element.ref,
        () => node.element.ref.componentWillShow());
    }

    // Move nodes to the correct z-index as necessary
    if (this.motion === Motion.NONE) {
      this.front = node;
      this.back = null;
    } else if (this.motion === Motion.SLIDE_ON) {
      this.back = this.front;
      this.front = node;
    } else if (this.motion === Motion.SLIDE_OFF) {
      this.back = node;
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
    Log.trace(`Transitioned to node ${node.componentName}/${node.hint || ''}`);
    if (node.element.ref && node.element.ref.componentDidShow) {
      node.element.ref.componentDidShow();
    }
    this.front = node;
    this.transitionValue = new Animated.Value(1);
    this.back = null;
    this.motion = Motion.NONE;
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
    this.startTransition(this.front.previous).then(() => {
      this.front.next = null;
    });
  }

  @action replace(scene, props) {
    const currentActive = this.front;
    const newActive = new NavNode(this, scene, props);
    currentActive.previous.next = newActive;
    this.motion = Motion.NONE;
    this.startTransition(newActive);
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

      if (root.tabConfig.disableQuickReset || this.front === root) {
        // Exit early if this is already the active tab and quick reset is disabled
        return;
      }

      this.startTransition(root).then(() => {
        root.next = null;
      });
    } else {
      this.activeTab = name;
      this.startTransition(this.tabNodes.get(name).tail);
    }
  }

  // This function performs a multi-step transition where all the steps are functions
  // that execute the various transition types above
  @action multistep(steps: Array = []) {
    if (steps.length === 0) {
      Log.error('Attempted to perform a multistep transition with no steps');
      return;
    }
    this.multistepInProgress = true;
    for (let i = 0; i < steps.length - 1; ++i) {
      steps[i]();
    }
    this.multistepInProgress = false;
    steps[steps.length - 1]();
  }
}