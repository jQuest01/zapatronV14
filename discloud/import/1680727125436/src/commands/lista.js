const { lista } = require('../controller/comandosController')

module.exports = {
    name: 'lista',
    description: "Exibe a playlist",
    voiceChannel: true,

    async execute({ inter }) {
        await inter.deferReply({ ephemeral: true });
        const embed = lista(inter)

        if (embed) {
            await inter.editReply({ embeds: [embed] })
        }
    },
};
