import React, { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertTriangle,
  BatteryMedium,
  BellRing,
  Bus,
  CheckCircle2,
  CloudRain,
  Gift,
  Lock,
  LockOpen,
  MapPin,
  RefreshCcw,
  Sparkles,
  ThermometerSun,
  TicketPercent,
  Users,
  Wand2,
} from 'lucide-react'
import liveContextMock from '../../data-mooc/phu-quoc/mock/live-context.json'
import attractions from '../../data-mooc/phu-quoc/mock/attractions.json'
import latestQueues from '../../data-mooc/phu-quoc/mock/latest-queues.json'
import vouchers from '../../data-mooc/phu-quoc/mock/vouchers.json'
import transport from '../../data-mooc/phu-quoc/mock/transport.json'
import restaurants from '../../data-mooc/phu-quoc/mock/restaurants.json'
import itineraryTemplates from '../../data-mooc/phu-quoc/mock/itinerary-templates.json'
import {
  buildLiveData,
  buildSuggestion,
  createInitialTimeline,
  fitScore,
  getItemWarnings,
  getQueueMin,
  isRainRisk,
  normalizeLiveContext,
  optimizeTimeline,
} from '../lib/liveOptimization'

const REQUIRED_PRESETS = ['normal_day', 'rainy_afternoon', 'overcrowded', 'family_fatigue', 'upsell']

const WEATHER_OPTIONS = ['sunny', 'light_rain', 'heavy_rain', 'very_hot', 'thunderstorm']
const CROWD_OPTIONS = ['low', 'medium', 'high', 'overcrowded']
const ENERGY_OPTIONS = ['high', 'medium', 'low']
const LOCATION_OPTIONS = ['resort_lobby', 'vinwonders_gate', 'typhoon_world', 'aquarium', 'safari', 'grand_world']

const QUEUE_CONTROLS = [
  { id: 'a_typhoon_world', label: 'Water Park' },
  { id: 'a_sea_shell', label: 'Sea Shell' },
  { id: 'a_roller_coaster', label: 'Roller Coaster' },
  { id: 'a_safari_bus', label: 'Safari' },
  { id: 'a_grand_world_show', label: 'Show' },
]

const presetLabels = {
  normal_day: 'Normal',
  rainy_afternoon: 'Rainy',
  overcrowded: 'Crowded',
  family_fatigue: 'Fatigue',
  upsell: 'Upsell',
}

const weatherLabels = {
  sunny: 'Nắng',
  light_rain: 'Mưa nhẹ',
  heavy_rain: 'Mưa lớn',
  very_hot: 'Rất nóng',
  thunderstorm: 'Dông',
}

const crowdLabels = {
  low: 'Thoáng',
  medium: 'Vừa',
  high: 'Đông',
  overcrowded: 'Quá tải',
}

const energyLabels = {
  high: 'Cao',
  medium: 'Vừa',
  low: 'Thấp',
}

const locationLabels = {
  resort_lobby: 'Resort lobby',
  vinwonders_gate: 'VinWonders gate',
  typhoon_world: 'Typhoon World',
  aquarium: 'Aquarium',
  safari: 'Safari',
  grand_world: 'Grand World',
}

