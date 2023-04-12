const { pause } = require('../controller/comandosController')

module.exports = {
    name: 'pause',
    description: "Pausa a playlist",
    voiceChannel: true,

    async execute({ inter }) {
        await inter.deferReply({ ephemeral: true });
        
        pause(inter)

        return inter.editReply({ content: 'Playlist pausada com sucesso.' });

    },
};
