const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionsBitField,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder
} = require("discord.js");
const express = require("express");
const fs = require("fs");

// Servidor Web para o Render (Mantém o bot 24/7)
const app = express();
app.get("/", (req, res) => res.send("Arcadiamon V5 Pro Estável Ativo!"));
app.listen(process.env.PORT || 3000, () => console.log("Web server pronto."));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration
  ]
});

// 📁 BANCO DE DADOS LOCAL
const DATA_FILE = "./dados.json";
let db = { inventory: {}, ai_tickets: {} };

if (fs.existsSync(DATA_FILE)) {
  try { db = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); } catch (e) { console.log(e); }
}
if (!db.ai_tickets) db.ai_tickets = {};
if (!db.inventory) db.inventory = {};

function saveDB() { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); }

// ID do Canal de Logs vindo do Render ou definido manualmente
const LOGS_CHANNEL = process.env.LOGS_CHANNEL_ID || "COLOQUE_AQUI_O_ID_SE_NAO_USAR_ENV";

// ================= REGISTRO DOS COMANDOS DE BARRA (SLASH) =================
const commands = [
  new SlashCommandBuilder()
    .setName("setup-ticket")
    .setDescription("Envia a central de atendimento com menu de seleção em Embed.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // 🔒 APENAS ADM

  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Mostra as informações de IP/Porta e status do servidor de Minecraft.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // 🔒 APENAS ADM

  new SlashCommandBuilder()
    .setName("setup-staff")
    .setDescription("Envia a central completa com ferramentas de punição, avisos e eventos.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // 🔒 APENAS ADM

  new SlashCommandBuilder()
    .setName("banir")
    .setDescription("Bane um usuário inadequado e gera logs avançados.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option => option.setName("usuario").setDescription("Usuário a ser banido").setRequired(true))
    .addStringOption(option => option.setName("motivo").setDescription("Motivo do banimento").setRequired(false)),

  new SlashCommandBuilder()
    .setName("loja")
    .setDescription("Exibe o catálogo completo da Loja Oficial com pacotes e vips."),

  new SlashCommandBuilder()
    .setName("pegar")
    .setDescription("Adiciona um item ou Pokémon ao seu inventário (Admin).")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option => option.setName("item").setDescription("Nome do item ou Pokémon").setRequired(true)),

  new SlashCommandBuilder()
    .setName("inv")
    .setDescription("Mostra o seu inventário de itens."),

  new SlashCommandBuilder()
    .setName("pokemon-status")
    .setDescription("Mostra o status de lealdade do seu Pokémon companheiro.")
    .addStringOption(option => option.setName("nome").setDescription("Nome do seu Pokémon").setRequired(true)),

  new SlashCommandBuilder()
    .setName("interagir")
    .setDescription("Comandos interativos e animados com outros membros.")
    .addStringOption(option => 
      option.setName("acao")
        .setDescription("Escolha a ação")
        .setRequired(true)
        .addChoices(
          { name: "Beijar 💋", value: "beijar" },
          { name: "Abraçar 🤗", value: "abracar" },
          { name: "Chutar 🦶", value: "chutar" },
          { name: "Atacar com Pokémon ⚔️", value: "atacar" }
        ))
    .addUserOption(option => option.setName("alvo").setDescription("Membro com quem interagir").setRequired(true))
].map(command => command.toJSON());

client.on("ready", async () => {
  console.log(`🤖 Bot logado como ${client.user.tag}!`);
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("Todos os comandos configurados e sincronizados com o Discord!");
  } catch (error) { console.error(error); }
});

// FUNÇÃO AUXILIAR PARA ENVIAR LOGS
async function enviarLog(titulo, descricao, cor, guild) {
  const canalLogs = guild.channels.cache.get(LOGS_CHANNEL);
  if (!canalLogs) return;

  const embedLog = new EmbedBuilder()
    .setTitle(titulo)
    .setDescription(descricao)
    .setColor(cor)
    .setTimestamp();

  await canalLogs.send({ embeds: [embedLog] });
}

// ================= PROCESSANDO OS SLASH COMMANDS =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName, user, guild } = interaction;

  // 🎫 /setup-ticket
  if (commandName === "setup-ticket") {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("menu_ticket")
      .setPlaceholder("🚨 Atendimento geral")
      .addOptions(
        new StringSelectMenuOptionBuilder().setLabel("Comprar Pokémon/kits").setDescription("Nesse canal vc consegue comprar kits/pokemom da loja").setValue("ticket_loja").setEmoji("💵"),
        new StringSelectMenuOptionBuilder().setLabel("Denunciar jogadores").setDescription("Denunciar jogadores que não respeitou as regras").setValue("ticket_denuncia").setEmoji("🚨"),
        new StringSelectMenuOptionBuilder().setLabel("Bugs").setDescription("Caso tenha um bug no servidor use essa opção").setValue("ticket_bugs").setEmoji("🔺"),
        new StringSelectMenuOptionBuilder().setLabel("Suporte com IA").setDescription("Abra um chat privado para tirar dúvidas com nossa IA inteligente").setValue("ticket_ia").setEmoji("🤖"),
        new StringSelectMenuOptionBuilder().setLabel("Suporte").setDescription("Caso esteja com dúvidas do servidor abri essa opção").setValue("ticket_suporte").setEmoji("💬"),
        new StringSelectMenuOptionBuilder().setLabel("Outros").setDescription("Assunto que fugi das opções acima").setValue("ticket_outros").setEmoji("🌍")
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);
    const embedTicket = new EmbedBuilder()
      .setTitle("📫 Central de Atendimento")
      .setDescription("Selecione o departamento ideal abaixo para abrir seu ticket privado.")
      .setColor("#ff1f1f");

    await interaction.reply({ embeds: [embedTicket], components: [row] });
  }

  // 🎮 /status
  if (commandName === "status") {
    const embedMinecraft = new EmbedBuilder()
      .setTitle("🎮 Status Conexão - Arcadiamon")
      .setDescription("Use as credenciais abaixo para conectar ao mundo Pixelmon/Cobblemon Bedrock!")
      .addFields(
        { name: "🌐 Endereço IP", value: "`arcadiamon.blazebr.xyz`", inline: true },
        { name: "🔌 Porta de Acesso", value: "`28606`", inline: true },
        { name: "📡 Status", value: "🟢 Online e Operando", inline: false }
      )
      .setColor("#ffcc00");

    await interaction.reply({ embeds: [embedMinecraft] });
  }

  // 🛠️ /setup-staff
  if (commandName === "setup-staff") {
    const rowStaff1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("staff_lock").setLabel("Trancar Chat 🔒").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("staff_unlock").setLabel("Abrir Chat 🔓").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("staff_purge").setLabel("Limpar Chat 🧹").setStyle(ButtonStyle.Secondary)
    );

    const rowStaff2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("staff_mute_info").setLabel("Mute 🔇").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("staff_ban_info").setLabel("Ban 🔨").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("staff_aviso_rapido").setLabel("Enviar Aviso ⚠️").setStyle(ButtonStyle.Warning),
      new ButtonBuilder().setCustomId("staff_evento_info").setLabel("Evento 🎉").setStyle(ButtonStyle.Success)
    );

    const embedStaffSetup = new EmbedBuilder()
      .setTitle("⚙️ Central Suprema de Moderação — Arcadiamon")
      .setDescription("Ações administrativas e ferramentas globais protegidas para uso exclusivo da Staff:")
      .setColor("#2c3e50");

    await interaction.reply({ embeds: [embedStaffSetup], components: [rowStaff1, rowStaff2] });
  }

  // 🔨 /banir
  if (commandName === "banir") {
    const alvo = interaction.options.getUser("usuario");
    const motivo = interaction.options.getString("motivo") || "Nenhum motivo informado.";
    const membro = interaction.options.getMember("usuario");

    if (!membro.bannable) {
      return interaction.reply({ content: "❌ Eu não posso banir este usuário devido à hierarquia de cargos.", ephemeral: true });
    }

    await guild.members.ban(alvo, { reason: motivo });
    await enviarLog(
      "🔨 Usuário Banido do Servidor",
      `**Infrator:** ${alvo.tag} (${alvo.id})\n**Staffer Responsável:** ${user.tag}\n**Motivo:** ${motivo}`,
      "#ff0000",
      guild
    );

    await interaction.reply({ content: `✅ O usuário **${alvo.tag}** foi banido com sucesso!`, ephemeral: true });
  }

  // 🛒 /loja
  if (commandName === "loja") {
    const selectLoja = new StringSelectMenuBuilder()
      .setCustomId("menu_loja_real")
      .setPlaceholder("🛒 Selecione um Pacote para comprar")
      .addOptions(
        new StringSelectMenuOptionBuilder().setLabel("🥉 Treinador Iniciante - R$ 4,00").setValue("pacote_iniciante").setDescription("Kit avançado + 2 Master Balls + 1 Pokemom Raro"),
        new StringSelectMenuOptionBuilder().setLabel("🥈 Treinador Pro - R$ 10,00").setValue("pacote_pro").setDescription("Kit completo + 5 Master Balls + 2 Raros + 1 Shiny"),
        new StringSelectMenuOptionBuilder().setLabel("🥇 Mestre Pokémon - R$ 18,00").setValue("pacote_mestre").setDescription("Kit lendário + 10 Master Balls + 1 Lendário + 2 Shinys"),
        new StringSelectMenuOptionBuilder().setLabel("👑 Pacote Supremo - R$ 24,00").setValue("pacote_supremo").setDescription("Kit FULL OP + 20 Master Balls + 2 Lendários + 3 Shinys + Tag"),
        new StringSelectMenuOptionBuilder().setLabel("✨ Kit VIP Pokémon - R$ 35,90").setValue("pacote_vip").setDescription("4 Raros + 25k Coins + 32 Candies + 10 Master + 1 Shiny + Tag")
      );

    const rowLoja = new ActionRowBuilder().addComponents(selectLoja);

    const embedLoja = new EmbedBuilder()
      .setTitle("⚡🔥 POKEARCADIAMON SERVER - LOJA OFICIAL 🔥⚡")
      .setDescription(
        "🎮 O melhor servidor Pokémon com addons exclusivos!\n" +
        "━━━━━━━━━━━━━━━━━━\n" +
        "💰📦 **PACOTES DISPONÍVEIS**\n\n" +
        "🥉 **TREINADOR INICIANTE — R$4**\n" +
        "🎒 Kit inicial avançado\n🟣 2 Master Balls\n💊 Itens básicos\n🐾 1 Pokémon raro\n\n" +
        "🥈 **TREINADOR PRO — R$10**\n" +
        "🎒 Kit completo\n🟣 5 Master Balls\n💊 Itens + cura\n🐾 2 Pokémon raros\n✨ 1 Shiny aleatório\n\n" +
        "🥇 **MESTRE POKÉMON — R$18**\n" +
        "🎒 Kit lendário\n🟣 10 Master Balls\n💊 Itens avançados\n🐾 1 Pokémon lendário\n✨ 2 Shinys\n\n" +
        "👑 **PACOTE SUPREMO — R$24**\n" +
        "🎒 Kit FULL OP\n🟣 20 Master Balls\n💊 Itens raros\n🐉 2 Lendários\n✨ 3 Shinys\n👑 Tag exclusiva\n" +
        "━━━━━━━━━━━━━━━━━━\n" +
        "⚡🔥 **EXTRAS DISPONÍVEIS**\n" +
        "🟣 1 Master Ball — R$1\n" +
        "✨ Shiny aleatório — R$3\n" +
        "🐉 Lendário aleatório — R$6\n" +
        "━━━━━━━━━━━━━━━━━━\n" +
        "✨ **KIT VIP POKÉMON** ✨\n" +
        "Um pacote equilibrado para quem quer começar forte sem gastar muito!\n\n" +
        "🎁 **O QUE INCLUI:**\n" +
        "🐉 4 Pokémon raros\n💎 25.000 Coins\n🍬 32 Rare Candies\n🧿 10 Master Balls\n✨ 1 Pokémon Shiny aleatório\n🏷️ Tag exclusiva no chat\n\n" +
        "💰 **PREÇO: R$35,90**"
      )
      .setColor("#ffcc00");

    await interaction.reply({ embeds: [embedLoja], components: [rowLoja] });
  }

  // 🎒 /pegar & /inv
  if (commandName === "pegar") {
    const item = interaction.options.getString("item");
    if (!db.inventory[user.id]) db.inventory[user.id] = [];
    db.inventory[user.id].push(item);
    saveDB();
    await interaction.reply({ content: `🎒 Adicionado **${item}** no inventário virtual.` });
  }

  if (commandName === "inv") {
    let inv = db.inventory[user.id] || [];
    await interaction.reply({ content: `🎒 **Seu Inventário Virtual:** ${inv.join(", ") || "Vazio."}` });
  }

  // 🐾 /pokemon-status
  if (commandName === "pokemon-status") {
    const nomePoke = interaction.options.getString("nome");
    const felicidade = Math.floor(Math.random() * 100);
    const embedStatus = new EmbedBuilder()
      .setTitle(`📊 Status: ${nomePoke}`)
      .setDescription(`❤️ **Felicidade/Lealdade:** ${felicidade}%\n⚡ **Status de Combate:** Pronto para batalha!`)
      .setColor("#3498db");
    await interaction.reply({ embeds: [embedStatus] });
  }

  // 🎭 COMANDOS INTERATIVOS
  if (commandName === "interagir") {
    const acao = interaction.options.getString("acao");
    const alvo = interaction.options.getUser("alvo");

    let textoAcao = "";
    if (acao === "beijar") textoAcao = `💋 ${user} deu um beijo carinhoso em ${alvo}!`;
    if (acao === "abracar") textoAcao = `🤗 ${user} deu um abraço apertado em ${alvo}!`;
    if (acao === "chutar") textoAcao = `🦶 ${user} deu um chute em ${alvo}!`;
    if (acao === "atacar") textoAcao = `⚔️ ${user} mandou seu Pokémon atacar o Pokémon de ${alvo}! Batalha valendo!`;

    const embedInterativo = new EmbedBuilder().setDescription(textoAcao).setColor("#e91e63");
    await interaction.reply({ embeds: [embedInterativo] });
  }
});

