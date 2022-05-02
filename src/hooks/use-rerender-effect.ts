import { useEffect, useRef } from 'react';


type UseEffect = (effect: React.EffectCallback, deps?: React.DependencyList | undefined) => void;
/**
 * Similar to React.useEffect except it doesn't run the effect
 * on mount but only after subsequent rerenders.
 */
const useRerenderEffect : UseEffect = (effect, dependencies) => {
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) {
      const unmount = effect();
      return () => unmount && unmount();
    }
    Object.assign(mounted, { current: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  // Cleanup on unmount
  useEffect(() => () => {
    mounted.current = false;
  }, []);
};

export default useRerenderEffect;