
const CLOUD_NAME = 'dacyy7rkn';
const API_KEY = '125966994992589';
const API_SECRET = 'BEu4GRBNsWAminLqFhHJfXh_t04';

export const uploadToCloudinary = async (base64Data: string): Promise<string> => {
  // 1. Prepare Timestamp
  const timestamp = Math.floor(Date.now() / 1000);
  
  // 2. Generate Signature
  // Signature is a SHA-1 hash of "timestamp=12345...<api_secret>"
  const strToSign = `timestamp=${timestamp}${API_SECRET}`;
  const msgBuffer = new TextEncoder().encode(strToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // 3. Prepare Form Data
  const formData = new FormData();
  formData.append('file', base64Data);
  formData.append('api_key', API_KEY);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);

  // 4. Upload
  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Cloudinary upload failed');
  }

  const data = await response.json();
  return data.secure_url; // Returns https://res.cloudinary.com/...
};
