const { volta } = require('../controller/comandosController')

module.exports = {
    name: 'volta',
    description: "Volta uma posição na playlist",
    voiceChannel: true,

    async execute({ inter }) {
        await inter.deferReply({ ephemeral: true });
        volta(inter)
        await inter.editReply({ content: 'Retornado a música anterior' });
    },
};
