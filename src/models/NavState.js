import { action, observable, untracked, when } from 'mobx';
import { Animated, StatusBar } from 'react-native';
import PropTypes from 'prop-types';

import ElementPool from './ElementPool';
import NavNode from './NavNode';
import Log from '../Logger';
const HIGH_WATER_MARK = 10;
const LOW_WATER_MARK = 2;

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

export const Motion = {
  NONE: 0,
  SLIDE_ON: 1,
  SLIDE_OFF: 2,
};

// Object mapping from scene name to scene component definition
const sceneRegistry = {};

const deferredScenes = {};
const deferredMultiScenes = [];

// Attempts to apply right to left, merging objects or arrays as appropriate
export function mergeValues(left, right) {
  if (right === undefined) {
    return left;
  }

  // A user specified value of null is interpreted as an erasure of the underlying default
  if (right === null) {
    return null;
  }

  // This branch exists because tyepof null is technically 'object'
  if (left === null && right) {
    return right;
  }

  if (Array.isArray(left)) {
    // This works regardless of whether right is an array or not
    return left.concat(right);
  }

  // The ordering of this statement relative to the one above is important to preserve right over left semantic
  if (Array.isArray(right)) {
    return [left].concat(right);
  }

  if (typeof left === 'object') {
    if (typeof right === 'object') {
      return { ...left, ...right };
    }

    // For heterogeneous types, we assume that the right value is in fact a stylesheet reference and we
    // convert a stylesheet object into an array
    return [ left, right ];
  }

  return right;
}

function augmentSceneContext(target) {
  const base = target.childContextTypes || {};
  base._mobxNavParent = PropTypes.object;
  target.childContextTypes = base;
  const baseGet = target.prototype.getChildContext;
  target.prototype.getChildContext = baseGet ? function() {
    const baseContext = baseGet.call(this);
    baseContext._mobxNavParent = this;
    return baseContext;
  } : function() {
    return {
      _mobxNavParent: this,
    }
  }
  return target;
}

export function scene(key) {
  if (typeof arguments[0] !== 'string') {
    // For decorators without arguments, the first parameter is actually a misnomer and not a key but the target
    // itself
    const target = key;
    // This target is expected to map to multiple keys, each of which is a key of the multiNavConfig
    // static property of the instance

    // If a navConfig is present (in addition to a multiNavConfig), apply the navConfig to all multi nav configs
    let baseConfig = {};
    if (target.navConfig) {
      if (typeof target.navConfig === 'function') {
        deferredMultiScenes.push(target);
        return;
      } else {
        baseConfig = target.navConfig || {};
      }
    }

    let baseMultiConfig = {};
    if (target.multiNavConfig) {
      if (typeof target.multiNavConfig === 'function') {
        deferredMultiScenes.push(target);
        return;
      } else {
        baseMultiConfig = target.multiNavConfig;
      }
    } else {
      Log.error(`A scene key was not supplied to component ${target.constructor.name} but no multiNavConfig property was defined`);
      return;
    }

    Object.keys(baseMultiConfig).forEach((sceneKey) => {
      if (sceneRegistry[sceneKey]) {
        Log.error(`Attempting to register a scene with duplicate name ${sceneKey}`);
      }

      const merged = { ...baseConfig };
      const config = baseMultiConfig[sceneKey];
      Object.keys(config).forEach((configKey) => {
        merged[configKey] = mergeValues(merged[configKey], config[configKey]);
      })

      sceneRegistry[sceneKey] = {
        target,
        config: merged,
        sceneKey,
      };
    });
    return augmentSceneContext(target);
  } else {
    return (target) => {
      if (sceneRegistry[key]) {
        Log.error(`Attempting to register a scene with duplicate name ${key}`);
      }

      let baseConfig = {};
      if (target.navConfig) {
        if (typeof target.navConfig === 'function') {
          deferredScenes[key] = target;
          return;
        } else {
          baseConfig = target.navConfig || {};
        }
      }

      sceneRegistry[key] = {
        target,
        config: baseConfig,
        sceneKey: key,
      }
      return augmentSceneContext(target);
    }
  }
}

