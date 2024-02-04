'use strict';

const init = async () => {
    const Hapi = require('@hapi/hapi');
    const server = Hapi.server({
        address: 'localhost',
        port: 3000,
    });

    await server.register(require('./game/gameHandler.ts'))
    await server.start();

    console.log('Server running on http://localhost:%s', server.info.port);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

// noinspection JSIgnoredPromiseFromCall
init();
