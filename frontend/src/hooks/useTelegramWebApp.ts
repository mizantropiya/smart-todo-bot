import { useEffect, useMemo } from "react";

export function useTelegramWebApp() {
  useEffect(() => {
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();
  }, []);

  return useMemo(() => {
    const webApp = window.Telegram?.WebApp;
    return {
      hasInitData: Boolean(webApp?.initData),
      displayName: webApp?.initDataUnsafe?.user?.first_name ?? "мой список"
    };
  }, []);
}