function registerChildMixin() {
  Log.trace(`Child ${this.displayName || this.name || this.constructor.name} mounted`);
  if (this.context._mobxNavParent) {
    // We're currently mounted inside a registered mobx navigation scene. Register ourselves
    if (!this.context._mobxNavParent._mobxNavChildren) {
      this.context._mobxNavParent._mobxNavChildren = [];
    }
    this.context._mobxNavParent._mobxNavChildren.push(this);
  }
}

export function child(target) {
  if (!target) {
    Log.error('Child decorator attached to invalid target');
  }

  if (typeof target === 'function' && (!target.prototype || !target.prototype.render)) {
    Log.error('Child decorator cannot be applied to stateless functional components');
  }

  // This is a react component. Modify it's prototype
  const base = target.prototype.componentWillMount;
  target.prototype.componentWillMount = base ? function() {
    base.call(this);
    registerChildMixin.call(this);
  } : function() {
    registerChildMixin.call(this);
  }

  // Thread the scene's context parameter through
  const baseContextTypes = target.contextTypes || {};
  baseContextTypes._mobxNavParent = PropTypes.object;
  target.contextTypes = baseContextTypes;

  return target;
}

export class NavState {
  @observable transitionInProgress: boolean = false;
  @observable keyboardVisible: boolean = false;
  elementPool: ElementPool;

  rootNode: NavNode;

  tabConfigs: Map<string, Object> = new Map();
  tabNodes: Map<string, Object> = new Map();

  initialTab: NavNode;

  config: Object;
  // If available, cards that specify a template (or several) will first overlay configuration from this object
  // before applying their own overrides
  templates: Object = {};

  currentStatusBarStyle: string = 'default';

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
  constructor(config, templates, cacheWatermark = HIGH_WATER_MARK) {
    this.elementPool = new ElementPool(this, cacheWatermark, LOW_WATER_MARK);
    if (!config.initialScene) {
      Log.error('Attempted to construct a NavState without an initial scene');
      return;
    }

    if (typeof templates === 'object') {
      this.templates = templates;
    }

    // Do a pass on all deferred scenes to ensure the nav config has loaded properly
    Object.keys(deferredScenes).forEach((key) => {
      const target = deferredScenes[key];
      target.navConfig = target.navConfig();
      scene(key)(target);
    });
    deferredMultiScenes.forEach((target) => {
      if (target.navConfig && typeof target.navConfig === 'function') {
        target.navConfig = target.navConfig();
      }
      if (target.multiNavConfig && typeof target.multiNavConfig === 'function') {
        target.multiNavConfig = target.multiNavConfig();
      }
      scene(target);
    })

    Log.setLogLevel(config.logLevel);

    this.config = config;

    this.rootNode = new NavNode(this, {
      target: config.initialScene,
      config: config.initialScene.navConfig,
    }, config.initialProps);

    this.transitionValue = new Animated.Value(1);
    this.startTransition(this.rootNode);
  }

  get frontCustomConfig() {
    return this.front.config.custom;
  }

  get frontSceneKey() {
    return this.front.sceneKey;
  }

  get backCustomConfig() {
    return this.back ? this.back.config.custom : null;
  }

  get backSceneKey() {
    return this.back ? this.back.sceneKey : null;
  }

