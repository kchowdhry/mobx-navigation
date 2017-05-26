import { Atom } from 'mobx';
import NavElement from './NavElement';
import Log from '../Logger';


export default class ElementPool {
  navState: NavState;
  // Keep this many orphaned instances around before starting to relaim scene instances in memory
  cacheWatermark: number;

  // Map from scene key to sets of string keys (effectively namespaces keys by scene type)
  nodeKeys: Map<string, Map<string, object>> = new Map();

  // Mobx observable maps do not allow object keys so we make the instance pool a custom observable
  atom = new Atom('Nav instance pool');
  // Map from string or node to object with instance, refcount, and key
  elements = new Map();
  // Set of keys that are currently orphaned
  orphanedElements = new Set();

  constructor(navState: NavState, cacheWatermark: number) {
    this.cacheWatermark = cacheWatermark
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

  hintToKey(hint: string, sceneKey: string): object {
    let keys = this.nodeKeys.get(sceneKey);
    if (!keys) {
      keys = new Map();
      this.nodeKeys.set(sceneKey, keys);
    }

    let key = keys.get(hint);
    if (!key) {
      key = {};
      keys.set(hint, key);
    }

    return key;
  }

  // The hint is intended to be an object reference to a set of props used to define
  retain(node: NavNode): NavElement {
    // The instance returned by this function will either be created inline or was cached already by a previous
    // nav node sharing the same hint as this one
    let id = node.hint ? this.hintToKey(node.hint, node.sceneKey) : node;

    let value = this.elements.get(id);
    if (value) {
      Log.trace(`Found cached element for hint ${node.hint}`);
      value.refCount += 1;
    } else {
      if (node.hint) {
        Log.trace(`Creating new cached element for hint ${node.hint}`);
      }

      this.atom.reportChanged();
      value = new NavElement(this.navState, node);
      this.elements.set(id, value);
    }

    if (node.hint) {
      // Noop if this node was not previously orphaned
      this.orphanedElements.delete(id);
    }

    return value;
  }

  release(node: NavNode) {
    let id = node.hint ? this.hintToKey(node.hint, node.sceneKey) : node;

    const value = this.elements.get(id);
    if (value) {
      value.refCount -= 1;
      if (value.refCount === 0) {
        if (node.hint) {
          this.orphanedElements.add(node.hint);
          if (this.orphanedElements.size > this.cacheWatermark) {
            // Remove the oldest orphaned element from the pool
            const toRemove = this.orphanedElements.values().next().value;
            this.atom.reportChanged();
            this.elements.delete(toRemove);
            Log.trace('Removing orphaned node ${toRemove}');
          }
        } else {
          Log.trace(`Removing anonymous element ${node.sceneKey} from the pool`);
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
    this.nodeKeys = new Map();
    this.atom.reportChanged();
  }
}
