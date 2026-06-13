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

// Servidor Web para o Render
const app = express();
app.get("/", (req, res) => res.send("Arcadiamon V3 Avançado Ativo!"));
app.listen(process.env.PORT || 3000, () => console.log("Web server pronto."));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration
  ]
});

// 📁 BANCO DE DADOS EXPANDIDO
const DATA_FILE = "./dados.json";
let db = { inventory: {}, ai_tickets: {}, economy: {} };

if (fs.existsSync(DATA_FILE)) {
  try { db = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); } catch (e) { console.log(e); }
}
if (!db.ai_tickets) db.ai_tickets = {};
if (!db.economy) db.economy = {};
if (!db.inventory) db.inventory = {};

function saveDB() { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); }

// ID do Canal de Logs vindo do Render ou definido aqui
const LOGS_CHANNEL = process.env.LOGS_CHANNEL_ID || "COLOQUE_AQUI_O_ID_SE_NAO_USAR_ENV";

// Itens da Loja Configurados
const LOJA_ITENS = [
  { id: "1", nome: "Ultra Ball", preco: 500, desc: "Aumenta a chance de captura." },
  { id: "2", nome: "Master Ball", preco: 5000, desc: "Captura perfeita garantida." },
  { id: "3", nome: "Kit Treinador Inicial", preco: 1500, desc: "Vem com 5 Pokéballs e 2 Poções." },
  { id: "4", nome: "Ovo de Pokémon Raro", preco: 8000, desc: "Choca um Pokémon aleatório raro." }
];

// ================= REGISTRO DOS COMANDOS DE BARRA (SLASH) =================
const commands = [
  new SlashCommandBuilder()
    .setName("setup-ticket")
    .setDescription("Envia a central de atendimento com menu de seleção em Embed.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Mostra as informações de IP/Porta e status do servidor de Minecraft.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("setup-staff")
    .setDescription("Envia a central de comandos rápidos para a Staff.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("banir")
    .setDescription("Bane um usuário inadequado e gera logs avançados.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option => option.setName("usuario").setDescription("Usuário a ser banido").setRequired(true))
    .addStringOption(option => option.setName("motivo").setDescription("Motivo do banimento").setRequired(false)),

  new SlashCommandBuilder()
    .setName("pegar")
    .setDescription("Adiciona um item ou Pokémon ao seu inventário (Admin).")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option => option.setName("item").setDescription("Nome do item ou Pokémon").setRequired(true)),

  new SlashCommandBuilder()
    .setName("inv")
    .setDescription("Mostra o seu inventário de itens."),

  new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Receba suas moedas diárias para usar na loja."),

  new SlashCommandBuilder()
    .setName("carteira")
    .setDescription("Veja quantas moedas você possui."),

  new SlashCommandBuilder()
    .setName("loja")
    .setDescription("Abra a loja do servidor para comprar itens com suas moedas."),

  // Comandos Interativos
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
    console.log("Todos os comandos avançados foram registrados!");
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

  // 🎮 /status (IP E PORTA DO SERVIDOR)
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
    const rowStaff = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("staff_lock").setLabel("Bloquear Chat 🔒").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("staff_unlock").setLabel("Desbloquear Chat 🔓").setStyle(ButtonStyle.Success)
    );

    const embedStaffSetup = new EmbedBuilder()
      .setTitle("🛠️ Controle Rápido Staff")
      .setDescription("Utilize os botões rápidos abaixo para fazer a manutenção imediata deste canal de texto.")
      .setColor("#34495e");

    await interaction.reply({ embeds: [embedStaffSetup], components: [rowStaff] });
  }

  // 🔨 /banir (COM LOGS DE BANIMENTO)
  if (commandName === "banir") {
    const alvo = interaction.options.getUser("usuario");
    const motivo = interaction.options.getString("motivo") || "Nenhum motivo informado.";
    const membro = interaction.options.getMember("usuario");

    if (!membro.bannable) {
      return interaction.reply({ content: "❌ Eu não posso banir este usuário devido à hierarquia de cargos.", ephemeral: true });
    }

    await guild.members.ban(alvo, { reason: motivo });
    
    // Log Avançado enviado ao canal de Logs dedicado
    await enviarLog(
      "🔨 Usuário Banido do Servidor",
      `**Infrator:** ${alvo.tag} (${alvo.id})\n**Staffer Responsável:** ${user.tag}\n**Motivo:** ${motivo}`,
      "#ff0000",
      guild
    );

    await interaction.reply({ content: `✅ O usuário **${alvo.tag}** foi banido com sucesso! Logs registradas.`, ephemeral: true });
  }

  // 💰 ECONOMIA & LOJA SISTEMAS
  if (commandName === "daily") {
    if (!db.economy[user.id]) db.economy[user.id] = 0;
    const quantia = Math.floor(Math.random() * 300) + 200; // Dá entre 200 e 500 moedas
    db.economy[user.id] += quantia;
    saveDB();

    await interaction.reply({ content: `🪙 Você resgatou sua recompensa diária e ganhou **$${quantia} moedas**!` });
  }

  if (commandName === "carteira") {
    const saldo = db.economy[user.id] || 0;
    await interaction.reply({ content: `👛 Seu saldo atual é de **$${saldo} moedas**.` });
  }

  if (commandName === "loja") {
    const selectLoja = new StringSelectMenuBuilder()
      .setCustomId("menu_loja")
      .setPlaceholder("🛒 Escolha um item para comprar");

    LOJA_ITENS.forEach(item => {
      selectLoja.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(`${item.nome} - $${item.preco}`)
          .setDescription(item.desc)
          .setValue(`buy_${item.id}`)
      );
    });

    const rowLoja = new ActionRowBuilder().addComponents(selectLoja);
    const embedLoja = new EmbedBuilder()
      .setTitle("🛒 Loja Oficial do Servidor Arcadiamon")
      .setDescription("Use suas moedas ganhas com o `/daily` para comprar recursos valiosos abaixo:")
      .setColor("#2ecc71");

    await interaction.reply({ embeds: [embedLoja], components: [rowLoja] });
  }

  // 🎒 /pegar & /inv
  if (commandName === "pegar") {
    const item = interaction.options.getString("item");
    if (!db.inventory[user.id]) db.inventory[user.id] = [];
    db.inventory[user.id].push(item);
    saveDB();
    await interaction.reply({ content: `🎒 Adicionado **${item}** no inventário.` });
  }

  if (commandName === "inv") {
    let inv = db.inventory[user.id] || [];
    await interaction.reply({ content: `🎒 **Seu Inventário:** ${inv.join(", ") || "Vazio."}` });
  }

  // 🎭 COMANDOS INTERATIVOS
  if (commandName === "interagir") {
    const acao = interaction.options.getString("acao");
    const alvo = interaction.options.getUser("alvo");

    let textoAcao = "";
    if (acao === "beijar") textoAcao = `💋 ${user} deu um beijo carinhoso em ${alvo}!`;
    if (acao === "abracar") textoAcao = `🤗 ${user} deu um abraço apertado em ${alvo}!`;
    if (acao === "chutar") textoAcao = `🦶 ${user} deu um chute cômico em ${alvo}!`;
    if (acao === "atacar") textoAcao = `⚔️ ${user} mandou seu Pokémon principal atacar o Pokémon de ${alvo}! Que batalha épica!`;

    const embedInterativo = new EmbedBuilder().setDescription(textoAcao).setColor("#e91e63");
    await interaction.reply({ embeds: [embedInterativo] });
  }
});

