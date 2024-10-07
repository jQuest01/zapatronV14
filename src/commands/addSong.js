const { SlashCommandBuilder, SlashCommandStringOption } = require('discord.js');
const axios = require('axios')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addsong')
        .setDescription("Adiciona uma música na lista do trivia")
        .addStringOption(new SlashCommandStringOption().setName('nome').setDescription('Nome da música pra adicionar').setRequired(true))
        .addStringOption(new SlashCommandStringOption().setName('link').setDescription('Link da música pra adicionar').setRequired(true))
        .addStringOption(new SlashCommandStringOption().setName('cantor').setDescription('Cantor da música (se for mais de um, separe por virgula)').setRequired(true)),
    voiceChannel: false,

    async execute({ inter }) {
        const header = {
            'Authorization': token
        }

        await inter.deferReply({ ephemeral: true });

        const song = inter.options.getString('nome');
        const link = inter.options.getString('link');
        const singer = []

        if (inter.options.getString('cantor').includes(',')) {
            for (const cantor of inter.options.getString('cantor').split(',')) {
                singer.push(cantor.trim())
            }
        } else {
            singer.push(inter.options.getString('cantor').trim())
        }

        const musica = {
            "title": song,
            "url": link,
            "singers": singer
        }

        const jsonSongs = await axios.get(`${jsonServer}/api/musica`, { headers: header }).then((res) => res.data)

        const result = jsonSongs.filter((s) => {
            return (s.url === link || (s.title.toLowerCase() === song.toLowerCase() && s.singers.some(r => singer.includes(r.toLowerCase()))))
        })

        if (!result.length) {
            await inter.editReply({ content: 'Adicionando sua música... 🎧' });

            const response = await axios.post(
                `${jsonServer}/api/musica`, JSON.stringify(musica),
                {
                    headers: {
                        'Authorization': token,
                        'Content-type': 'application/json'
                    }
                }
            ).catch(async (err) => {
                return await inter.editReply({ content: 'Sua música já está na lista' });
            })

            return await inter.editReply({ content: 'Música adicionada com sucesso' });
        }
        return await inter.editReply({ content: 'Sua música já está na lista.' });

    },
};
