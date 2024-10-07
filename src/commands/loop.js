const { ApplicationCommandOptionType, SlashCommandBuilder, SlashCommandUserOption, SlashCommandStringOption } = require('discord.js');
const { loop } = require('../controller/comandosController')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription("Ativa ou desativa a repetição da playlist ou de uma música específica")
        .addStringOption(option =>
            option.setName('opcao')
                .setDescription('Selecione dentre as opções disponiveis')
                .setRequired(true)
                .addChoices(
                    { name: 'Playlist', value: 'enable_loop_queue' },
                    { name: 'Desativar', value: 'disable_loop' },
                    { name: 'Música', value: 'enable_loop_song' }
                )),
    voiceChannel: true,

    async execute({ inter }) {
        await inter.deferReply({ ephemeral: true });
        await loop(inter)
    },
};