  // Performs a 2-level object merge of a scene's configuration with the root one, applying templates as they
  // are available
  mergeNodeConfig(nodeConfig, base = this.config) {
    if (!nodeConfig) {
      Object.keys(base).forEach((configKey) => {
        nodeConfig[configKey] = base[configKey];
      });
      return;
    }

    if (nodeConfig._merged) {
      // This node config has already merged with the top level configuration and any templates it has specified
      return;
    }

    // Access all templates uniformly through the templates array
    if (nodeConfig.template) {
      if (nodeConfig.templates) {
        nodeConfig.templates.unshift(nodeConfig.template);
      } else {
        nodeConfig.templates = [nodeConfig.template];
      }
      nodeConfig.template = undefined;
    }

    // If the node configuration has any templates defined, we destructively apply the template variables directly on
    // the configuration itself and remove the template key so this template application only needs to happen once
    // for each scene.

    if (nodeConfig.templates) {
      nodeConfig.templates.forEach((templateName) => {
        const template = this.templates[templateName];
        if (template) {
          Object.keys(template).forEach((key) => {
            nodeConfig[key] = mergeValues(template[key], nodeConfig[key]);
          });
        }
      });
    }
    nodeConfig.templates = undefined;

    Object.keys(base).forEach((key) => {
      if (key === 'children') {
        return;
      }

      // We still check the truthiness of base[key] because typeof null evaluates to 'object'
      nodeConfig[key] = mergeValues(base[key], nodeConfig[key]);
    });

    // Set an internal flag to indicate that base config and templates have been applied
    nodeConfig._merged = true;
  }

  propagateLifecycleEvent(instance, eventName) {
    if (instance._mobxNavChildren) {
      instance._mobxNavChildren.forEach((child) => {
        if (child[eventName]) {
          child[eventName].call(child);
        }
      })
    } else if (instance._reactInternalInstance && instance._reactInternalInstance._context &&
               instance._reactInternalInstance._context._mobxNavParent) {
      const children = instance._reactInternalInstance._context._mobxNavParent._mobxNavChildren;
      if (children) {
        children.forEach((child) => {
          if (child[eventName]) {
            child[eventName].call(child);
          }
        });
      }
    }
    if (instance[eventName]) {
      instance[eventName].call(instance);
    }
  }

