import React, { useEffect, useState } from 'react';
import { usePHLocation, type LocationItem } from '../../hooks/usePHLocation';

interface AddressData {
  street: string;
  region: LocationItem | null;
  province: LocationItem | null;
  city: LocationItem | null;
  barangay: LocationItem | null;
  postalCode: string;
}

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const AddressInput: React.FC<AddressInputProps> = ({ value, onChange }) => {
  const {
    regions,
    provinces,
    cities,
    barangays,
    selectedRegion,
    setSelectedRegion,
    selectedProvince,
    setSelectedProvince,
    selectedCity,
    setSelectedCity,
    selectedBarangay,
    setSelectedBarangay,
    loading
  } = usePHLocation();

  const [address, setAddress] = useState<AddressData>({
    street: '',
    region: null,
    province: null,
    city: null,
    barangay: null,
    postalCode: ''
  });

  // Initialize from value prop
  useEffect(() => {
    if (!value) return;
    try {
      const parsed = JSON.parse(value);
      if (parsed.region && parsed.region.code) {
        setAddress(parsed);
        if (parsed.region?.code) setSelectedRegion(parsed.region.code);
        if (parsed.province?.code) setSelectedProvince(parsed.province.code);
        if (parsed.city?.code) setSelectedCity(parsed.city.code);
        if (parsed.barangay?.code) setSelectedBarangay(parsed.barangay.code);
        return;
      }
    } catch (e) {
      // Not JSON, just treat as street
      setAddress(prev => ({ ...prev, street: value }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync back to onChange
  useEffect(() => {
    // Determine if we have structural data or just a street
    if (address.region) {
      onChange(JSON.stringify(address));
    } else if (address.street) {
      onChange(address.street); // fallback if no region selected
    } else {
      onChange('');
    }
  }, [address, onChange]);

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const region = regions.find(r => r.code === code) || null;
    setSelectedRegion(code);
    setAddress(prev => ({ ...prev, region, province: null, city: null, barangay: null }));
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const province = provinces.find(p => p.code === code) || null;
    setSelectedProvince(code);
    setAddress(prev => ({ ...prev, province, city: null, barangay: null }));
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const city = cities.find(c => c.code === code) || null;
    setSelectedCity(code);
    setAddress(prev => ({ ...prev, city, barangay: null }));
  };

  const handleBarangayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const barangay = barangays.find(b => b.code === code) || null;
    setSelectedBarangay(code);
    setAddress(prev => ({ ...prev, barangay }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Region</label>
          <select
            value={selectedRegion}
            onChange={handleRegionChange}
            className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <option value="">Select Region</option>
            {regions.map(r => (
              <option key={r.code} value={r.code}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* Show Province if not NCR */}
        {selectedRegion && selectedRegion !== '130000000' && (
          <div>
            <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Province</label>
            <select
              value={selectedProvince}
              onChange={handleProvinceChange}
              disabled={loading || provinces.length === 0}
              className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream focus:outline-none focus:ring-2 focus:ring-gold disabled:opacity-50"
            >
              <option value="">Select Province</option>
              {provinces.map(p => (
                <option key={p.code} value={p.code}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">City / Municipality</label>
          <select
            value={selectedCity}
            onChange={handleCityChange}
            disabled={loading || cities.length === 0}
            className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream focus:outline-none focus:ring-2 focus:ring-gold disabled:opacity-50"
          >
            <option value="">Select City / Municipality</option>
            {cities.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Barangay</label>
          <select
            value={selectedBarangay}
            onChange={handleBarangayChange}
            disabled={loading || barangays.length === 0}
            className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream focus:outline-none focus:ring-2 focus:ring-gold disabled:opacity-50"
          >
            <option value="">Select Barangay</option>
            {barangays.map(b => (
              <option key={b.code} value={b.code}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3">
          <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">House/Unit/Blk, Street, Subdivision</label>
          <input
            type="text"
            value={address.street}
            onChange={(e) => setAddress(prev => ({ ...prev, street: e.target.value }))}
            placeholder="e.g. 123 Main St., Brgy. San Jose"
            className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-teal/70 dark:text-cream/70 uppercase tracking-wider mb-1.5">Postal Code</label>
          <input
            type="text"
            value={address.postalCode}
            onChange={(e) => setAddress(prev => ({ ...prev, postalCode: e.target.value }))}
            placeholder="e.g. 1440"
            className="w-full px-4 py-2.5 rounded-xl border border-cream-dark dark:border-teal-light bg-cream/40 dark:bg-[#003946] text-teal dark:text-cream focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
      </div>
    </div>
  );
};
