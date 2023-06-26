const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder  } = require('discord.js');

module.exports = {
    name: 'rolardado',
    description: "Rola o(s) dado(s) selecionado(s) e retorna o resultado",

    async execute({ inter }) {
        
        if(inter.customId === 'send'){
            const channel = inter.message.channel
            let fields = []

            if(inter.message.embeds[0].data.fields){
                fields = inter.message.embeds[0].data.fields
            }
            const embed = new EmbedBuilder()
                .setTitle(`Resultados`)
                .setColor("#2f3136")
                .addFields(fields)

            await inter.deferUpdate()
            inter.editReply({content: 'sorteio de dados finalizado', components: [], embeds: []})
            channel.send({content: `${inter.message.interaction.user.username} conseguiu o(s) seguinte(s) resultado(s)`, embeds: [embed]})
        } else if (inter.customId && inter.customId === ('dicesModal')) {
            
            inter.fields.fields.forEach(async field =>{
                const embed = new EmbedBuilder()

                let dice = field.customId.split('_')[1].slice(1)
                let multiplier = parseInt(field.value)

                if(multiplier > 100){
                    embed.setDescription(`Máximo de dados permitidos é de 100, foram rodados 100 dados automaticamente para o D${dice}.`)
                    multiplier = 100
                }

                multiplier = (multiplier === 0 || multiplier < 0) ? 1 : multiplier
                let sum = 0
                let sumLabel = ''

                for(i = 0; i < multiplier; i++){
                    const diceValue = Math.floor(Math.random() * (dice - 1 + 1) + 1)
                    sum += diceValue
                    if((i + 1) === multiplier){
                        sumLabel += diceValue
                    }else{
                        sumLabel += diceValue + ' + '
                    }
                }
    
                let fields = []
            
                if(inter.message.embeds[0].data.fields){
                    fields = inter.message.embeds[0].data.fields
                }

                let resultField = multiplier > 1 ? '`'+ sum.toString() +' >> ' + sumLabel +'`' : '`'+ sum.toString() +'`'
                let resultTitle = multiplier > 1 ? `**${multiplier}x${field.customId.split('_')[1]}**` : `**${field.customId.split('_')[1]}**`

                fields.push({
                    name: resultTitle,
                    value: resultField,
                    inline: true
                })
    
                embed
                    .setTitle(`Resultados`)
                    .setColor("#2f3136")
                    .addFields(fields)
                    
                    const buttonsMatrix = montaOpcoesDados(field.customId.split('_')[1], inter.message.components)

                    await inter.deferUpdate()
                    inter.editReply({
                        embeds: [embed],
                        components: [new ActionRowBuilder().addComponents(buttonsMatrix[0]), new ActionRowBuilder().addComponents(buttonsMatrix[1])], 
                        ephemeral: true
                    })
    
            })

        } else if(inter.customId && inter.customId.substring(0,1) === 'D'){

            const modal = new ModalBuilder()
                .setCustomId('dicesModal')
                .setTitle(`Rolando ${inter.customId}`)

            const textInput = new TextInputBuilder()
                .setCustomId(`multiplier_${inter.customId}`)
                .setLabel('Quantos dados deseja rolar?')
                .setMinLength(1)
                .setPlaceholder('1')
                .setValue('1')
                .setStyle(1)
                .setRequired(false)

            await inter.showModal(modal.addComponents(new ActionRowBuilder().addComponents(textInput)))

        } else {
            const embed = new EmbedBuilder()
            .setTitle("Rolar Dados")
            .setColor("#2f3136")
            .setDescription("Clique no dado que deseja rolar")
            
            const buttonsMatrix = montaOpcoesDados(undefined)
            
            inter.reply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(buttonsMatrix[0]), new ActionRowBuilder().addComponents(buttonsMatrix[1])], 
                ephemeral: true
            })
        }

    },
};

function montaOpcoesDados(idToBlock, components){
        
    let dices = ['D4', 'D6', 'D8', 'D10', 'D12', 'D20', 'D100']
    let emojis = carregaEmojiDados()

    let lockedDices = dadosBloqueados(components)

    let buttonRows = []
    let buttonColumns = []

    let diceIndex = 0
    
    for(i = 0; i < 4; i++){
        buttonColumns.push(new ButtonBuilder()
            .setCustomId(`${dices[diceIndex]}`)
            .setLabel(`${dices[diceIndex]}`)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji({name: `${dices[diceIndex]}`, id: emojis.get(dices[diceIndex])})
        )
        buttonColumns.forEach(button =>{
            button.setDisabled((idToBlock && button.data.custom_id === idToBlock) || lockedDices.includes(button.data.custom_id))
        })
        diceIndex++
    }

    buttonRows.push(buttonColumns)
    buttonColumns = []

    for(i = diceIndex; i < dices.length; i++){
        buttonColumns.push(new ButtonBuilder()
            .setCustomId(`${dices[diceIndex]}`)
            .setLabel(`${dices[diceIndex]}`)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji({name: `${dices[diceIndex]}`, id: emojis.get(dices[diceIndex])})
        )
        buttonColumns.forEach(button =>{
            button.setDisabled((idToBlock && button.data.custom_id === idToBlock) || lockedDices.includes(button.data.custom_id))
        })
        diceIndex++
    }

    buttonColumns.push(new ButtonBuilder()
            .setCustomId('send')
            .setLabel('Enviar')
            .setStyle(ButtonStyle.Success)
        )

    buttonRows.push(buttonColumns)

    return buttonRows
        
}

function dadosBloqueados(components){

    let dices = []

    if(components){
        components.forEach(component => {
            component.components.forEach(button => {
                if(button.data.disabled){
                    dices.push(button.data.custom_id)
                }
            })
        })
    }

    return dices

}

function carregaEmojiDados(){

    let emojisMap = new Map()

    emojisMap.set('D4', '1120789100799205446')
    emojisMap.set('D6', '1120789132772376707')
    emojisMap.set('D8', '1120789143476240544')
    emojisMap.set('D10', '1120789154746335414')
    emojisMap.set('D12', '1120789164376473641')
    emojisMap.set('D20', '1120789173931090023')
    emojisMap.set('D100', '1120792988059193485')

    return emojisMap
}
