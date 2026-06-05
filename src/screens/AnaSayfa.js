import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import AySecici from '../components/AySecici';

export default function AnaSayfa({ navigation }) {
  const { butceLimiti, aylikOzet, kategoriler, aktifYil, aktifAy } = useApp();
  const [aramaMetni, setAramaMetni] = useState('');
  const [filtre, setFiltre]         = useState('tumu');

  const ozet = aylikOzet(aktifYil, aktifAy);
  const butceYuzde = butceLimiti > 0 ? (ozet.gider / butceLimiti) * 100 : 0;
  const asimVarMi  = butceLimiti > 0 && ozet.gider > butceLimiti;

  const filtrelenmisIslemler = useMemo(() => {
    return ozet.islemler.filter(islem => {
      const kat = kategoriler.find(k => k.id === islem.kategoriId);
      const aramaKabul =
        aramaMetni === '' ||
        (kat && kat.ad.toLowerCase().includes(aramaMetni.toLowerCase())) ||
        (islem.aciklama && islem.aciklama.toLowerCase().includes(aramaMetni.toLowerCase()));
      const turKabul = filtre === 'tumu' || islem.tur === filtre;
      return aramaKabul && turKabul;
    });
  }, [ozet.islemler, aramaMetni, filtre, kategoriler]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <AySecici />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ÖZET KARTLARI */}
          <View style={styles.ozetContainer}>
            <View style={[styles.kart, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.kartIcon}>📥</Text>
              <Text style={styles.kartBaslik}>Gelir</Text>
              <Text style={styles.kartMiktar}>₺{ozet.gelir.toFixed(2)}</Text>
            </View>
            <View style={[styles.kart, { backgroundColor: '#F44336' }]}>
              <Text style={styles.kartIcon}>📤</Text>
              <Text style={styles.kartBaslik}>Gider</Text>
              <Text style={styles.kartMiktar}>₺{ozet.gider.toFixed(2)}</Text>
            </View>
          </View>

          <View style={[styles.kartTam, { backgroundColor: ozet.net >= 0 ? '#3B82F6' : '#C62828' }]}>
            <View style={styles.netBakiyeRow}>
              <Text style={[styles.netBakiyeIcon, { color: ozet.net >= 0 ? undefined : '#FFFFFF' }]}>
                      {ozet.net >= 0 ? '💰' : '⚠️ Uyarı'}
              </Text>
              <View>
                <Text style={styles.kartBaslik}>Net Bakiye</Text>
                <Text style={styles.kartMiktarBuyuk}>₺{ozet.net.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* BÜTÇE */}
          {butceLimiti > 0 && (
            <View style={styles.bolum}>
              <View style={styles.bolumBaslikRow}>
                <Text style={styles.bolumBaslik}>💳 Aylık Bütçe</Text>
                <Text style={[styles.yuzdeText, asimVarMi && { color: '#F44336' }]}>
                  %{butceYuzde.toFixed(1)}
                </Text>
              </View>
              <View style={styles.progressArka}>
                <View style={[styles.progressOn, {
                  width: `${Math.min(butceYuzde, 100)}%`,
                  backgroundColor: asimVarMi ? '#F44336' : '#4CAF50',
                }]} />
              </View>
              <View style={styles.bolumBaslikRow}>
                <Text style={styles.kalanText}>₺{ozet.gider.toFixed(0)} / ₺{butceLimiti.toFixed(0)}</Text>
                {asimVarMi
                  ? <Text style={styles.asimText}>₺{(ozet.gider - butceLimiti).toFixed(0)} aşıldı!</Text>
                  : <Text style={styles.kalanText}>₺{(butceLimiti - ozet.gider).toFixed(0)} kaldı</Text>
                }
              </View>
            </View>
          )}

          {/* İŞLEM LİSTESİ */}
          <View style={styles.islemListeAlani}>
            <View style={styles.islemListeHeader}>
              <Text style={styles.bolumBaslik}>Son İşlemler</Text>
              <TouchableOpacity onPress={() => navigation.navigate('IslemEkle')}>
                <Text style={styles.ekleLinkText}>+ Ekle</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.aramaKutu}>
              <Text style={styles.aramaIcon}>🔍</Text>
              <TextInput
                style={styles.aramaInput}
                placeholder="Kategori veya açıklama ara..."
                placeholderTextColor="#94A3B8"
                value={aramaMetni}
                onChangeText={setAramaMetni}
              />
              {aramaMetni.length > 0 && (
                <TouchableOpacity onPress={() => setAramaMetni('')}>
                  <Text style={{ fontSize: 18, color: '#94A3B8', paddingHorizontal: 4 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.filtreContainer}>
              {[
                { key: 'tumu',  label: '📋 Tümü'  },
                { key: 'gelir', label: '📥 Gelir' },
                { key: 'gider', label: '📤 Gider' },
              ].map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.filtreBtn, filtre === f.key && styles.filtreBtnAktif]}
                  onPress={() => setFiltre(f.key)}
                >
                  <Text style={[styles.filtreBtnText, filtre === f.key && styles.filtreBtnTextAktif]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {filtrelenmisIslemler.length === 0 ? (
              <Text style={styles.bosListe}>
                {aramaMetni ? 'Arama sonucu bulunamadı.' : 'Bu ay henüz işlem yok.'}
              </Text>
            ) : (
              filtrelenmisIslemler.map(islem => {
                const kat = kategoriler.find(k => k.id === islem.kategoriId);
                return (
                  <TouchableOpacity
                    key={islem.id}
                    style={styles.islemSatir}
                    onPress={() => navigation.navigate('IslemDetay', { islem })}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.islemSimgeKutu, { backgroundColor: kat ? kat.renk : '#607D8B' }]}>
                      <Text style={styles.islemSimge}>{kat ? kat.simge : '📦'}</Text>
                    </View>
                    <View style={styles.islemDetayCol}>
                      <Text style={styles.islemKategori}>{kat ? kat.ad : 'Diğer'}</Text>
                      <Text style={styles.islemAciklama} numberOfLines={1}>
                        {islem.aciklama || new Date(islem.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                      </Text>
                    </View>
                    <View style={styles.islemSagKol}>
                      <Text style={[styles.islemTutar, { color: islem.tur === 'gelir' ? '#4CAF50' : '#F44336' }]}>
                        {islem.tur === 'gelir' ? '+' : '-'}₺{islem.miktar.toFixed(2)}
                      </Text>
                      <Text style={styles.islemTarih}>
                        {new Date(islem.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 40 },
  ozetContainer: { flexDirection: 'row', padding: 12, gap: 12 },
  kart: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  kartTam: { marginHorizontal: 12, padding: 20, borderRadius: 16, justifyContent: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  netBakiyeRow:    { flexDirection: 'row', alignItems: 'center', gap: 14 },
  netBakiyeIcon:   { fontSize: 36, backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 36 },
  kartIcon:        { fontSize: 22, marginBottom: 6 },
  kartBaslik:      { color: '#fff', fontSize: 13, opacity: 0.9, marginBottom: 4, fontWeight: '600' },
  kartMiktar:      { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  kartMiktarBuyuk: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  bolum: { backgroundColor: '#fff', margin: 12, borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  bolumBaslikRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bolumBaslik:    { fontSize: 17, fontWeight: 'bold', color: '#1E293B' },
  yuzdeText:      { fontSize: 15, fontWeight: 'bold', color: '#4CAF50' },
  progressArka:   { height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, marginVertical: 10, overflow: 'hidden' },
  progressOn:     { height: '100%', borderRadius: 5 },
  kalanText:      { fontSize: 13, color: '#64748B', fontWeight: '600' },
  asimText:       { fontSize: 13, color: '#F44336', fontWeight: 'bold' },
  islemListeAlani: { backgroundColor: '#fff', margin: 12, borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  islemListeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  ekleLinkText: { color: '#3B82F6', fontSize: 16, fontWeight: 'bold' },
  aramaKutu: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, marginBottom: 12 },
  aramaIcon:  { fontSize: 16, marginRight: 8 },
  aramaInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: '#1E293B' },
  filtreContainer: { flexDirection: 'row', marginBottom: 14, gap: 8 },
  filtreBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: '#F8FAFC', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  filtreBtnAktif:     { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  filtreBtnText:      { fontSize: 12, fontWeight: '600', color: '#64748B' },
  filtreBtnTextAktif: { color: '#fff' },
  bosListe: { textAlign: 'center', color: '#94A3B8', marginTop: 24, marginBottom: 8, fontStyle: 'italic', fontSize: 14 },
  islemSatir: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  islemSimgeKutu: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  islemSimge:    { fontSize: 21 },
  islemDetayCol: { flex: 1 },
  islemKategori: { fontSize: 15, fontWeight: 'bold', color: '#1E293B' },
  islemAciklama: { fontSize: 12, color: '#64748B', marginTop: 3 },
  islemSagKol:   { alignItems: 'flex-end' },
  islemTutar:    { fontSize: 16, fontWeight: 'bold' },
  islemTarih:    { fontSize: 11, color: '#94A3B8', marginTop: 2 },
});