export function formatAddress(locStr?: string | null): string {
  if (!locStr) return '—';
  
  try {
    const data = JSON.parse(locStr);
    
    // Check if it matches our AddressData structure
    if (data && typeof data === 'object' && (data.region || data.street)) {
      const parts = [
        data.street,
        data.barangay?.name,
        data.city?.name,
        data.province?.name,
        data.postalCode
      ].filter(Boolean); // removes null/undefined/empty string
      
      // We usually don't include the region name in standard PH addresses if we have province/city,
      // but we can append it if needed. Standard PH address is usually up to City/Province + Postal.
      return parts.length > 0 ? parts.join(', ') : '—';
    }
  } catch (e) {
    // If it's not JSON, it's a legacy plain text string
  }
  
  return locStr;
}
