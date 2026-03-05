import { createContext } from "react";

export const NavigationContext = createContext({
    navigation: false,
});

export const SetNavigationContext = createContext({
    setSubunit: () => {},
    setNavigation: () => {},
    setNotification: () => {},
});
