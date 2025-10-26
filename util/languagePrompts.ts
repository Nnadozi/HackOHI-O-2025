/**
 * Language-specific prompts for OpenAI vision API
 */

export const languagePrompts: { [key: string]: string } = {
  "en-US":
    "What is the main object in this image? Respond with ONLY a single word - the name of the object. Or multiple words if the object is not a single word. No more than 4 words. Respond in English.",
  "es-ES":
    "¿Cuál es el objeto principal en esta imagen? Responde con UNA SOLA palabra - el nombre del objeto. O varias palabras si el objeto no es una sola palabra. No más de 4 palabras. Responde en español.",
  "fr-FR":
    "Quel est l'objet principal dans cette image? Répondez avec UN SEUL mot - le nom de l'objet. Ou plusieurs mots si l'objet n'est pas un seul mot. Pas plus de 4 mots. Répondez en français.",
  "de-DE":
    "Was ist das Hauptobjekt in diesem Bild? Antworten Sie mit NUR EINEM Wort - dem Namen des Objekts. Oder mehrere Wörter, wenn das Objekt kein einzelnes Wort ist. Nicht mehr als 4 Wörter. Antworten Sie auf Deutsch.",
  "it-IT":
    "Qual è l'oggetto principale in questa immagine? Rispondi con UNA SOLA parola - il nome dell'oggetto. O più parole se l'oggetto non è una sola parola. Non più di 4 parole. Rispondi in italiano.",
  "pt-BR":
    "Qual é o objeto principal nesta imagem? Responda com UMA ÚNICA palavra - o nome do objeto. Ou várias palavras se o objeto não for uma única palavra. Não mais que 4 palavras. Responda em português.",
  "ja-JP":
    "この画像の主な物体は何ですか？単一の単語でのみ回答してください - 物体の名前。物体が単一の単語でない場合は複数の単語。4語以内。日本語で回答してください。",
  "zh-CN":
    "这张图片中的主要对象是什么？只用一个词回答 - 对象的名称。如果对象不是一个词，则使用多个词。不超过4个词。用中文回答。",
};

export const getPromptForLanguage = (language: string): string => {
  return languagePrompts[language] || languagePrompts["en-US"];
};

