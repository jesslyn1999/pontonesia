export const parseBoolean = (value: string | undefined): boolean => {
    return !!(value && value.toLowerCase() === 'true');
};