import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Loader2, RefreshCw, Move, Pencil, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Inject Leaflet CSS once
function useLeafletCSS() {
  useEffect(() => {
    if (document.getElementById('leaflet-css')) return;
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }, []);
}

// Romanization helpers for Taiwan addresses
const CITY_EN = {
  '台北市': 'Taipei', '臺北市': 'Taipei', '新北市': 'New Taipei', '基隆市': 'Keelung',
  '桃園市': 'Taoyuan', '新竹市': 'Hsinchu', '新竹縣': 'Hsinchu County',
  '苗栗縣': 'Miaoli', '台中市': 'Taichung', '臺中市': 'Taichung',
  '彰化縣': 'Changhua', '南投縣': 'Nantou', '雲林縣': 'Yunlin',
  '嘉義市': 'Chiayi', '嘉義縣': 'Chiayi County', '台南市': 'Tainan', '臺南市': 'Tainan',
  '高雄市': 'Kaohsiung', '屏東縣': 'Pingtung', '宜蘭縣': 'Yilan',
  '花蓮縣': 'Hualien', '台東縣': 'Taitung', '澎湖縣': 'Penghu',
  '金門縣': 'Kinmen', '連江縣': 'Lienchiang',
};

const DISTRICT_EN = {
  '中正區': 'Zhongzheng District', '大同區': 'Datong District', '中山區': 'Zhongshan District',
  '松山區': 'Songshan District', '大安區': 'Da\'an District', '萬華區': 'Wanhua District',
  '信義區': 'Xinyi District', '士林區': 'Shilin District', '北投區': 'Beitou District',
  '內湖區': 'Neihu District', '南港區': 'Nangang District', '文山區': 'Wenshan District',
  '板橋區': 'Banqiao District', '三重區': 'Sanchong District', '中和區': 'Zhonghe District',
  '永和區': 'Yonghe District', '新莊區': 'Xinzhuang District', '新店區': 'Xindian District',
  '淡水區': 'Danshui District', '汐止區': 'Xizhi District', '土城區': 'Tucheng District',
  '蘆洲區': 'Luzhou District', '樹林區': 'Shulin District', '三峽區': 'Sanxia District',
  '鶯歌區': 'Yingge District', '林口區': 'Linkou District',
  '桃園區': 'Taoyuan District', '中壢區': 'Zhongli District', '龜山區': 'Guishan District',
  '八德區': 'Bade District', '楊梅區': 'Yangmei District', '蘆竹區': 'Luzhu District',
  '西屯區': 'Xitun District', '南屯區': 'Nantun District', '北屯區': 'Beitun District',
  '豐原區': 'Fengyuan District', '大里區': 'Dali District', '太平區': 'Taiping District',
};

// Build an English query from a Taiwan address string
function buildEnglishQuery(address) {
  let eng = address;
  for (const [zh, en] of Object.entries(CITY_EN)) {
    eng = eng.replace(zh, en + ', ');
  }
  for (const [zh, en] of Object.entries(DISTRICT_EN)) {
    eng = eng.replace(zh, en + ', ');
  }
  // Replace common road patterns: 重慶南路一段122號 → just keep numbers and Taiwan
  // Strip remaining CJK for a cleaner query
  eng = eng.replace(/[\u4e00-\u9fff]+/g, ' ').replace(/\s+/g, ' ').trim();
  return eng + ', Taiwan';
}

