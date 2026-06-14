const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField, ModalBuilder, TextInputBuilder, TextInputStyle, UserSelectMenuBuilder, ChannelType, StringSelectMenuBuilder } = require("discord.js");
const express = require("express");

const app = express();
app.get("/", (req, res) => res.send("Bot Central com Sistema de Eventos Online!"));
app.listen(process.env.PORT || 3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const PREFIXO = "!"; 

const respostasIAAtendimento = {
  vip: "📢 **VIP, Compras e Loja:** Para consultar planos, métodos de pagamento ou registrar ativações, envie o seu nick e o comprovante aqui no chat. Um Diretor fará a entrega manual assim que visualizar!",
  bugs: "⚙️ **Bugs e Erros Técnico:** Detalhe o problema explicando o passo a passo de como ele acontece. Se tiver prints ou vídeos do erro, anexe aqui para ajudar nossos programadores.",
  conexao: "🎮 **Conexão, IP e Versão:** Verifique se você está utilizando a versão exata do servidor em seu launcher. Certifique-se também de que seus mods estão na pasta correta e que o Java está atualizado.",
  regras: "⚖️ **Denúncias, Revisões e Regras:** Mantenha a calma e envie sua justificativa ou acusação acompanhada de provas concretas (links, prints ou vídeos). A diretoria analisará o caso em breve.",
  staff: "👑 **Falar com a Staff / Ajuda Geral:** Entendido! Se o seu problema não se encaixa nas opções automáticas, digite a sua dúvida detalhadamente aqui e aguarde um Administrador humano assumir o seu chamado.",
  desempenho: "⚡ **Lag, Ping ou Queda de FPS:** Se você está enfrentando travamentos, verifique sua rota de internet ou tente alocar mais memória RAM no seu launcher."
};

client.on("ready", () => {
  console.log(`✅ ${client.user.tag} online! Sistema de eventos configurado.`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // --- COMANDO !pokepedia ---
  if (message.content.startsWith(`${PREFIXO}pokepedia`)) {
    const args = message.content.split(" ");
    const pokemonNome = args[1]?.toLowerCase();

    if (!pokemonNome) return message.reply("❌ Use o comando informando o nome de um Pokémon! Exemplo: `!pokepedia pikachu`.");

    try {
      const respostaApi = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonNome}`);
      if (!respostaApi.ok) return message.reply("❌ Esse Pokémon não foi encontrado na Poképédia.");

      const dados = await respostaApi.json();
      const tipos = dados.types.map(t => t.type.name.toUpperCase()).join(", ");
      const hp = dados.stats[0].base_stat;
      const ataque = dados.stats[1].base_stat;
      const defesa = dados.stats[2].base_stat;
      const velocidade = dados.stats[5].base_stat;
      const foto = dados.sprites.front_default || dados.sprites.other["official-artwork"].front_default;

      const embedPoke = new EmbedBuilder()
        .setTitle(`📕 POKÉPEDIA — ${dados.name.toUpperCase()}`)
        .addFields(
          { name: "✨ Tipo(s):", value: `\`${tipos}\``, inline: true },
          { name: "❤️ Vida (HP):", value: `\`${hp}\``, inline: true },
          { name: "⚔️ Ataque:", value: `\`${ataque}\``, inline: true },
          { name: "🛡️ Defesa:", value: `\`${defesa}\``, inline: true },
          { name: "⚡ Velocidade:", value: `\`${velocidade}\``, inline: true }
        )
        .setColor("#ffcb05")
        .setFooter({ text: "Poképédia Integrada" });

      if (foto) embedPoke.setThumbnail(foto);
      return message.channel.send({ embeds: [embedPoke] });
    } catch {
      return message.reply("❌ Erro ao conectar com a Poképédia.");
    }
  }

  // --- LEITURA INTELIGENTE DA IA NOS TICKETS ---
  if (message.channel.name.startsWith("🎫-ticket-") || message.channel.name.startsWith("🤖-ia-")) {
    await message.channel.sendTyping();
    setTimeout(async () => {
      const msgUser = message.content.toLowerCase();
      let respostaFinal = "Descreva seu problema detalhadamente e aguarde um Administrador humano assumir o chamado!";

      if (msgUser.includes("vip") || msgUser.includes("comprar") || msgUser.includes("loja") || msgUser.includes("site")) respostaFinal = respostasIAAtendimento.vip;
      else if (msgUser.includes("bug") || msgUser.includes("erro") || msgUser.includes("problema")) respostaFinal = respostasIAAtendimento.bugs;
      else if (msgUser.includes("entrar") || msgUser.includes("ip") || msgUser.includes("conexao")) respostaFinal = respostasIAAtendimento.conexao;
      else if (msgUser.includes("regra") || msgUser.includes("ban") || msgUser.includes("denuncia")) respostaFinal = respostasIAAtendimento.regras;
      else if (msgUser.includes("lag") || msgUser.includes("ping") || msgUser.includes("fps")) respostaFinal = respostasIAAtendimento.desempenho;
      else if (msgUser.includes("staff") || msgUser.includes("ajuda") || msgUser.includes("suporte")) respostaFinal = respostasIAAtendimento.staff;

      const embedIA = new EmbedBuilder()
        .setTitle("🤖 ASSISTENTE VIRTUAL (IA)")
        .setDescription(respostaFinal)
        .setColor("#9b59b6");

      await message.channel.send({ embeds: [embedIA] });
    }, 1200);
    return;
  }

  // COMANDO s!etup-ticket
  if (message.content === "s!etup-ticket") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply("❌ Sem permissão.");

    const embedSetup = new EmbedBuilder()
      .setTitle("📩 CENTRAL DE ATENDIMENTO")
      .setDescription("Selecione a categoria no menu abaixo para abrir um chamado privado.")
      .setColor("#1abc9c");

    const selectTicket = new StringSelectMenuBuilder()
      .setCustomId("select_categoria_ticket")
      .setPlaceholder("Selecione o motivo do suporte...")
      .addOptions([
        { label: "Atendimento com IA 🤖", description: "Dúvidas rápidas com a nossa IA", value: "Atendimento IA" },
        { label: "Suporte Geral 💬", description: "Dúvidas com a equipe de Staff", value: "Suporte Geral" },
        { label: "Financeiro / VIP 💰", description: "Problemas com compras ou VIP", value: "Financeiro" },
        { label: "Reportar Bugs ⚙️", description: "Erros técnicos no servidor", value: "Bugs" },
        { label: "Denúncias e Revisões ⚖️", description: "Contestar punições ou reportar jogadores", value: "Denúncias" }
      ]);

    await message.channel.send({ embeds: [embedSetup], components: [new ActionRowBuilder().addComponents(selectTicket)] });
    await message.delete().catch(() => {});
  }

  // COMANDO !painel (Staff)
  if (message.content === `${PREFIXO}painel`) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return;

    const embedMenu = new EmbedBuilder()
      .setTitle("🛡️ CENTRAL DE GERENCIAMENTO")
      .setDescription("Escolha uma das abas administrativas abaixo:")
      .setColor("#2f3136");

    const rowMenu = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("menu_chat_aba").setLabel("Apenas Chat 💬").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("menu_punir_aba").setLabel("Punir Membro 🔨").setStyle(ButtonStyle.Danger)
    );

    await message.channel.send({ embeds: [embedMenu], components: [rowMenu] });
  }
});

