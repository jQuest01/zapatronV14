const { ApplicationCommandOptionType } = require('discord.js');
const { loop } = require('../controller/comandosController')

module.exports = {
    name: 'loop',
    description: "Ativa ou desativa a repetição da playlist ou de uma música específica",
    voiceChannel: true,
    options: [
        {
            name: 'tipo',
            description: 'o tipo de repetição a ser ativada',
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: 'Playlist', value: 'enable_loop_queue' },
                { name: 'Desativar', value: 'disable_loop' },
                { name: 'Música', value: 'enable_loop_song' },
            ],
        }
    ],
    async execute({ inter }) {
        await inter.deferReply({ ephemeral: true });
        await loop(inter)
    },
};
