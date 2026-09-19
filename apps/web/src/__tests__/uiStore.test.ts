import { describe, it, expect } from 'vitest';
import { useUIStore } from '../stores/uiStore';

describe('useUIStore', () => {
  it('toggles drawers between none and active', () => {
    const store = useUIStore.getState();
    expect(store.activeDrawer).toBe('none');

    store.openDrawer('behind-the-scenes');
    expect(useUIStore.getState().activeDrawer).toBe('behind-the-scenes');

    store.closeDrawer();
    expect(useUIStore.getState().activeDrawer).toBe('none');
  });

  it('updates language selection', () => {
    const store = useUIStore.getState();
    store.setLanguage('hi');
    expect(useUIStore.getState().language).toBe('hi');

    store.setLanguage('hinglish');
    expect(useUIStore.getState().language).toBe('hinglish');
  });

  it('sets term for explanation modal', () => {
    const store = useUIStore.getState();
    store.explainTerm('moratorium');
    expect(useUIStore.getState().activeTerm).toBe('moratorium');

    store.explainTerm(null);
    expect(useUIStore.getState().activeTerm).toBeNull();
  });
});
