import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useApp } from '../context/AppContext';

const TARIH_SECENEKLERI = [
  { key: 'bugun',      label: '📅 Bugün',       gunOnce: 0    },
  { key: 'dun',        label: '📆 Dün',         gunOnce: 1    },
  { key: 'gecenHafta', label: '🗓️ Geçen Hafta', gunOnce: 7    },
  { key: 'ozel',       label: '✏️ Özel',         gunOnce: null },
];

function gunCikar(gun) {
  const tarih = new Date();
  tarih.setDate(tarih.getDate() - gun);
  tarih.setHours(12, 0, 0, 0);
  return tarih;
}

function tarihFormat(tarih) {
  return new Date(tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function IslemEkle({ navigation }) {
  const { kategoriler, islemEkle } = useApp();
  const [tur, setTur]               = useState('gider');
  const [miktar, setMiktar]         = useState('');
  const [kategoriId, setKategoriId] = useState('');
  const [aciklama, setAciklama]     = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [tarihSecimi, setTarihSecimi] = useState('bugun');
  const [ozelGun, setOzelGun]       = useState('');
  const [ozelAy, setOzelAy]         = useState('');
  const [ozelYil, setOzelYil]       = useState('');

  function secilenTarihi() {
    if (tarihSecimi === 'ozel') {
      if (!ozelGun.trim() || !ozelAy.trim() || !ozelYil.trim()) return null;
      const g = parseInt(ozelGun);
      const a = parseInt(ozelAy);
      const y = parseInt(ozelYil);

      if (isNaN(g) || isNaN(a) || isNaN(y)) return null;
      if (y < 2000) return null;
      const tarih = new Date(y, a - 1, g, 12, 0, 0);
      if (isNaN(tarih.getTime()) || g < 1 || g > 31 || a < 1 || a > 12) return null;
      return tarih;
    }
    const secim = TARIH_SECENEKLERI.find(t => t.key === tarihSecimi);
    return gunCikar(secim?.gunOnce ?? 0);
  }

  async function kaydet() {
    if (!miktar || isNaN(parseFloat(miktar)) || parseFloat(miktar) <= 0) {
      Alert.alert('Hata', 'Geçerli bir miktar girin'); return;
    }
    if (!kategoriId) {
      Alert.alert('Hata', 'Lütfen bir kategori seçin'); return;
    }
    if (tarihSecimi === 'ozel' && ozelYil.trim() && parseInt(ozelYil) < 2000) {
      Alert.alert('Geçersiz Yıl', 'İşlem tarihi 2000 yılından eski olamaz.'); return;
    }
    const tarih = secilenTarihi();
    if (!tarih) {
      Alert.alert('Hata', 'Geçerli bir tarih girin (GG/AA/YYYY)'); return;
    }
    setYukleniyor(true);
    await islemEkle({
      tur, miktar: parseFloat(miktar), kategoriId, aciklama: aciklama.trim(), tarih: tarih.toISOString(),
    });
    setYukleniyor(false);
    setMiktar(''); setAciklama(''); setKategoriId(''); setTarihSecimi('bugun'); setOzelGun(''); setOzelAy(''); setOzelYil('');
    Alert.alert('Başarılı ✅', 'İşlem kaydedildi!', [{ text: 'Tamam', onPress: () => navigation.navigate('AnaSayfa') }]);
  }

  const secilenTarih = secilenTarihi();

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.bolum}>
            <Text style={styles.etiket}>İşlem Türü</Text>
            <View style={styles.turContainer}>
              <TouchableOpacity style={[styles.turBtn, tur === 'gider' && styles.turBtnGiderAktif]} onPress={() => setTur('gider')}>
                <Text style={styles.turEmoji}>📤</Text>
                <Text style={[styles.turBtnText, tur === 'gider' && styles.turBtnTextAktif]}>Gider</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.turBtn, tur === 'gelir' && styles.turBtnGelirAktif]} onPress={() => setTur('gelir')}>
                <Text style={styles.turEmoji}>📥</Text>
                <Text style={[styles.turBtnText, tur === 'gelir' && styles.turBtnTextAktif]}>Gelir</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bolum}>
            <Text style={styles.etiket}>Miktar (₺)</Text>
            <View style={styles.miktarContainer}>
              <Text style={styles.tlSimge}>₺</Text>
              <TextInput style={styles.miktarInput} value={miktar} onChangeText={setMiktar} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#CBD5E1" />
            </View>
          </View>

          <View style={styles.bolum}>
            <Text style={styles.etiket}>📅 Tarih</Text>
            <View style={styles.tarihGrid}>
              {TARIH_SECENEKLERI.map(t => (
                <TouchableOpacity key={t.key} style={[styles.tarihBtn, tarihSecimi === t.key && styles.tarihBtnAktif]} onPress={() => setTarihSecimi(t.key)}>
                  <Text style={[styles.tarihBtnText, tarihSecimi === t.key && styles.tarihBtnTextAktif]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {tarihSecimi === 'ozel' && (
              <View style={styles.ozelTarihContainer}>
                <TextInput style={styles.ozelTarihInput} value={ozelGun} onChangeText={setOzelGun} keyboardType="number-pad" placeholder="GG" placeholderTextColor="#CBD5E1" maxLength={2} />
                <Text style={styles.tarihAyrac}>/</Text>
                <TextInput style={styles.ozelTarihInput} value={ozelAy} onChangeText={setOzelAy} keyboardType="number-pad" placeholder="AA" placeholderTextColor="#CBD5E1" maxLength={2} />
                <Text style={styles.tarihAyrac}>/</Text>
                <TextInput style={[styles.ozelTarihInput, { flex: 1.5 }]} value={ozelYil} onChangeText={setOzelYil} keyboardType="number-pad" placeholder="YYYY" placeholderTextColor="#CBD5E1" maxLength={4} />
              </View>
            )}
            {secilenTarih && <Text style={styles.secilenTarihText}>📌 {tarihFormat(secilenTarih)}</Text>}
          </View>

          <View style={styles.bolum}>
            <Text style={styles.etiket}>Kategori</Text>
            <View style={styles.kategoriGrid}>
              {kategoriler.map(k => (
                <TouchableOpacity key={k.id} style={[styles.kategoriBtn, kategoriId === k.id && { backgroundColor: k.renk, borderColor: k.renk }]} onPress={() => setKategoriId(k.id)}>
                  <Text style={styles.kategoriSimge}>{k.simge}</Text>
                  <Text style={[styles.kategoriAd, kategoriId === k.id && { color: '#fff' }]}>{k.ad}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.bolum}>
            <Text style={styles.etiket}>Açıklama (İsteğe Bağlı)</Text>
            <TextInput style={styles.aciklamaInput} value={aciklama} onChangeText={setAciklama} placeholder="Kısa bir not ekleyin..." placeholderTextColor="#CBD5E1" multiline />
          </View>

          <TouchableOpacity style={[styles.kaydetBtn, { backgroundColor: tur === 'gelir' ? '#10B981' : '#EF4444', opacity: yukleniyor ? 0.6 : 1 }]} onPress={kaydet} disabled={yukleniyor}>
            <Text style={styles.kaydetBtnText}>{yukleniyor ? '⏳ Kaydediliyor...' : '💾 Kaydet'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F1F5F9' },
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  scrollContent: { paddingBottom: 40 },
  bolum: { backgroundColor: '#fff', margin: 12, marginBottom: 0, borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  etiket: { fontSize: 14, fontWeight: 'bold', color: '#475569', marginBottom: 12 },
  turContainer: { flexDirection: 'row', gap: 10 },
  turBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#E2E8F0', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  turBtnGiderAktif: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  turBtnGelirAktif: { backgroundColor: '#10B981', borderColor: '#10B981' },
  turEmoji: { fontSize: 18 },
  turBtnText: { fontSize: 16, fontWeight: 'bold', color: '#94A3B8' },
  turBtnTextAktif: { color: '#fff' },
  miktarContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14 },
  tlSimge: { fontSize: 26, color: '#1E293B', fontWeight: 'bold', marginRight: 6 },
  miktarInput: { flex: 1, fontSize: 34, fontWeight: 'bold', color: '#1E293B', padding: 10 },
  tarihGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tarihBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 2, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  tarihBtnAktif: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  tarihBtnText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tarihBtnTextAktif: { color: '#fff' },
  ozelTarihContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  ozelTarihInput: { flex: 1, borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 18, fontWeight: 'bold', color: '#1E293B', textAlign: 'center' },
  tarihAyrac: { fontSize: 22, color: '#94A3B8', fontWeight: 'bold' },
  secilenTarihText: { marginTop: 10, fontSize: 13, color: '#3B82F6', fontWeight: '600' },
  kategoriGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kategoriBtn: { width: '22%', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 2, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  kategoriSimge: { fontSize: 24 },
  kategoriAd: { fontSize: 11, color: '#475569', marginTop: 5, textAlign: 'center', fontWeight: '500' },
  aciklamaInput: { borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, fontSize: 15, color: '#1E293B', minHeight: 80, textAlignVertical: 'top' },
  kaydetBtn: { margin: 12, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  kaydetBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});