async function nominatimQuery(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&countrycodes=tw`;
  const res = await fetch(url, { headers: { 'User-Agent': 'HesonBooking/1.0' } });
  const data = await res.json();
  if (data && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  return null;
}

// Try multiple geocoding strategies
async function geocodeAddress(address) {
  // Strategy 1: full Chinese address
  let result = await nominatimQuery(address);
  if (result) return result;

  // Strategy 2: English transliteration
  const engQuery = buildEnglishQuery(address);
  result = await nominatimQuery(engQuery);
  if (result) return result;

  // Strategy 3: city + district only (fallback to district center)
  for (const [zh, en] of Object.entries(DISTRICT_EN)) {
    if (address.includes(zh)) {
      for (const [zhC, enC] of Object.entries(CITY_EN)) {
        if (address.includes(zhC)) {
          result = await nominatimQuery(`${en}, ${enC}, Taiwan`);
          if (result) return result;
        }
      }
    }
  }

  // Strategy 4: city only
  for (const [zh, en] of Object.entries(CITY_EN)) {
    if (address.includes(zh)) {
      result = await nominatimQuery(`${en}, Taiwan`);
      if (result) return result;
    }
  }

  return null;
}

export default function AddressMap({ address, onLocationChange }) {
  useLeafletCSS();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [position, setPosition] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const setupMap = useCallback(async (lat, lng, zoom = 17) => {
    const L = (await import('leaflet')).default;
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (!containerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current).setView([lat, lng], zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(mapRef.current);

      mapRef.current.on('click', (e) => {
        if (confirmed) return;
        const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
        markerRef.current?.setLatLng([coords.lat, coords.lng]);
        setPosition(coords);
        setStatus('manual');
        onLocationChange?.(coords);
      });
    } else {
      mapRef.current.setView([lat, lng], zoom);
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapRef.current);
      markerRef.current.on('dragend', (e) => {
        if (confirmed) return;
        const { lat: newLat, lng: newLng } = e.target.getLatLng();
        const coords = { lat: newLat, lng: newLng };
        setPosition(coords);
        setStatus('manual');
        onLocationChange?.(coords);
      });
    }

    setTimeout(() => mapRef.current?.invalidateSize(), 150);
  }, [onLocationChange]);

  const doGeocode = useCallback(async () => {
    if (!address || address.length < 5) return;
    setStatus('loading');
    try {
      const result = await geocodeAddress(address);
      if (result) {
        setPosition(result);
        setStatus('found');
        onLocationChange?.(result);
        await setupMap(result.lat, result.lng, 17);
      } else {
        setStatus('error');
        // Show Taiwan map for manual click
        await setupMap(23.97, 120.97, 8);
      }
    } catch {
      setStatus('error');
      await setupMap(23.97, 120.97, 8);
    }
  }, [address, setupMap, onLocationChange]);

  // Reset confirmed when address changes
  useEffect(() => {
    setConfirmed(false);
  }, [address]);

  useEffect(() => {
    if (!address || address.length < 5) {
      setStatus('idle');
      return;
    }
    const t = setTimeout(doGeocode, 1200);
    return () => clearTimeout(t);
  }, [address, doGeocode]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  if (status === 'idle') return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between min-h-[20px]">
        <div className="flex items-center gap-1.5 text-xs">
          <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
          {status === 'loading' && (
            <span className="flex items-center gap-1 text-stone-500">
              <Loader2 className="w-3 h-3 animate-spin" />自動定位中...
            </span>
          )}
          {status === 'found' && (
            <span className="text-green-600">已自動定位 · 可拖曳大頭針或點擊地圖手動校正</span>
          )}
          {status === 'manual' && (
            <span className="text-amber-600 flex items-center gap-1">
              <Move className="w-3 h-3" />已手動校正位置
            </span>
          )}
          {status === 'error' && (
            <span className="text-red-500">無法自動定位，請點擊地圖手動標記</span>
          )}
        </div>
          <div className="flex items-center gap-1">
          {status !== 'loading' && !confirmed && (
            <Button type="button" variant="ghost" size="sm"
              className="h-6 text-xs px-2 text-stone-500 hover:text-stone-700"
              onClick={doGeocode}>
              <RefreshCw className="w-3 h-3 mr-1" />重新定位
            </Button>
          )}
          {position && status !== 'loading' && !confirmed && (
            <Button type="button" size="sm"
              className="h-6 text-xs px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              onClick={() => { setConfirmed(true); markerRef.current?.dragging?.disable(); }}>
              <CheckCircle2 className="w-3 h-3 mr-1" />確認位置
            </Button>
          )}
          {confirmed && (
            <Button type="button" variant="outline" size="sm"
              className="h-6 text-xs px-3 text-amber-600 border-amber-300 hover:bg-amber-50 rounded-lg"
              onClick={() => { setConfirmed(false); markerRef.current?.dragging?.enable(); }}>
              <Pencil className="w-3 h-3 mr-1" />編輯位置
            </Button>
          )}
        </div>
      </div>

      {status === 'loading' && (
        <div className="rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center" style={{ height: 240 }}>
          <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
        </div>
      )}

      <div className="relative">
        <div
          ref={containerRef}
          className="rounded-xl overflow-hidden border border-stone-200"
          style={{ height: 240, display: status === 'loading' ? 'none' : 'block' }}
        />
        {confirmed && (
          <div className="absolute inset-0 rounded-xl bg-transparent z-[1000] cursor-not-allowed" />
        )}
      </div>

      {position && status !== 'loading' && (
        <p className="text-xs text-stone-400">
          座標：{position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          {status === 'manual' && ' （手動校正）'}
        </p>
      )}
    </div>
  );
}