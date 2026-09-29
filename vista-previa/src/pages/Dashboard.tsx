import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/ui/Card';
import { Calendar as CalendarIcon, ChevronDown, Upload } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [ingresos, setIngresos] = useState<number>(0);
  const [compras, setCompras] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseXML = (xmlText: string) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const comprobante = xmlDoc.getElementsByTagName("cfdi:Comprobante")[0];
    if (comprobante) {
      return parseFloat(comprobante.getAttribute("Total") || "0");
    }
    return 0;
  };

  const parseTXT = (txtText: string) => {
    const lines = txtText.split('\n');
    let start = false;
    let total = 0;
    for (const line of lines) {
      if (line.startsWith('CLAVE\t')) { start = true; continue; }
      if (start && line.trim()) {
        const parts = line.split('\t');
        if (parts.length >= 12 && parts[0].trim() !== '') {
          const importe = parseFloat(parts[6]);
          if (!isNaN(importe)) total += importe;
        }
      }
    }
    return total;
  };

  useEffect(() => {
    // Load initial files from public folder
    fetch('/KEL990126MW9FRF131812.xml')
      .then(res => res.text())
      .then(text => setCompras(parseXML(text)))
      .catch(console.error);
      
    fetch('/ventas julio texto.txt')
      .then(res => res.text())
      .then(text => setIngresos(parseTXT(text)))
      .catch(console.error);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (file.name.endsWith('.xml')) {
          setCompras(parseXML(text));
        } else if (file.name.endsWith('.txt')) {
          setIngresos(parseTXT(text));
        }
      };
      reader.readAsText(file);
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="animate-fade-in">
      <div className="mt-page-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="mt-page-title" style={{ fontSize: '24px', letterSpacing: '-0.5px' }}>Dashboard</h1>
          <p className="mt-page-subtitle" style={{ fontSize: '13px' }}>Resumen mensual</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => fileInputRef.current?.click()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--mt-surface)', border: '1px solid var(--mt-border)', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', marginTop: '4px', color: 'var(--mt-text-primary)' }}
          >
            <Upload size={16} style={{ color: 'var(--mt-text-secondary)' }} />
            <span style={{ fontSize: '13px', fontWeight: 500 }}>Cargar datos</span>
          </button>
          <input type="file" multiple accept=".xml,.txt" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--mt-surface)', border: '1px solid var(--mt-border)', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', marginTop: '4px' }} onClick={() => alert('Filtro por mes disponible próximamente')}>
            <CalendarIcon size={16} style={{ color: 'var(--mt-text-secondary)' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--mt-text-primary)' }}>Julio 2026</span>
            <ChevronDown size={16} style={{ color: 'var(--mt-text-secondary)', marginLeft: '4px' }} />
          </div>
        </div>
      </div>

      <div className="mt-stats-grid animate-fade-in delay-100">
        <StatCard title="INGRESOS" value={ingresos > 0 ? formatCurrency(ingresos) : "$143,424.08"} caption="Julio 2026" />
        <StatCard title="GASTOS OPERATIVOS" value="$0.00" caption="Sin gastos operativos registrados" />
        <StatCard title="COMPRAS" value={compras > 0 ? formatCurrency(compras) : "$15,555.29"} caption="Facturas registradas" />
        <StatCard 
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span>STOCK Y CONCILIACIÓN</span>
              <span style={{ fontSize: '11px', backgroundColor: '#3F2C00', color: '#FBBF24', padding: '2px 8px', borderRadius: '12px', border: '1px solid #5C4000', textTransform: 'none', letterSpacing: '0', fontWeight: 500 }}>Atención</span>
            </div>
          } 
          value={
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span>14</span>
              <span style={{ fontSize: '18px', fontWeight: 600 }}>productos</span>
            </div>
          } 
          caption="Requieren reposición" 
        />
      </div>
      
      <div className="mt-dashboard-columns animate-fade-in delay-200" style={{ gridTemplateColumns: '1fr', marginTop: '24px' }}>
        <div className="mt-panel" style={{ backgroundColor: 'var(--mt-surface)', borderColor: 'var(--mt-border)', borderRadius: '8px', overflow: 'hidden' }}>
          <div className="mt-panel-header" style={{ borderBottom: '1px solid var(--mt-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
            <h3 className="mt-panel-title" style={{ fontSize: '14px' }}>Evolución de ingresos y gastos</h3>
            <button className="mt-panel-action" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--mt-text-secondary)', fontSize: '12px' }} onClick={() => navigate('/administration')}>Ver administración ↗</button>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div className="mt-chart-legend" style={{ marginBottom: 0, gap: '24px' }}>
                <div className="mt-legend-item">
                  <div className="mt-legend-line" style={{ backgroundColor: '#FFFFFF', width: '12px' }}></div>
                  <span style={{ color: 'var(--mt-text-secondary)', fontSize: '12px' }}>Ingresos</span>
                </div>
                <div className="mt-legend-item">
                  <div className="mt-legend-line" style={{ backgroundColor: 'var(--mt-text-muted)', width: '12px' }}></div>
                  <span style={{ color: 'var(--mt-text-secondary)', fontSize: '12px' }}>Gastos operativos</span>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--mt-text-muted)' }}>Cifras en MXN</div>
            </div>
            
            <div style={{ position: 'relative', height: '240px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '48px', fontSize: '11px', color: 'var(--mt-text-muted)', textAlign: 'right', paddingRight: '16px' }}>$165k</span>
                <div style={{ flex: 1, borderTop: '1px dashed var(--mt-border-subtle)' }}></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '48px', fontSize: '11px', color: 'var(--mt-text-muted)', textAlign: 'right', paddingRight: '16px' }}>$110k</span>
                <div style={{ flex: 1, borderTop: '1px dashed var(--mt-border-subtle)' }}></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '48px', fontSize: '11px', color: 'var(--mt-text-muted)', textAlign: 'right', paddingRight: '16px' }}>$55k</span>
                <div style={{ flex: 1, borderTop: '1px dashed var(--mt-border-subtle)' }}></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '48px', fontSize: '11px', color: 'var(--mt-text-muted)', textAlign: 'right', paddingRight: '16px' }}>$0k</span>
                <div style={{ flex: 1, borderTop: '1px solid var(--mt-border-subtle)' }}></div>
              </div>

              <svg style={{ position: 'absolute', top: 0, left: '48px', width: 'calc(100% - 48px)', height: 'calc(100% - 24px)', overflow: 'visible' }}>
                <path className="animate-fade-in delay-300" d="M 8.3%,216 L 25%,216 L 41.6%,216 L 58.3%,216 L 75%,216 L 91.6%,35" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.3" />
                <circle className="animate-fade-in delay-400" cx="91.6%" cy="35" r="4" fill="#FFFFFF" />
              </svg>
              
              <div style={{ position: 'absolute', bottom: 0, left: '48px', width: 'calc(100% - 48px)', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', fontSize: '12px', color: 'var(--mt-text-muted)', textAlign: 'center' }}>
                <span>Feb</span>
                <span>Mar</span>
                <span>Abr</span>
                <span>May</span>
                <span>Jun</span>
                <span style={{ color: 'var(--mt-text-primary)', fontWeight: 600 }}>Jul</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-dashboard-columns animate-fade-in delay-300" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '16px' }}>
        <div className="mt-panel" style={{ borderRadius: '8px' }}>
          <div className="mt-panel-header" style={{ padding: '16px 24px' }}>
            <h3 className="mt-panel-title">Actividad reciente</h3>
            <button className="mt-panel-action" style={{ color: 'var(--mt-text-secondary)', fontSize: '12px' }} onClick={() => alert('Actividad completa')}>Ver todo ↗</button>
          </div>
        </div>
        <div className="mt-panel" style={{ borderRadius: '8px' }}>
          <div className="mt-panel-header" style={{ padding: '16px 24px' }}>
            <h3 className="mt-panel-title">Avisos y notificaciones</h3>
            <button className="mt-panel-action" style={{ color: 'var(--mt-text-secondary)', fontSize: '12px' }} onClick={() => alert('Bandeja de notificaciones')}>Ver todas ↗</button>
          </div>
        </div>
      </div>
    </div>
  );
}
