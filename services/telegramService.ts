export const sendTelegramMessage = async (botToken: string, chatId: string, text: string) => {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to send message');
  }
  return response.json();
};

export const sendTelegramDocument = async (botToken: string, chatId: string, file: Blob, filename: string) => {
  const url = `https://api.telegram.org/bot${botToken}/sendDocument`;
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('document', file, filename);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to send document');
  }
  return response.json();
};

export const downloadTelegramDocument = async (botToken: string, fileId: string) => {
  // First get the file path
  const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;
  const fileRes = await fetch(getFileUrl);
  if (!fileRes.ok) throw new Error('Failed to get file path');
  
  const fileData = await fileRes.json();
  if (!fileData.ok) throw new Error('Failed to get file path from Telegram');
  
  const filePath = fileData.result.file_path;
  
  // Then download the file
  const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
  const downloadRes = await fetch(downloadUrl);
  if (!downloadRes.ok) throw new Error('Failed to download file');
  
  return downloadRes.text();
};