export default function LiveScreen() {
  const data = useMemo(
    () => buildLiveData({ attractions, restaurants, transport, vouchers, itineraryTemplates, latestQueues }),
    []
  )
  const initialTimeline = useMemo(() => createInitialTimeline(data), [data])
  const [selectedPreset, setSelectedPreset] = useState('normal_day')
  const [liveContext, setLiveContext] = useState(() => normalizeLiveContext(liveContextMock.presets.normal_day))
  const [timeline, setTimeline] = useState(initialTimeline)
  const [itemLocks, setItemLocks] = useState({})
  const [toasts, setToasts] = useState([])
  const [reasons, setReasons] = useState([])

  const suggestion = useMemo(() => buildSuggestion(timeline, liveContext, data), [timeline, liveContext, data])
  const presetHint = liveContextMock.presets[selectedPreset]?.recommendedReflex

  const updateContext = (patch) => {
    setLiveContext((current) => ({ ...current, ...patch }))
    setToasts([])
    setReasons([])
  }

  const selectPreset = (presetId) => {
    setSelectedPreset(presetId)
    setLiveContext(normalizeLiveContext(liveContextMock.presets[presetId]))
    setTimeline(initialTimeline)
    setItemLocks({})
    setToasts([])
    setReasons([])
  }

  const updateQueue = (id, value) => {
    updateContext({
      queues: {
        ...liveContext.queues,
        [id]: Number(value),
      },
    })
  }

  const toggleLock = (itemId) => {
    setItemLocks((current) => ({ ...current, [itemId]: !current[itemId] }))
  }

  const handleOptimize = () => {
    const result = optimizeTimeline(timeline, liveContext, itemLocks, data)
    setTimeline(result.timeline)
    setToasts(result.toasts)
    setReasons(result.reasons)
  }

  const handleReset = () => {
    setTimeline(initialTimeline)
    setItemLocks({})
    setToasts([])
    setReasons([])
  }

  return (
    <>
      <div className="tab-view live-screen">
        <div className="live-hero">
          <div>
            <p className="live-kicker">Vinpearl Journey Concierge</p>
            <h2 className="live-title">Live Reflex</h2>
            <p className="live-subtitle">Day 2 · Phú Quốc · Gia đình 5 người</p>
          </div>
          <div className="live-hero-icon">
            <BellRing size={22} />
          </div>
        </div>

        <PhoneWidget
          timeline={timeline}
          liveContext={liveContext}
          itemLocks={itemLocks}
          suggestion={suggestion}
          toasts={toasts}
          reasons={reasons}
          data={data}
          onToggleLock={toggleLock}
          onOptimize={handleOptimize}
          onReset={handleReset}
        />
      </div>

      {typeof document !== 'undefined' && createPortal(
        <aside className="live-demo-console" aria-label="Simulation controls for demo operator">
          <SimulationControlPanel
            liveContext={liveContext}
            selectedPreset={selectedPreset}
            presetHint={presetHint}
            onPreset={selectPreset}
            onChange={updateContext}
            onQueueChange={updateQueue}
          />
        </aside>,
        document.body
      )}
    </>
  )
}

