import { createContext, useCallback, useContext, useRef } from "react";

// Created a shared context, different components can access functions to send and receive tutorial actions
const TutorialActionContext = createContext({
    reportTutorialAction: () => {},
    subscribeTutorialActions: () => () => {},
});

// Wrap the app with provider, components inside can report user actions and listen for actions from other components
export function TutorialActionProvider({ children }) {
    const listeners = useRef(new Set());
    const reportTutorialAction = useCallback((action, payload = {}) => {
        listeners.current.forEach((listener) => listener(action, payload));
    }, []);
    const subscribeTutorialActions = useCallback((listener) => {
        listeners.current.add(listener);
        return () => listeners.current.delete(listener);
    }, []);

    return (
        <TutorialActionContext.Provider
            value={{ reportTutorialAction, subscribeTutorialActions }}
        >
            {children}
        </TutorialActionContext.Provider>
    );
}

export function useTutorialActions() {
    return useContext(TutorialActionContext);
}