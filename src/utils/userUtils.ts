
import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

// Fixed namespace UUID for consistent generation
const NAMESPACE_UUID = '1b671a64-40d5-491e-99b0-da01ff1f3341';

export const generateConsistentUUID = (userId: string): string => {
  try {
    // Generate a consistent UUID v5 based on the user ID
    return uuidv5(userId, NAMESPACE_UUID);
  } catch (error) {
    console.error("Error generating consistent UUID:", error);
    // Fallback to a new random UUID
    return uuidv4();
  }
};

export const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};
