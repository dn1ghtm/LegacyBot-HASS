const fs = require('fs');
const path = require('path');

function healthCheck() {
    try {
        // Check if required files exist
        const requiredFiles = ['index.js', 'package.json'];
        for (const file of requiredFiles) {
            if (!fs.existsSync(path.join(__dirname, file))) {
                console.error(`Required file ${file} not found`);
                process.exit(1);
            }
        }

        // Check if Discord token is set
        if (!process.env.DISCORD_TOKEN) {
            console.error('DISCORD_TOKEN environment variable not set');
            process.exit(1);
        }

        // Check if data files are accessible
        const dataFiles = ['bot_settings.json', 'teams.json'];
        for (const file of dataFiles) {
            const filePath = path.join(__dirname, file);
            if (!fs.existsSync(filePath)) {
                console.error(`Data file ${file} not found`);
                process.exit(1);
            }
        }

        console.log('Health check passed');
        process.exit(0);
    } catch (error) {
        console.error('Health check failed:', error);
        process.exit(1);
    }
}

healthCheck(); 