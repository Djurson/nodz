import { useEffect, useState } from "react";
import { Environment } from "../../wailsjs/runtime/runtime";

export function useIsMac() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    try {
      Environment()
        .then((env) => setIsMac(env.platform === "darwin"))
        .catch(() => {});
    } catch {
      // window.runtime isn't injected outside a running Wails app (e.g. `npm run dev` in a browser)
    }
  }, []);

  return isMac;
}
