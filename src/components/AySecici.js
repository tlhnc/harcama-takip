import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useState } from 'react';
import { useApp } from '../context/AppContext';

const AY_ADLARI = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                   'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const MIN_YIL = 2000;

export default function AySecici() {
  const { aktifYil, aktifAy, setAktifYil, setAktifAy } = useApp();
  const [modalAcik, setModalAcik] = useState(false);
  const [geciciYil, setGeciciYil] = useState(aktifYil);

  const simdi = new Date();
  const maxYil = simdi.getFullYear() + 2;

  function onOkTikla() {
    let yeni = aktifAy - 1;
    let yeniYil = aktifYil;
    if (yeni < 0) { yeni = 11; yeniYil = aktifYil - 1; }
    if (yeniYil < MIN_YIL || (yeniYil === MIN_YIL && yeni < 0)) return;
    setAktifAy(yeni); setAktifYil(yeniYil);
  }

  function ileriOkTikla() {
    let yeni = aktifAy + 1;
    let yeniYil = aktifYil;
    if (yeni > 11) { yeni = 0; yeniYil = aktifYil + 1; }
    setAktifAy(yeni); setAktifYil(yeniYil);
  }

  function modalAc() { setGeciciYil(aktifYil); setModalAcik(true); }

  function aySecildi(ayIndex) {
    if (geciciYil === MIN_YIL && ayIndex < 0) return;
    setAktifAy(ayIndex);
    setAktifYil(geciciYil);
    setModalAcik(false);
  }

  const geriDisabled = aktifYil === MIN_YIL && aktifAy === 0;

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={onOkTikla}
          style={[styles.okBtn, geriDisabled && styles.okBtnDisabled]}
          disabled={geriDisabled}
        >
          <Text style={styles.okIcon}>◀</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tarihBtn} onPress={modalAc} activeOpacity={0.8}>
          <Text style={styles.tarihText}>🗓️ {AY_ADLARI[aktifAy]} {aktifYil}</Text>
          <Text style={styles.tarihAlt}>▼</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={ileriOkTikla} style={styles.okBtn}>
          <Text style={styles.okIcon}>▶</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalAcik} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setModalAcik(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalKutu}>
            {/* Yıl Seçici */}
            <View style={styles.yilRow}>
              <TouchableOpacity
                onPress={() => setGeciciYil(y => Math.max(MIN_YIL, y - 1))}
                style={[styles.yilOk, geciciYil <= MIN_YIL && styles.yilOkDisabled]}
                disabled={geciciYil <= MIN_YIL}
              >
                <Text style={styles.yilOkText}>◀</Text>
              </TouchableOpacity>
              <Text style={styles.yilText}>{geciciYil}</Text>
              <TouchableOpacity
                onPress={() => setGeciciYil(y => Math.min(maxYil, y + 1))}
                style={[styles.yilOk, geciciYil >= maxYil && styles.yilOkDisabled]}
                disabled={geciciYil >= maxYil}
              >
                <Text style={styles.yilOkText}>▶</Text>
              </TouchableOpacity>
            </View>

            {/* Ay Grid */}
            <View style={styles.ayGrid}>
              {AY_ADLARI.map((ad, i) => {
                const disabled = geciciYil === MIN_YIL && i < 0;
                const aktif = geciciYil === aktifYil && i === aktifAy;
                const bugun = geciciYil === simdi.getFullYear() && i === simdi.getMonth();
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.ayBtn,
                      aktif && styles.ayBtnAktif,
                      bugun && !aktif && styles.ayBtnBugun,
                      disabled && styles.ayBtnDisabled,
                    ]}
                    onPress={() => !disabled && aySecildi(i)}
                    disabled={disabled}
                  >
                    <Text style={[styles.ayBtnText, aktif && styles.ayBtnTextAktif, disabled && styles.ayBtnTextDisabled]}>
                      {ad.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Bugüne Git */}
            <TouchableOpacity
              style={styles.bugunBtn}
              onPress={() => { setAktifAy(simdi.getMonth()); setAktifYil(simdi.getFullYear()); setModalAcik(false); }}
            >
              <Text style={styles.bugunBtnText}>📅 Bugüne Git</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1E40AF', paddingVertical: 10, paddingHorizontal: 8,
  },
  okBtn: { padding: 10, borderRadius: 8 },
  okBtnDisabled: { opacity: 0.3 },
  okIcon: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  tarihBtn: { flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 6 },
  tarihText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  tarihAlt: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalKutu: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, width: 320,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 12,
  },
  yilRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  yilOk: { backgroundColor: '#EFF6FF', padding: 10, borderRadius: 10, minWidth: 40, alignItems: 'center' },
  yilOkDisabled: { opacity: 0.3 },
  yilOkText: { color: '#1E40AF', fontSize: 16, fontWeight: 'bold' },
  yilText: { fontSize: 22, fontWeight: 'bold', color: '#1E293B' },

  ayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16 },
  ayBtn: {
    width: '22%', paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  ayBtnAktif: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  ayBtnBugun: { borderColor: '#1E40AF', backgroundColor: '#EFF6FF' },
  ayBtnDisabled: { opacity: 0.3 },
  ayBtnText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  ayBtnTextAktif: { color: '#fff' },
  ayBtnTextDisabled: { color: '#CBD5E1' },

  bugunBtn: {
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#BFDBFE',
  },
  bugunBtnText: { color: '#1E40AF', fontSize: 15, fontWeight: 'bold' },
});