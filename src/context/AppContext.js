import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext(null);

export const varsayilanKategoriler = [
  { id: '1', ad: 'Market',    simge: '🛒', renk: '#4CAF50' },
  { id: '2', ad: 'Faturalar', simge: '💡', renk: '#FF9800' },
  { id: '3', ad: 'Ulaşım',    simge: '🚗', renk: '#2196F3' },
  { id: '4', ad: 'Sağlık',    simge: '💊', renk: '#F44336' },
  { id: '5', ad: 'Eğlence',   simge: '🎬', renk: '#9C27B0' },
  { id: '6', ad: 'Eğitim',    simge: '📚', renk: '#00BCD4' },
  { id: '7', ad: 'Yemek',     simge: '🍔', renk: '#FF5722' },
  { id: '8', ad: 'Diğer',     simge: '📦', renk: '#607D8B' },
];

export function AppProvider({ children }) {
  const simdi = new Date();
  const [islemler, setIslemler]       = useState([]);
  const [kategoriler, setKategoriler] = useState(varsayilanKategoriler);
  const [butceLimiti, setButceLimiti] = useState(0);
  const [yukleniyor, setYukleniyor]   = useState(true);
  const [aktifYil, setAktifYil]       = useState(simdi.getFullYear());
  const [aktifAy, setAktifAy]         = useState(simdi.getMonth());

  useEffect(() => { veriYukle(); }, []);

  async function veriYukle() {
    try {
      const [islemVerisi, kategoriVerisi, butceVerisi] = await Promise.all([
        AsyncStorage.getItem('@islemler'),
        AsyncStorage.getItem('@kategoriler'),
        AsyncStorage.getItem('@butce_limiti'),
      ]);
      if (islemVerisi)    setIslemler(JSON.parse(islemVerisi));
      if (kategoriVerisi) setKategoriler(JSON.parse(kategoriVerisi));
      if (butceVerisi)    setButceLimiti(JSON.parse(butceVerisi));
    } catch (e) {
      console.warn('Veri yükleme hatası:', e);
    } finally {
      setYukleniyor(false);
    }
  }

  async function islemEkle(islem) {
    const yeniIslem = { ...islem, id: Date.now().toString(), tarih: islem.tarih || new Date().toISOString() };
    const yeniListe = [yeniIslem, ...islemler];
    setIslemler(yeniListe);
    try { await AsyncStorage.setItem('@islemler', JSON.stringify(yeniListe)); } catch (e) { console.warn(e); }
    return yeniIslem;
  }

  async function islemSil(id) {
    const yeniListe = islemler.filter(i => i.id !== id);
    setIslemler(yeniListe);
    try { await AsyncStorage.setItem('@islemler', JSON.stringify(yeniListe)); } catch (e) { console.warn(e); }
  }

  async function islemGuncelle(id, guncelVeri) {
    const yeniListe = islemler.map(i => (i.id === id ? { ...i, ...guncelVeri } : i));
    setIslemler(yeniListe);
    try { await AsyncStorage.setItem('@islemler', JSON.stringify(yeniListe)); } catch (e) { console.warn(e); }
  }

  async function kategoriEkle(kategori) {
    const yeniKategori = { ...kategori, id: Date.now().toString() };
    const yeniListe = [...kategoriler, yeniKategori];
    setKategoriler(yeniListe);
    try { await AsyncStorage.setItem('@kategoriler', JSON.stringify(yeniListe)); } catch (e) { console.warn(e); }
    return yeniKategori;
  }

  async function kategoriSil(id) {
    const yeniListe = kategoriler.filter(k => k.id !== id);
    setKategoriler(yeniListe);
    try { await AsyncStorage.setItem('@kategoriler', JSON.stringify(yeniListe)); } catch (e) { console.warn(e); }
  }

  async function butceLimitiGuncelle(yeniLimit) {
    const limit = parseFloat(yeniLimit) || 0;
    setButceLimiti(limit);
    try { await AsyncStorage.setItem('@butce_limiti', JSON.stringify(limit)); } catch (e) { console.warn(e); }
  }

  async function tumVerileriSifirla() {
    setIslemler([]); setKategoriler(varsayilanKategoriler); setButceLimiti(0);
    try {
      await AsyncStorage.multiRemove(['@islemler', '@butce_limiti']);
      await AsyncStorage.setItem('@kategoriler', JSON.stringify(varsayilanKategoriler));
    } catch (e) { console.warn(e); }
  }

  function aylikOzet(yil, ay) {
    const filtrelenmis = islemler.filter(i => {
      const t = new Date(i.tarih);
      return t.getFullYear() === yil && t.getMonth() === ay;
    });
    const sirali = [...filtrelenmis].sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
    const gelir = filtrelenmis.filter(i => i.tur === 'gelir').reduce((t, i) => t + i.miktar, 0);
    const gider = filtrelenmis.filter(i => i.tur === 'gider').reduce((t, i) => t + i.miktar, 0);
    return { gelir, gider, net: gelir - gider, islemler: sirali };
  }

  function kategoriHarcamalar(yil, ay) {
    const { islemler: ayIslemleri } = aylikOzet(yil, ay);
    const sonuc = {};
    ayIslemleri.filter(i => i.tur === 'gider').forEach(i => {
      sonuc[i.kategoriId] = (sonuc[i.kategoriId] || 0) + i.miktar;
    });
    return sonuc;
  }

  return (
    <AppContext.Provider value={{
      islemler, setIslemler, kategoriler, setKategoriler, yukleniyor, butceLimiti,
      islemEkle, islemSil, islemGuncelle, kategoriEkle, kategoriSil,
      butceLimitiGuncelle, tumVerileriSifirla, aylikOzet, kategoriHarcamalar,
      aktifYil, aktifAy, setAktifYil, setAktifAy,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}