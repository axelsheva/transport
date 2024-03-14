export const randomIn = (from: number, to: number) => {
    return Math.floor(Math.random() * (to - from + 1)) + from;
};

export const promiseWithTimeout = async <T>(ms: number, promise: Promise<T>): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
        const id = setTimeout(() => {
            clearTimeout(id);
            reject(new Error('Request timeout'));
        }, ms);
    });

    return Promise.race([promise, timeoutPromise]);
};
