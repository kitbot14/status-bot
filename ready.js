const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

module.exports = (client) => {
  client.once('ready', () => {
    console.log('Client prêt !');

    // Définir le statut du bot en mode "streaming"
    try {
      client.user.setPresence({
        activities: [
          {
            name: 'status de ton bot',
            type: ActivityType.Streaming, // Utiliser ActivityType.Streaming pour v14
            url: 'https://twitch.tv/kityt69' // Remplace par une URL de streaming
          }
        ],
        status: 'online' // Peut être 'online', 'idle', 'dnd', 'invisible'
      });

      console.log('Statut de streaming défini !');
    } catch (error) {
      console.error('Erreur lors de la définition du statut de streaming:', error);
    }
  });
};
