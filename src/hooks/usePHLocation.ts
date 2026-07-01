import { useState, useEffect } from 'react';

export interface LocationItem {
  code: string;
  name: string;
}

export function usePHLocation() {
  const [regions, setRegions] = useState<LocationItem[]>([]);
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [cities, setCities] = useState<LocationItem[]>([]);
  const [barangays, setBarangays] = useState<LocationItem[]>([]);

  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedBarangay, setSelectedBarangay] = useState<string>('');

  const [loading, setLoading] = useState(false);

  // Fetch Regions on mount
  useEffect(() => {
    fetch('https://psgc.gitlab.io/api/regions/')
      .then(res => res.json())
      .then(data => {
        // Sort regions alphabetically
        data.sort((a: any, b: any) => a.name.localeCompare(b.name));
        setRegions(data);
      })
      .catch(err => console.error('Error fetching regions', err));
  }, []);

  // Fetch Provinces/Cities when Region changes
  useEffect(() => {
    setSelectedProvince('');
    setSelectedCity('');
    setSelectedBarangay('');
    setProvinces([]);
    setCities([]);
    setBarangays([]);

    if (selectedRegion) {
      setLoading(true);
      // If NCR (National Capital Region), it has no provinces, only cities
      if (selectedRegion === '130000000') {
        fetch(`https://psgc.gitlab.io/api/regions/${selectedRegion}/cities-municipalities/`)
          .then(res => res.json())
          .then(data => {
            data.sort((a: any, b: any) => a.name.localeCompare(b.name));
            setCities(data);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      } else {
        // Fetch Provinces for the region
        fetch(`https://psgc.gitlab.io/api/regions/${selectedRegion}/provinces/`)
          .then(res => res.json())
          .then(data => {
            data.sort((a: any, b: any) => a.name.localeCompare(b.name));
            setProvinces(data);
            setLoading(false);
          })
          .catch(() => setLoading(false));
      }
    }
  }, [selectedRegion]);

  // Fetch Cities when Province changes
  useEffect(() => {
    setSelectedCity('');
    setSelectedBarangay('');
    setCities([]);
    setBarangays([]);

    if (selectedProvince) {
      setLoading(true);
      fetch(`https://psgc.gitlab.io/api/provinces/${selectedProvince}/cities-municipalities/`)
        .then(res => res.json())
        .then(data => {
          data.sort((a: any, b: any) => a.name.localeCompare(b.name));
          setCities(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [selectedProvince]);

  // Fetch Barangays when City changes
  useEffect(() => {
    setSelectedBarangay('');
    setBarangays([]);

    if (selectedCity) {
      setLoading(true);
      fetch(`https://psgc.gitlab.io/api/cities-municipalities/${selectedCity}/barangays/`)
        .then(res => res.json())
        .then(data => {
          data.sort((a: any, b: any) => a.name.localeCompare(b.name));
          setBarangays(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [selectedCity]);

  return {
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
  };
}