// ================= INTERAÇÕES DO MENU DA LOJA =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId === "menu_loja_real") {
    const embedCompraInstrucoes = new EmbedBuilder()
      .setTitle("🛒 Como finalizar sua Compra")
      .setDescription(`Olá ${interaction.user}, abra um chamado na categoria **💵 Comprar Pokémon/kits** nos Tickets para realizar o pagamento Pix com a Staff!`)
      .setColor("#2ecc71");

    await interaction.reply({ embeds: [embedCompraInstrucoes], ephemeral: true });
  }
});

// ================= PROCESSANDO A SELEÇÃO DO TICKET E SEUS BOTÕES =================
client.on("interactionCreate", async (interaction) => {
  if (interaction.isStringSelectMenu() && interaction.customId === "menu_ticket") {
    await interaction.deferReply({ ephemeral: true });
    const escolha = interaction.values[0];
    let nomeCategoria = escolha.replace("ticket_", "");
    let prefixoChannel = nomeCategoria === "ia" ? "🤖-ia-" : `🎫-${nomeCategoria}-`;

    try {
      const channel = await interaction.guild.channels.create({
        name: `${prefixoChannel}${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
        ]
      });

      if (escolha === "ticket_ia") { db.ai_tickets[channel.id] = true; saveDB(); }

      const rowTicket = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("claim_ticket").setLabel("Claim 🔒").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("close_ticket").setLabel("Fechar ❌").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("staff_panel").setLabel("Painel Staff 🛠️").setStyle(ButtonStyle.Secondary)
      );

      const embedBoasVindas = new EmbedBuilder()
        .setTitle(`👋 Atendimento: ${nomeCategoria.toUpperCase()}`)
        .setDescription(escolha === "ticket_ia" ? `Olá! Converse aqui com nossa IA diretamente!` : `Olá, relate sua dúvida para nossa equipe!`)
        .setColor("#3498db");

      await channel.send({ embeds: [embedBoasVindas], components: [rowTicket] });
      await interaction.editReply({ content: `✅ Canal criado: ${channel}` });
    } catch (e) { console.error(e); }
  }

  // ================= CONTROLE DE BOTÕES DA STAFF (🔒 APENAS MOD/ADM) =================
  if (interaction.isButton()) {
    const botoesStaff = ["staff_lock", "staff_unlock", "staff_purge", "staff_mute_info", "staff_ban_info", "staff_aviso_rapido", "staff_evento_info"];
    
    if (botoesStaff.includes(interaction.customId)) {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return interaction.reply({ content: "❌ Erro: Comando restrito a Administradores e Moderadores.", ephemeral: true });
      }
    }

    if (interaction.customId === "staff_lock") {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
      await interaction.reply({ content: "🔒 Canal trancado com sucesso pela Staff." });
    }
    if (interaction.customId === "staff_unlock") {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
      await interaction.reply({ content: "🔓 Canal reaberto para conversas." });
    }
    if (interaction.customId === "staff_purge") {
      const mensagens = await interaction.channel.messages.fetch({ limit: 50 });
      await interaction.channel.bulkDelete(mensagens, true).catch(() => {});
      await interaction.reply({ content: "🧹 Mensagens limpas com sucesso por um Administrador.", ephemeral: true });
    }
    if (interaction.customId === "staff_mute_info") {
      await interaction.reply({ content: "🔇 **Como Muta:** Use a interface do Discord clicando com o botão direito no usuário → *Castigo* ou gerencie os cargos.", ephemeral: true });
    }
    if (interaction.customId === "staff_ban_info") {
      await interaction.reply({ content: "🔨 **Como Banir:** Digite `/banir` para remover o infrator e disparar logs automáticos.", ephemeral: true });
    }
    if (interaction.customId === "staff_aviso_rapido") {
      const embedAviso = new EmbedBuilder()
        .setTitle("⚠️ AVISO IMPORTANTE — STAFF")
        .setDescription("Por favor, respeitem as regras do canal de texto para evitar advertências da moderação.")
        .setColor("#f1c40f");
      await interaction.channel.send({ embeds: [embedAviso] });
      await interaction.reply({ content: "✅ Aviso enviado.", ephemeral: true });
    }
    if (interaction.customId === "staff_evento_info") {
      const embedEvento = new EmbedBuilder()
        .setTitle("🎉 NOVO EVENTO INICIADO!")
        .setDescription("Um evento oficial acaba de começar dentro do nosso servidor de Minecraft! Entre agora mesmo para jogar!")
        .setColor("#2ecc71");
      await interaction.channel.send({ content: "@everyone", embeds: [embedEvento] });
      await interaction.reply({ content: "✅ Alerta de evento enviado.", ephemeral: true });
    }
    
    // Fechar Canal de Ticket comum
    if (interaction.customId === "close_ticket") {
      await interaction.reply({ content: "🔒 Fechando canal em 5 segundos..." });
      if (db.ai_tickets[interaction.channel.id]) { delete db.ai_tickets[interaction.channel.id]; saveDB(); }
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
  }
});

// ================= RESPONDEDOR DA IA DENTRO DO TICKET =================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (db.ai_tickets[message.channel.id]) {
    await message.channel.sendTyping();
    const pergunta = message.content.toLowerCase();
    let respostaTexto = `Olá! Descreva sua dúvida sobre o Arcadiamon ou chame a Moderação por meio dos botões acima!`;

    if (pergunta.includes("ip") || pergunta.includes("porta") || pergunta.includes("entrar") || pergunta.includes("como entra")) {
      respostaTexto = `🌟 **COMO ENTRAR NO SERVIDOR (Minecraft Bedrock / MCPE):**\n\n` +
                      `1️⃣ Entre no seu Minecraft e clique em **Jogar**.\n` +
                      `2️⃣ Vá até a aba **Servidores** e clique em **Adicionar Servidor**.\n` +
                      `3️⃣ Endereço (IP): \`arcadiamon.blazebr.xyz\`\n` +
                      `4️⃣ Porta: \`28606\``;
    } else if (pergunta.includes("pegar") || pergunta.includes("mod") || pergunta.includes("coisas") || pergunta.includes("pokemon")) {
      respostaTexto = `🎒 **COMO PEGAR COISAS DO MOD DE POKÉMON:**\n\n` +
                      `• **No Discord:** Use o comando \`/loja\` para ver nossos planos VIP!\n\n` +
                      `• **No Servidor (Minecraft):** Digite \`/kit\` no chat do jogo para resgatar os recursos iniciais gratuitos!`;
    }

    const embedIa = new EmbedBuilder().setTitle("🤖 Suporte Automatizado").setDescription(respostaTexto).setColor("#9b59b6");
    await message.reply({ embeds: [embedIa] });
  }
});

client.login(process.env.TOKEN);
