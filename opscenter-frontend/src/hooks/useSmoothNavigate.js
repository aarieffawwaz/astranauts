import { useNavigate } from "react-router-dom";
import { flushSync } from "react-dom";

export function useSmoothNavigate() {
  const navigate = useNavigate();

  return (to, options = {}) => {
    if (!document.startViewTransition) {
      navigate(to, options);
      return;
    }

    document.startViewTransition(() => {
      flushSync(() => {
        navigate(to, options);
      });
    });
  };
}
