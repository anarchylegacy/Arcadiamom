const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");
const express = require("express");

const app = express();
app.get("/", (req, res) => res.send("Bot KamiMod Ativo!"));
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
  console.log(`✅ ${client.user.tag} online com comandos de texto normais!`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // 1. COMANDO: !painel
  if (message.content === `${PREFIXO}painel`) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Apenas administradores podem usar este comando.");
    }

    const embed = new EmbedBuilder()
      .setTitle("🛡️ SISTEMA KAMIMOD — CENTRAL DE CONTROLE")
      .setDescription("Utilize os botões abaixo ou digite os comandos diretamente no chat.")
      .setColor("#2f3136");

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("kamimod_lock").setLabel("Trancar Chat 🔒").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("kamimod_unlock").setLabel("Abrir Chat 🔓").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("kamimod_purge").setLabel("Limpar Chat 🧹").setStyle(ButtonStyle.Secondary)
    );

    await message.channel.send({ embeds: [embed], components: [row1] });
  }

  // 2. COMANDO INDIVIDUAL: !limpar
  if (message.content.startsWith(`${PREFIXO}limpar`)) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
    
    const mensagens = await message.channel.messages.fetch({ limit: 50 });
    await message.channel.bulkDelete(mensagens, true).catch(() => {});
    const aviso = await message.channel.send("🧹 **KamiMod:** Chat limpo com sucesso!");
    setTimeout(() => aviso.delete().catch(() => {}), 4000);
  }

  // 3. COMANDO INDIVIDUAL: !trancar
  if (message.content === `${PREFIXO}trancar`) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return;
    
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
    await message.reply("🔒 **KamiMod:** Este canal foi trancado.");
  }

  // 4. COMANDO INDIVIDUAL: !destrancar
  if (message.content === `${PREFIXO}destrancar`) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return;
    
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true });
    await message.reply("🔓 **KamiMod:** Este canal foi desbloqueado.");
  }

  // 5. COMANDO INDIVIDUAL: !anuncio
  if (message.content === `${PREFIXO}anuncio`) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const embedAviso = new EmbedBuilder()
      .setTitle("📢 ANÚNCIO OFICIAL")
      .setDescription("Atenção comunidade! Fiquem atentos às regras e novidades do servidor.")
      .setColor("#3498db");
    
    await message.channel.send({ embeds: [embedAviso] });
    await message.delete().catch(() => {});
  }
});

// Respostas dos botões do painel principal
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
    return interaction.reply({ content: "❌ Apenas a Staff pode clicar aqui.", ephemeral: true });
  }

  if (interaction.customId === "kamimod_lock") {
    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
    await interaction.reply({ content: "🔒 Canal trancado via painel." });
  }

  if (interaction.customId === "kamimod_unlock") {
    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
    await interaction.reply({ content: "🔓 Canal desbloqueado via painel." });
  }

  if (interaction.customId === "kamimod_purge") {
    const mensagens = await interaction.channel.messages.fetch({ limit: 50 });
    await interaction.channel.bulkDelete(mensagens, true).catch(() => {});
    await interaction.reply({ content: "🧹 Mensagens limpas.", ephemeral: true });
  }
});

client.login(process.env.TOKEN);
