import { world, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

// Evento que detecta quando qualquer jogador usa um item
world.beforeEvents.itemUse.subscribe((event) => {
    const player = event.source;
    const item = event.itemStack;

    // Verifica se o item que o jogador usou é uma bússola
    if (item.typeId === "minecraft:compass") {
        
        // Sistema precisa rodar no próximo tique para abrir a interface (FormUI) com segurança
        system.run(() => {
            
            // 1. VERIFICAÇÃO DE ADMIN (Se o jogador tem a tag 'solitário')
            if (player.hasTag("solitário")) {
                const menuAdmin = new ActionFormData();
                
                menuAdmin.title("§l§dAPOLLO — Painel Admin");
                menuAdmin.body("Olá Admin " + player.name + "!\nPainel de controle do servidor.");
                
                // Botões exclusivos do Administrador
                menuAdmin.button("§l§d[•] WARPS", "textures/items/compass"); 
                menuAdmin.button("§l§c[•] LIMPAR LAG (Admin)", "textures/items/blaze_rod"); 
                menuAdmin.button("§l§e[•] MUDAR PARA CRIATIVO", "textures/items/feather");

                menuAdmin.show(player).then((response) => {
                    if (response.canceled) return;
                    
                    switch (response.selection) {
                        case 0:
                            player.runCommandAsync("tp @s 100 64 100"); 
                            player.sendMessage("§a[Apollo] Teleportado para a área de Warps!");
                            break;
                        case 1:
                            player.runCommandAsync("kill @e[type=item]"); 
                            player.sendMessage("§c[ClearLag] Todos os itens do chão foram limpos!");
                            break;
                        case 2:
                            player.runCommandAsync("gamemode c @s");
                            player.sendMessage("§e[Apollo] Seu modo de jogo foi alterado para Criativo.");
                            break;
                    }
                });
            } 
            
            // 2. VERIFICAÇÃO DE MEMBRO (Se o jogador NÃO tem a tag 'solitário')
            else {
                const menuMembro = new ActionFormData();
                
                menuMembro.title("§l§bAPOLLO — Menu do Jogador");
                menuMembro.body("Olá " + player.name + ", bem-vindo ao servidor!\nSelecione uma opção abaixo:");

                // Botões públicos para todos os jogadores comuns
                menuMembro.button("§l§1[•] IR PARA AS WARPS", "textures/items/compass"); 
                menuMembro.button("§l§e[•] MINHAS HOMES", "textures/items/bed"); 
                menuMembro.button("§l§b[•] RTP (Teleporte Aleatório)", "textures/items/ender_pearl"); 
                menuMembro.button("§l§6[•] MERCADO / LOJA", "textures/items/paper"); 

                menuMembro.show(player).then((response) => {
                    if (response.canceled) return;
                    
                    switch (response.selection) {
                        case 0:
                            player.runCommandAsync("tp @s 100 64 100"); 
                            player.sendMessage("§a[Apollo] Teleportado para a área de Warps!");
                            break;
                        case 1:
                            player.sendMessage("§e[Apollo] Esta função (Homes) está sendo configurada!");
                            break;
                        case 2:
                            player.runCommandAsync("spreadplayers ~ ~ 50 500 @s"); 
                            player.sendMessage("§b[Apollo] Você foi teleportado para um lugar aleatório!");
                            break;
                        case 3:
                            player.sendMessage("§6[Apollo] Abrindo mercado de economia...");
                            break;
                    }
                });
            }
            
        });
    }
});
