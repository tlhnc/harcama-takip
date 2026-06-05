import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState } from 'react';
import { useApp } from '../context/AppContext';

const TARIH_SECENEKLERI = [
  { key: 'bugun',      label: '📅 Bugün',       gunOnce: 0    },
  { key: 'dun',        label: '📆 Dün',          gunOnce: 1    },
  { key: 'gecenHafta', label: '🗓️ Geçen Hafta', gunOnce: 7    },
  { key: 'ozel',       label: '✏️ Özel',         gunOnce: null },
];

export default function IslemDetay({ route, navigation }) {
  const { islem } = route.params;
  const { kategoriler, islemSil, islemGuncelle } = useApp();

  const mevcutTarih = new Date(islem.tarih);

  const [tur, setTur]               = useState(islem.tur);
  const [miktar, setMiktar]         = useState(islem.miktar.toString());
  const [kategoriId, setKategoriId] = useState(islem.kategoriId);
  const [aciklama, setAciklama]     = useState(islem.aciklama || '');
  const [tarihSecimi, setTarihSecimi] = useState('ozel');
  const [ozelGun, setOzelGun]       = useState(mevcutTarih.getDate().toString());
  const [ozelAy, setOzelAy]         = useState((mevcutTarih.getMonth() + 1).toString());
  const [ozelYil, setOzelYil]       = useState(mevcutTarih.getFullYear().toString());
  const [yukleniyor, setYukleniyor] = useState(false);

  // HATA 2 DÜZELTİLDİ: Özel tarihte alanların dolu olması zorunlu,
  // boş string artık "1" olarak kabul edilmiyor.
  function secilenTarihi() {
    if (tarihSecimi === 'ozel') {
      if (!ozelGun.trim() || !ozelAy.trim() || !ozelYil.trim()) return null;
      const g = parseInt(ozelGun);
      const a = parseInt(ozelAy);
      const y = parseInt(ozelYil);
      if (isNaN(g) || isNaN(a) || isNaN(y)) return null;
      const tarih = new Date(y, a - 1, g, 12, 0, 0);
      if (isNaN(tarih.getTime()) || g < 1 || g > 31 || a < 1 || a > 12) return null;
      return tarih;
    }
    const secim = TARIH_SECENEKLERI.find(t => t.key === tarihSecimi);
    const tarih = new Date();
    tarih.setDate(tarih.getDate() - (secim?.gunOnce ?? 0));
    tarih.setHours(12, 0, 0, 0);
    return tarih;
  }

  async function kaydet() {
    if (!miktar || isNaN(parseFloat(miktar)) || parseFloat(miktar) <= 0) {
      Alert.alert('Hata', 'Geçerli bir miktar girin');
      return;
    }
    if (!kategoriId) {
      Alert.alert('Hata', 'Lütfen bir kategori seçin');
      return;
    }
    const tarih = secilenTarihi();
    if (!tarih) {
      Alert.alert('Hata', 'Geçerli bir tarih girin');
      return;
    }
    setYukleniyor(true);
    await islemGuncelle(islem.id, {
      tur, miktar: parseFloat(miktar),
      kategoriId, aciklama: aciklama.trim(),
      tarih: tarih.toISOString(),
    });
    setYukleniyor(false);
    Alert.alert('Başarılı ✅', 'İşlem güncellendi!', [
      { text: 'Tamam', onPress: () => navigation.goBack() },
    ]);
  }

  function silOnayla() {
    Alert.alert('İşlemi Sil', 'Bu işlemi kalıcı olarak silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          await islemSil(islem.id);
          navigation.goBack();
        },
      },
    ]);
  }

  const secilenTarih = secilenTarihi();

  return (
    // HATA 5 DÜZELTİLDİ: SafeAreaView + KeyboardAvoidingView eklendi.
    // iPhone Home Indicator ve Android gesture alanıyla çakışma giderildi.
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* İşlem Türü */}
          <View style={styles.bolum}>
            <Text style={styles.etiket}>İşlem Türü</Text>
            <View style={styles.turContainer}>
              <TouchableOpacity
                style={[styles.turBtn, tur === 'gider' && styles.turBtnGiderAktif]}
                onPress={() => setTur('gider')}
              >
                <Text style={styles.turEmoji}>📤</Text>
                <Text style={[styles.turBtnText, tur === 'gider' && styles.turBtnTextAktif]}>Gider</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.turBtn, tur === 'gelir' && styles.turBtnGelirAktif]}
                onPress={() => setTur('gelir')}
              >
                <Text style={styles.turEmoji}>📥</Text>
                <Text style={[styles.turBtnText, tur === 'gelir' && styles.turBtnTextAktif]}>Gelir</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Miktar */}
          <View style={styles.bolum}>
            <Text style={styles.etiket}>Miktar (₺)</Text>
            <View style={styles.miktarContainer}>
              <Text style={styles.tlSimge}>₺</Text>
              <TextInput
                style={styles.miktarInput}
                value={miktar}
                onChangeText={setMiktar}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#CBD5E1"
              />
            </View>
          </View>

          {/* Tarih */}
          <View style={styles.bolum}>
            <Text style={styles.etiket}>📅 Tarih</Text>
            <View style={styles.tarihGrid}>
              {TARIH_SECENEKLERI.map(t => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.tarihBtn, tarihSecimi === t.key && styles.tarihBtnAktif]}
                  onPress={() => setTarihSecimi(t.key)}
                >
                  <Text style={[styles.tarihBtnText, tarihSecimi === t.key && styles.tarihBtnTextAktif]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {tarihSecimi === 'ozel' && (
              <View style={styles.ozelTarihContainer}>
                <TextInput style={styles.ozelTarihInput} value={ozelGun} onChangeText={setOzelGun}
                  keyboardType="number-pad" placeholder="GG" placeholderTextColor="#CBD5E1" maxLength={2} />
                <Text style={styles.tarihAyrac}>/</Text>
                <TextInput style={styles.ozelTarihInput} value={ozelAy} onChangeText={setOzelAy}
                  keyboardType="number-pad" placeholder="AA" placeholderTextColor="#CBD5E1" maxLength={2} />
                <Text style={styles.tarihAyrac}>/</Text>
                <TextInput style={[styles.ozelTarihInput, { flex: 1.5 }]} value={ozelYil} onChangeText={setOzelYil}
                  keyboardType="number-pad" placeholder="YYYY" placeholderTextColor="#CBD5E1" maxLength={4} />
              </View>
            )}
            {secilenTarih && (
              <Text style={styles.secilenTarihText}>
                📌 {new Date(secilenTarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            )}
          </View>

          {/* Kategori */}
          <View style={styles.bolum}>
            <Text style={styles.etiket}>Kategori</Text>
            <View style={styles.kategoriGrid}>
              {kategoriler.map(k => (
                <TouchableOpacity
                  key={k.id}
                  style={[styles.kategoriBtn, kategoriId === k.id && { backgroundColor: k.renk, borderColor: k.renk }]}
                  onPress={() => setKategoriId(k.id)}
                >
                  <Text style={styles.kategoriSimge}>{k.simge}</Text>
                  <Text style={[styles.kategoriAd, kategoriId === k.id && { color: '#fff' }]}>{k.ad}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Açıklama */}
          <View style={styles.bolum}>
            <Text style={styles.etiket}>Açıklama (İsteğe Bağlı)</Text>
            <TextInput
              style={styles.aciklamaInput}
              value={aciklama}
              onChangeText={setAciklama}
              placeholder="Kısa bir not ekleyin..."
              placeholderTextColor="#CBD5E1"
              multiline
            />
          </View>

          {/* Güncelle Butonu */}
          <TouchableOpacity
            style={[styles.kaydetBtn, {
              backgroundColor: tur === 'gelir' ? '#10B981' : '#EF4444',
              opacity: yukleniyor ? 0.6 : 1,
            }]}
            onPress={kaydet}
            disabled={yukleniyor}
          >
            <Text style={styles.kaydetBtnText}>
              {yukleniyor ? '⏳ Kaydediliyor...' : '💾 Güncelle'}
            </Text>
          </TouchableOpacity>

          {/* Sil Butonu */}
          <TouchableOpacity style={styles.silBtn} onPress={silOnayla}>
            <Text style={styles.silBtnText}>🗑️ İşlemi Sil</Text>
          </TouchableOpacity>

          {/* Alt boşluk — navigasyon çubuğuyla çakışmayı önler */}
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // HATA 5: SafeAreaView için eklendi
  safeArea: { flex: 1, backgroundColor: '#F1F5F9' },
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  // HATA 5: scrollContent paddingBottom — alt butonlar navigasyonla çakışmaz
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
  kaydetBtn: { margin: 12, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 16 },
  kaydetBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  silBtn: { marginHorizontal: 12, padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 2, borderColor: '#FECACA', backgroundColor: '#FEF2F2', marginTop: 8 },
  silBtnText: { color: '#DC2626', fontSize: 16, fontWeight: 'bold' },
});