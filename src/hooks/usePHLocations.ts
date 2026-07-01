import { useState, useEffect } from 'react';

export interface Region {
  id: number;
  psgc_code: string;
  region_name: string;
  region_code: string;
}

export interface Province {
  id: number;
  psgc_code: string;
  province_name: string;
  province_code: string;
  region_code: string;
}

export interface City {
  id: number;
  psgc_code: string;
  city_name: string;
  city_code: string;
  province_code: string;
  region_code: string;
}

export interface Barangay {
  id: number;
  brgy_code: string;
  brgy_name: string;
  city_code: string;
  province_code: string;
  region_code: string;
}

const BASE_URL = 'https://raw.githubusercontent.com/isaacdarcilla/philippine-addresses/main';

export const usePHLocations = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRegions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/region.json`);
        if (!res.ok) throw new Error('Failed to fetch regions');
        const data = await res.json();
        setRegions(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRegions();
  }, []);

  const getProvincesByRegion = async (regionCode: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/province.json`);
      if (!res.ok) throw new Error('Failed to fetch provinces');
      const data: Province[] = await res.json();
      const filtered = data.filter(p => p.region_code === regionCode);
      setProvinces(filtered);
      setCities([]);
      setBarangays([]);
      return filtered;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getCitiesByProvince = async (provinceCode: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/city.json`);
      if (!res.ok) throw new Error('Failed to fetch cities');
      const data: City[] = await res.json();
      const filtered = data.filter(c => c.province_code === provinceCode);
      setCities(filtered);
      setBarangays([]);
      return filtered;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getBarangaysByCity = async (cityCode: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/barangay.json`);
      if (!res.ok) throw new Error('Failed to fetch barangays');
      const data: Barangay[] = await res.json();
      const filtered = data.filter(b => b.city_code === cityCode);
      setBarangays(filtered);
      return filtered;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    regions,
    provinces,
    cities,
    barangays,
    loading,
    error,
    getProvincesByRegion,
    getCitiesByProvince,
    getBarangaysByCity,
  };
};
