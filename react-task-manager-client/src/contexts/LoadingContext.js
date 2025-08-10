import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onLoadingChange } from '../services/api';

const LoadingContext = createContext({ isLoading: false, loadingCount: 0 });

export function LoadingProvider({ children }) {
    const [loadingCount, setLoadingCount] = useState(0);

    useEffect(() => {
        // subscribe to the counter maintained by api.js
        const off = onLoadingChange(setLoadingCount);
        return off;
    }, []);

    // dev helper
    useEffect(() => {
        window.__loading = {
            get count() { return loadingCount; },
            get isLoading() { return loadingCount > 0; },
        };
    }, [loadingCount]);

    const value = useMemo(
        () => ({ loadingCount, isLoading: loadingCount > 0 }),
        [loadingCount]
    );

    return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
}

export function useLoading() {
    return useContext(LoadingContext);
}
