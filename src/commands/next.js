const { next } = require('../controller/comandosController')

module.exports = {
    name: 'next',
    description: "Pula para a próxima música",
    voiceChannel: true,

    async execute({ inter }) {
        next(inter)
    },
};
