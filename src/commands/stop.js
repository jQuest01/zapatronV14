const { stop } = require('../controller/comandosController')

module.exports = {
    name: 'stop',
    description: "Para e zera a playlist",
    voiceChannel: true,

    async execute({ inter }) {
        stop(inter)

    },
};