// ================= COMPRA NA LOJA (SELECT MENU) =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId === "menu_loja") {
    const itemId = interaction.values[0].replace("buy_", "");
    const itemSelecionado = LOJA_ITENS.find(i => i.id === itemId);
    const userId = interaction.user.id;
    const saldo = db.economy[userId] || 0;

    if (saldo < itemSelecionado.preco) {
      return interaction.reply({ content: `❌ Você não tem moedas suficientes! Você precisa de **$${itemSelecionado.preco}** e só possui **$${saldo}**.`, ephemeral: true });
    }

    db.economy[userId] -= itemSelecionado.preco;
    if (!db.inventory[userId]) db.inventory[userId] = [];
    db.inventory[userId].push(itemSelecionado.nome);
    saveDB();

    await interaction.reply({ content: `🛒 Compra realizada! Você comprou **${itemSelecionado.nome}** por **$${itemSelecionado.preco}** moedas e foi enviado ao seu \`/inv\`.` });
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

  // Interações de botõesStaff rápidos do comando /setup-staff
  if (interaction.isButton()) {
    if (interaction.customId === "staff_lock") {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
      await interaction.reply({ content: "🔒 Este canal foi bloqueado para membros comuns." });
    }
    if (interaction.customId === "staff_unlock") {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
      await interaction.reply({ content: "🔓 Este canal foi reaberto com sucesso." });
    }
    
    // Tratamentos do ticket antigo preservados
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
      respostaTexto = `🎮 **COMO ENTRAR NO SERVIDOR (Minecraft Bedrock / MCPE):**\n\n` +
                      `1️⃣ Entre no seu Minecraft e clique em **Jogar**.\n` +
                      `2️⃣ Vá até a aba **Servidores** e clique em **Adicionar Servidor**.\n` +
                      `3️⃣ Nome: \`Arcadiamon\`\n` +
                      `4️⃣ Endereço (IP): \`arcadiamon.blazebr.xyz\`\n` +
                      `5️⃣ Porta: \`28606\`\n\n` +
                      `Clique em **Salvar** e venha se divertir!`;
    } else if (pergunta.includes("pegar") || pergunta.includes("mod") || pergunta.includes("coisas") || pergunta.includes("pokemon")) {
      respostaTexto = `🎒 **COMO PEGAR COISAS DO MOD DE POKÉMON:**\n\n` +
                      `• **Aqui no Discord:** Use o comando de barra `/loja` para gastar suas moedas obtidas com o `/daily`. Você também pode consultar o seu inventário virtual usando `/inv`.\n\n` +
                      `• **No Servidor (Minecraft):** Quando você entra pela primeira vez, você ganha seu Pokémon inicial automaticamente por interface. Para coletar itens adicionais, insígnias ou Pokebolas use o comando \`/kit\` dentro do jogo!`;
    }

    const embedIa = new EmbedBuilder().setTitle("🤖 Suporte Automatizado").setDescription(respostaTexto).setColor("#9b59b6");
    await message.reply({ embeds: [embedIa] });
  }
});

client.login(process.env.TOKEN);