// Interações Gerais e Modais
client.on("interactionCreate", async (interaction) => {
  
  // RECEBIMENTO DOS FORMULÁRIOS (MODAIS)
  if (interaction.isModalSubmit()) {
    // 1. Processamento do Modal de Eventos
    if (interaction.customId === "modal_sistema_evento") {
      const canalInput = interaction.fields.getTextInputValue("input_ev_canal").replace("#", "").trim();
      const horaInput = interaction.fields.getTextInputValue("input_ev_hora");
      const descInput = interaction.fields.getTextInputValue("input_ev_desc");

      const canalAlvo = interaction.guild.channels.cache.find(c => c.name === canalInput || c.id === canalInput);
      if (!canalAlvo || canalAlvo.type !== ChannelType.GuildText) {
        return interaction.reply({ content: "❌ Canal de texto inválido ou não encontrado. Digite o nome correto (ex: `anuncios`).", ephemeral: true });
      }

      const embedAnuncioEvento = new EmbedBuilder()
        .setTitle("🎉 NOVO EVENTO CONFIRMADO!")
        .setDescription(`Preparem-se! Nossa equipe preparou um super evento para vocês.\n\n📝 **Evento:** ${descInput}\n⏰ **Horário:** ${horaInput}`)
        .setColor("#f1c40f")
        .setThumbnail("https://i.imgur.com/v8tT4vX.png")
        .setFooter({ text: `Anunciado por: ${interaction.user.tag}` })
        .setTimestamp();

      await canalAlvo.send({ content: "@everyone 🔔", embeds: [embedAnuncioEvento] });
      return interaction.reply({ content: `✅ Evento anunciado com sucesso em <#${canalAlvo.id}>!`, ephemeral: true });
    }

    // 2. Processamento do Modal de Nicknames
    if (interaction.customId.startsWith("modal_nick_")) {
      const alvoId = interaction.customId.split("_")[2];
      const novoNick = interaction.fields.getTextInputValue("input_newnick");
      const membroAlvo = await interaction.guild.members.fetch(alvoId).catch(() => null);

      if (!membroAlvo) return interaction.reply({ content: "❌ Membro não encontrado.", ephemeral: true });
      await membroAlvo.setNickname(novoNick)
        .then(() => interaction.reply(`📝 Apelido alterado para: **${novoNick}**.`))
        .catch(() => interaction.reply({ content: "❌ Erro de hierarquia.", ephemeral: true }));
    }
    return;
  }

  // Abertura de canais via Menu Dropdown (Tickets)
  if (interaction.isStringSelectMenu() && interaction.customId === "select_categoria_ticket") {
    const categoriaId = interaction.values[0];
    const prefixo = categoriaId === "Atendimento IA" ? "🤖-ia-" : "🎫-ticket-";
    const nomeCanal = `${prefixo}${interaction.user.username}`;
    
    if (interaction.guild.channels.cache.find(c => c.name === nomeCanal.toLowerCase())) {
      return interaction.reply({ content: "❌ Você já possui um canal aberto.", ephemeral: true });
    }

    const canalTicket = await interaction.guild.channels.create({
      name: nomeCanal,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        { id: interaction.guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
      ]
    });

    const embedTicket = new EmbedBuilder()
      .setTitle(`🎫 CHAMADO — ${categoriaId.toUpperCase()}`)
      .setDescription(categoriaId === "Atendimento IA" ? "🤖 Tire suas dúvidas enviando mensagens aqui!" : "Descreva seu problema enquanto aguarda a Staff!")
      .setColor("#1abc9c");

    await canalTicket.send({ embeds: [embedTicket], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("ticket_fechar_canal").setLabel("Fechar 🔒").setStyle(ButtonStyle.Danger))] });
    return interaction.reply({ content: `✅ Canal criado: <#${canalTicket.id}>`, ephemeral: true });
  }

  if (!interaction.isButton() && !interaction.isUserSelectMenu()) return;

  if (interaction.customId === "ticket_fechar_canal") {
    await interaction.reply("🔒 Fechando em 5 segundos...");
    return setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
  }

  const [categoria, acao, alvoId] = interaction.customId.split("_");

  // NAVEGAÇÃO DO !painel DA STAFF
  if (categoria === "menu" && acao === "chat") {
    const embedChat = new EmbedBuilder().setTitle("💬 CENTRAL DO CHAT").setDescription("Opções e ferramentas para canais de texto:").setColor("#3498db");
    const rowChat = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("chat_lock_").setLabel("Trancar Chat 🔒").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("chat_unlock_").setLabel("Abrir Chat 🔓").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("chat_clear_").setLabel("Limpar Chat 🧹").setStyle(ButtonStyle.Secondary)
    );
    // Adicionado o seu botão de evento na aba de Chat
    const rowEvento = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("chat_evento_").setLabel("Anunciar Evento 🎉").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("menu_voltar_").setLabel("Voltar Menu ↩️").setStyle(ButtonStyle.Primary)
    );
    return await interaction.update({ embeds: [embedChat], components: [rowChat, rowEvento] });
  }

  // CLIQUE NO BOTÃO DE EVENTO (ABRE O FORMULÁRIO/MODAL)
  if (categoria === "chat" && acao === "evento") {
    const modalEvento = new ModalBuilder().setCustomId("modal_sistema_evento").setTitle("🎉 Configurar Novo Evento");

    const inputCanal = new TextInputBuilder().setCustomId("input_ev_canal").setLabel("Em qual canal postar? (Ex: anuncios)").setStyle(TextInputStyle.Short).setRequired(true);
    const inputHora = new TextInputBuilder().setCustomId("input_ev_hora").setLabel("Qual o horário do evento? (Ex: 20:00)").setStyle(TextInputStyle.Short).setRequired(true);
    const inputDesc = new TextInputBuilder().setCustomId("input_ev_desc").setLabel("Qual o evento e detalhes?").setStyle(TextInputStyle.Paragraph).setRequired(true);

    modalEvento.addComponents(
      new ActionRowBuilder().addComponents(inputCanal),
      new ActionRowBuilder().addComponents(inputHora),
      new ActionRowBuilder().addComponents(inputDesc)
    );
    return await interaction.showModal(modalEvento);
  }

  if (categoria === "menu" && acao === "punir") {
    const embedSelect = new EmbedBuilder().setTitle("👤 SELECIONE O MEMBRO").setDescription("Busque o usuário abaixo:").setColor("#e67e22");
    const selectMenu = new UserSelectMenuBuilder().setCustomId("select_user_punir").setPlaceholder("Procure por @...");
    return await interaction.update({ embeds: [embedSelect], components: [new ActionRowBuilder().addComponents(selectMenu), new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("menu_voltar_").setLabel("Voltar ↩️").setStyle(ButtonStyle.Primary))] });
  }

  if (categoria === "menu" && acao === "voltar") {
    const embedMenu = new EmbedBuilder().setTitle("🛡️ CENTRAL DE GERENCIAMENTO").setDescription("Escolha uma das abas administrativas abaixo:").setColor("#2f3136");
    const rowMenu = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("menu_chat_aba").setLabel("Apenas Chat 💬").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("menu_punir_aba").setLabel("Punir Membro 🔨").setStyle(ButtonStyle.Danger)
    );
    return await interaction.update({ embeds: [embedMenu], components: [rowMenu] });
  }

  // Carregar botões de punição após escolher usuário
  if (interaction.isUserSelectMenu() && interaction.customId === "select_user_punir") {
    const selectedId = interaction.values[0];
    const embedPunir = new EmbedBuilder().setTitle("🔨 GERENCIAR MEMBRO").setDescription(`Ações em: <@${selectedId}>`).setColor("#e74c3c");

    const r1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`usr_ban_${selectedId}`).setLabel("Banir 🔨").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`usr_kick_${selectedId}`).setLabel("Expulsar 🦶").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`usr_unban_${selectedId}`).setLabel("Desbanir 🔓").setStyle(ButtonStyle.Success)
    );
    const r2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`usr_mute_${selectedId}`).setLabel("Mutar 🔇").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`usr_unmute_${selectedId}`).setLabel("Desmutar 🔊").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`usr_purge_${selectedId}`).setLabel("Limpar Mensagens 🧹").setStyle(ButtonStyle.Secondary)
    );
    const r3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`usr_nick_${selectedId}`).setLabel("Trocar Apelido 📝").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`usr_info_${selectedId}`).setLabel("Ver Info ℹ️").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("menu_voltar_").setLabel("Voltar Menu ↩️").setStyle(ButtonStyle.Primary)
    );
    return await interaction.update({ embeds: [embedPunir], components: [r1, r2, r3] });
  }

  // Execuções do Chat (Lock/Unlock/Clear)
  if (categoria === "chat" && acao === "lock") {
    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
    return interaction.reply("🔒 Canal trancado.");
  }
  if (categoria === "chat" && acao === "unlock") {
    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
    return interaction.reply("🔓 Canal aberto.");
  }
  if (categoria === "chat" && acao === "clear") {
    const msgs = await interaction.channel.messages.fetch({ limit: 50 });
    await interaction.channel.bulkDelete(msgs, true);
    return interaction.reply({ content: "🧹 Mensagens limpas.", ephemeral: true });
  }

  // Execuções de Membros
  const membroAlvo = alvoId ? await interaction.guild.members.fetch(alvoId).catch(() => null) : null;

  if (categoria === "usr" && acao === "ban") {
    await interaction.guild.bans.create(alvoId).then(() => interaction.reply("🔨 Banido.")).catch(() => interaction.reply("❌ Erro ao banir."));
  }
  if (categoria === "usr" && acao === "kick" && membroAlvo) {
    await membroAlvo.kick().then(() => interaction.reply("🦶 Expulso."));
  }
  if (categoria === "usr" && acao === "mute" && membroAlvo) {
    await membroAlvo.timeout(60 * 60 * 1000).then(() => interaction.reply("🔇 Mutado por 1 hora."));
  }
  if (categoria === "usr" && acao === "unmute" && membroAlvo) {
    await membroAlvo.timeout(null).then(() => interaction.reply("🔊 Desmutado."));
  }
  if (categoria === "usr" && acao === "purge") {
    const m = await interaction.channel.messages.fetch({ limit: 100 });
    await interaction.channel.bulkDelete(m.filter(msg => msg.author.id === alvoId), true);
    return interaction.reply({ content: "🧹 Mensagens limpas.", ephemeral: true });
  }
  if (categoria === "usr" && acao === "info" && membroAlvo) {
    return interaction.reply({ embeds: [new EmbedBuilder().setTitle("📋 Info").setDescription(`**Tag:** ${membroAlvo.user.tag}`)], ephemeral: true });
  }
  if (categoria === "usr" && acao === "nick") {
    const modalNick = new ModalBuilder().setCustomId(`modal_nick_${alvoId}`).setTitle("Mudar Apelido");
    modalNick.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("input_newnick").setLabel("Qual o novo apelido?").setStyle(TextInputStyle.Short).setRequired(true)));
    return await interaction.showModal(modalNick);
  }
});

client.login(process.env.TOKEN);
