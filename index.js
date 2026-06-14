const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");
const express = require("express");

const app = express();
app.get("/", (req, res) => res.send("Painel Completo Online!"));
app.listen(process.env.PORT || 3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const PREFIXO = "!"; 

client.on("ready", () => {
  console.log(`✅ Bot conectado como ${client.user.tag}! Todas as funções KamiMod ativas.`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Ativa o painel administrativo completo
  if (message.content === `${PREFIXO}painel`) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Apenas administradores podem usar este comando.");
    }

    const embed = new EmbedBuilder()
      .setTitle("🛡️ SISTEMA KAMIMOD — PAINEL ADMINISTRATIVO")
      .setDescription(
        "Bem-vindo à central de controle de segurança do **Arcadiamon**.\n" +
        "Utilize os botões abaixo para aplicar ações rápidas de moderação ou obter instruções de punição."
      )
      .addFields(
        { name: "🔒 Segurança do Painel", value: "Apenas membros da Staff com permissões conseguem clicar nos botões.", inline: false }
      )
      .setColor("#2f3136");

    // Linha 1: Controle do Chat
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("kamimod_lock").setLabel("Trancar Chat 🔒").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("kamimod_unlock").setLabel("Abrir Chat 🔓").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("kamimod_purge").setLabel("Limpar Chat 🧹").setStyle(ButtonStyle.Secondary)
    );

    // Linha 2: Punições e Avisos
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("kamimod_warn").setLabel("Advertir (+1 Warn) ⚠️").setStyle(ButtonStyle.Warning),
      new ButtonBuilder().setCustomId("kamimod_mute").setLabel("Mutar (Castigo) 🔇").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("kamimod_kick").setLabel("Expulsar 🦶").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("kamimod_ban").setLabel("Banir Usuário 🔨").setStyle(ButtonStyle.Danger)
    );

    // Linha 3: Eventos e Anúncios
    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("kamimod_aviso").setLabel("Anúncio Oficial 📢").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("kamimod_evento").setLabel("Alerta de Evento 🎉").setStyle(ButtonStyle.Success)
    );

    await message.channel.send({ embeds: [embed], components: [row1, row2, row3] });
  }
});

// Ações de cada botão do Painel
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  // Trava de segurança para os botões do KamiMod
  const botoesKami = [
    "kamimod_lock", "kamimod_unlock", "kamimod_purge", 
    "kamimod_warn", "kamimod_mute", "kamimod_kick", 
    "kamimod_ban", "kamimod_aviso", "kamimod_evento"
  ];
  
  if (botoesKami.includes(interaction.customId)) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({ content: "❌ Permissão Negada: Você não faz parte da Staff Administrativa.", ephemeral: true });
    }
  }

  if (interaction.customId === "kamimod_lock") {
    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
    await interaction.reply({ content: "🔒 **KamiMod:** Este canal foi trancado por um Administrador." });
  }

  if (interaction.customId === "kamimod_unlock") {
    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
    await interaction.reply({ content: "🔓 **KamiMod:** Este canal foi desbloqueado pela Staff." });
  }

  if (interaction.customId === "kamimod_purge") {
    const mensagens = await interaction.channel.messages.fetch({ limit: 50 });
    await interaction.channel.bulkDelete(mensagens, true).catch(() => {});
    await interaction.reply({ content: "🧹 **KamiMod:** Chat limpo com sucesso.", ephemeral: true });
  }

  if (interaction.customId === "kamimod_warn") {
    await interaction.reply({ content: "⚠️ **Instrução de Advertência:** Utilize os comandos nativos de moderação ou registre o aviso diretamente no canal de logs adicionando o motivo.", ephemeral: true });
  }

  if (interaction.customId === "kamimod_mute") {
    await interaction.reply({ content: "🔇 **Instrução de Mute:** Clique com o botão direito no usuário → **Castigo** e defina o tempo necessário para silenciá-lo.", ephemeral: true });
  }

  if (interaction.customId === "kamimod_kick") {
    await interaction.reply({ content: "🦶 **Instrução de Expulsão:** Para remover temporariamente o membro, vá nas opções de perfil dele dentro do servidor e selecione 'Expulsar'.", ephemeral: true });
  }

  if (interaction.customId === "kamimod_ban") {
    await interaction.reply({ content: "🔨 **Instrução de Banimento:** Para banir com logs estruturados, clique com o botão direito no usuário → **Banir** ou use comandos diretos.", ephemeral: true });
  }

  if (interaction.customId === "kamimod_aviso") {
    const embedAviso = new EmbedBuilder()
      .setTitle("📢 ANÚNCIO OFICIAL — DIRETORIA")
      .setDescription("Atenção comunidade do Arcadiamon! Mantenham a ordem e sigam as diretrizes para garantir uma boa convivência de todos.")
      .setColor("#3498db");
    await interaction.channel.send({ embeds: [embedAviso] });
    await interaction.reply({ content: "✅ Anúncio enviado com sucesso.", ephemeral: true });
  }

  if (interaction.customId === "kamimod_evento") {
    const embedEvento = new EmbedBuilder()
      .setTitle("🎉 EVENTO RELÂMPAGO INICIADO!")
      .setDescription("Preparem seus Pokémons! Um evento oficial acaba de começar dentro do servidor de Minecraft. Entrem para participar!")
      .setColor("#2ecc71");
    await interaction.channel.send({ content: "@everyone", embeds: [embedEvento] });
    await interaction.reply({ content: "✅ Alerta de evento disparado.", ephemeral: true });
  }
});

client.login(process.env.TOKEN);
