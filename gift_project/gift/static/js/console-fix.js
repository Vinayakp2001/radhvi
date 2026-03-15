// Console Log Cleanup - Suppress unnecessary logs in production
(function() {
    'use strict';
    
    // Set to false to disable debug logs
    const DEBUG_MODE = false;
    
    if (!DEBUG_MODE) {
        // Store original console methods
        const originalLog = console.log;
        const originalWarn = console.warn;
        
        // List of messages to suppress
        const suppressMessages = [
            'initialized',
            'Connection type',
            'WebP supported',
            'Fonts loaded',
            'Image performance',
            'optimization',
            'Input missing label',
            'Supported image formats'
        ];
        
        // Override console.log
        console.log = function(...args) {
            const message = args.join(' ');
            const shouldSuppress = suppressMessages.some(msg => 
                message.toLowerCase().includes(msg.toLowerCase())
            );
            
            if (!shouldSuppress) {
                originalLog.apply(console, args);
            }
        };
        
        // Override console.warn for label warnings
        console.warn = function(...args) {
            const message = args.join(' ');
            if (!message.includes('Input missing label')) {
                originalWarn.apply(console, args);
            }
        };
    }
})();
