import { NavState } from '../src/NavState';

const NullScene = (props) => {
  return null;
}

const NullScene2 = (props) => {
  return null;
}

describe('NavState', () => {
  const navState = new NavState({
    navBarHeight: 1,
    tabBarHeight: 1,
  }, NullScene);

  it('should construct a state with one scene', () => {
    expect(navState.front).toBeDefined();
    expect(navState.front).toBe(navState.activeNode);
    expect(navState.activeNode.component).toBe(NullScene);
  });

  it('should push a new scene onto the stack', () => {
    const oldFront = navState.front;
    navState.push(NullScene2);
    expect(navState.back).toBe(oldFront);
    expect(navState.front.component).toBe(NullScene2);
  })
});