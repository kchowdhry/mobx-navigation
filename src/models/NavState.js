import { action, observable, untracked, when } from 'mobx';
import { Animated, StatusBar } from 'react-native';

import ElementPool from './ElementPool';
import NavNode from './NavNode';
import Log from '../Logger';

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

export function scene(key) {
  return (target) => {
    if (sceneRegistry[key]) {
      Log.error(`Attempting to register a scene with duplicate name ${key}`);
    }
    sceneRegistry[key] = target;
    target.navSceneKey = key;
    return target;
  }
}

export class NavState {
  elementPool: ElementPool = new ElementPool(this);

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
  constructor(config, templates) {
    if (!config.initialScene) {
      Log.error('Attempted to construct a NavState without an initial scene');
      return;
    }

    if (typeof templates === 'object') {
      this.templates = templates;
    }

    Log.setLogLevel(config.logLevel);

    this.config = config;

    this.rootNode = new NavNode(this, config.initialScene, config.initialProps);

    this.transitionValue = new Animated.Value(1);
    this.startTransition(this.rootNode);
  }

  // Performs a 2-level object merge of a scene's configuration with the root one, applying templates as they
  // are available
  mergeNodeConfig(nodeConfig, base = this.config) {
    if (!nodeConfig) {
      return base;
    }

    if (nodeConfig._merged) {
      // This node config has already merged with the top level configuration and any templates it has specified
      return nodeConfig;
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
            if (nodeConfig[key]) {
              if (typeof nodeConfig[key] === 'object') {
                nodeConfig[key] = { ...template[key], ...nodeConfig[key] };
              }
            } else {
              nodeConfig[key] = template[key];
            }
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
      if (base[key] && typeof base[key] === 'object') {
        if (nodeConfig[key]) {
          nodeConfig[key] = { ...base[key], ...nodeConfig[key] };
        } else {
          nodeConfig[key] = base[key];
        }
      } else if (!nodeConfig[key]) {
        nodeConfig[key] = base[key];
      }
    });

    // Set an internal flag to indicate that base config and templates have been applied
    nodeConfig._merged = true;
    return nodeConfig;
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
    if (node.element.navConfig.statusBarStyle !== this.currentStatusBarStyle) {
      StatusBar.setBarStyle(node.element.navConfig.statusBarStyle);
      this.currentStatusBarStyle = node.element.navConfig.statusBarStyle;
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
  addTabConfig(tabConfig: Object) {
    this.tabConfigs.set(tabConfig.name, tabConfig);
  }

  addTab(tabConfig: Object) {
    const tab = new NavNode(this, tabConfig.initialScene, tabConfig.initialProps);
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

  @action push = (sceneKey, props) => {
    const scene = this.getScene(sceneKey);
    if (!scene) {
      return;
    }

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
    return new Promise((resolve) => {
      this.startTransition(this.front.previous).then(() => {
        this.front.next = null;
        resolve();
      });
    });
  }

  @action replace = (sceneKey, props) => {
    const scene = this.getScene(sceneKey);
    if (!scene) {
      return;
    }

    const currentActive = this.front;
    const newActive = new NavNode(this, scene, props);
    if (currentActive.previous) {
      currentActive.previous.next = newActive;
    }
    this.motion = Motion.NONE;
    return this.startTransition(newActive);
  }

  @action tabs = () => {
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

  @action tab = (name: string) => {
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