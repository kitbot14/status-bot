const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const ready = require('./ready'); // Importer le module ready.js

// Lire les configurations depuis config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMembers
  ]
});

const bots = config.bots; // Liste des bots avec leurs IDs et noms
const channelId = config.channelId;
const guildId = config.guildId;
const token = config.token;

let statusMessage;

// Fonction pour générer le format de timestamp Discord
function getDiscordTimestamp() {
  return `<t:${Math.floor(Date.now() / 1000)}:R>`; // Timestamp Unix actuel
}

// Emoji pour les différents états
const emojis = {
  online: '<:ON:1276254078841786439>',
  offline: '<:OFF:1276254076698361896>',
  notFound: '<:NONTROUVER:1276254113134547107>'
};

// Charger le module ready.js
ready(client);

client.once('ready', () => {
  const channel = client.channels.cache.get(channelId);
  if (!channel) {
    console.error('Salon non trouvé');
    return;
  }

  // Fonction pour vérifier le statut des bots et mettre à jour le message
  async function checkBotsStatus() {
    try {
      const guild = client.guilds.cache.get(guildId); // Utiliser l'ID du serveur
      if (!guild) {
        console.error('Serveur non trouvé');
        return;
      }

      const members = await guild.members.fetch();

      // Créer la description combinée pour tous les bots
      let description = '';

      bots.forEach(bot => {
        const botMember = members.get(bot.id);
        const status = botMember ? (botMember.presence ? botMember.presence.status : 'offline') : 'offline';

        description += `**Nom du Bot**: ${bot.name}\n`;
        description += `**ID du Bot**: ${bot.id}\n`;
        description += `**Statut**: ${status === 'online' ? `${emojis.online} En ligne` : `${emojis.offline} Hors ligne`}\n`;
        description += '\n';
      });

      // Créer l'embed avec tous les statuts
      const statusEmbed = new EmbedBuilder()
        .setTitle('Statut des Bots')
        .setDescription(description)
        .addFields(
          { name: 'Dernière mise à jour', value: getDiscordTimestamp() } // Met à jour le timestamp
        )
        .setColor('Blue'); // Choisis une couleur qui te convient

      // Créer un bouton avec un lien
      const button = new ButtonBuilder()
        .setLabel('My Code Here')
        .setStyle(ButtonStyle.Link)
        .setURL('https://github.com/kitbot14/status-bot');

      // Créer une ligne d'action pour le bouton
      const row = new ActionRowBuilder().addComponents(button);

      // Mettre à jour ou envoyer le message
      if (statusMessage) {
        await statusMessage.edit({ embeds: [statusEmbed], components: [row] });
      } else {
        statusMessage = await channel.send({ embeds: [statusEmbed], components: [row] });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut des bots:', error);
    }
  }

  // Vérifie le statut toutes les 60 secondes
  setInterval(checkBotsStatus, 60000);

  // Effectue une première vérification dès que le bot est prêt
  checkBotsStatus();
});

client.login(token);
