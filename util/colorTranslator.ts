/**
 * Translates color names to different languages
 */

export const translateColor = (colorName: string, language: string): string => {
  const normalizedColor = colorName.toLowerCase().trim();
  
  // Define color translations
  const colorTranslations: { [key: string]: { [key: string]: string } } = {
    red: {
      "en-US": "red",
      "es-ES": "rojo",
      "fr-FR": "rouge",
      "de-DE": "rot",
      "it-IT": "rosso",
      "pt-BR": "vermelho",
      "ja-JP": "赤",
      "zh-CN": "红色",
    },
    blue: {
      "en-US": "blue",
      "es-ES": "azul",
      "fr-FR": "bleu",
      "de-DE": "blau",
      "it-IT": "blu",
      "pt-BR": "azul",
      "ja-JP": "青",
      "zh-CN": "蓝色",
    },
    green: {
      "en-US": "green",
      "es-ES": "verde",
      "fr-FR": "vert",
      "de-DE": "grün",
      "it-IT": "verde",
      "pt-BR": "verde",
      "ja-JP": "緑",
      "zh-CN": "绿色",
    },
    yellow: {
      "en-US": "yellow",
      "es-ES": "amarillo",
      "fr-FR": "jaune",
      "de-DE": "gelb",
      "it-IT": "giallo",
      "pt-BR": "amarelo",
      "ja-JP": "黄色",
      "zh-CN": "黄色",
    },
    orange: {
      "en-US": "orange",
      "es-ES": "naranja",
      "fr-FR": "orange",
      "de-DE": "orange",
      "it-IT": "arancione",
      "pt-BR": "laranja",
      "ja-JP": "オレンジ",
      "zh-CN": "橙色",
    },
    purple: {
      "en-US": "purple",
      "es-ES": "morado",
      "fr-FR": "violet",
      "de-DE": "lila",
      "it-IT": "viola",
      "pt-BR": "roxo",
      "ja-JP": "紫",
      "zh-CN": "紫色",
    },
    pink: {
      "en-US": "pink",
      "es-ES": "rosa",
      "fr-FR": "rose",
      "de-DE": "rosa",
      "it-IT": "rosa",
      "pt-BR": "rosa",
      "ja-JP": "ピンク",
      "zh-CN": "粉色",
    },
    brown: {
      "en-US": "brown",
      "es-ES": "marrón",
      "fr-FR": "marron",
      "de-DE": "braun",
      "it-IT": "marrone",
      "pt-BR": "marrom",
      "ja-JP": "茶色",
      "zh-CN": "棕色",
    },
    black: {
      "en-US": "black",
      "es-ES": "negro",
      "fr-FR": "noir",
      "de-DE": "schwarz",
      "it-IT": "nero",
      "pt-BR": "preto",
      "ja-JP": "黒",
      "zh-CN": "黑色",
    },
    white: {
      "en-US": "white",
      "es-ES": "blanco",
      "fr-FR": "blanc",
      "de-DE": "weiß",
      "it-IT": "bianco",
      "pt-BR": "branco",
      "ja-JP": "白",
      "zh-CN": "白色",
    },
    gray: {
      "en-US": "gray",
      "es-ES": "gris",
      "fr-FR": "gris",
      "de-DE": "grau",
      "it-IT": "grigio",
      "pt-BR": "cinza",
      "ja-JP": "灰色",
      "zh-CN": "灰色",
    },
    grey: {
      "en-US": "grey",
      "es-ES": "gris",
      "fr-FR": "gris",
      "de-DE": "grau",
      "it-IT": "grigio",
      "pt-BR": "cinza",
      "ja-JP": "灰色",
      "zh-CN": "灰色",
    },
  };

  // Handle color variations with modifiers (e.g., "dark red", "light blue")
  const modifers: { [key: string]: { [key: string]: string } } = {
    dark: {
      "en-US": "dark",
      "es-ES": "oscuro",
      "fr-FR": "foncé",
      "de-DE": "dunkel",
      "it-IT": "scuro",
      "pt-BR": "escuro",
      "ja-JP": "濃い",
      "zh-CN": "深",
    },
    light: {
      "en-US": "light",
      "es-ES": "claro",
      "fr-FR": "clair",
      "de-DE": "hell",
      "it-IT": "chiaro",
      "pt-BR": "claro",
      "ja-JP": "薄い",
      "zh-CN": "浅",
    },
  };

  // Check for modifiers and translate them
  for (const [modifier, translations] of Object.entries(modifers)) {
    if (normalizedColor.includes(modifier)) {
      const baseColor = normalizedColor.replace(modifier, "").trim();
      const translatedModifier = translations[language] || modifier;
      const translatedBase = colorTranslations[baseColor]?.[language] || baseColor;
      return `${translatedModifier} ${translatedBase}`;
    }
  }

  if (colorTranslations[normalizedColor] && colorTranslations[normalizedColor][language]) {
    return colorTranslations[normalizedColor][language];
  }
  
  // If not found, return the original color name
  return colorName;
};

