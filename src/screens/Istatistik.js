import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, SafeAreaView,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { PieChart, LineChart, BarChart } from 'react-native-chart-kit';
import AySecici from '../components/AySecici';

const EKRAN = Dimensions.get('window').width - 32;

export default function Istatistik() {
  const { kategoriler, aylikOzet, kategoriHarcamalar, aktifYil, aktifAy } = useApp();

  const yil = aktifYil;
  const ay  = aktifAy;

  const { gelir, gider, net } = aylikOzet(yil, ay);
  const katHarcamalar  = kategoriHarcamalar(yil, ay);
  const toplamGider    = Object.values(katHarcamalar).reduce((t, v) => t + v, 0);

  const oncekiAyNo = ay === 0 ? 11 : ay - 1;
  const oncekiYil  = ay === 0 ? yil - 1 : yil;
  const { gelir: oncekiGelir, gider: oncekiGider } = aylikOzet(oncekiYil, oncekiAyNo);
  const gelirDegisim = oncekiGelir > 0 ? (((gelir - oncekiGelir) / oncekiGelir) * 100).toFixed(1) : null;
  const giderDegisim = oncekiGider > 0 ? (((gider - oncekiGider) / oncekiGider) * 100).toFixed(1) : null;

  const ayAdlari = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                    'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

  const sonAltiAy = Array.from({ length: 6 }, (_, i) => {
    let hedefAy = ay - (5 - i);
    let hedefYil = yil;
    if (hedefAy < 0) { hedefAy += 12; hedefYil -= 1; }
    const ozet = aylikOzet(hedefYil, hedefAy);
    return { ad: ayAdlari[hedefAy].slice(0, 3), gelir: ozet.gelir, gider: ozet.gider };
  });

  const cizgiGrafik = {
    labels: sonAltiAy.map(a => a.ad),
    datasets: [
      { data: sonAltiAy.map(a => a.gelir || 0), color: () => '#10B981', strokeWidth: 2 },
      { data: sonAltiAy.map(a => a.gider || 0), color: () => '#EF4444', strokeWidth: 2 },
    ],
    legend: ['Gelir', 'Gider'],
  };

  const siraliKategoriler = kategoriler
    .filter(k => katHarcamalar[k.id] && katHarcamalar[k.id] > 0)
    .sort((a, b) => (katHarcamalar[b.id] || 0) - (katHarcamalar[a.id] || 0));

  const pastaVeri = siraliKategoriler.map(k => ({
    name: k.ad, miktar: katHarcamalar[k.id] || 0, color: k.renk,
    legendFontColor: '#333', legendFontSize: 13,
  }));

  const cubukKategoriler = siraliKategoriler.slice(0, 6);
  const cubukGrafik = {
    labels: cubukKategoriler.map(k => k.ad.length > 5 ? k.ad.slice(0, 4) + '.' : k.ad),
    datasets: [{ data: cubukKategoriler.length > 0 ? cubukKategoriler.map(k => katHarcamalar[k.id] || 0) : [0] }],
  };

  const grafikteyiConf = {
    backgroundGradientFrom: '#fff', backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(30, 64, 175, ${opacity})`,
    strokeWidth: 2,
    propsForDots: { r: '4', strokeWidth: '2' },
    propsForLabels: { fontSize: 11 },
  };

  const cubukGrafikConf = {
    backgroundGradientFrom: '#fff', backgroundGradientTo: '#fff',
    color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
    strokeWidth: 2, barPercentage: 0.65,
    propsForLabels: { fontSize: 10 }, decimalPlaces: 0,
  };

  const harcamaOrani = gelir > 0 ? (gider / gelir) * 100 : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AySecici />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

        {/* Özet Kartlar */}
        <View style={styles.kartlar}>
          <View style={[styles.kart, { backgroundColor: '#10B981' }]}>
            <Text style={styles.kartSimge}>📥</Text>
            <Text style={styles.kartBaslik}>Gelir</Text>
            <Text style={styles.kartMiktar}>₺{gelir.toFixed(0)}</Text>
            {gelirDegisim !== null && (
              <Text style={styles.degisim}>{gelirDegisim > 0 ? '▲' : '▼'} %{Math.abs(gelirDegisim)}</Text>
            )}
          </View>
          <View style={[styles.kart, { backgroundColor: '#EF4444' }]}>
            <Text style={styles.kartSimge}>📤</Text>
            <Text style={styles.kartBaslik}>Gider</Text>
            <Text style={styles.kartMiktar}>₺{gider.toFixed(0)}</Text>
            {giderDegisim !== null && (
              <Text style={styles.degisim}>{giderDegisim > 0 ? '▲' : '▼'} %{Math.abs(giderDegisim)}</Text>
            )}
          </View>
          <View style={[styles.kart, { backgroundColor: net >= 0 ? '#1E40AF' : '#C62828' }]}>
            <Text style={styles.kartSimge}>{net >= 0 ? '💰' : '⚠️'}</Text>
            <Text style={styles.kartBaslik}>Net</Text>
            <Text style={styles.kartMiktar}>₺{net.toFixed(0)}</Text>
          </View>
        </View>

        {/* Harcama Oranı */}
        {gelir > 0 && (
          <View style={styles.bolum}>
            <Text style={styles.bolumBaslik}>💳 Harcama Oranı</Text>
            <View style={styles.oranBarArka}>
              <View style={[styles.oranBarOn, {
                width: `${Math.min(harcamaOrani, 100)}%`,
                backgroundColor: harcamaOrani > 90 ? '#EF4444' : harcamaOrani > 70 ? '#FF9800' : '#10B981',
              }]} />
            </View>
            <Text style={[styles.oranYazi, {
              color: harcamaOrani > 90 ? '#EF4444' : harcamaOrani > 70 ? '#FF9800' : '#10B981',
            }]}>
              Gelirinizin %{harcamaOrani.toFixed(1)}'ini harcadınız
            </Text>
          </View>
        )}

        {/* Çizgi Grafik */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>📈 Son 6 Ay Gelir / Gider Trendi</Text>
          {sonAltiAy.every(a => a.gelir === 0 && a.gider === 0) ? (
            <Text style={styles.bosText}>Henüz yeterli veri yok</Text>
          ) : (
            <LineChart data={cizgiGrafik} width={EKRAN} height={200} chartConfig={grafikteyiConf} bezier style={styles.grafik} withInnerLines={false} fromZero />
          )}
          <View style={styles.legenda}>
            <View style={styles.legendaItem}><View style={[styles.legendaNokta, { backgroundColor: '#10B981' }]} /><Text style={styles.legendaText}>Gelir</Text></View>
            <View style={styles.legendaItem}><View style={[styles.legendaNokta, { backgroundColor: '#EF4444' }]} /><Text style={styles.legendaText}>Gider</Text></View>
          </View>
        </View>

        {/* Çubuk Grafik */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>📊 Kategori Karşılaştırma</Text>
          <Text style={styles.bolumAltBaslik}>Bu ay kategorilere göre harcama dağılımı (büyükten küçüğe)</Text>
          {cubukKategoriler.length === 0 ? (
            <Text style={styles.bosText}>Bu ay henüz gider yok</Text>
          ) : (
            <>
              <BarChart data={cubukGrafik} width={EKRAN} height={220} chartConfig={cubukGrafikConf} style={styles.grafik} fromZero showValuesOnTopOfBars />
              <View style={styles.cubukLegenda}>
                {cubukKategoriler.map(k => (
                  <View key={k.id} style={styles.cubukLegendaItem}>
                    <View style={[styles.cubukLegendaRenk, { backgroundColor: k.renk }]}><Text style={{ fontSize: 12 }}>{k.simge}</Text></View>
                    <Text style={styles.cubukLegendaText} numberOfLines={1}>{k.ad}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Pasta Grafik */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>🥧 Kategori Dağılımı</Text>
          {pastaVeri.length === 0 ? (
            <Text style={styles.bosText}>Bu ay henüz gider yok</Text>
          ) : (
            <PieChart data={pastaVeri} width={EKRAN} height={200} chartConfig={grafikteyiConf} accessor="miktar" backgroundColor="transparent" paddingLeft="10" style={styles.grafik} />
          )}
        </View>

        {/* Kategori Detay */}
        <View style={styles.bolum}>
          <Text style={styles.bolumBaslik}>🏷️ Kategori Detayı</Text>
          {siraliKategoriler.length === 0 ? (
            <Text style={styles.bosText}>Bu ay henüz gider yok</Text>
          ) : (
            <>
              {siraliKategoriler.map(k => {
                const miktar = katHarcamalar[k.id] || 0;
                const yuzde  = toplamGider > 0 ? (miktar / toplamGider) * 100 : 0;
                return (
                  <View key={k.id} style={styles.kategoriSatir}>
                    <View style={styles.kategoriSolKisim}>
                      <View style={[styles.kategoriRenkCember, { backgroundColor: k.renk }]}><Text style={styles.kategoriSimge}>{k.simge}</Text></View>
                      <View>
                        <Text style={styles.kategoriAd}>{k.ad}</Text>
                        <Text style={styles.kategoriYuzde}>%{yuzde.toFixed(1)}</Text>
                      </View>
                    </View>
                    <View style={styles.kategoriSagKisim}>
                      <Text style={styles.kategoriMiktar}>₺{miktar.toFixed(2)}</Text>
                      <View style={styles.barArka}><View style={[styles.barOn, { width: `${yuzde}%`, backgroundColor: k.renk }]} /></View>
                    </View>
                  </View>
                );
              })}
              <View style={styles.toplamSatir}>
                <Text style={styles.toplamText}>Toplam Gider</Text>
                <Text style={styles.toplamMiktar}>₺{toplamGider.toFixed(2)}</Text>
              </View>
            </>
          )}
        </View>

        {/* En Yüksek */}
        {siraliKategoriler.length > 0 && (
          <View style={[styles.bolum, { marginBottom: 24 }]}>
            <Text style={styles.bolumBaslik}>🏆 En Yüksek Harcama</Text>
            <View style={styles.enYuksek}>
              <Text style={styles.enYuksekSimge}>{siraliKategoriler[0].simge}</Text>
              <View>
                <Text style={styles.enYuksekAd}>{siraliKategoriler[0].ad}</Text>
                <Text style={styles.enYuksekMiktar}>₺{(katHarcamalar[siraliKategoriler[0].id] || 0).toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}
        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F1F5F9' },
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  scrollContent: { paddingBottom: 16 },
  kartlar: { flexDirection: 'row', padding: 12, gap: 8 },
  kart: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  kartSimge: { fontSize: 20, marginBottom: 4 },
  kartBaslik: { color: '#fff', fontSize: 12, marginBottom: 2 },
  kartMiktar: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  degisim: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 2 },
  bolum: { backgroundColor: '#fff', marginHorizontal: 12, borderRadius: 12, padding: 16, marginBottom: 12 },
  bolumBaslik: { fontSize: 16, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  bolumAltBaslik: { fontSize: 12, color: '#64748B', marginBottom: 12 },
  bosText: { color: '#aaa', textAlign: 'center', paddingVertical: 20 },
  grafik: { borderRadius: 8, marginLeft: -16 },
  legenda: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 8 },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendaNokta: { width: 10, height: 10, borderRadius: 5 },
  legendaText: { fontSize: 13, color: '#555' },
  oranBarArka: { height: 14, backgroundColor: '#f0f0f0', borderRadius: 7, overflow: 'hidden', marginBottom: 8 },
  oranBarOn: { height: 14, borderRadius: 7 },
  oranYazi: { fontSize: 13, fontWeight: '600', textAlign: 'right' },
  cubukLegenda: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, justifyContent: 'center' },
  cubukLegendaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: '28%' },
  cubukLegendaRenk: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cubukLegendaText: { fontSize: 11, color: '#475569', fontWeight: '500', flex: 1 },
  kategoriSatir: { marginBottom: 14 },
  kategoriSolKisim: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  kategoriRenkCember: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  kategoriSimge: { fontSize: 18 },
  kategoriAd: { fontSize: 14, fontWeight: '600', color: '#333' },
  kategoriYuzde: { fontSize: 12, color: '#888' },
  kategoriSagKisim: { paddingLeft: 46 },
  kategoriMiktar: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  barArka: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  barOn: { height: 8, borderRadius: 4 },
  toplamSatir: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 4 },
  toplamText: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  toplamMiktar: { fontSize: 16, fontWeight: 'bold', color: '#EF4444' },
  enYuksek: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 16 },
  enYuksekSimge: { fontSize: 40 },
  enYuksekAd: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  enYuksekMiktar: { fontSize: 22, fontWeight: 'bold', color: '#EF4444', marginTop: 4 },
});