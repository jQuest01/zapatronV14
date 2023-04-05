const { volta } = require('../controller/comandosController')

module.exports = {
    name: 'volta',
    description: "Volta uma posição na playlist",
    voiceChannel: true,

    async execute({ inter }) {
        volta(inter)
    },
};
