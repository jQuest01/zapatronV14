const { next } = require('../controller/comandosController')

module.exports = {
    name: 'next',
    description: "Pula para a próxima música",
    voiceChannel: true,

    async execute({ inter }) {
        await inter.deferReply({ ephemeral: true });
        next(inter)
        await inter.editReply({ content: 'Música skipada' });
    },
};
