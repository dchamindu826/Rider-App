// plugins/withAndroidNotificationSound.js
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withAndroidNotificationSound(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const androidResDir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/res/raw'
      );

      // 'raw' folder eka hadanawa nathnam
      if (!fs.existsSync(androidResDir)) {
        fs.mkdirSync(androidResDir, { recursive: true });
      }

      // Assets folder eken sound eka android folder ekata copy karanawa
      const source = path.join(config.modRequest.projectRoot, 'assets/notification.mp3');
      const destination = path.join(androidResDir, 'notification.mp3');

      fs.copyFileSync(source, destination);
      return config;
    },
  ]);
};