function PhoneWidget({
  timeline,
  liveContext,
  itemLocks,
  suggestion,
  toasts,
  reasons,
  data,
  onToggleLock,
  onOptimize,
  onReset,
}) {
  const activeVoucher = liveContext.voucherExpiring ? data.voucherById[liveContext.voucherExpiring] : null

  return (
    <section className="live-phone-widget">
      <div className="live-widget-top">
        <div>
          <p className="live-section-label">PhoneWidget</p>
          <h3 className="live-widget-title">Timeline hôm nay</h3>
        </div>
        <button className="live-icon-btn" type="button" onClick={onReset} aria-label="Reset timeline">
          <RefreshCcw size={16} />
        </button>
      </div>

      <div className="live-badges">
        <StatusBadge icon={CloudRain} label={weatherLabels[liveContext.weather]} alert={isRainRisk(liveContext)} />
        <StatusBadge icon={Users} label={crowdLabels[liveContext.crowd]} alert={['high', 'overcrowded'].includes(liveContext.crowd)} />
        <StatusBadge icon={BatteryMedium} label={energyLabels[liveContext.energy]} alert={liveContext.energy === 'low'} />
        {liveContext.childTired && <StatusBadge icon={AlertTriangle} label="Bé mệt" alert />}
        {liveContext.elderlyMode && <StatusBadge icon={Bus} label="Elderly" alert />}
        {activeVoucher && <StatusBadge icon={Gift} label="Voucher" alert />}
      </div>

      <div className="live-suggestion-box">
        <div className="live-suggestion-icon">
          <Sparkles size={16} />
        </div>
        <p>{suggestion}</p>
      </div>

      <div className="live-timeline">
        {timeline.map((item) => {
          const warnings = getItemWarnings(item, liveContext)
          const queue = getQueueMin(item, liveContext)
          const score = fitScore(item, liveContext)
          const locked = Boolean(itemLocks[item.id])

          return (
            <div
              className={`live-timeline-row ${warnings.length ? 'has-warning' : ''} ${locked ? 'is-locked' : ''}`}
              key={item.id}
            >
              <div className="live-time">{item.time}</div>
              <div className="live-line-wrap">
                <span className="live-node" />
              </div>
              <div className="live-card">
                <div className="live-card-head">
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.zone} · {item.type}</p>
                  </div>
                  <button
                    className={`live-lock-btn ${locked ? 'active' : ''}`}
                    type="button"
                    onClick={() => onToggleLock(item.id)}
                    aria-label={locked ? 'Unlock activity' : 'Lock activity'}
                  >
                    {locked ? <Lock size={14} /> : <LockOpen size={14} />}
                  </button>
                </div>

                <div className="live-card-meta">
                  {item.sourceType === 'attraction' && <span>Queue {queue}’</span>}
                  <span>Fit {Math.round(score * 100)}%</span>
                  {item.voucherTitle && <span className="live-voucher-pill"><TicketPercent size={12} /> F&B</span>}
                </div>

                {(warnings.length > 0 || item.reason || item.voucherTitle) && (
                  <div className="live-card-badges">
                    {warnings.map((warning) => (
                      <span className={`live-warning-chip ${warning.tone}`} key={warning.key}>{warning.label}</span>
                    ))}
                    {item.voucherTitle && <span className="live-warning-chip success">{item.voucherTitle}</span>}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {reasons.length > 0 && (
        <div className="live-reasons">
          {reasons.slice(0, 3).map((reason) => (
            <p key={reason}><CheckCircle2 size={13} /> {reason}</p>
          ))}
        </div>
      )}

      {toasts.length > 0 && (
        <div className="live-toast-list">
          {toasts.map((toast) => (
            <div className="live-toast" key={toast}>{toast}</div>
          ))}
        </div>
      )}

      <button className="live-optimize-btn" type="button" onClick={onOptimize}>
        <Wand2 size={16} /> Optimize
      </button>
    </section>
  )
}

function SimulationControlPanel({ liveContext, selectedPreset, presetHint, onPreset, onChange, onQueueChange }) {
  return (
    <section className="live-control-panel">
      <div className="live-control-header">
        <div>
          <p className="live-section-label">Bảng điều khiển demo</p>
          <h3 className="live-control-title">Mô phỏng tình huống</h3>
        </div>
        <span className="live-control-tag">Live</span>
      </div>
      <p className="live-control-caption">
        Chỉnh các điều kiện thực tế bên dưới, rồi bấm <strong>Optimize</strong> trên điện thoại để xem AI phản ứng.
      </p>

      <ControlSection step={1} title="Kịch bản mẫu" hint="Chọn nhanh một tình huống có sẵn">
        <div className="live-preset-grid">
          {REQUIRED_PRESETS.map((presetId) => (
            <button
              key={presetId}
              type="button"
              className={`live-preset-btn ${selectedPreset === presetId ? 'active' : ''}`}
              onClick={() => onPreset(presetId)}
            >
              {presetLabels[presetId]}
            </button>
          ))}
        </div>
        {presetHint && (
          <p className="live-preset-hint"><Sparkles size={12} /> {presetHint}</p>
        )}
      </ControlSection>

      <ControlSection step={2} title="Thời tiết & đám đông" hint="Tác động tới hoạt động ngoài trời">
        <div className="live-control-grid">
          <SelectControl
            label="Thời tiết"
            value={liveContext.weather}
            options={WEATHER_OPTIONS}
            labels={weatherLabels}
            icon={CloudRain}
            onChange={(value) => onChange({ weather: value })}
          />
          <SelectControl
            label="Đám đông"
            value={liveContext.crowd}
            options={CROWD_OPTIONS}
            labels={crowdLabels}
            icon={Users}
            onChange={(value) => onChange({ crowd: value })}
          />
        </div>
        <label className="live-slider">
          <span><ThermometerSun size={14} /> Khả năng mưa</span>
          <strong>{liveContext.rainProb}%</strong>
          <input
            type="range"
            min="0"
            max="100"
            value={liveContext.rainProb}
            onChange={(event) => onChange({ rainProb: Number(event.target.value) })}
          />
        </label>
      </ControlSection>

      <ControlSection step={3} title="Trạng thái gia đình" hint="Quyết định nhịp đi chơi và nghỉ ngơi">
        <div className="live-field">
          <p className="live-field-label">Năng lượng cả nhà</p>
          <div className="live-energy-row">
            {ENERGY_OPTIONS.map((energy) => (
              <button
                type="button"
                key={energy}
                className={`live-segment ${liveContext.energy === energy ? 'active' : ''}`}
                onClick={() => onChange({ energy })}
              >
                {energyLabels[energy]}
              </button>
            ))}
          </div>
        </div>
        <div className="live-toggle-grid">
          <ToggleControl label="Bé mệt" checked={liveContext.childTired} onChange={(value) => onChange({ childTired: value })} />
          <ToggleControl label="Có người lớn tuổi" checked={liveContext.elderlyMode} onChange={(value) => onChange({ elderlyMode: value, avoidLongWalk: value || liveContext.avoidLongWalk })} />
          <ToggleControl label="Hạn chế đi bộ" checked={liveContext.avoidLongWalk} onChange={(value) => onChange({ avoidLongWalk: value })} />
          <ToggleControl label="Bữa tối gấp" checked={liveContext.dinnerSlotTight} onChange={(value) => onChange({ dinnerSlotTight: value })} />
        </div>
      </ControlSection>

      <ControlSection step={4} title="Vị trí & hàng chờ" hint="Số phút chờ hiện tại ở từng điểm">
        <SelectControl
          label="Đang ở"
          value={liveContext.location}
          options={LOCATION_OPTIONS}
          labels={locationLabels}
          icon={MapPin}
          onChange={(value) => onChange({ location: value })}
        />
        <div className="live-queue-panel">
          <p className="live-mini-title">Thời gian chờ (phút)</p>
          {QUEUE_CONTROLS.map((control) => (
            <label className="live-queue-row" key={control.id}>
              <span>{control.label}</span>
              <input
                type="number"
                min="0"
                max="120"
                value={liveContext.queues?.[control.id] ?? 0}
                onChange={(event) => onQueueChange(control.id, event.target.value)}
              />
            </label>
          ))}
        </div>
      </ControlSection>

      <ControlSection step={5} title="Ưu đãi" hint="Voucher cần dùng trước khi hết hạn">
        <label className="live-voucher-select">
          <span><Gift size={14} /> Voucher sắp hết hạn</span>
          <select
            value={liveContext.voucherExpiring || ''}
            onChange={(event) => onChange({ voucherExpiring: event.target.value })}
          >
            <option value="">Không dùng</option>
            <option value="v_fnb_today">Giảm 30% F&B hôm nay</option>
            <option value="v_safari_meal">Voucher bữa ăn Safari</option>
          </select>
        </label>
      </ControlSection>
    </section>
  )
}

function ControlSection({ step, title, hint, children }) {
  return (
    <div className="live-group">
      <div className="live-group-head">
        <span className="live-group-step">{step}</span>
        <div>
          <p className="live-group-name">{title}</p>
          {hint && <p className="live-group-hint">{hint}</p>}
        </div>
      </div>
      <div className="live-group-body">{children}</div>
    </div>
  )
}

function StatusBadge({ icon: Icon, label, alert }) {
  return (
    <span className={`live-status-badge ${alert ? 'alert' : ''}`}>
      <Icon size={13} /> {label}
    </span>
  )
}

function SelectControl({ label, value, options, labels, icon: Icon, onChange }) {
  return (
    <label className="live-select">
      <span><Icon size={14} /> {label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option value={option} key={option}>{labels[option] || option}</option>
        ))}
      </select>
    </label>
  )
}

function ToggleControl({ label, checked, onChange }) {
  return (
    <button
      type="button"
      className={`live-toggle ${checked ? 'active' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span>{label}</span>
      <span className="live-switch" />
    </button>
  )
}
