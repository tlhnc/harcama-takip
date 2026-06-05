import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { useApp } from '../context/AppContext';

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

const RENKLER = ['#4CAF50','#F44336','#2196F3','#FF9800','#9C27B0','#00BCD4','#FF5722','#607D8B','#E91E63','#8BC34A'];
const SIMGELER = ['🛒','💡','🚗','💊','🎬','📚','🍔','📦','✈️','🏠','👗','🎮','💰','🏋️','🎵','📱','🐾','🌿','💅','🍕'];

function stringToUTF16LEBase64(str) {
  const buf = new ArrayBuffer(str.length * 2);
  const view = new Uint16Array(buf);
  for (let i = 0; i < str.length; i++) {
    view[i] = str.charCodeAt(i);
  }
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default function Kategoriler() {
  const { kategoriler, kategoriEkle, kategoriSil, butceLimiti, butceLimitiGuncelle, tumVerileriSifirla, islemler, setIslemler } = useApp();
  const insets = useSafeAreaInsets();

  const [modalGorunum, setModalGorunum] = useState(false);
  const [yeniAd, setYeniAd]             = useState('');
  const [secilenSimge, setSecilenSimge] = useState('📦');
  const [secilenRenk, setSecilenRenk]   = useState('#607D8B');
  const [butceInput, setButceInput]     = useState(butceLimiti > 0 ? butceLimiti.toString() : '');
  const [islemSuruyor, setIslemSuruyor] = useState(false);

  function silOnayla(id, ad) {
    Alert.alert('Kategori Sil', `"${ad}" kategorisini silmek istiyor musunuz?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => kategoriSil(id) },
    ]);
  }

  async function kaydet() {
    if (!yeniAd.trim()) { Alert.alert('Hata', 'Kategori adı boş olamaz'); return; }
    await kategoriEkle({ ad: yeniAd.trim(), simge: secilenSimge, renk: secilenRenk });
    setYeniAd(''); setSecilenSimge('📦'); setSecilenRenk('#607D8B');
    setModalGorunum(false);
  }

  function butceKaydet() {
    const deger = parseFloat(butceInput);
    if (butceInput && (isNaN(deger) || deger < 0)) {
      Alert.alert('Hata', 'Geçerli bir bütçe limiti girin'); return;
    }
    butceLimitiGuncelle(deger || 0);
    Alert.alert('Başarılı ✅', deger > 0 ? `Bütçe: ₺${deger.toFixed(0)}` : 'Limit kaldırıldı.');
  }

  function sifirlaOnayla() {
    Alert.alert('⚠️ Verileri Sıfırla', 'Tüm işlemler ve kategoriler silinecek!', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sıfırla', style: 'destructive', onPress: () => { tumVerileriSifirla(); setButceInput(''); } },
    ]);
  }

  async function csvIndir() {
    if (islemler.length === 0) { Alert.alert('Uyarı', 'İndirilecek veri yok.'); return; }

    const satirlar = [['Tarih', 'Tür', 'Miktar (₺)', 'Kategori', 'Açıklama']];
    islemler.forEach(i => {
      const kat = kategoriler.find(k => k.id === i.kategoriId);
      satirlar.push([
        new Date(i.tarih).toLocaleDateString('tr-TR'),
        i.tur === 'gelir' ? 'Gelir' : 'Gider',
        i.miktar.toFixed(2).replace('.', ','),
        kat ? kat.ad : 'Diğer',
        (i.aciklama || '').replace(/;/g, ','),
      ]);
    });

    // UTF-16 LE + BOM — Türkçe karakterlerin Excel'de bozulmaması için
    const csvMetin = '\uFEFF' + satirlar.map(r => r.join('\t')).join('\r\n');
    const csv = stringToUTF16LEBase64(csvMetin);

    try {
      const dosyaAdi = `harcama-${new Date().getTime()}.csv`;
      const yol = FileSystem.documentDirectory + dosyaAdi;
      await FileSystem.writeAsStringAsync(yol, csv, { encoding: FileSystem.EncodingType.Base64 });
      const paylasimMevcut = await Sharing.isAvailableAsync();
      if (paylasimMevcut) {
        await Sharing.shareAsync(yol, { mimeType: 'text/csv', dialogTitle: 'Excel Kaydet', UTI: 'public.comma-separated-values-text' });
      }
    } catch (e) {
      Alert.alert('Hata ❌', 'Oluşturulamadı: ' + e.message);
    }
  }

  async function csvYukle() {
    setIslemSuruyor(true);
    try {
      const sonuc = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', '*/*'],
        copyToCacheDirectory: true,
      });

      if (sonuc.canceled || !sonuc.assets || sonuc.assets.length === 0) {
        setIslemSuruyor(false); return;
      }

      // Önce base64 olarak oku — UTF-16 LE dosyaları için
      let ham = '';
      try {
        const b64 = await FileSystem.readAsStringAsync(sonuc.assets[0].uri, { encoding: FileSystem.EncodingType.Base64 });
        const binary = atob(b64);
        // UTF-16 LE BOM kontrolü (FF FE)
        if (binary.charCodeAt(0) === 0xFF && binary.charCodeAt(1) === 0xFE) {
          for (let b = 2; b < binary.length - 1; b += 2) {
            const code = binary.charCodeAt(b) | (binary.charCodeAt(b + 1) << 8);
            ham += String.fromCharCode(code);
          }
        } else {
          // UTF-8 fallback
          ham = await FileSystem.readAsStringAsync(sonuc.assets[0].uri, { encoding: 'utf8' });
        }
      } catch {
        ham = await FileSystem.readAsStringAsync(sonuc.assets[0].uri, { encoding: 'utf8' });
      }

      const temizIcerik = ham.replace(/^\uFEFF/, '').trim();
      const satirlar = temizIcerik.split(/\r?\n/);

      if (satirlar.length < 2) {
        Alert.alert('Hata', 'Dosya boş veya format hatalı.'); setIslemSuruyor(false); return;
      }

      // Ayırıcıyı otomatik tespit et: sekme mi noktalı virgül mü?
      const ayirici = satirlar[0].includes('\t') ? '\t' : ';';

      let yeniIslemler = [];
      for (let i = 1; i < satirlar.length; i++) {
        const sutunlar = satirlar[i].split(ayirici);
        if (sutunlar.length < 4) continue;

        const tarihParcalari = sutunlar[0].split('.');
        let isoTarih = new Date().toISOString();
        if (tarihParcalari.length === 3) {
          isoTarih = new Date(tarihParcalari[2], parseInt(tarihParcalari[1]) - 1, tarihParcalari[0], 12).toISOString();
        }

        const tur = sutunlar[1].toLowerCase() === 'gelir' ? 'gelir' : 'gider';
        const miktar = parseFloat(sutunlar[2].replace(',', '.')) || 0;
        const kategoriAdi = sutunlar[3];
        const aciklama = sutunlar[4] || '';

        let katId = '8'; 
        const eslesenKat = kategoriler.find(k => k.ad.toLowerCase() === kategoriAdi.toLowerCase());
        if (eslesenKat) katId = eslesenKat.id;

        yeniIslemler.push({ id: Date.now().toString() + i, tarih: isoTarih, tur, miktar, kategoriId: katId, aciklama });
      }

      Alert.alert('Yükleme Başarılı', `${yeniIslemler.length} işlem bulundu.`, [
        { text: 'İptal', style: 'cancel' },
        { text: 'Üzerine Yaz', style: 'destructive', onPress: async () => { setIslemler(yeniIslemler); await AsyncStorage.setItem('@islemler', JSON.stringify(yeniIslemler)); } },
        { text: 'Ekle', onPress: async () => { const birlesik = [...yeniIslemler, ...islemler]; setIslemler(birlesik); await AsyncStorage.setItem('@islemler', JSON.stringify(birlesik)); } }
      ]);
    } catch (e) {
      Alert.alert('Hata ❌', 'CSV Okunamadı: ' + e.message);
    } finally {
      setIslemSuruyor(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.bolum}>
            <View style={styles.bolumHeader}>
              <View style={styles.baslikSol}>
                <Text style={styles.bolumBaslik}>🏷️ Kategoriler</Text>
                <View style={styles.sayacBadge}><Text style={styles.sayacText}>{kategoriler?.length || 0}</Text></View>
              </View>
              <TouchableOpacity style={styles.yeniKategoriBtn} onPress={() => setModalGorunum(true)}>
                <Text style={styles.yeniKategoriBtnText}>+ Ekle</Text>
              </TouchableOpacity>
            </View>
            {(!kategoriler || kategoriler.length === 0) && <Text style={styles.bosListeUyari}>İşlem yapabilmek için kategori ekleyin.</Text>}
            {kategoriler?.map(k => (
              <View key={k.id} style={styles.kategoriSatir}>
                <View style={[styles.renkCember, { backgroundColor: k.renk }]}><Text style={styles.simge}>{k.simge}</Text></View>
                <Text style={styles.kategoriAd}>{k.ad}</Text>
                <TouchableOpacity style={styles.silBtn} onPress={() => silOnayla(k.id, k.ad)}><Text style={styles.silBtnText}>🗑️</Text></TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.bolum}>
            <Text style={styles.bolumBaslik}>💳 Aylık Bütçe Limiti</Text>
            <View style={styles.butceInputRow}>
              <Text style={styles.butceTl}>₺</Text>
              <TextInput style={styles.butceInput} value={butceInput} onChangeText={setButceInput} keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#CBD5E1" />
            </View>
            <TouchableOpacity style={styles.butceKaydetBtn} onPress={butceKaydet}><Text style={styles.butceKaydetText}>💾 Limiti Kaydet</Text></TouchableOpacity>
            {butceLimiti > 0 && <View style={styles.mevcutLimit}><Text style={styles.mevcutLimitText}>✅ Mevcut limit: ₺{butceLimiti.toFixed(0)}</Text></View>}
          </View>

          <View style={styles.bolum}>
            <Text style={styles.bolumBaslik}>📤 / 📥 Excel (CSV) İşlemleri</Text>
            <Text style={styles.aciklama}>Verilerinizi bilgisayarınızda düzenlemek için dışa aktarın veya hazırladığınız tabloyu uygulamaya yükleyin.</Text>
            
            <TouchableOpacity style={[styles.exportSutunBtn, { backgroundColor: '#7C3AED' }]} onPress={csvYukle} disabled={islemSuruyor}>
              <Text style={styles.exportSutunBtnText}>{islemSuruyor ? '⏳ Yükleniyor...' : '📥 Excel (CSV) İçe Aktar'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.exportSutunBtn} onPress={csvIndir} disabled={islemSuruyor}>
              <Text style={styles.exportSutunBtnText}>📤 Excel Olarak Dışa Aktar</Text>
            </TouchableOpacity>
            
            <Text style={styles.exportBilgi}>📌 Toplam {islemler.length} işlem kayıtlı</Text>
          </View>

          <View style={[styles.bolum, { marginBottom: 32 }]}>
            <Text style={styles.bolumBaslik}>⚙️ Veri Yönetimi</Text>
            <Text style={styles.aciklama}>Tüm işlemleri, kategorileri ve bütçe ayarlarını sıfırlayarak temiz başlangıç yapın.</Text>
            <TouchableOpacity style={styles.sifirlaBtn} onPress={sifirlaOnayla}><Text style={styles.sifirlaBtnText}>🗑️ Tüm Verileri Sıfırla</Text></TouchableOpacity>
            <Text style={styles.sifirlaUyari}>⚠️ Bu işlem geri alınamaz!</Text>
          </View>
        </ScrollView>

        <Modal visible={modalGorunum} animationType="slide" transparent>
          <View style={styles.modalArka}>
            <View style={[styles.modalKutu, { paddingBottom: Math.max(insets.bottom + 20, 24) }]}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10 }}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalBaslik}>Yeni Kategori</Text>
                <TextInput style={styles.input} value={yeniAd} onChangeText={setYeniAd} placeholder="Kategori adı..." placeholderTextColor="#CBD5E1" />
                <Text style={styles.etiket}>Simge Seç</Text>
                <View style={styles.simgeGrid}>
                  {SIMGELER.map(s => (
                    <TouchableOpacity key={s} style={[styles.simgeBtn, secilenSimge === s && styles.simgeBtnAktif]} onPress={() => setSecilenSimge(s)}>
                      <Text style={styles.simgeBtnText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.etiket}>Renk Seç</Text>
                <View style={styles.renkGrid}>
                  {RENKLER.map(r => (
                    <TouchableOpacity key={r} style={[styles.renkBtn, { backgroundColor: r }, secilenRenk === r && styles.renkBtnAktif]} onPress={() => setSecilenRenk(r)} />
                  ))}
                </View>
                <View style={styles.onizleme}>
                  <View style={[styles.onizlemeCember, { backgroundColor: secilenRenk }]}><Text style={styles.onizlemeSimge}>{secilenSimge}</Text></View>
                  <Text style={styles.onizlemeAd}>{yeniAd || 'Kategori Adı'}</Text>
                </View>
                <View style={styles.modalBtnler}>
                  <TouchableOpacity style={styles.iptalBtn} onPress={() => setModalGorunum(false)}><Text style={styles.iptalBtnText}>İptal</Text></TouchableOpacity>
                  <TouchableOpacity style={[styles.kaydetBtn, { backgroundColor: secilenRenk }]} onPress={kaydet}><Text style={styles.kaydetBtnText}>✅ Kaydet</Text></TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F1F5F9' },
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  scrollContent: { paddingBottom: 40 }, 
  bolum: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  bolumHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  baslikSol: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bolumBaslik: { fontSize: 17, fontWeight: 'bold', color: '#1E293B', marginBottom: 2 },
  sayacBadge: { backgroundColor: '#1E40AF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  sayacText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  yeniKategoriBtn: { backgroundColor: '#1E40AF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  yeniKategoriBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  bosListeUyari: { color: '#94A3B8', fontSize: 14, textAlign: 'center', fontStyle: 'italic', marginVertical: 12 },
  aciklama: { fontSize: 13, color: '#64748B', marginBottom: 14, lineHeight: 20 },
  kategoriSatir: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  renkCember: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  simge: { fontSize: 22 },
  kategoriAd: { flex: 1, fontSize: 16, color: '#1E293B', fontWeight: '500' },
  silBtn: { padding: 8 },
  silBtnText: { fontSize: 18 },
  butceInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, marginBottom: 10 },
  butceTl: { fontSize: 24, color: '#1E293B', fontWeight: 'bold', marginRight: 8 },
  butceInput: { flex: 1, fontSize: 22, fontWeight: 'bold', color: '#1E293B', padding: 12 },
  butceKaydetBtn: { backgroundColor: '#1E40AF', padding: 14, borderRadius: 12, alignItems: 'center' },
  butceKaydetText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  mevcutLimit: { marginTop: 10, backgroundColor: '#EFF6FF', borderRadius: 10, padding: 10, alignItems: 'center' },
  mevcutLimitText: { color: '#1E40AF', fontSize: 14, fontWeight: '600' },
  exportSutunBtn: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  exportSutunBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  exportBilgi: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4 },
  sifirlaBtn: { backgroundColor: '#FEE2E2', padding: 16, borderRadius: 14, alignItems: 'center', borderWidth: 2, borderColor: '#FECACA' },
  sifirlaBtnText: { color: '#DC2626', fontSize: 16, fontWeight: 'bold' },
  sifirlaUyari: { textAlign: 'center', color: '#94A3B8', fontSize: 12, marginTop: 8 },
  modalArka: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalKutu: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, maxHeight: '90%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#CBD5E1', borderRadius: 2, alignSelf: 'center', marginBottom: 8, marginTop: 10 },
  modalBaslik: { fontSize: 20, fontWeight: 'bold', color: '#1E293B', marginBottom: 18, textAlign: 'center' },
  input: { borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 17, color: '#1E293B', marginBottom: 18 },
  etiket: { fontSize: 14, fontWeight: 'bold', color: '#475569', marginBottom: 10 },
  simgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  simgeBtn: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 2, borderColor: '#E2E8F0' },
  simgeBtnAktif: { borderColor: '#1E40AF', backgroundColor: '#EFF6FF' },
  simgeBtnText: { fontSize: 24 },
  renkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  renkBtn: { width: 38, height: 38, borderRadius: 19 },
  renkBtnAktif: { borderWidth: 3, borderColor: '#1E293B' },
  onizleme: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 14, marginBottom: 18, gap: 12 },
  onizlemeCember: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  onizlemeSimge: { fontSize: 24 },
  onizlemeAd: { fontSize: 17, fontWeight: '600', color: '#1E293B' },
  modalBtnler: { flexDirection: 'row', gap: 12 },
  iptalBtn: { flex: 1, padding: 16, borderRadius: 14, borderWidth: 2, borderColor: '#E2E8F0', alignItems: 'center' },
  iptalBtnText: { fontSize: 16, color: '#64748B', fontWeight: 'bold' },
  kaydetBtn: { flex: 1, padding: 16, borderRadius: 14, alignItems: 'center' },
  kaydetBtnText: { fontSize: 16, color: '#fff', fontWeight: 'bold' },
});