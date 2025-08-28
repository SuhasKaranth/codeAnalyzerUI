/** @type {import('next').NextConfig} */
const nextConfig = {
    // Disable React strict mode in development to reduce hydration warnings
    reactStrictMode: false,

    // Suppress hydration warnings in development
    onDemandEntries: {
        // Period (in ms) where the server will keep pages in the buffer
        maxInactiveAge: 25 * 1000,
        // Number of pages that should be kept simultaneously without being disposed
        pagesBufferLength: 2,
    },

    // Development-specific settings
    ...(process.env.NODE_ENV === 'development' && {
        // Disable some optimizations that can cause hydration issues in dev
        swcMinify: false,
    })
}

module.exports = nextConfig