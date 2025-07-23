
// Fixed namespace UUID for consistent generation
const NAMESPACE_UUID = '1b671a64-40d5-491e-99b0-da01ff1f3341';

export const generateConsistentUUID = (userId: string): string => {
  try {
    // Create a deterministic UUID from Clerk user ID
    const input = userId + NAMESPACE_UUID;
    let hash1 = 0, hash2 = 0;
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash1 = ((hash1 << 5) - hash1) + char;
      hash1 = hash1 & hash1; // Convert to 32-bit integer
      hash2 = ((hash2 << 3) - hash2) + char + i;
      hash2 = hash2 & hash2;
    }
    
    // Create valid UUID v4 format
    const hex1 = Math.abs(hash1).toString(16).padStart(8, '0').slice(0, 8);
    const hex2 = Math.abs(hash2).toString(16).padStart(8, '0').slice(0, 8);
    
    // Format as valid UUID v4
    const uuid = `${hex1.slice(0, 8)}-${hex1.slice(4, 8)}-4${hex2.slice(1, 4)}-a${hex2.slice(4, 7)}-${hex2}${hex1.slice(0, 4)}`;
    
    console.log('Generated UUID for user', userId, ':', uuid);
    return uuid;
  } catch (error) {
    console.error("Error generating consistent UUID:", error);
    // Fallback to a valid random UUID
    return '12345678-1234-4234-a234-123456789012';
  }
};

export const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};