  // Returns a promise that resolves when the transition to the new node has completed. In the promise
  // resolution, it is expected that the caller clean up any nodes that are now orphaned
  @action startTransition(node: NavNode): Promise<> {
    if (!node) {
      Log.error(`Attempting to transition to empty node`);
      return Promise.reject();
    }

    if (node === this.front) {
      Log.error(`Attempting to transition to the same node`);
      return Promise.reject();
    }

    if (this.multistepInProgress) {
      // We're in the middle of executing a multistep transactional transition
      return Promise.resolve();
    }

    this.transitionInProgress = true;

    const oldFront = this.front;
    if (this.front) {
      when('node ref available', () => !!oldFront.element.wrappedRef,
        () => {
          this.propagateLifecycleEvent(oldFront.element.wrappedRef, 'componentWillHide');
        });
    }

    const component = node.wrappedComponent;
    // We perform the componentWillShow as a mobx reaction because it isn't immediately available
    when('node ref available', () => !!node.element.ref,
      () => {
        this.propagateLifecycleEvent(node.element.wrappedRef, 'componentWillShow');
      });

    return new Promise((resolve) => {
      when('nav card mounted', () => node.element.mounted, () => {
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
          this.endTransition(node, oldFront);
          resolve();
          return;
        }

        let start = 0;
        let end = 1;
        if (this.motion === Motion.SLIDE_OFF) {
          start = 1;
          end = 0;
        }
        this.transitionValue = new Animated.Value(start);
        Animated.timing(this.transitionValue, {
          toValue: end,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          this.endTransition(node, oldFront);
          resolve();
        });
      });
    });
  }

  @action endTransition = (node, oldFront) => {
    Log.trace(`Transitioned to node ${node.sceneKey}/${node.hint || ''}`);
    if (node.element.wrappedRef) {
      this.propagateLifecycleEvent(node.element.wrappedRef, 'componentDidShow');
    }
    if (oldFront && oldFront.element.wrappedRef) {
      this.propagateLifecycleEvent(oldFront.element.wrappedRef, 'componentDidHide');
    }
    if (node.element.navConfig.statusBarStyle !== this.currentStatusBarStyle) {
      StatusBar.setBarStyle(node.element.navConfig.statusBarStyle);
      this.currentStatusBarStyle = node.element.navConfig.statusBarStyle;
    }

    this.front = node;
    this.transitionValue = new Animated.Value(1);
    this.back = null;
    this.motion = Motion.NONE;
    this.transitionInProgress = false;
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
  addTabConfig(tabConfig: Object) {
    this.tabConfigs.set(tabConfig.name, tabConfig);
  }

  addTab(tabConfig: Object) {
    const tab = new NavNode(this, {
      target: tabConfig.initialScene,
      config: tabConfig.initialScene.navConfig,
    }, tabConfig.initialProps);
    tab.tabConfig = tabConfig;
    this.tabNodes.set(tabConfig.name, tab);
    if (tabConfig.isInitial) {
      this.initialTab = tab;
    }
  }

  getScene(sceneKey) {
    const scene = sceneRegistry[sceneKey];
    if (!scene) {
      Log.error(`Attempted to retrieve unregistered scene ${sceneKey}`);
    }
    return scene;
  }

  @action push = (sceneKey: string, props, motion = Motion.SLIDE_ON) => {
    if (this.transitionInProgress) {
      return Promise.resolve();
    }

    const scene = this.getScene(sceneKey);
    if (!scene) {
      return Promise.reject();
    }

    const config = scene.config || {};
    const node = new NavNode(this, scene, props);

    let tail = null;
    let targetTab = this.activeTab;

    if (config.tabAffinity && config.tabAffinity !== this.activeTab) {
      // This scene has designated that it belongs on a particular tab. Swap to that stack and push this scene on
      tail = this.tabNodes.get(config.tabAffinity).tail;
      targetTab = config.tabAffinity;
    } else if (config.isRootScene) {
      // This scene does not belong to any tab and should exist on the root stack
      tail = this.rootNode.tail;
      targetTab = '';
    } else {
      // This scene hasn't specified that it has an affinity for any particular tab. Push it onto the current
      // active tab
      tail = targetTab ? this.tabNodes.get(targetTab).tail : this.rootNode.tail;
    }

    tail.next = node;

    if (targetTab !== this.activeTab) {
      this.motion = Motion.NONE;
      this.activeTab = targetTab;
    } else {
      this.motion = motion;
    }

    return this.startTransition(node);
  }

  // By default, pops a single scene from the stack. If a number is supplied, it will pop that many scenes
  @action pop = (sceneCount: number = 1, motion = Motion.SLIDE_OFF) => {
    if (this.transitionInProgress) {
      return Promise.resolve();
    }

    if (sceneCount < 1) {
      Log.error(`Attempted to pop an invalid number of scenes: ${sceenCount}`);
      return Promise.reject();
    }

    this.motion = motion;

    let current = this.front;
    for (let i = 0; i < sceneCount; i += 1) {
      if (!current) {
        Log.error(`Attempted to pop ${sceneCount} scene(s) but there were fewer scenes on the stack`);
        return Promise.reject();
      }
      current = current.previous;
    }

    return new Promise((resolve) => {
      this.startTransition(current).then(() => {
        current.next = null;
        resolve();
      });
    });
  }

  @action popTo = (sceneKey: string) => {
    if (this.transitionInProgress || sceneKey === this.front.sceneKey) {
      return Promise.resolve();
    }

    const desired = sceneRegistry[sceneKey];
    if (!desired) {
      Log.error(`Attempted to pop to unregistered scene ${sceneKey}`);
      return Promise.reject();
    }

    let previous = this.front.previous;
    while (previous.component !== desired.target) {
      previous = previous.previous;

      if (!previous) {
        Log.error(`Attempted to pop to scene ${sceneKey} which is not on the stack`);
        return Promise.reject();
      }
    }

    this.motion = Motion.SLIDE_OFF;
    return new Promise((resolve) => {
      this.startTransition(previous).then(() => {
        previous.next = null;
        resolve();
      })
    });
  }

  @action replace = (sceneKey: string, props, motion = Motion.NONE) => {
    if (this.transitionInProgress) {
      return Promise.resolve();
    }

    const scene = this.getScene(sceneKey);
    if (!scene) {
      Log.error(`Attempted to replace existing scene with unregistered scene ${sceneKey}`);
      return Promise.reject();
    }

    const currentActive = this.front;
    currentActive.next = null;
    this.elementPool.release(currentActive);

    const newActive = new NavNode(this, scene, props);
    if (currentActive.previous) {
      currentActive.previous.next = newActive;
    }
    this.motion = motion;
    return this.startTransition(newActive);
  }

  @action tabs = () => {
    if (this.transitionInProgress) {
      return Promise.resolve();
    }

    this.tabConfigs.forEach((config, name) => {
      if (!this.tabNodes.has(name)) {
        this.addTab(config);
      }
    });

    // Calling this function causes a replacement transition to the scene associated to the initial tab
    this.activeTab = this.initialTab.tabConfig.name;
    this.motion = Motion.NONE;
    return this.startTransition(this.initialTab);
  }

  // Reset the specified tab to the root node of the tab. If the argument is an empty string, resets to the
  // root scene. If null or undefined, resets to the root node of the active tab
  @action tabRoot = (tabName: string = null) => {
    if (this.transitionInProgress) {
      return Promise.resolve();
    }

    this.motion = Motion.NONE;
    let node = null;
    if (tabName === '') {
      node = this.rootNode;
      this.activeTab = tabName;
    } else if (!tabName) {
      node = this.tabNodes.get(this.activeTab);
    } else {
      node = this.tabNodes.get(tabName);
      this.activeTab = tabName;
    }

    if (node) {
      node.next = null;
      return this.startTransition(node);
    }
    return Promise.reject();
  }

  @action tab = (name: string) => {
    if (this.transitionInProgress) {
      return Promise.resolve();
    }

    if (this.activeTab === name) {
      this.motion = Motion.NONE;
      const root = this.tabNodes.get(name);

      if (root.tabConfig.disableQuickReset || this.front === root) {
        // Exit early if this is already the active tab and quick reset is disabled
        return Promise.resolve();
      }

      this.startTransition(root).then(() => {
        root.next = null;
      });
    } else if (this.tabNodes.has(name)) {
      this.activeTab = name;
      return this.startTransition(this.tabNodes.get(name).tail);
    } else {
      Log.error(`Attempted to navigate to nonexistant tab ${name}`);
      return Promise.reject();
    }
  }

  @action reset = () => {
    this.elementPool.elements.forEach((element) => {
      const ref = element.wrappedRef;
      if (ref) {
        this.propagateLifecycleEvent(ref, 'componentWillHide');
        this.propagateLifecycleEvent(ref, 'componentDidHide');
      }
    });
    this.elementPool.flush();
    this.tabNodes = new Map();
    this.transitionValue = new Animated.Value(1);
    this.tabConfigs.forEach((config, name) => {
      this.addTab(config);
    });

    this.rootNode = new NavNode(this, {
      target: this.config.initialScene,
      config: this.config.initialScene.navConfig,
    }, this.config.initialProps);

    this.motion = Motion.NONE;
    return this.startTransition(this.rootNode);
  }

  @action decrementWaterMark = () => {
    this.elementPool.decrementWaterMark();
  }

  @action evict = () => {
    this.elementPool.evict();
  }

  // This function performs a multi-step transition where all the steps are functions
  // that execute the various transition types above
  @action multistep = (steps: Array = []) => {
    if (steps.length === 0) {
      Log.error('Attempted to perform a multistep transition with no steps');
      return;
    }
    this.multistepInProgress = true;
    untracked(() => {
      for (let i = 0; i < steps.length - 1; ++i) {
        steps[i]();
      }
    });
    this.multistepInProgress = false;
    return steps[steps.length - 1]();
  }
}
